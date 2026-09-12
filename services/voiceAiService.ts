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
  | 'READY'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'ERROR';

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

class VoiceAiService {
  private currentStatus: VoiceAiStatus = 'IDLE';
  private statusListeners: Array<(status: VoiceAiStatus) => void> = [];
  private transcriptListeners: Array<(text: string) => void> = [];
  private taskStateListeners: Array<(state: VoiceTaskState) => void> = [];

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

  // Web Audio Context for mic streaming & PCM playback
  private audioContext: any = null;
  private micStream: any = null;
  private micProcessor: any = null;
  private audioPlaybackQueue: any[] = [];
  private activeBufferSources: any[] = [];
  private nextPlayTime: number = 0;

  // Continuous speech recognition
  private speechRecognizer: any = null;

  // Callbacks
  private onAutonomousNavigationCb: ((place: Place, route: RouteOption) => void) | null = null;

  // Generation counter to cancel superseded/stale tasks
  private taskGeneration: number = 0;

  public getStatus(): VoiceAiStatus {
    return this.currentStatus;
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

  public subscribeTranscript(listener: (text: string) => void): () => void {
    this.transcriptListeners.push(listener);
    return () => {
      this.transcriptListeners = this.transcriptListeners.filter((l) => l !== listener);
    };
  }

  public subscribeTaskState(listener: (state: VoiceTaskState) => void): () => void {
    this.taskStateListeners.push(listener);
    listener(this.taskState);
    return () => {
      this.taskStateListeners = this.taskStateListeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: VoiceAiStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  private emitTranscript(text: string) {
    this.transcriptListeners.forEach((fn) => fn(text));
  }

  private updateTaskState(partial: Partial<VoiceTaskState>) {
    this.taskState = { ...this.taskState, ...partial };
    this.taskStateListeners.forEach((fn) => fn(this.taskState));
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
        error: req.granted ? undefined : 'Microphone permission was denied by device.',
      };
    } catch (e: any) {
      console.warn('[VoiceAi] Mic permission check warning:', e?.message);
      return { granted: true };
    }
  }

  /**
   * Initialize Web Audio Context for real-time PCM audio playback
   */
  private getAudioContext(): any {
    if (typeof window !== 'undefined') {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx({ sampleRate: 24000 });
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    }
    return this.audioContext;
  }

  /**
   * Immediately stops all active audio playback and clears queued audio buffers (Interruption / Barge-in)
   */
  public stopAllAudioPlayback(): void {
    try {
      Speech.stop();
    } catch (e) {}

    if (this.activeBufferSources.length > 0) {
      this.activeBufferSources.forEach((source) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {}
      });
      this.activeBufferSources = [];
    }
    this.audioPlaybackQueue = [];
    this.nextPlayTime = 0;

    if (this.currentStatus === 'SPEAKING') {
      this.setStatus('LISTENING');
    }
  }

  /**
   * Enqueues and plays a 24kHz Base64 PCM audio chunk from Gemini Live
   */
  private playPcmChunk(base64Pcm: string): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;
      this.activeBufferSources.push(source);

      source.onended = () => {
        const idx = this.activeBufferSources.indexOf(source);
        if (idx !== -1) this.activeBufferSources.splice(idx, 1);
        if (this.activeBufferSources.length === 0 && this.currentStatus === 'SPEAKING') {
          this.setStatus('LISTENING');
        }
      };

      if (this.currentStatus !== 'SPEAKING') {
        this.setStatus('SPEAKING');
      }
    } catch (err) {
      console.warn('[VoiceAi] Error playing PCM chunk:', err);
    }
  }

  /**
   * Starts persistent live microphone stream
   */
  private async startContinuousMicrophone(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

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
      this.micStream = stream;

      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const micCtx = new AudioCtx({ sampleRate: 16000 });
      const micSource = micCtx.createMediaStreamSource(stream);

      // 4096 samples buffer at 16kHz (~250ms per chunk)
      const processor = micCtx.createScriptProcessor(4096, 1, 1);
      this.micProcessor = processor;

      processor.onaudioprocess = (e: any) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Simple VAD energy detection for instant client-side barge-in
        let sumSquares = 0;
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / inputData.length);
        if (rms > 0.04 && this.currentStatus === 'SPEAKING') {
          // User is speaking while AI is speaking -> Immediate Barge-in!
          this.stopAllAudioPlayback();
        }

        // Convert PCM16 to Base64
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
      console.warn('[VoiceAi] Mic streaming initialization notice:', err);
    }

    // Also start continuous Web Speech recognition to stream live transcribed text
    this.startContinuousSpeechRecognition();
  }

  /**
   * Continuous Speech Recognition for real-time text injection into Live session
   */
  private startContinuousSpeechRecognition(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (this.speechRecognizer) {
            this.speechRecognizer.abort();
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
              this.emitTranscript(transcript);

              // If user speaks, trigger immediate audio interruption
              if (this.currentStatus === 'SPEAKING') {
                this.stopAllAudioPlayback();
              }

              if (currentResult.isFinal) {
                this.sendLiveTextInput(transcript);
              }
            }
          };

          rec.onerror = (e: any) => {
            // Ignore no-speech errors to stay listening continuously
            if (e.error !== 'no-speech' && e.error !== 'aborted') {
              console.warn('[VoiceAi] Speech recognition event:', e.error);
            }
          };

          rec.onend = () => {
            // Restart automatically if session is still active
            if (this.currentStatus !== 'IDLE' && this.currentStatus !== 'COMPLETED') {
              try {
                rec.start();
              } catch (e) {}
            }
          };

          this.speechRecognizer = rec;
          rec.start();
        } catch (e) {
          console.warn('[VoiceAi] Web Speech API start notice:', e);
        }
      }
    }
  }

  /**
   * Sends audio chunk to active live session
   */
  private sendLiveAudioChunk(base64Pcm: string): void {
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
   * Sends real-time text input into the Live session
   */
  public sendLiveTextInput(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    this.stopAllAudioPlayback();
    this.setStatus('THINKING');
    this.emitTranscript(trimmed);

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

    // 1. Verify Microphone Permission
    const perm = await this.ensureMicrophonePermission();
    if (!perm.granted) {
      this.setStatus('ERROR');
      this.emitTranscript(perm.error || 'Microphone permission required for voice navigation.');
      return;
    }

    this.setStatus('LISTENING');

    // 2. Connect to Live API over WebSocket
    const connected = await this.connectLiveSession();
    if (!connected) {
      console.warn('[VoiceAi] Falling back to direct Gemini Live connection');
      await this.connectDirectGeminiLive();
    }

    // 3. Start persistent microphone stream
    await this.startContinuousMicrophone();

    // 4. Trigger the REQUIRED starting greeting:
    // "Hello and welcome to SpecFinder, an autonomous AI integrated service."
    this.sendLiveTextInput('Start session and greet the user.');
  }

  /**
   * Connect via Backend WebSocket proxy
   */
  private async connectLiveSession(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const baseUrl = getApiBaseUrl();
        const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/ai/live-stream';

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ Connected to Gemini Live WebSocket proxy at', wsUrl);
          this.wsConnection = ws;
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data.toString());

            if (message.type === 'ready') {
              resolve(true);
            } else if (message.type === 'gemini') {
              this.handleGeminiLiveEvent(message.data);
            } else if (message.type === 'error') {
              console.warn('[VoiceAi] Server live error:', message.message);
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
        };

        setTimeout(() => resolve(Boolean(this.wsConnection)), 3500);
      } catch (err) {
        resolve(false);
      }
    });
  }

  /**
   * Direct Gemini Live API WebSocket connection via @google/genai SDK
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
                text: `You are "SpecFinder AI", an autonomous voice AI navigation assistant for SpecFinder.
Your starting greeting must begin with: "Hello and welcome to SpecFinder, an autonomous AI integrated service." followed by naturally asking: "Tell me where you'd like to go or what you'd like me to find along your journey."
Keep spoken replies concise, natural (1-2 sentences), and direct.
When user mentions a destination or says "take me to [X]", call resolve_destination.
When user asks for a stop along the way (e.g. "Find a petrol station on the way"), call find_places.
If the user changes their mind (e.g. "Actually take me to Kondapur instead"), call resolve_destination with the new destination.
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
          onopen: () => console.log('Direct Gemini Live connected'),
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
   * Handle incoming Gemini Live server events
   */
  private async handleGeminiLiveEvent(msg: any): Promise<void> {
    // 1. Check for interruption / barge-in signal
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
        this.emitTranscript(sc.outputTranscription.text);
      }

      if (sc.inputTranscription?.text) {
        this.emitTranscript(sc.inputTranscription.text);
      }

      if (sc.turnComplete) {
        if (this.activeBufferSources.length === 0) {
          this.setStatus('LISTENING');
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
      if (call.name === 'resolve_destination' || call.name === 'calculate_route' || call.name === 'start_navigation') {
        const destName = call.args?.destinationName || 'Gachibowli';
        this.emitTranscript(`Resolving ${destName}...`);

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

        // If user changed their mind while a previous task was running, verify generation!
        if (currentGen !== this.taskGeneration) {
          return;
        }

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

        // If navigation completion is requested or destination confirmed
        if (call.name === 'start_navigation' || this.onAutonomousNavigationCb) {
          setTimeout(() => {
            if (this.onAutonomousNavigationCb && currentGen === this.taskGeneration) {
              this.onAutonomousNavigationCb(targetPlace, chosenRoute);
            }
          }, 1800);
        }
      } else if (call.name === 'find_places') {
        const category = call.args?.category || 'petrol';
        this.emitTranscript(`Finding ${category} along route...`);

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

  public handleUserUtterance(text: string, _navCb?: any): void {
    this.sendLiveTextInput(text);
  }

  /**
   * Reset and close session
   */
  public resetSession(): void {
    this.taskGeneration++;
    this.stopAllAudioPlayback();

    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
      this.micStream = null;
    }

    if (this.micProcessor) {
      try {
        this.micProcessor.disconnect();
      } catch (e) {}
      this.micProcessor = null;
    }

    if (this.speechRecognizer) {
      try {
        this.speechRecognizer.abort();
      } catch (e) {}
      this.speechRecognizer = null;
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
    this.emitTranscript('');
  }
}

export const voiceAiService = new VoiceAiService();
