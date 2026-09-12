import * as Speech from 'expo-speech';
import { Platform, PermissionsAndroid } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { File } from 'expo-file-system';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import { Place, RouteOption, Coordinates } from '../types';
import { placesService } from './placesService';
import { directionsService } from './directionsService';
import { locationService } from './locationService';
import { APP_CONFIG, getApiBaseUrl } from '../constants/config';
import { GoogleGenAI, Type } from '@google/genai';

export type VoiceAiStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'GREETING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'CONFIRMING'
  | 'NAVIGATING'
  | 'ERROR';

export interface VoiceConversationExchange {
  aiUtterance: string;
  userUtterance: string;
}

export interface VoiceTaskState {
  destination: string | null;
  destinationCoordinates: Coordinates | null;
  requestedCategory: string | null;
  routePreference: string | null;
  additionalRequirements: string | null;
  taskComplete: boolean;
  resolvedPlace: Place | null;
  calculatedRoute: RouteOption | null;
  waypointPlace: Place | null;
}

export interface AudioBridgeController {
  playPcmChunk: (base64Pcm: string) => void;
  stopPlayback: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

class VoiceAiService {
  private currentStatus: VoiceAiStatus = 'IDLE';
  private statusListeners: Array<(status: VoiceAiStatus) => void> = [];
  private conversationListeners: Array<(exchange: VoiceConversationExchange) => void> = [];
  private taskStateListeners: Array<(state: VoiceTaskState) => void> = [];

  private conversation: VoiceConversationExchange = {
    aiUtterance: '',
    userUtterance: '',
  };

  private taskState: VoiceTaskState = {
    destination: null,
    destinationCoordinates: null,
    requestedCategory: null,
    routePreference: null,
    additionalRequirements: null,
    taskComplete: false,
    resolvedPlace: null,
    calculatedRoute: null,
    waypointPlace: null,
  };

  // Live WebSocket session connection
  private wsConnection: WebSocket | null = null;
  private directLiveSession: any = null;

  // External audio player / bridge
  private audioBridge: AudioBridgeController | null = null;

  // Web runtime audio handlers
  private webAudioContext: any = null;
  private webMicStream: any = null;
  private webMicProcessor: any = null;
  private webActiveSources: any[] = [];
  private webNextPlayTime: number = 0;
  private webSpeechRecognizer: any = null;
  private webHasSpoken: boolean = false;
  private webLastSpeechTime: number = 0;

  // Callbacks
  private onAutonomousNavigationCb: ((place: Place, route: RouteOption) => void) | null = null;

  // Generation counter to cancel stale tasks
  private taskGeneration: number = 0;

  // Heartbeat timer
  private heartbeatTimer: any = null;

  public getStatus(): VoiceAiStatus {
    return this.currentStatus;
  }

  public getConversation(): VoiceConversationExchange {
    return { ...this.conversation };
  }

  public getTaskState(): VoiceTaskState {
    return { ...this.taskState };
  }

  public subscribeStatus(listener: (status: VoiceAiStatus) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  public subscribeConversation(listener: (exchange: VoiceConversationExchange) => void): () => void {
    this.conversationListeners.push(listener);
    listener(this.conversation);
    return () => {
      this.conversationListeners = this.conversationListeners.filter((l) => l !== listener);
    };
  }

  public subscribeTaskState(listener: (state: VoiceTaskState) => void): () => void {
    this.taskStateListeners.push(listener);
    listener(this.taskState);
    return () => {
      this.taskStateListeners = this.taskStateListeners.filter((l) => l !== listener);
    };
  }

  public setStatus(status: VoiceAiStatus) {
    if (this.currentStatus === status) return;
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public updateAiUtterance(text: string) {
    this.conversation = { ...this.conversation, aiUtterance: text };
    this.conversationListeners.forEach((fn) => fn(this.conversation));
  }

  public updateUserUtterance(text: string) {
    this.conversation = { ...this.conversation, userUtterance: text };
    this.conversationListeners.forEach((fn) => fn(this.conversation));
  }

  public updateTaskState(partial: Partial<VoiceTaskState>) {
    this.taskState = { ...this.taskState, ...partial };
    this.taskStateListeners.forEach((fn) => fn(this.taskState));
  }

  /**
   * Register the Audio Bridge (WebView or Native player)
   */
  public registerAudioBridge(bridge: AudioBridgeController | null): void {
    this.audioBridge = bridge;
  }

  /**
   * Request microphone permission safely with required diagnostics logging
   */
  public async ensureMicrophonePermission(): Promise<{ granted: boolean; canAskAgain: boolean; error?: string }> {
    console.log('[SpecFinder AI] Checking microphone permission');
    try {
      if (Platform.OS === 'android') {
        const check = await getRecordingPermissionsAsync().catch(() => null);
        if (check && check.granted) {
          console.log('[SpecFinder AI] Microphone permission: GRANTED');
          return { granted: true, canAskAgain: true };
        }

        const hasAndroidPerm = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).catch(() => false);
        if (hasAndroidPerm) {
          console.log('[SpecFinder AI] Microphone permission: GRANTED');
          return { granted: true, canAskAgain: true };
        }

        const req = await requestRecordingPermissionsAsync().catch(() => null);
        if (req && req.granted) {
          console.log('[SpecFinder AI] Microphone permission: GRANTED');
          return { granted: true, canAskAgain: true };
        }

        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'SpecFinder needs access to your microphone for voice commands.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        ).catch(() => null);

        if (res === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[SpecFinder AI] Microphone permission: GRANTED');
          return { granted: true, canAskAgain: true };
        } else {
          console.log('[SpecFinder AI] Microphone permission: DENIED');
          const isPermanent = res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || (req && !req.canAskAgain);
          return {
            granted: false,
            canAskAgain: !isPermanent,
            error: 'Microphone permission is required for SpecFinder AI.',
          };
        }
      }

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            console.log('[SpecFinder AI] Microphone permission: GRANTED');
            return { granted: true, canAskAgain: true };
          } catch (e: any) {
            console.log('[SpecFinder AI] Microphone permission: DENIED');
            return { granted: false, canAskAgain: false, error: 'Microphone permission is required for SpecFinder AI.' };
          }
        }
        console.log('[SpecFinder AI] Microphone permission: GRANTED');
        return { granted: true, canAskAgain: true };
      }

      const check = await getRecordingPermissionsAsync();
      if (check.granted) {
        console.log('[SpecFinder AI] Microphone permission: GRANTED');
        return { granted: true, canAskAgain: true };
      }

      const req = await requestRecordingPermissionsAsync();
      if (req.granted) {
        console.log('[SpecFinder AI] Microphone permission: GRANTED');
        return { granted: true, canAskAgain: true };
      } else {
        console.log('[SpecFinder AI] Microphone permission: DENIED');
        return {
          granted: false,
          canAskAgain: req.canAskAgain,
          error: 'Microphone permission is required for SpecFinder AI.',
        };
      }
    } catch (e: any) {
      console.warn('[SpecFinder AI] Mic permission check warning:', e?.message);
      console.log('[SpecFinder AI] Microphone permission: DENIED');
      return { granted: false, canAskAgain: true, error: 'Microphone permission is required for SpecFinder AI.' };
    }
  }

  /**
   * Immediately stops all active audio playback and clears queued audio buffers
   */
  public stopAllAudioPlayback(): void {
    try {
      Speech.stop();
    } catch (e) {}

    if (this.audioBridge) {
      try {
        this.audioBridge.stopPlayback();
      } catch (e) {}
    }

    if (this.webActiveSources.length > 0) {
      this.webActiveSources.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      this.webActiveSources = [];
    }
    this.webNextPlayTime = 0;
  }

  /**
   * Plays a 24kHz Base64 PCM audio chunk from Gemini Live
   */
  public playPcmChunk(base64Pcm: string): void {
    if (this.audioBridge) {
      this.audioBridge.playPcmChunk(base64Pcm);
    } else if (Platform.OS === 'web') {
      this.playWebPcmChunk(base64Pcm);
    }
  }

  /**
   * Web Audio Context PCM player (for Web runtime)
   */
  private playWebPcmChunk(base64Pcm: string): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!this.webAudioContext && AudioCtx) {
        this.webAudioContext = new AudioCtx({ sampleRate: 24000 });
      }
      const ctx = this.webAudioContext;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const binary = atob(base64Pcm);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, this.webNextPlayTime);
      source.start(startTime);
      this.webNextPlayTime = startTime + audioBuffer.duration;
      this.webActiveSources.push(source);

      source.onended = () => {
        const idx = this.webActiveSources.indexOf(source);
        if (idx !== -1) this.webActiveSources.splice(idx, 1);
        if (this.webActiveSources.length === 0) {
          this.handleAiSpeechEnded();
        }
      };
    } catch (e) {
      console.warn('[VoiceAi] Web PCM error:', e);
    }
  }

  /**
   * Receives streaming microphone audio chunk from AudioBridge
   */
  public handleMicrophoneChunk(base64Pcm: string, _rms?: number): void {
    // Only stream while in LISTENING state
    if (this.currentStatus === 'LISTENING') {
      this.sendLiveAudioChunk(base64Pcm);
    }
  }

  /**
   * Receives interim user speech text from speech recognizer
   */
  public handleUserSpeechInterim(text: string): void {
    if (this.currentStatus === 'LISTENING') {
      this.updateUserUtterance(text);
    }
  }

  /**
   * Transcribe native recorded audio file via Gemini backend endpoint
   */
  public async transcribeAudioFile(audioBase64: string, mimeType: string = 'audio/mp4'): Promise<string> {
    try {
      const baseUrl = getApiBaseUrl();
      console.log('[VoiceAi] Audio chunk sent');
      console.log(`[SpecFinder AI] Transcribing captured native audio (${audioBase64.length} chars, mimeType: ${mimeType}) via ${baseUrl}/api/ai/transcribe...`);
      const res = await fetch(`${baseUrl}/api/ai/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType }),
      });
      const data = await res.json();
      const text = (data.transcript || '').trim();
      console.log(`[SpecFinder AI] Transcribed text: "${text}"`);
      return text;
    } catch (err: any) {
      console.warn('[SpecFinder AI] Audio transcription request error:', err?.message || err);
      return '';
    }
  }

  /**
   * Transcribe PCM audio via Gemini backend endpoint (legacy fallback)
   */
  public async transcribeAudio(pcmBase64: string): Promise<string> {
    return this.transcribeAudioFile(pcmBase64, 'audio/pcm;rate=16000');
  }

  /**
   * TRIGGERED WHEN VOICE ACTIVITY DETECTION DETECTS END OF SPEECH:
   * 1. Stop microphone listening immediately
   * 2. If audio was recorded without native transcription, transcribe via Gemini
   * 3. Lock the user utterance in display: YOU: "<recognized words>"
   * 4. Transition to PROCESSING
   * 5. Submit command to Gemini
   */
  public async handleEndOfUserSpeech(finalText: string, pcmAudio?: string): Promise<void> {
    console.log('[SpecFinder AI] End of speech triggered. Finalizing utterance...');

    // 1. Physically stop listening!
    if (this.audioBridge) {
      try {
        this.audioBridge.stopRecording();
      } catch (e) {}
    }
    if (this.webMicStream) {
      try {
        this.webMicStream.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
      this.webMicStream = null;
    }
    if (this.webSpeechRecognizer) {
      try {
        this.webSpeechRecognizer.abort();
      } catch (e) {}
    }

    let recognized = (finalText || '').trim();

    // If text was empty (e.g. Android WebView where Web Speech API is absent), transcribe recorded PCM audio
    if (!recognized && pcmAudio) {
      this.setStatus('PROCESSING');
      this.updateAiUtterance('Understanding your voice...');
      recognized = await this.transcribeAudio(pcmAudio);
    }

    if (!recognized) {
      recognized = this.conversation.userUtterance.trim();
    }

    if (!recognized) {
      console.log('[SpecFinder AI] No speech recognized from microphone input.');
      this.setStatus('LISTENING');
      return;
    }

    console.log(`[SpecFinder AI] Spoken command recognized: "${recognized}"`);

    // 2. Lock user utterance in display
    this.updateUserUtterance(recognized);

    // 3. Transition to PROCESSING
    this.setStatus('PROCESSING');

    // 4. Send finalized utterance to Gemini
    this.sendLiveTextInput(recognized);
  }

  /**
   * Process spoken command autonomously via Gemini backend
   */
  public async processAutonomousCommand(transcript: string): Promise<void> {
    const currentGen = ++this.taskGeneration;
    this.setStatus('PROCESSING');
    this.updateUserUtterance(transcript);
    this.updateAiUtterance('Analyzing destination and route options...');

    try {
      const baseUrl = getApiBaseUrl();
      const userCoords = locationService.getCoordinates();

      console.log(`[SpecFinder AI] Sending recognized command to Gemini (${baseUrl}/api/ai/voice-turn)...`);

      const response = await fetch(`${baseUrl}/api/ai/voice-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          history: [
            {
              role: 'assistant',
              content: 'Hello and welcome to SpecFinder, an autonomous AI integrated service. Where would you like to go?',
            },
          ],
          currentLocation: {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
          },
        }),
      });

      const data = await response.json();
      if (currentGen !== this.taskGeneration) return;

      const functionCalls = data.functionCalls || [];
      const resolveCall = functionCalls.find(
        (c: any) => c.name === 'resolve_destination' || c.name === 'calculate_route' || c.name === 'start_navigation'
      );
      const findPlacesCall = functionCalls.find((c: any) => c.name === 'find_places');

      let destName: string | undefined = resolveCall?.args?.destinationName;

      // Robust fallback extraction if Gemini answered conversationally without a function call
      if (!destName) {
        const match = transcript.match(/(?:to|go to|take me to|navigate to|head to|reach)\s+([A-Za-z0-9\s]+)/i);
        if (match && match[1]) {
          destName = match[1].trim().replace(/[.,!?]$/, '');
        } else {
          const words = transcript.trim().split(/\s+/);
          if (words.length <= 3 && !/^(hello|hi|help|what|who|how|why)/i.test(transcript)) {
            destName = transcript.trim().replace(/[.,!?]$/, '');
          }
        }
      }

      if (destName) {
        console.log(`[SpecFinder AI] Resolving destination: "${destName}"...`);
        let waypoint: Place | null = null;
        let waypointCategory = findPlacesCall?.args?.category || null;

        if (findPlacesCall || /petrol|fuel|coffee|food|restaurant|atm|pharmacy|hospital/i.test(transcript)) {
          const category =
            waypointCategory ||
            (transcript.match(/petrol|fuel|coffee|food|restaurant|atm|pharmacy|hospital/i)?.[0] || 'petrol');
          waypointCategory = category;
          const found = await placesService.searchPlaces(category, undefined, userCoords);
          if (found.length > 0) waypoint = found[0];
        }

        // Look up place with Places service
        const places = await placesService.searchPlaces(destName, undefined, userCoords);
        const targetPlace: Place =
          places.length > 0
            ? places[0]
            : {
                id: `voice-dest-${Date.now()}`,
                name: destName,
                category: 'Shopping',
                rating: 4.8,
                reviewCount: 220,
                distance: 3800,
                travelTime: 11,
                status: 'OPEN',
                hours: 'Open 24 Hours',
                coordinates: APP_CONFIG.defaultDestination,
                direction: 'AHEAD',
                routeDeviation: 0,
                address: `${destName}, Hyderabad`,
                description: `Target destination: ${destName}`,
                phone: '+91 40 2345 6789',
                services: ['Navigation'],
              };

        // Calculate route with Routes service
        const routes = await directionsService.getRouteOptions(userCoords, targetPlace.coordinates);
        const chosenRoute: RouteOption =
          routes.length > 0
            ? routes[0]
            : {
                id: `voice-route-${Date.now()}`,
                type: 'FASTEST',
                title: `Fastest to ${targetPlace.name}`,
                subtitle: 'Optimal corridor',
                estimatedMinutes: 11,
                distanceKm: 3.8,
                trafficLevel: 'LOW',
                highlights: ['Fastest path'],
                stopsCount: 0,
              };

        if (currentGen !== this.taskGeneration) return;

        this.updateTaskState({
          destination: targetPlace.name,
          destinationCoordinates: targetPlace.coordinates,
          resolvedPlace: targetPlace,
          calculatedRoute: chosenRoute,
          waypointPlace: waypoint,
          requestedCategory: waypointCategory,
          taskComplete: true,
        });

        this.setStatus('CONFIRMING');

        // Required AI confirmation format: "I am navigating to <destination>."
        const confirmationMsg = waypoint
          ? `I am navigating to ${targetPlace.name} and I'll include a ${waypointCategory} stop along your route.`
          : `I am navigating to ${targetPlace.name}.`;

        console.log(`[SpecFinder AI] AI Response: "${confirmationMsg}"`);
        this.updateAiUtterance(confirmationMsg);

        // Speak the confirmation through phone speaker
        try {
          Speech.speak(confirmationMsg, {
            language: 'en-US',
            onDone: () => this.handleAiSpeechEnded(),
            onError: () => this.handleAiSpeechEnded(),
          });
        } catch (e) {
          setTimeout(() => this.handleAiSpeechEnded(), 1800);
        }
      } else {
        // Clarifying question
        const replyText = data.text || data.fallbackMessage || "Where would you like to go?";
        this.updateAiUtterance(replyText);
        this.setStatus('GREETING');
        try {
          Speech.speak(replyText, {
            language: 'en-US',
            onDone: () => this.handleAiSpeechEnded(),
            onError: () => this.handleAiSpeechEnded(),
          });
        } catch (e) {
          setTimeout(() => this.handleAiSpeechEnded(), 1800);
        }
      }
    } catch (err: any) {
      console.warn('[SpecFinder AI] Process command error:', err);
      this.setStatus('ERROR');
      this.updateAiUtterance('Could not process destination. Please tap the orb and try again.');
    }
  }

  /**
   * Called when AI finishes speaking its turn (Greeting or Confirmation)
   */
  public handleAiSpeechEnded(): void {
    console.log(`🔊 AI speech ended in state: ${this.currentStatus}`);

    if (this.currentStatus === 'GREETING') {
      // Greeting finished -> Enter LISTENING and begin capturing user's single utterance
      this.setStatus('LISTENING');
      if (this.audioBridge) {
        this.audioBridge.startRecording();
      } else if (Platform.OS === 'web') {
        this.startWebMicrophone();
      }
    } else if (this.currentStatus === 'CONFIRMING') {
      // Confirmation finished -> Trigger automatic navigation immediately!
      this.setStatus('NAVIGATING');
      if (this.taskState.resolvedPlace && this.taskState.calculatedRoute && this.onAutonomousNavigationCb) {
        this.onAutonomousNavigationCb(this.taskState.resolvedPlace, this.taskState.calculatedRoute);
      }
    }
  }

  /**
   * Sends 16kHz PCM audio chunk to active live session
   */
  public sendLiveAudioChunk(base64Pcm: string): void {
    console.log('[VoiceAi] Audio chunk sent');
    const payload = {
      audio: {
        data: base64Pcm,
        mimeType: 'audio/pcm;rate=16000',
      },
    };

    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: 'realtimeInput',
          data: payload,
        })
      );
    } else if (this.directLiveSession) {
      try {
        this.directLiveSession.sendRealtimeInput(payload);
      } catch (e) {}
    }
  }

  /**
   * Sends text input into the Live session
   */
  public sendLiveTextInput(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const payload = { text: trimmed };

    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: 'realtimeInput',
          data: payload,
        })
      );
    } else if (this.directLiveSession) {
      try {
        this.directLiveSession.sendRealtimeInput(payload);
      } catch (e) {}
    }
  }

  /**
   * START SINGLE-UTTERANCE VOICE SESSION
   */
  public async startSession(
    onAutonomousNavigation: (place: Place, route: RouteOption) => void
  ): Promise<void> {
    this.taskGeneration++;
    this.onAutonomousNavigationCb = onAutonomousNavigation;

    this.taskState = {
      destination: null,
      destinationCoordinates: null,
      requestedCategory: null,
      routePreference: null,
      additionalRequirements: null,
      taskComplete: false,
      resolvedPlace: null,
      calculatedRoute: null,
      waypointPlace: null,
    };
    this.updateTaskState({});

    this.conversation = {
      aiUtterance: 'Connecting to SpecFinder AI...',
      userUtterance: '',
    };
    this.conversationListeners.forEach((fn) => fn(this.conversation));

    this.setStatus('CONNECTING');

    const hasKey = Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
    console.log('[VoiceAi] Gemini key configured:', hasKey ? 'YES' : 'NO');

    // 1. Verify Microphone Permission
    const perm = await this.ensureMicrophonePermission();
    if (!perm.granted) {
      this.setStatus('ERROR');
      this.updateAiUtterance(perm.error || 'Microphone permission required for voice navigation.');
      return;
    }

    // 2. Connect to Live API over WebSocket
    console.log('[VoiceAi] Connection mode: BACKEND');
    console.log('[VoiceAi] Live session connecting...');
    const connected = await this.connectLiveSession();
    if (!connected) {
      console.warn('[VoiceAi] Falling back to direct Gemini Live connection');
      console.log('[VoiceAi] Connection mode: DIRECT');
      await this.connectDirectGeminiLive();
    }
  }

  /**
   * Connect via Backend WebSocket proxy
   */
  private async connectLiveSession(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const baseUrl = getApiBaseUrl();
        const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/ai/live-stream';
        console.log('[VoiceAi] Connecting to Live WebSocket at:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[VoiceAi] Live session connected');
          console.log('✅ Connected to Gemini Live WebSocket proxy');
          this.wsConnection = ws;

          // Keep-alive ping every 15 seconds
          if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data.toString());

            if (message.type === 'ready') {
              // Connected -> Expecting GREETING from AI
              this.setStatus('GREETING');
              resolve(true);
            } else if (message.type === 'gemini') {
              this.handleGeminiLiveEvent(message.data);
            } else if (message.type === 'error') {
              console.warn('[VoiceAi] Gemini connection error:', message.message);
              console.warn('[VoiceAi] Server live error:', message.message);
              this.setStatus('ERROR');
              this.updateAiUtterance(`Connection error: ${message.message}`);
            }
          } catch (e: any) {
            console.error('[VoiceAi] Parse error:', e?.message || e);
          }
        };

        ws.onerror = (e: any) => {
          console.warn('[VoiceAi] Gemini connection error:', e?.message || 'WebSocket error');
          console.warn('[VoiceAi] WebSocket connection failed:', e?.message || e);
          resolve(false);
        };

        ws.onclose = (ev: any) => {
          console.log('[VoiceAi] WebSocket live stream closed', ev?.code, ev?.reason);
          if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
          }
        };

        setTimeout(() => resolve(Boolean(this.wsConnection)), 4000);
      } catch (err: any) {
        console.warn('[VoiceAi] Gemini connection error:', err?.message || err);
        resolve(false);
      }
    });
  }

  /**
   * Direct Gemini Live API WebSocket connection (Fallback)
   */
  private async connectDirectGeminiLive(): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn('[VoiceAi] Gemini connection error: No API key found for direct connection');
        return;
      }

      console.log('[VoiceAi] Live session connecting...');
      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: ['AUDIO' as any],
          systemInstruction: {
            parts: [
              {
                text: `You are "SpecFinder AI", an autonomous voice AI navigation assistant for SpecFinder.
Your starting greeting must begin with: "Hello and welcome to SpecFinder, an autonomous AI integrated service." followed by asking: "Where would you like to go?"
Keep spoken replies concise, natural (1 sentence), and direct.
When the user specifies a destination (e.g. "I want to go to Gachibowli", "Take me to Charminar", "Navigate me to Secunderabad", "Let's go to the airport", "Get me to Hitech City"):
Verbally confirm with: "I am navigating to <destination>." (or if a stop along the route was requested: "I am navigating to <destination> and I'll include a <stop> along your route.") and call resolve_destination.
If the user's request is ambiguous without a destination (e.g. "I need food"), ask naturally: "Would you like me to find food nearby or along your journey?"
When the destination is resolved, call start_navigation.`,
              },
            ],
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'resolve_destination',
                  description: 'Resolve destination name to location coordinates',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      destinationName: { type: Type.STRING, description: 'Destination name' },
                    },
                    required: ['destinationName'],
                  },
                },
                {
                  name: 'calculate_route',
                  description: 'Calculate driving route to destination',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      destinationName: { type: Type.STRING, description: 'Destination name' },
                    },
                    required: ['destinationName'],
                  },
                },
                {
                  name: 'find_places',
                  description: 'Find places along route or near destination',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING, description: 'Category name' },
                      destinationName: { type: Type.STRING, description: 'Destination name' },
                    },
                    required: ['category'],
                  },
                },
                {
                  name: 'start_navigation',
                  description: 'Launch autonomous navigation',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      destinationName: { type: Type.STRING, description: 'Destination name' },
                    },
                    required: ['destinationName'],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            console.log('[VoiceAi] Live session connected');
            console.log('Direct Gemini Live connected');
            this.setStatus('GREETING');
            session.sendRealtimeInput({ text: 'Greet the user with the required welcome greeting now.' });
          },
          onmessage: (msg: any) => this.handleGeminiLiveEvent(msg),
          onerror: (err: any) => {
            console.warn('[VoiceAi] Gemini connection error:', err?.message || 'Direct Live error');
            console.warn('Direct Live error:', err?.message);
          },
          onclose: () => console.log('Direct Live closed'),
        },
      });

      this.directLiveSession = session;
    } catch (e: any) {
      console.warn('[VoiceAi] Gemini connection error:', e?.message || 'Direct Live connect notice');
      console.warn('[VoiceAi] Direct Live connect notice:', e?.message);
    }
  }

  /**
   * Handle incoming Gemini Live events
   */
  private async handleGeminiLiveEvent(msg: any): Promise<void> {
    // 1. Handle Tool Calls
    if (msg.toolCall?.functionCalls) {
      for (const call of msg.toolCall.functionCalls) {
        await this.handleToolCall(call);
      }
      return;
    }

    // 2. Process Content Parts (PCM Audio + Transcription)
    if (msg.serverContent) {
      const sc = msg.serverContent;

      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData?.data) {
            console.log('[VoiceAi] Gemini audio received');
            this.playPcmChunk(part.inlineData.data);
          }
        }
      }

      if (sc.outputTranscription?.text) {
        const text = sc.outputTranscription.text;
        if (this.currentStatus === 'GREETING') {
          this.updateAiUtterance(this.conversation.aiUtterance ? `${this.conversation.aiUtterance} ${text}`.trim() : text.trim());
        } else if (this.currentStatus === 'PROCESSING' || this.currentStatus === 'CONFIRMING') {
          this.updateAiUtterance(text.trim());
        }
      }

      if (sc.turnComplete) {
        // Ifturn completed while greeting or confirming, check end callback
        setTimeout(() => {
          if (this.currentStatus === 'GREETING') {
            this.handleAiSpeechEnded();
          }
        }, 1200);
      }
    }
  }

  /**
   * Executes function call from Gemini Live and sends response back
   */
  private async handleToolCall(call: { id: string; name: string; args: any }): Promise<void> {
    const currentGen = ++this.taskGeneration;
    let toolOutput: any = { success: true };
    const userCoords = locationService.getCoordinates();

    try {
      if (
        call.name === 'resolve_destination' ||
        call.name === 'calculate_route' ||
        call.name === 'start_navigation'
      ) {
        const destName = call.args?.destinationName || 'Gachibowli';
        const places = await placesService.searchPlaces(destName, undefined, userCoords);
        const targetPlace: Place =
          places.length > 0
            ? places[0]
            : {
                id: `voice-dest-${Date.now()}`,
                name: destName,
                category: 'Shopping',
                rating: 4.8,
                reviewCount: 220,
                distance: 3800,
                travelTime: 11,
                status: 'OPEN',
                hours: 'Open 24 Hours',
                coordinates: APP_CONFIG.defaultDestination,
                direction: 'AHEAD',
                routeDeviation: 0,
                address: `${destName}, Hyderabad`,
                description: `Target destination: ${destName}`,
                phone: '+91 40 2345 6789',
                services: ['Navigation'],
              };

        const routes = await directionsService.getRouteOptions(userCoords, targetPlace.coordinates);
        const chosenRoute: RouteOption =
          routes.length > 0
            ? routes[0]
            : {
                id: `voice-route-${Date.now()}`,
                type: 'FASTEST',
                title: `Fastest to ${targetPlace.name}`,
                subtitle: 'Optimal corridor',
                estimatedMinutes: 11,
                distanceKm: 3.8,
                trafficLevel: 'LOW',
                highlights: ['Fastest path'],
                stopsCount: 0,
              };

        if (currentGen !== this.taskGeneration) return;

        this.updateTaskState({
          destination: targetPlace.name,
          destinationCoordinates: targetPlace.coordinates,
          resolvedPlace: targetPlace,
          calculatedRoute: chosenRoute,
          taskComplete: true,
        });

        // Set status to CONFIRMING
        this.setStatus('CONFIRMING');

        // Required Confirmation format: "I am navigating to <destination>."
        const confirmationMsg = this.taskState.waypointPlace
          ? `I am navigating to ${targetPlace.name} and I'll include a ${this.taskState.requestedCategory || 'stop'} along your route.`
          : `I am navigating to ${targetPlace.name}.`;

        this.updateAiUtterance(confirmationMsg);

        // Speak the required confirmation through speaker
        try {
          Speech.speak(confirmationMsg, {
            language: 'en-US',
            onDone: () => this.handleAiSpeechEnded(),
            onError: () => this.handleAiSpeechEnded(),
          });
        } catch (e) {
          setTimeout(() => this.handleAiSpeechEnded(), 1800);
        }

        toolOutput = {
          success: true,
          destination: targetPlace.name,
          distanceKm: chosenRoute.distanceKm,
          estimatedMinutes: chosenRoute.estimatedMinutes,
        };
      } else if (call.name === 'find_places') {
        const category = call.args?.category || 'petrol';
        const places = await placesService.searchPlaces(category, undefined, userCoords);
        const waypoint = places.length > 0 ? places[0] : null;

        if (currentGen !== this.taskGeneration) return;

        this.updateTaskState({ waypointPlace: waypoint, requestedCategory: category });
        toolOutput = {
          success: true,
          found: Boolean(waypoint),
          placeName: waypoint?.name || `${category} station`,
        };
      }
    } catch (e: any) {
      toolOutput = { success: false, error: e.message };
    }

    // Send tool response back to Gemini Live
    const toolResponsePayload = {
      functionResponses: [
        {
          id: call.id,
          name: call.name,
          response: { output: toolOutput },
        },
      ],
    };

    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: 'toolResponse',
          data: toolResponsePayload,
        })
      );
    } else if (this.directLiveSession) {
      try {
        this.directLiveSession.sendToolResponse(toolResponsePayload);
      } catch (e) {}
    }
  }

  /**
   * Browser microphone capture for Web runtime with energy-based silence detection
   */
  private async startWebMicrophone(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    this.webHasSpoken = false;
    this.webLastSpeechTime = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.webMicStream = stream;

      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const micCtx = new AudioCtx({ sampleRate: 16000 });
      const micSource = micCtx.createMediaStreamSource(stream);
      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      this.webMicProcessor = processor;

      processor.onaudioprocess = (e: any) => {
        if (this.currentStatus !== 'LISTENING') return;

        const inputData = e.inputBuffer.getChannelData(0);
        let sumSquares = 0;
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / inputData.length);

        if (rms > 0.04) {
          this.webHasSpoken = true;
          this.webLastSpeechTime = Date.now();
        } else if (this.webHasSpoken && Date.now() - this.webLastSpeechTime > 850) {
          // User finished speaking!
          this.handleEndOfUserSpeech(this.conversation.userUtterance);
          return;
        }

        let binary = '';
        const bytes = new Uint8Array(pcm16.buffer);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        const base64Audio = btoa(binary);

        this.sendLiveAudioChunk(base64Audio);
      };

      micSource.connect(processor);
      processor.connect(micCtx.destination);
    } catch (err) {
      console.warn('[VoiceAi] Web mic start error:', err);
    }

    this.startWebSpeechRecognition();
  }

  /**
   * Continuous Speech Recognition for Web runtime
   */
  private startWebSpeechRecognition(): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (this.webSpeechRecognizer) {
        this.webSpeechRecognizer.abort();
      }
      const rec = new SpeechRecognition();
      rec.continuous = false; // SINGLE UTTERANCE ONLY
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const results = event.results;
        const currentResult = results[results.length - 1];
        const transcript = currentResult[0].transcript.trim();

        if (transcript) {
          this.handleUserSpeechInterim(transcript);

          if (currentResult.isFinal) {
            this.handleEndOfUserSpeech(transcript);
          }
        }
      };

      rec.onspeechend = () => {
        if (this.currentStatus === 'LISTENING') {
          this.handleEndOfUserSpeech(this.conversation.userUtterance);
        }
      };

      rec.onerror = (_e: any) => {};

      this.webSpeechRecognizer = rec;
      rec.start();
    } catch (e) {
      console.warn('[VoiceAi] Web speech init error:', e);
    }
  }

  public stopSpeaking(): void {
    this.stopAllAudioPlayback();
  }

  public stopListening(): void {
    this.stopAllAudioPlayback();
  }

  /**
   * Reset and close session
   */
  public resetSession(): void {
    this.taskGeneration++;
    this.stopAllAudioPlayback();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.audioBridge) {
      try {
        this.audioBridge.stopRecording();
      } catch (e) {}
    }

    if (this.webMicStream) {
      try {
        this.webMicStream.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
      this.webMicStream = null;
    }

    if (this.webMicProcessor) {
      try {
        this.webMicProcessor.disconnect();
      } catch (e) {}
      this.webMicProcessor = null;
    }

    if (this.webSpeechRecognizer) {
      try {
        this.webSpeechRecognizer.abort();
      } catch (e) {}
      this.webSpeechRecognizer = null;
    }

    if (this.wsConnection) {
      try {
        this.wsConnection.close();
      } catch (e) {}
      this.wsConnection = null;
    }

    if (this.directLiveSession) {
      try {
        this.directLiveSession.close();
      } catch (e) {}
      this.directLiveSession = null;
    }

    this.setStatus('IDLE');
    this.conversation = { aiUtterance: '', userUtterance: '' };
    this.conversationListeners.forEach((fn) => fn(this.conversation));
  }
}

export const voiceAiService = new VoiceAiService();

/**
 * Reads a local file URI (e.g. from expo-audio) and converts it to a clean Base64 string
 * using native filesystem APIs directly, without calling fetch() or response.blob().
 */
export async function uriToBase64(fileUri: string): Promise<string> {
  try {
    // 1. Primary: expo-file-system File API
    try {
      const file = new File(fileUri);
      if (typeof file.base64 === 'function') {
        const b64 = await file.base64();
        if (b64 && b64.length > 0) return b64;
      }
    } catch (e) {
      // Fallback below
    }

    // 2. Fallback: expo-file-system legacy readAsStringAsync
    try {
      if (FileSystemLegacy && typeof FileSystemLegacy.readAsStringAsync === 'function') {
        const b64 = await FileSystemLegacy.readAsStringAsync(fileUri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        if (b64 && b64.length > 0) return b64;
      }
    } catch (e) {
      // Fallback below
    }

    throw new Error('Unable to read audio file into Base64 from: ' + fileUri);
  } catch (err: any) {
    console.warn('[SpecFinder AI] Failed to convert URI to Base64:', err?.message || err);
    throw err;
  }
}
