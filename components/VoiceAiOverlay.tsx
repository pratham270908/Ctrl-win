import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import {
  voiceAiService,
  VoiceAiStatus,
  VoiceTaskState,
  VoiceConversationExchange,
  AudioBridgeController,
} from '../services/voiceAiService';
import { Place, RouteOption } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface VoiceAiOverlayProps {
  visible: boolean;
  onClose: () => void;
  onAutonomousNavigation: (place: Place, route: RouteOption) => void;
}

const AUDIO_BRIDGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpecFinder Audio Bridge</title>
</head>
<body style="background:transparent; margin:0; padding:0;">
  <script>
    let audioCtx = null;
    let micStream = null;
    let micProcessor = null;
    let activeSources = [];
    let nextPlayTime = 0;
    let speechRecognizer = null;
    let hasSpoken = false;
    let lastSpeechTime = 0;
    let currentInterimTranscript = '';
    let isListeningActive = false;

    function getAudioContext() {
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx({ sampleRate: 24000 });
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    // Play 24kHz Base64 PCM chunk from Gemini Live
    window.playPcmChunk = function(base64Data) {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const binary = atob(base64Data);
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

        const startTime = Math.max(ctx.currentTime, nextPlayTime);
        source.start(startTime);
        nextPlayTime = startTime + audioBuffer.duration;
        activeSources.push(source);

        source.onended = function() {
          const idx = activeSources.indexOf(source);
          if (idx !== -1) activeSources.splice(idx, 1);
          if (activeSources.length === 0) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ai_speech_ended' }));
            }
          }
        };
      } catch (e) {
        console.error('PCM play error:', e);
      }
    };

    // Stop all audio playback immediately
    window.stopAllPlayback = function() {
      activeSources.forEach(function(s) {
        try { s.stop(); s.disconnect(); } catch (e) {}
      });
      activeSources = [];
      nextPlayTime = 0;
    };

    // Begin single-utterance microphone capture
    window.startRecording = async function() {
      getAudioContext();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

      hasSpoken = false;
      lastSpeechTime = 0;
      currentInterimTranscript = '';
      isListeningActive = true;

      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const micCtx = new AudioCtx({ sampleRate: 16000 });
        const source = micCtx.createMediaStreamSource(micStream);
        const processor = micCtx.createScriptProcessor(4096, 1, 1);
        micProcessor = processor;

        processor.onaudioprocess = function(e) {
          if (!isListeningActive) return;

          const inputData = e.inputBuffer.getChannelData(0);
          let sumSquares = 0;
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSquares += s * s;
          }
          const rms = Math.sqrt(sumSquares / inputData.length);

          // Energy-based Voice Activity Detection
          if (rms > 0.04) {
            hasSpoken = true;
            lastSpeechTime = Date.now();
          } else if (hasSpoken && Date.now() - lastSpeechTime > 850) {
            // END OF SPEECH DETECTED VIA VAD -> STOP IMMEDIATELY
            finalizeUtterance(currentInterimTranscript);
            return;
          }

          // Convert Int16 PCM to Base64
          let binary = '';
          const bytes = new Uint8Array(pcm16.buffer);
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
          }
          const base64Audio = btoa(binary);

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mic_pcm',
              data: base64Audio,
              rms: rms
            }));
          }
        };

        source.connect(processor);
        processor.connect(micCtx.destination);
      } catch (err) {
        console.warn('Mic init error:', err);
      }

      startSingleSpeechRecognition();
    };

    // End single utterance immediately & stop listening
    function finalizeUtterance(transcript) {
      if (!isListeningActive) return;
      isListeningActive = false;

      window.stopRecording();

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'end_of_speech',
          text: transcript || currentInterimTranscript
        }));
      }
    }

    window.stopRecording = function() {
      isListeningActive = false;
      if (micStream) {
        micStream.getTracks().forEach(function(t) { t.stop(); });
        micStream = null;
      }
      if (micProcessor) {
        micProcessor.disconnect();
        micProcessor = null;
      }
      if (speechRecognizer) {
        try { speechRecognizer.abort(); } catch (e) {}
        speechRecognizer = null;
      }
    };

    function startSingleSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      try {
        if (speechRecognizer) {
          speechRecognizer.abort();
        }
        const rec = new SpeechRecognition();
        rec.continuous = false; // SINGLE UTTERANCE ONLY
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = function(event) {
          if (!isListeningActive) return;

          const results = event.results;
          const currentResult = results[results.length - 1];
          const transcript = currentResult[0].transcript.trim();

          if (transcript) {
            hasSpoken = true;
            lastSpeechTime = Date.now();
            currentInterimTranscript = transcript;

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'user_speech_interim',
                text: transcript
              }));
            }

            if (currentResult.isFinal) {
              finalizeUtterance(transcript);
            }
          }
        };

        rec.onspeechend = function() {
          if (isListeningActive) {
            finalizeUtterance(currentInterimTranscript);
          }
        };

        rec.onerror = function() {};

        speechRecognizer = rec;
        rec.start();
      } catch (e) {}
    }

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bridge_ready' }));
    }
  </script>
</body>
</html>
`;

export const VoiceAiOverlay: React.FC<VoiceAiOverlayProps> = ({
  visible,
  onClose,
  onAutonomousNavigation,
}) => {
  const [status, setStatus] = useState<VoiceAiStatus>('IDLE');
  const [conversation, setConversation] = useState<VoiceConversationExchange>({
    aiUtterance: 'Connecting to SpecFinder AI...',
    userUtterance: '',
  });
  const [taskState, setTaskState] = useState<VoiceTaskState>(voiceAiService.getTaskState());

  const webViewRef = useRef<WebView>(null);

  // Concentric wave animation values
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Setup AudioBridge controller for voiceAiService
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const bridgeController: AudioBridgeController = {
      playPcmChunk: (base64Pcm: string) => {
        webViewRef.current?.injectJavaScript(`window.playPcmChunk("${base64Pcm}"); true;`);
      },
      stopPlayback: () => {
        webViewRef.current?.injectJavaScript(`window.stopAllPlayback(); true;`);
      },
      startRecording: () => {
        webViewRef.current?.injectJavaScript(`window.startRecording(); true;`);
      },
      stopRecording: () => {
        webViewRef.current?.injectJavaScript(`window.stopRecording(); true;`);
      },
    };

    voiceAiService.registerAudioBridge(bridgeController);

    return () => {
      voiceAiService.registerAudioBridge(null);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      voiceAiService.resetSession();
      return;
    }

    const unsubStatus = voiceAiService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubConv = voiceAiService.subscribeConversation((conv) => {
      setConversation(conv);
    });

    const unsubTask = voiceAiService.subscribeTaskState((st) => {
      setTaskState(st);
    });

    // Start Live Session
    voiceAiService.startSession(onAutonomousNavigation);

    return () => {
      unsubStatus();
      unsubConv();
      unsubTask();
      voiceAiService.stopSpeaking();
      voiceAiService.stopListening();
    };
  }, [visible]);

  // Handle messages from the hidden WebView Audio Bridge
  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'mic_pcm') {
        voiceAiService.handleMicrophoneChunk(msg.data, msg.rms);
      } else if (msg.type === 'user_speech_interim') {
        voiceAiService.handleUserSpeechInterim(msg.text);
      } else if (msg.type === 'end_of_speech') {
        voiceAiService.handleEndOfUserSpeech(msg.text);
      } else if (msg.type === 'ai_speech_ended') {
        voiceAiService.handleAiSpeechEnded();
      }
    } catch (e) {
      console.warn('[VoiceAi] WebView message parse error:', e);
    }
  };

  // Pulse & orb animations based on actual Voice State
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;

    if (status === 'LISTENING' || status === 'GREETING' || status === 'CONFIRMING') {
      loopAnim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim1, {
              toValue: 1.35,
              duration: 900,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim1, {
              toValue: 1,
              duration: 900,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim2, {
              toValue: 1.6,
              duration: 1200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim2, {
              toValue: 1,
              duration: 1200,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseAnim3, {
              toValue: 1.9,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim3, {
              toValue: 1,
              duration: 1500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      loopAnim.start();
    } else if (status === 'PROCESSING' || status === 'CONNECTING') {
      loopAnim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopAnim.start();
    } else {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
      pulseAnim3.setValue(1);
      spinAnim.setValue(0);
    }

    return () => {
      if (loopAnim) loopAnim.stop();
    };
  }, [status]);

  const handleOrbPress = () => {
    if (status === 'GREETING' || status === 'CONFIRMING') {
      voiceAiService.stopAllAudioPlayback();
      voiceAiService.handleAiSpeechEnded();
    } else if (status === 'IDLE' || status === 'ERROR') {
      voiceAiService.startSession(onAutonomousNavigation);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'CONNECTING':
        return { label: 'CONNECTING...', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' };
      case 'GREETING':
        return { label: 'GREETING...', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.18)' };
      case 'LISTENING':
        return { label: 'LISTENING...', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.22)' };
      case 'PROCESSING':
        return { label: 'PROCESSING COMMAND...', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.22)' };
      case 'CONFIRMING':
        return { label: 'CONFIRMING...', color: '#10B981', bg: 'rgba(16, 185, 129, 0.22)' };
      case 'NAVIGATING':
        return { label: 'STARTING NAVIGATION...', color: '#10B981', bg: 'rgba(16, 185, 129, 0.3)' };
      case 'ERROR':
        return { label: 'ERROR', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' };
      default:
        return { label: 'IDLE', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.18)' };
    }
  };

  const badge = getStatusBadge();
  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Top Bar with SpecFinder AI Branding & Close Button */}
          <View style={styles.headerRow}>
            <View style={styles.brandingRow}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="sparkles" size={16} color={COLORS.accentCyan} />
              </View>
              <View>
                <Text style={styles.brandTitle}>SpecFinder AI</Text>
                <Text style={styles.brandSubtitle}>Autonomous Voice Agent</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Real-time Status Badge */}
          <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          {/* Futuristic Concentric Glowing AI Orb */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave3,
                { transform: [{ scale: pulseAnim3 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave2,
                { transform: [{ scale: pulseAnim2 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave1,
                { transform: [{ scale: pulseAnim1 }] },
              ]}
            />

            <TouchableOpacity
              style={styles.orbCore}
              onPress={handleOrbPress}
              activeOpacity={0.85}
            >
              {status === 'PROCESSING' || status === 'CONNECTING' ? (
                <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                  <Ionicons name="sync" size={42} color="#38BDF8" />
                </Animated.View>
              ) : status === 'GREETING' || status === 'CONFIRMING' ? (
                <Ionicons name="volume-high" size={42} color="#38BDF8" />
              ) : status === 'NAVIGATING' ? (
                <Ionicons name="navigate" size={42} color="#10B981" />
              ) : (
                <Ionicons name="sparkles" size={42} color="#38BDF8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Explicit Turn-Based Display Boxes */}
          <View style={styles.dialogueBoxContainer}>
            {/* YOU CARD: Shown when user speaks or after utterance completes */}
            {conversation.userUtterance ? (
              <View style={styles.userUtteranceCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.userBadge}>
                    <Text style={styles.userBadgeText}>YOU</Text>
                  </View>
                  {status === 'LISTENING' && (
                    <View style={styles.micActiveIndicator}>
                      <View style={styles.micDot} />
                      <Text style={styles.micListeningText}>Listening</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userSpeechText}>
                  "{conversation.userUtterance}"
                </Text>
              </View>
            ) : null}

            {/* SPECFINDER AI CARD: Greeting, Prompt, or Confirmation */}
            <View style={styles.aiUtteranceCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>SPECFINDER AI</Text>
                </View>
              </View>
              <Text style={styles.aiSpeechText}>
                {conversation.aiUtterance || (status === 'LISTENING' ? 'Where would you like to go?' : 'Initializing...')}
              </Text>
            </View>
          </View>

          {/* Destination Target Card (If Resolved) */}
          {taskState.destination && (
            <View style={styles.destinationCard}>
              <View style={styles.destHeaderRow}>
                <Ionicons name="location" size={17} color={COLORS.accentCyan} />
                <Text style={styles.destName} numberOfLines={1}>
                  Target: <Text style={{ color: '#FFFFFF' }}>{taskState.destination}</Text>
                </Text>
              </View>
              {taskState.calculatedRoute && (
                <Text style={styles.destRouteStats}>
                  {taskState.calculatedRoute.title} • {taskState.calculatedRoute.estimatedMinutes} min • {taskState.calculatedRoute.distanceKm} km
                </Text>
              )}
              {taskState.waypointPlace && (
                <View style={styles.waypointRow}>
                  <Ionicons name="pin" size={14} color="#F59E0B" />
                  <Text style={styles.waypointText} numberOfLines={1}>
                    Stop: {taskState.waypointPlace.name} (On the way)
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Interaction Hint */}
          <Text style={styles.bottomHint}>
            {status === 'LISTENING'
              ? 'Speak one command • Stops automatically when you finish'
              : status === 'PROCESSING'
              ? 'Processing destination...'
              : status === 'CONFIRMING'
              ? 'Confirming route...'
              : status === 'NAVIGATING'
              ? 'Launching navigation...'
              : 'SpecFinder Autonomous Voice Assistant'}
          </Text>

          {/* Hidden Cross-Platform Web Audio & Recording Bridge */}
          {Platform.OS !== 'web' && (
            <WebView
              ref={webViewRef}
              source={{ html: AUDIO_BRIDGE_HTML }}
              originWhitelist={['*']}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              style={styles.hiddenWebView}
              onMessage={handleWebViewMessage}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 26, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 12,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.5)',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  orbContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  pulseWave: {
    position: 'absolute',
    borderRadius: 100,
  },
  pulseWave1: {
    width: 115,
    height: 115,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  pulseWave2: {
    width: 135,
    height: 135,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pulseWave3: {
    width: 155,
    height: 155,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.18)',
  },
  orbCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0369A1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 10,
  },
  dialogueBoxContainer: {
    width: '100%',
    marginVertical: 14,
    gap: 10,
  },
  userUtteranceCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.90)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  aiUtteranceCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  micActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  micDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  micListeningText: {
    fontSize: 10.5,
    color: '#38BDF8',
    fontWeight: '700',
  },
  aiBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  userSpeechText: {
    color: '#38BDF8',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  aiSpeechText: {
    color: '#F1F5F9',
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '500',
  },
  destinationCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentCyan,
  },
  destHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  destName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  destRouteStats: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 25,
    fontWeight: '500',
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 25,
    marginTop: 6,
  },
  waypointText: {
    fontSize: 11.5,
    color: '#F59E0B',
    fontWeight: '600',
  },
  bottomHint: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    position: 'absolute',
    opacity: 0,
  },
});
