import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import {
  voiceAiService,
  VoiceAiStatus,
  VoiceTaskState,
  VoiceConversationExchange,
  uriToBase64,
} from '../services/voiceAiService';
import { Place, RouteOption } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface VoiceAiOverlayProps {
  visible: boolean;
  onClose: () => void;
  onAutonomousNavigation: (place: Place, route: RouteOption) => void;
}

const GREETING_TEXT = 'Hello and welcome to SpecFinder, an autonomous AI integrated service. Where would you like to go?';

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

  const isListeningRef = useRef<boolean>(false);
  const recordingTimeoutRef = useRef<any>(null);
  const isComponentActiveRef = useRef<boolean>(false);

  // Native audio recorder from expo-audio (MPEG-4 AAC recording on Android hardware)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Concentric wave animation values
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Stop recording and finish single utterance
  const finishUtterance = useCallback(async () => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    console.log('[SpecFinder AI] Native microphone stopped');
    voiceAiService.setStatus('PROCESSING');
    voiceAiService.updateAiUtterance('Understanding your voice...');

    try {
      await recorder.stop();
      const recordedUri = recorder.uri;
      console.log('[SpecFinder AI] Native audio file recorded at:', recordedUri);

      if (!recordedUri) {
        voiceAiService.updateAiUtterance('Could not capture audio. Please tap the orb to try again.');
        voiceAiService.setStatus('IDLE');
        return;
      }

      // Convert local audio file to Base64
      const base64Audio = await uriToBase64(recordedUri);

      // Transcribe via Gemini backend transcribe endpoint
      const transcript = await voiceAiService.transcribeAudioFile(base64Audio, 'audio/mp4');

      if (!transcript || transcript.trim().length === 0) {
        console.log('[SpecFinder AI] No speech detected in recorded audio.');
        voiceAiService.updateAiUtterance("I didn't hear any speech. Please tap the orb and state your destination.");
        voiceAiService.setStatus('IDLE');
        return;
      }

      // STEP 5: Actual spoken transcript appears under YOU
      console.log(`[SpecFinder AI] Spoken command recognized: "${transcript}"`);
      voiceAiService.updateUserUtterance(transcript);

      // STEP 6, 7 & 8: Send to Gemini for destination understanding, confirmation, & autonomous navigation
      await voiceAiService.processAutonomousCommand(transcript);
    } catch (err: any) {
      console.error('[SpecFinder AI] Utterance processing failed:', err);
      voiceAiService.setStatus('ERROR');
      voiceAiService.updateAiUtterance('Error processing speech: ' + (err?.message || err));
    }
  }, [recorder]);

  // Start native microphone recording
  const startNativeListening = useCallback(async () => {
    if (isListeningRef.current || !isComponentActiveRef.current) return;

    // STEP 1 & 3: Permission check with required diagnostic logging
    console.log('[SpecFinder AI] Requesting microphone permission');
    const perm = await voiceAiService.ensureMicrophonePermission();

    if (!perm.granted) {
      console.log('[SpecFinder AI] Microphone permission: DENIED');
      voiceAiService.setStatus('ERROR');
      voiceAiService.updateAiUtterance(
        perm.error || 'Microphone permission DENIED. Please enable microphone permission in device settings.'
      );
      return; // Do NOT display LISTENING!
    }

    console.log('[SpecFinder AI] Microphone permission: GRANTED');
    console.log('[SpecFinder AI] Starting native microphone');

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      isListeningRef.current = true;

      console.log('[SpecFinder AI] Native microphone started');

      // Now and only now update UI to LISTENING
      voiceAiService.setStatus('LISTENING');
      voiceAiService.updateAiUtterance('Where would you like to go?');
      console.log('[SpecFinder AI] Audio input received');

      // STEP 4: Single Utterance Window (Automatic End-of-Speech Detection)
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = setTimeout(() => {
        if (isListeningRef.current) {
          finishUtterance();
        }
      }, 4200); // 4.2 seconds single utterance window
    } catch (err: any) {
      console.error('[SpecFinder AI] Failed to start native microphone:', err);
      voiceAiService.setStatus('ERROR');
      voiceAiService.updateAiUtterance('Could not start native microphone: ' + (err?.message || err));
    }
  }, [recorder, finishUtterance]);

  // Speak AI initial greeting, then automatically start native microphone
  const startGreeting = useCallback(() => {
    voiceAiService.setStatus('GREETING');
    voiceAiService.updateAiUtterance(GREETING_TEXT);

    try {
      Speech.speak(GREETING_TEXT, {
        language: 'en-US',
        onDone: () => {
          if (isComponentActiveRef.current) {
            startNativeListening();
          }
        },
        onError: () => {
          if (isComponentActiveRef.current) {
            startNativeListening();
          }
        },
      });
    } catch (e) {
      setTimeout(() => {
        if (isComponentActiveRef.current) {
          startNativeListening();
        }
      }, 2500);
    }
  }, [startNativeListening]);

  // Lifecycle when overlay becomes visible
  useEffect(() => {
    if (!visible) {
      isComponentActiveRef.current = false;
      isListeningRef.current = false;
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      Speech.stop();
      recorder.stop().catch(() => {});
      voiceAiService.resetSession();
      return;
    }

    isComponentActiveRef.current = true;

    const unsubStatus = voiceAiService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubConv = voiceAiService.subscribeConversation((conv) => {
      setConversation(conv);
    });

    const unsubTask = voiceAiService.subscribeTaskState((st) => {
      setTaskState(st);
    });

    // Start voice session
    voiceAiService.startSession(onAutonomousNavigation);
    startGreeting();

    return () => {
      isComponentActiveRef.current = false;
      isListeningRef.current = false;
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      unsubStatus();
      unsubConv();
      unsubTask();
      Speech.stop();
      recorder.stop().catch(() => {});
      voiceAiService.stopSpeaking();
      voiceAiService.stopListening();
    };
  }, [visible, startGreeting, recorder, onAutonomousNavigation]);

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
    if (status === 'GREETING') {
      Speech.stop();
      startNativeListening();
    } else if (status === 'LISTENING') {
      // User finished command early
      finishUtterance();
    } else if (status === 'CONFIRMING') {
      Speech.stop();
      voiceAiService.handleAiSpeechEnded();
    } else if (status === 'IDLE' || status === 'ERROR') {
      voiceAiService.startSession(onAutonomousNavigation);
      startGreeting();
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
});
