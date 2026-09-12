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
import { Ionicons } from '@expo/vector-icons';
import { voiceAiService, VoiceAiStatus, VoiceTaskState } from '../services/voiceAiService';
import { Place, RouteOption } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface VoiceAiOverlayProps {
  visible: boolean;
  onClose: () => void;
  onAutonomousNavigation: (place: Place, route: RouteOption) => void;
}

export const VoiceAiOverlay: React.FC<VoiceAiOverlayProps> = ({
  visible,
  onClose,
  onAutonomousNavigation,
}) => {
  const [status, setStatus] = useState<VoiceAiStatus>('IDLE');
  const [transcript, setTranscript] = useState<string>('');
  const [taskState, setTaskState] = useState<VoiceTaskState>(voiceAiService.getTaskState());

  // Concentric wave animation values
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      voiceAiService.resetSession();
      return;
    }

    const unsubStatus = voiceAiService.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    const unsubTranscript = voiceAiService.subscribeTranscript((text) => {
      setTranscript(text);
    });

    const unsubTask = voiceAiService.subscribeTaskState((st) => {
      setTaskState(st);
    });

    // Start session with required starting greeting:
    // "Hello and welcome to SpecFinder, an autonomous AI integrated service."
    voiceAiService.startSession(onAutonomousNavigation);

    return () => {
      unsubStatus();
      unsubTranscript();
      unsubTask();
      voiceAiService.stopSpeaking();
      voiceAiService.stopListening();
    };
  }, [visible]);

  // Pulse & orb animations depending on status
  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;

    if (status === 'LISTENING' || status === 'SPEAKING' || status === 'EXECUTING') {
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
    } else if (status === 'THINKING') {
      loopAnim = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
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
    if (status === 'SPEAKING') {
      voiceAiService.stopSpeaking();
      voiceAiService.startListening(onAutonomousNavigation);
    } else if (status === 'LISTENING') {
      voiceAiService.stopListening();
    } else if (status === 'IDLE' || status === 'ERROR') {
      voiceAiService.startSession(onAutonomousNavigation);
    }
  };

  const handleQuickUtterance = (phrase: string) => {
    voiceAiService.handleUserUtterance(phrase, onAutonomousNavigation);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LISTENING':
        return { label: 'LISTENING...', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.18)' };
      case 'THINKING':
        return { label: 'AI THINKING...', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.18)' };
      case 'SPEAKING':
        return { label: 'SPEAKING...', color: '#10B981', bg: 'rgba(16, 185, 129, 0.18)' };
      case 'EXECUTING':
        return { label: 'ROUTING AUTONOMOUSLY...', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.18)' };
      case 'COMPLETED':
        return { label: 'TASK COMPLETE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.25)' };
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
          {/* Top Bar with Assistant Branding and Close */}
          <View style={styles.headerRow}>
            <View style={styles.brandingRow}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="sparkles" size={15} color={COLORS.accentCyan} />
              </View>
              <View>
                <Text style={styles.brandTitle}>SpecFinder AI</Text>
                <Text style={styles.brandSubtitle}>Autonomous Voice Navigation</Text>
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

          {/* Status Indicator Pill */}
          <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
            <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
          </View>

          {/* Futuristic Concentric Glowing AI Orb */}
          <View style={styles.orbContainer}>
            {/* Outer wave 3 */}
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave3,
                { transform: [{ scale: pulseAnim3 }] },
              ]}
            />
            {/* Mid wave 2 */}
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave2,
                { transform: [{ scale: pulseAnim2 }] },
              ]}
            />
            {/* Inner wave 1 */}
            <Animated.View
              style={[
                styles.pulseWave,
                styles.pulseWave1,
                { transform: [{ scale: pulseAnim1 }] },
              ]}
            />

            {/* Core Interactive Glowing Orb */}
            <TouchableOpacity
              style={styles.orbCore}
              onPress={handleOrbPress}
              activeOpacity={0.85}
            >
              {status === 'THINKING' ? (
                <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                  <Ionicons name="sync" size={44} color="#38BDF8" />
                </Animated.View>
              ) : status === 'SPEAKING' ? (
                <Ionicons name="volume-high" size={44} color="#38BDF8" />
              ) : status === 'EXECUTING' || status === 'COMPLETED' ? (
                <Ionicons name="navigate" size={44} color="#10B981" />
              ) : (
                <Ionicons name="sparkles" size={44} color="#38BDF8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Spoken live subtitle / transcript box */}
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>AI VOICE TRANSCRIPT</Text>
            <Text style={styles.transcriptText} numberOfLines={4}>
              {transcript || (status === 'LISTENING' ? 'Listening to your voice...' : 'Initializing SpecFinder AI...')}
            </Text>
          </View>

          {/* Structured Task Status Panel if destination detected */}
          {taskState.destination && (
            <View style={styles.taskCard}>
              <View style={styles.taskCardRow}>
                <Ionicons name="location" size={16} color={COLORS.accentCyan} />
                <Text style={styles.taskCardTitle}>
                  Target: <Text style={{ color: '#FFFFFF' }}>{taskState.destination}</Text>
                </Text>
              </View>
              {taskState.calculatedRoute && (
                <Text style={styles.taskCardSub}>
                  {taskState.calculatedRoute.title} • {taskState.calculatedRoute.estimatedMinutes} min • {taskState.calculatedRoute.distanceKm} km
                </Text>
              )}
            </View>
          )}

          {/* Quick Voice Prompt Shortcuts for instant testing & accessibility */}
          <View style={styles.quickPromptsContainer}>
            <Text style={styles.quickPromptsTitle}>Or tap a query to speak:</Text>
            <View style={styles.quickChipsWrap}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickUtterance('I want to go to Charminar')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>"Go to Charminar"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickUtterance('Find me a petrol pump on the way to Gachibowli')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>"Petrol pump to Gachibowli"</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => handleQuickUtterance('I need food')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipText}>"I need food"</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Tap Instruction */}
          <Text style={styles.bottomHint}>
            {status === 'SPEAKING'
              ? 'Tap orb to interrupt • Tap close to exit'
              : status === 'LISTENING'
              ? 'Speak naturally or tap a query above'
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
    backgroundColor: 'rgba(5, 11, 26, 0.88)',
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
    marginBottom: 24,
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
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  pulseWave: {
    position: 'absolute',
    borderRadius: 100,
  },
  pulseWave1: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  pulseWave2: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pulseWave3: {
    width: 165,
    height: 165,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.18)',
  },
  orbCore: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 8,
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 16,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    minHeight: 74,
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentCyan,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: '#F1F5F9',
    lineHeight: 20,
    fontWeight: '500',
  },
  taskCard: {
    width: '100%',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    marginBottom: 12,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  taskCardSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 3,
    fontWeight: '500',
  },
  quickPromptsContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 10,
  },
  quickPromptsTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickChipText: {
    fontSize: 11.5,
    color: '#38BDF8',
    fontWeight: '600',
  },
  bottomHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
});
