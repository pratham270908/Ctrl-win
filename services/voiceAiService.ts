import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { Place, RouteOption, Coordinates } from '../types';
import { placesService } from './placesService';
import { directionsService } from './directionsService';
import { locationService } from './locationService';
import { APP_CONFIG, getApiBaseUrl } from '../constants/config';
import { GoogleGenAI, Type } from '@google/genai';

export type VoiceAiStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXECUTING'
  | 'COMPLETED'
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

  // Browser Audio Context for Web runtime
  private webAudioContext: any = null;
  private webMicStream: any = null;
  private webMicProcessor: any = null;
  private webActiveSources: any[] = [];
  private webNextPlayTime: number = 0;
  private webSpeechRecognizer: any = null;

  // Callbacks
  private onAutonomousNavigationCb: ((place: Place, route: RouteOption) => void) | null = null;

  // Generation counter to cancel stale tasks
  private taskGeneration: number = 0;

  // Keep-alive heartbeat
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
   * Request microphone permission safely
   */
  public async ensureMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((t) => t.stop());
            return { granted: true };
          } catch (e: any) {
            return { granted: false, error: 'Microphone permission denied by browser.' };
          }
        }
        return { granted: true };
      }

      const check = await getRecordingPermissionsAsync();
      if (check.granted) return { granted: true };

      const req = await requestRecordingPermissionsAsync();
      return {
        granted: req.granted,
        error: req.granted ? undefined : 'Microphone permission denied. Please allow microphone access in settings.',
      };
    } catch (e: any) {
      console.warn('[VoiceAi] Mic permission check warning:', e?.message);
      return { granted: true };
    }
  }

  /**
   * Immediately stops all active audio playback and clears queued audio buffers (Interruption / Barge-in)
   */
  public stopAllAudioPlayback(): void {
    try {
      Speech.stop();
    } catch (e) {}

    // Tell AudioBridge to stop playback immediately
    if (this.audioBridge) {
      try {
        this.audioBridge.stopPlayback();
      } catch (e) {}
    }

    // Web runtime playback cleanup
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

    if (this.currentStatus === 'SPEAKING') {
      this.setStatus('LISTENING');
    }
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

    if (this.currentStatus !== 'SPEAKING' && this.currentStatus !== 'EXECUTING') {
      this.setStatus('SPEAKING');
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
        if (this.webActiveSources.length === 0 && this.currentStatus === 'SPEAKING') {
          this.setStatus('LISTENING');
        }
      };
    } catch (e) {
      console.warn('[VoiceAi] Web PCM error:', e);
    }
  }

  /**
   * Receives microphone audio chunk from AudioBridge or native recorder
   */
  public handleMicrophoneChunk(base64Pcm: string, rms?: number): void {
    // If RMS energy indicates user speech while AI is speaking -> Instant client-side Barge-In!
    if (rms !== undefined && rms > 0.04 && this.currentStatus === 'SPEAKING') {
      console.log('⚡ User speech energy detected during AI playback -> Instant Barge-In triggered');
      this.stopAllAudioPlayback();
    }

    this.sendLiveAudioChunk(base64Pcm);
  }

  /**
   * Receives user speech text from speech recognizer
   */
  public handleUserSpeechDetected(text: string, isFinal?: boolean): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.updateUserUtterance(trimmed);

    if (this.currentStatus === 'SPEAKING') {
      this.stopAllAudioPlayback();
    }

    if (isFinal) {
      this.sendLiveTextInput(trimmed);
    }
  }

  /**
   * Callback when AI audio playback completes naturally
   */
  public handleAiSpeechEnded(): void {
    if (this.currentStatus === 'SPEAKING') {
      this.setStatus('LISTENING');
    }
  }

  /**
   * Sends 16kHz PCM audio chunk to active live session
   */
  public sendLiveAudioChunk(base64Pcm: string): void {
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

    this.stopAllAudioPlayback();
    this.setStatus('THINKING');
    this.updateUserUtterance(trimmed);

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
   * START PERSISTENT LIVE SESSION
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

    // 1. Verify Microphone Permission
    const perm = await this.ensureMicrophonePermission();
    if (!perm.granted) {
      this.setStatus('ERROR');
      this.updateAiUtterance(perm.error || 'Microphone permission required for voice navigation.');
      return;
    }

    // 2. Connect to Live API over WebSocket
    const connected = await this.connectLiveSession();
    if (!connected) {
      console.warn('[VoiceAi] Falling back to direct Gemini Live connection');
      await this.connectDirectGeminiLive();
    }

    // 3. Start audio bridge / microphone
    if (this.audioBridge) {
      this.audioBridge.startRecording();
    } else if (Platform.OS === 'web') {
      this.startWebMicrophone();
    }

    // 4. Initial status ready
    this.setStatus('LISTENING');
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
          console.log('✅ Connected to Gemini Live WebSocket proxy');
          this.wsConnection = ws;
          this.setStatus('LISTENING');

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
              this.setStatus('LISTENING');
              resolve(true);
            } else if (message.type === 'gemini') {
              this.handleGeminiLiveEvent(message.data);
            } else if (message.type === 'error') {
              console.warn('[VoiceAi] Server live error:', message.message);
              this.setStatus('ERROR');
              this.updateAiUtterance(`Connection error: ${message.message}`);
            }
          } catch (e) {
            console.error('[VoiceAi] Parse error:', e);
          }
        };

        ws.onerror = (e) => {
          console.warn('[VoiceAi] WebSocket connection failed:', e);
          resolve(false);
        };

        ws.onclose = () => {
          console.log('[VoiceAi] WebSocket live stream closed');
          if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
          }
        };

        setTimeout(() => resolve(Boolean(this.wsConnection)), 4000);
      } catch (err) {
        resolve(false);
      }
    });
  }

  /**
   * Direct Gemini Live API WebSocket connection via @google/genai SDK (Fallback)
   */
  private async connectDirectGeminiLive(): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return;

      const ai = new GoogleGenAI({ apiKey });

      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: ['AUDIO' as any],
          systemInstruction: {
            parts: [
              {
                text: `You are "SpecFinder AI", an autonomous real-time voice AI navigation assistant for SpecFinder.
Your starting greeting must begin with: "Hello and welcome to SpecFinder, an autonomous AI integrated service." followed by naturally asking: "Where would you like to go?"
Keep spoken replies concise, natural (1-2 sentences), and direct.
When the user specifies a destination (e.g. "I want to go to Charminar", "Take me to Gachibowli"), confirm verbally (e.g. "Sure. I'll help you get to Gachibowli.") and call resolve_destination.
When the user asks for stops or places along the way (e.g. "Find a petrol pump on the way"), understand that "on the way" refers to the active journey, confirm verbally (e.g. "Sure, I'll look for a petrol pump along your route."), and call find_places with the category and target destination.
If the user's request is ambiguous without a destination (e.g. "I need food"), do NOT navigate immediately; ask naturally: "Would you like me to find food nearby or along your journey?"
If the user changes their mind or interrupts (e.g. "Actually change destination to Kondapur" or "Wait, take me to Kondapur"), acknowledge verbally (e.g. "Sure, I'll change the destination to Kondapur.") and call resolve_destination with the new destination.
When the destination is confirmed, say "Starting navigation now." and call start_navigation.`,
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
            console.log('Direct Gemini Live connected');
            this.setStatus('LISTENING');
            // Trigger opening greeting
            session.sendRealtimeInput({ text: 'Greet the user with the required welcome greeting now.' });
          },
          onmessage: (msg: any) => this.handleGeminiLiveEvent(msg),
          onerror: (err: any) => console.warn('Direct Live error:', err?.message),
          onclose: () => console.log('Direct Live closed'),
        },
      });

      this.directLiveSession = session;
    } catch (e: any) {
      console.warn('[VoiceAi] Direct Live connect notice:', e?.message);
    }
  }

  /**
   * Handle incoming Gemini Live events
   */
  private async handleGeminiLiveEvent(msg: any): Promise<void> {
    // 1. Check for interruption / barge-in signal from Gemini Live VAD
    if (msg.serverContent?.interrupted) {
      console.log('⚡ Gemini Live Interruption received — stopping audio playback immediately');
      this.stopAllAudioPlayback();
      return;
    }

    // 2. Handle Tool Call from Gemini Live
    if (msg.toolCall?.functionCalls) {
      for (const call of msg.toolCall.functionCalls) {
        await this.handleToolCall(call);
      }
      return;
    }

    // 3. Process Content Parts (PCM Audio + Transcription)
    if (msg.serverContent) {
      const sc = msg.serverContent;

      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.playPcmChunk(part.inlineData.data);
          }
        }
      }

      if (sc.outputTranscription?.text) {
        const text = sc.outputTranscription.text;
        // Append or update AI utterance
        this.updateAiUtterance(this.conversation.aiUtterance ? `${this.conversation.aiUtterance} ${text}`.trim() : text.trim());
      }

      if (sc.inputTranscription?.text) {
        this.updateUserUtterance(sc.inputTranscription.text);
      }

      if (sc.turnComplete) {
        // If not actively playing audio sources, return to LISTENING
        if (this.currentStatus === 'THINKING' || this.currentStatus === 'SPEAKING') {
          setTimeout(() => {
            if (this.currentStatus === 'SPEAKING' || this.currentStatus === 'THINKING') {
              this.setStatus('LISTENING');
            }
          }, 400);
        }
      }
    }
  }

  /**
   * Executes function call from Gemini Live and sends response back
   */
  private async handleToolCall(call: { id: string; name: string; args: any }): Promise<void> {
    const currentGen = ++this.taskGeneration;
    this.setStatus('EXECUTING');

    let toolOutput: any = { success: true };
    const userCoords = locationService.getCoordinates();

    try {
      if (
        call.name === 'resolve_destination' ||
        call.name === 'calculate_route' ||
        call.name === 'start_navigation'
      ) {
        const destName = call.args?.destinationName || 'Gachibowli';
        this.updateAiUtterance(`Locating ${destName} and preparing the route...`);

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
                services: ['Parking'],
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

        toolOutput = {
          success: true,
          destination: targetPlace.name,
          distanceKm: chosenRoute.distanceKm,
          estimatedMinutes: chosenRoute.estimatedMinutes,
        };

        // If navigation trigger requested or destination is resolved:
        // Automatically start navigation without asking redundant questions
        setTimeout(() => {
          if (this.onAutonomousNavigationCb && currentGen === this.taskGeneration) {
            this.setStatus('COMPLETED');
            this.onAutonomousNavigationCb(targetPlace, chosenRoute);
          }
        }, 1600);
      } else if (call.name === 'find_places') {
        const category = call.args?.category || 'petrol';
        this.updateAiUtterance(`Finding ${category} along your route...`);

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
   * Browser microphone capture for Web runtime
   */
  private async startWebMicrophone(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

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
        const inputData = e.inputBuffer.getChannelData(0);
        let sumSquares = 0;
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / inputData.length);
        if (rms > 0.04 && this.currentStatus === 'SPEAKING') {
          this.stopAllAudioPlayback();
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
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const results = event.results;
        const currentResult = results[results.length - 1];
        const transcript = currentResult[0].transcript.trim();

        if (transcript) {
          this.updateUserUtterance(transcript);
          if (this.currentStatus === 'SPEAKING') {
            this.stopAllAudioPlayback();
          }
          if (currentResult.isFinal) {
            this.sendLiveTextInput(transcript);
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[VoiceAi] Web speech error:', e.error);
        }
      };

      rec.onend = () => {
        if (this.currentStatus !== 'IDLE' && this.currentStatus !== 'COMPLETED') {
          try {
            rec.start();
          } catch (e) {}
        }
      };

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

  public startListening(_navCb?: any): void {
    this.stopAllAudioPlayback();
    this.setStatus('LISTENING');
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
