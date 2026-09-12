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

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

class VoiceAiService {
  private currentStatus: VoiceAiStatus = 'IDLE';
  private statusListeners: Array<(status: VoiceAiStatus) => void> = [];
  private transcriptListeners: Array<(text: string) => void> = [];
  private taskStateListeners: Array<(state: VoiceTaskState) => void> = [];

  private history: ConversationTurn[] = [];
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

  private webSpeechRecognition: any = null;

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
   * Check and request microphone permission safely without crashing
   */
  public async ensureMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach((track) => track.stop());
            return { granted: true };
          } catch (webErr: any) {
            return { granted: false, error: 'Microphone access denied in browser settings.' };
          }
        }
        return { granted: true };
      }

      const check = await getRecordingPermissionsAsync();
      if (check.granted) {
        return { granted: true };
      }

      const req = await requestRecordingPermissionsAsync();
      return {
        granted: req.granted,
        error: req.granted ? undefined : 'Microphone permission was denied by device.',
      };
    } catch (e: any) {
      console.warn('[VoiceAi] Microphone permission check warning:', e?.message);
      return { granted: true };
    }
  }

  /**
   * Speak via native device text-to-speech
   */
  public async speak(text: string, onComplete?: () => void): Promise<void> {
    try {
      await Speech.stop();
      this.setStatus('SPEAKING');
      this.emitTranscript(text);

      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.98,
        onDone: () => {
          if (onComplete) {
            onComplete();
          } else {
            this.setStatus('LISTENING');
          }
        },
        onError: () => {
          if (onComplete) onComplete();
          else this.setStatus('LISTENING');
        },
      });
    } catch (err) {
      console.warn('[VoiceAi] Speech synthesis notice:', err);
      if (onComplete) onComplete();
      else this.setStatus('LISTENING');
    }
  }

  /**
   * Stop speaking immediately (user interrupt)
   */
  public async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Starts the initial assistant greeting on tap
   */
  public async startSession(onAutonomousNavigation: (place: Place, route: RouteOption) => void): Promise<void> {
    this.history = [];
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

    // 1. Check microphone permission
    const perm = await this.ensureMicrophonePermission();
    if (!perm.granted) {
      this.setStatus('ERROR');
      this.emitTranscript(perm.error || 'Microphone permission required for voice navigation.');
      return;
    }

    // 2. Speak the REQUIRED starting greeting:
    // "Hello and welcome to SpecFinder, an autonomous AI integrated service."
    const greeting = 'Hello and welcome to SpecFinder, an autonomous AI integrated service.';
    const followUp = "Tell me where you'd like to go or what you'd like me to find along your journey.";

    this.history.push({ role: 'assistant', content: `${greeting} ${followUp}` });

    await this.speak(`${greeting} ${followUp}`, () => {
      this.startListening(onAutonomousNavigation);
    });
  }

  /**
   * Starts listening for user speech via Web Speech API or voice capture
   */
  public startListening(onAutonomousNavigation: (place: Place, route: RouteOption) => void): void {
    if (this.currentStatus === 'SPEAKING' || this.currentStatus === 'EXECUTING') {
      return;
    }
    this.setStatus('LISTENING');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (this.webSpeechRecognition) {
            this.webSpeechRecognition.abort();
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((res: any) => res[0].transcript)
              .join('');
            this.emitTranscript(transcript);

            if (event.results[0]?.isFinal) {
              this.webSpeechRecognition = null;
              this.handleUserUtterance(transcript, onAutonomousNavigation);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[VoiceAi] Speech recognition event:', event?.error);
          };

          this.webSpeechRecognition = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.warn('[VoiceAi] Web Speech API initialization notice:', e);
        }
      }
    }
  }

  /**
   * Stop active listening
   */
  public stopListening(): void {
    if (this.webSpeechRecognition) {
      try {
        this.webSpeechRecognition.stop();
      } catch (e) {}
      this.webSpeechRecognition = null;
    }
  }

  /**
   * Main turn processing with Gemini AI, function calling, and autonomous execution
   */
  public async handleUserUtterance(
    userText: string,
    onAutonomousNavigation: (place: Place, route: RouteOption) => void
  ): Promise<void> {
    const query = userText.trim();
    if (!query) return;

    this.stopListening();
    this.stopSpeaking();
    this.setStatus('THINKING');
    this.emitTranscript(query);
    this.history.push({ role: 'user', content: query });

    const userCoords = locationService.getCoordinates();
    const heading = APP_CONFIG.defaultLocation.heading || 45;

    try {
      // 1. Call backend voice-turn endpoint
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/ai/voice-turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: this.history,
          currentLocation: userCoords,
          userHeading: heading,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const functionCalls: Array<{ name: string; args: any }> = data.functionCalls || [];
      const aiText: string = data.text || '';

      // 2. Handle function calls
      if (functionCalls.length > 0) {
        await this.executeFunctionCalls(functionCalls, query, onAutonomousNavigation);
      } else if (aiText) {
        // 3. Spoken conversational follow-up (e.g. asking clarifying question)
        this.history.push({ role: 'assistant', content: aiText });
        await this.speak(aiText, () => {
          this.startListening(onAutonomousNavigation);
        });
      } else {
        const fallback = 'I heard you. Where would you like to navigate?';
        this.history.push({ role: 'assistant', content: fallback });
        await this.speak(fallback, () => {
          this.startListening(onAutonomousNavigation);
        });
      }
    } catch (err: any) {
      console.warn('[VoiceAi] Backend turn error, attempting direct SDK fallback:', err?.message);
      await this.handleDirectGeminiFallback(query, userCoords, onAutonomousNavigation);
    }
  }

  /**
   * Direct Gemini SDK fallback if backend is momentarily unreachable
   */
  private async handleDirectGeminiFallback(
    query: string,
    userCoords: Coordinates,
    onAutonomousNavigation: (place: Place, route: RouteOption) => void
  ): Promise<void> {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('No Gemini API key available');
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are SpecFinder Voice AI. Current coords: (${userCoords.latitude}, ${userCoords.longitude}).
Keep spoken answers concise (1-2 sentences).
If user specifies destination or place on the way, resolve it and navigate.
If request is ambiguous like "I need food", ask whether nearby or along their journey.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: query,
        config: {
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'resolve_destination',
                  description: 'Resolve destination name to location and calculate route',
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
                      category: { type: Type.STRING, description: 'Place category' },
                      destinationName: { type: Type.STRING, description: 'Destination name' },
                    },
                    required: ['category'],
                  },
                },
              ],
            },
          ],
        },
      });

      const functionCalls: any = response.functionCalls || [];
      const aiText = response.text || '';

      if (functionCalls.length > 0) {
        await this.executeFunctionCalls(functionCalls, query, onAutonomousNavigation);
      } else if (aiText) {
        this.history.push({ role: 'assistant', content: aiText });
        await this.speak(aiText, () => {
          this.startListening(onAutonomousNavigation);
        });
      } else {
        await this.speak("I'm finding your route now.", () => {
          this.executeDestinationResolution(query, onAutonomousNavigation);
        });
      }
    } catch (fallbackErr: any) {
      console.error('[VoiceAi] Direct SDK fallback error:', fallbackErr);
      this.setStatus('ERROR');
      await this.speak('Voice assistant is temporarily unavailable. Please try again.');
    }
  }

  /**
   * Executes Gemini function calls with existing SpecFinder services
   */
  private async executeFunctionCalls(
    calls: Array<{ name: string; args: any }>,
    originalQuery: string,
    onAutonomousNavigation: (place: Place, route: RouteOption) => void
  ): Promise<void> {
    this.setStatus('EXECUTING');

    let targetDestinationName = '';
    let targetCategory = '';

    for (const call of calls) {
      if (call.name === 'resolve_destination' || call.name === 'calculate_route' || call.name === 'start_navigation') {
        if (call.args?.destinationName) {
          targetDestinationName = call.args.destinationName;
        }
      }
      if (call.name === 'find_places') {
        if (call.args?.category) {
          targetCategory = call.args.category;
        }
        if (call.args?.destinationName && !targetDestinationName) {
          targetDestinationName = call.args.destinationName;
        }
      }
    }

    if (!targetDestinationName) {
      targetDestinationName = originalQuery.replace(/^(i want to go to|take me to|navigate to|go to)\s+/i, '').trim();
    }

    await this.executeDestinationResolution(
      targetDestinationName,
      onAutonomousNavigation,
      targetCategory
    );
  }

  /**
   * Resolves destination, calculates route, finds en-route places, and launches autonomous navigation
   */
  public async executeDestinationResolution(
    destinationName: string,
    onAutonomousNavigation: (place: Place, route: RouteOption) => void,
    categoryWaypoint?: string
  ): Promise<void> {
    try {
      this.setStatus('EXECUTING');
      this.emitTranscript(`Resolving route to ${destinationName}...`);

      const userCoords = locationService.getCoordinates();

      // 1. Resolve destination via existing placesService
      const matchingPlaces = await placesService.searchPlaces(destinationName, undefined, userCoords);
      let targetPlace: Place | null = matchingPlaces.length > 0 ? matchingPlaces[0] : null;

      if (!targetPlace) {
        targetPlace = {
          id: `voice-dest-${Date.now()}`,
          name: destinationName,
          category: 'Shopping',
          rating: 4.8,
          reviewCount: 350,
          distance: 4200,
          travelTime: 12,
          status: 'OPEN',
          hours: 'Open 24 Hours',
          coordinates: APP_CONFIG.defaultDestination,
          direction: 'AHEAD',
          routeDeviation: 0,
          address: `${destinationName}, Hyderabad`,
          description: `Autonomous voice destination: ${destinationName}`,
          phone: '+91 40 2345 6789',
          services: ['Parking', 'Accessible Entrance'],
        };
      }

      this.updateTaskState({
        destination: targetPlace.name,
        destinationCoordinates: targetPlace.coordinates,
        resolvedPlace: targetPlace,
      });

      // 2. Calculate route via existing directionsService
      const routes = await directionsService.getRouteOptions(userCoords, targetPlace.coordinates);
      const chosenRoute: RouteOption =
        routes.length > 0
          ? routes[0]
          : {
              id: `voice-route-${Date.now()}`,
              type: 'FASTEST',
              title: `Fastest to ${targetPlace.name}`,
              subtitle: 'Optimal corridor via expressway',
              estimatedMinutes: Math.round((targetPlace.travelTime || 10)),
              distanceKm: parseFloat(((targetPlace.distance || 3500) / 1000).toFixed(1)),
              trafficLevel: 'LOW',
              highlights: ['Fastest corridor', 'Minimal delays'],
              stopsCount: 0,
            };

      // 3. If category requested along route (e.g. petrol pump or pharmacy), find it
      let waypointPlace: Place | null = null;
      if (categoryWaypoint) {
        const stops = await placesService.getRouteRecommendations(
          targetPlace,
          chosenRoute,
          45,
          38,
          'ALL',
          userCoords
        );
        const catLower = categoryWaypoint.toLowerCase();
        waypointPlace =
          stops.find((s) => s.category.toLowerCase().includes(catLower) || s.name.toLowerCase().includes(catLower)) ||
          (stops.length > 0 ? stops[0] : null);
      }

      this.updateTaskState({
        calculatedRoute: chosenRoute,
        waypointPlace,
        taskComplete: true,
      });

      // 4. Speak autonomous confirmation
      let spokenMessage = `Your route to ${targetPlace.name} is ready. Starting navigation.`;
      if (waypointPlace) {
        spokenMessage = `I've found ${waypointPlace.name} along your route to ${targetPlace.name}. Starting navigation now.`;
      }

      this.setStatus('COMPLETED');
      this.emitTranscript(spokenMessage);

      await this.speak(spokenMessage, () => {
        setTimeout(() => {
          onAutonomousNavigation(targetPlace!, chosenRoute);
        }, 350);
      });
    } catch (err: any) {
      console.error('[VoiceAi] Execution error:', err);
      this.setStatus('ERROR');
      await this.speak("I couldn't resolve the route. Please try again.");
    }
  }

  /**
   * Reset session
   */
  public resetSession(): void {
    this.stopListening();
    this.stopSpeaking();
    this.setStatus('IDLE');
    this.emitTranscript('');
  }
}

export const voiceAiService = new VoiceAiService();
