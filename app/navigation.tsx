import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { InteractiveMap } from '../components/InteractiveMap';
import { directionsService, TurnInstruction } from '../services/directionsService';
import { Place, RouteOption } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../store/AppContext';

interface NavigationScreenProps {
  destinationPlace?: Place | null;
  activeRoute?: RouteOption | null;
  onEndNavigation: () => void;
  onRouteChange: () => void;
}

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  destinationPlace,
  activeRoute,
  onEndNavigation,
  onRouteChange,
}) => {
  const { settings, updateSetting } = useApp();
  const [instructions, setInstructions] = useState<TurnInstruction[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(!settings.voiceGuidance);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(45);
  const [detourTaken, setDetourTaken] = useState<boolean>(false);
  const [showDetourOffer, setShowDetourOffer] = useState<boolean>(true);

  useEffect(() => {
    directionsService.getTurnByTurnInstructions().then(setInstructions);
  }, []);

  // Automatic trip simulation loop when isSimulating is active
  useEffect(() => {
    if (!isSimulating || instructions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < instructions.length - 1) {
          const next = prev + 1;
          const speeds = [42, 58, 48, 22];
          setCurrentSpeed(speeds[next % speeds.length]);
          return next;
        } else {
          setIsSimulating(false);
          Alert.alert('Destination Reached!', `You have arrived safely at ${destName}.`, [
            { text: 'Complete Journey', onPress: onEndNavigation },
          ]);
          return prev;
        }
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [isSimulating, instructions]);

  const currentInstruction = instructions[currentStepIndex] || {
    instruction: 'Continue straight',
    distanceText: '250 m',
    icon: 'arrow-up',
    streetName: 'Cyber Towers Flyover',
  };

  const destName = destinationPlace?.name || 'Gachibowli Tech Campus';

  const distances = ['2.1 km', '1.6 km', '900 m', '200 m'];
  const times = detourTaken ? ['5 min', '3 min', '2 min', '1 min'] : ['8 min', '6 min', '3 min', '1 min'];
  const remainingDist = distances[currentStepIndex] || (activeRoute ? `${activeRoute.distanceKm} km` : '2.1 km');
  const remainingTime = times[currentStepIndex] || (activeRoute ? `${activeRoute.estimatedMinutes} min` : '8 min');

  const handleToggleMute = async () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    await updateSetting('voiceGuidance', !nextState);
    Alert.alert(
      nextState ? 'Voice Guidance Muted' : 'Voice Guidance Enabled',
      nextState
        ? 'Navigation announcements will remain silent.'
        : 'Directional voice announcements are now active.'
    );
  };

  const handleRecenter = () => {
    Alert.alert('Location Centered', 'Re-aligned camera to your vehicle vector (45° NE).');
  };

  const handleNextStep = () => {
    if (currentStepIndex < instructions.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      Alert.alert('Arrived!', `You have arrived at ${destName}.`, [
        { text: 'Finish Journey', onPress: onEndNavigation },
      ]);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleToggleSimulation = () => {
    const next = !isSimulating;
    setIsSimulating(next);
    if (next) {
      Alert.alert(
        'Auto-Drive Simulation Started',
        'Your simulated journey is now advancing through turns and updating speed in real-time.'
      );
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [25, 45, 65, 80];
    const nextIdx = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
    setCurrentSpeed(speeds[nextIdx]);
  };

  const handleTakeDetour = () => {
    setDetourTaken(true);
    setShowDetourOffer(false);
    Alert.alert('⚡ Detour Accepted', 'Switched to Bio-Diversity Flyover bypass. You save 3 minutes of traffic!');
  };

  const handleConfirmEnd = () => {
    Alert.alert(
      'End Navigation?',
      'Are you sure you want to stop active navigation guidance?',
      [
        { text: 'Keep Navigating', style: 'cancel' },
        { text: 'End Journey', style: 'destructive', onPress: onEndNavigation },
      ]
    );
  };

  const handleLanePress = () => {
    Alert.alert(
      'Lane Guidance',
      'Center Lane (Lane 2) is recommended for continuing on the Cyber Towers Flyover toward Gachibowli.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Turn Instruction Banner with Step Navigation */}
      <View style={styles.turnBanner}>
        {/* Step Backward Button */}
        <TouchableOpacity
          style={[styles.stepNavBtn, currentStepIndex === 0 && styles.stepNavBtnDisabled]}
          onPress={handlePrevStep}
          disabled={currentStepIndex === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={currentStepIndex === 0 ? '#475569' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.turnContentWrap}
          onPress={handleNextStep}
          activeOpacity={0.85}
        >
          <View style={styles.turnIconCircle}>
            <Ionicons
              name={currentInstruction.icon as any}
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.turnTextCol}>
            <Text style={styles.turnDistance}>{currentInstruction.distanceText}</Text>
            <Text style={styles.turnInstruction} numberOfLines={1}>
              {currentInstruction.instruction}
            </Text>
            <Text style={styles.streetName} numberOfLines={1}>
              onto {currentInstruction.streetName}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Step Forward Button */}
        <TouchableOpacity
          style={styles.stepNavBtn}
          onPress={handleNextStep}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Turn Progress Dots */}
      <View style={styles.dotsBar}>
        {instructions.map((_, idx) => (
          <View
            key={idx}
            style={[styles.stepDot, idx === currentStepIndex && styles.stepDotActive]}
          />
        ))}
        <Text style={styles.dotsLabel}>
          Step {currentStepIndex + 1} of {Math.max(1, instructions.length)}
        </Text>
      </View>

      {/* Interactive 3-Lane Guidance HUD */}
      <TouchableOpacity
        style={styles.laneGuidanceRow}
        onPress={handleLanePress}
        activeOpacity={0.8}
      >
        <View style={styles.laneItem}>
          <Ionicons name="arrow-up" size={14} color="#64748B" />
          <Text style={styles.laneText}>Lane 1</Text>
        </View>

        <View style={[styles.laneItem, styles.laneItemActive]}>
          <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
          <Text style={styles.laneTextActive}>Lane 2 (Active)</Text>
          <View style={styles.recommendedPill}>
            <Text style={styles.recommendedPillText}>KEEP</Text>
          </View>
        </View>

        <View style={styles.laneItem}>
          <Ionicons name="arrow-forward" size={14} color="#64748B" />
          <Text style={styles.laneText}>Exit</Text>
        </View>
      </TouchableOpacity>

      {/* Main Full-Bleed Interactive Navigation Map */}
      <View style={styles.mapArea}>
        <InteractiveMap
          height={400}
          places={destinationPlace ? [destinationPlace] : []}
          selectedPlace={destinationPlace}
          destinationName={destName}
          isNavigationMode={true}
          onRecenter={handleRecenter}
        />

        {/* Floating Ahead Speed & Trajectory HUD with Simulation & Speed Cycler */}
        <View style={styles.hudOverlay}>
          <View style={styles.hudPill}>
            <View style={styles.hudDot} />
            <Text style={styles.hudText}>VECTOR 45° NE</Text>
          </View>

          {/* Interactive Auto-Drive Simulation Toggle */}
          <TouchableOpacity
            style={[styles.simControlBtn, isSimulating && styles.simControlBtnActive]}
            onPress={handleToggleSimulation}
            activeOpacity={0.75}
          >
            <Ionicons
              name={isSimulating ? 'pause' : 'play'}
              size={13}
              color="#FFFFFF"
            />
            <Text style={styles.simControlText}>
              {isSimulating ? 'Pause Drive' : 'Auto Drive'}
            </Text>
          </TouchableOpacity>

          {/* Interactive Speed Dial */}
          <TouchableOpacity
            style={styles.speedDial}
            onPress={handleCycleSpeed}
            activeOpacity={0.75}
          >
            <Text style={styles.speedDialNum}>{currentSpeed}</Text>
            <Text style={styles.speedDialUnit}>km/h</Text>
          </TouchableOpacity>
        </View>

        {/* Traffic Detour Recommendation Banner (if available) */}
        {showDetourOffer && !detourTaken && (
          <View style={styles.detourBanner}>
            <View style={styles.detourLeft}>
              <Ionicons name="flash" size={16} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.detourTitle}>Bypass Traffic Ahead</Text>
                <Text style={styles.detourSub}>Bio-Diversity Flyover saves 3 mins</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.detourBtn}
              onPress={handleTakeDetour}
              activeOpacity={0.8}
            >
              <Text style={styles.detourBtnText}>Take Detour</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom Navigation Journey Card */}
      <View style={styles.bottomCard}>
        {/* Progress Metrics Row */}
        <View style={styles.metricsRow}>
          <View>
            <View style={styles.timeWrap}>
              <Text style={styles.timeNum}>{remainingTime}</Text>
              <Text style={styles.etaText}>
                • ETA {detourTaken ? '1:12 PM (-3m)' : '1:15 PM'}
              </Text>
            </View>
            <Text style={styles.distText}>
              {remainingDist} remaining • {destName}
            </Text>
          </View>

          <View style={styles.statusIndicator}>
            <Ionicons
              name={isSimulating ? 'pulse' : 'checkmark-circle'}
              size={18}
              color={COLORS.ahead}
            />
            <Text style={styles.statusText}>{isSimulating ? 'Cruising' : 'On Path'}</Text>
          </View>
        </View>

        {/* Action Controls: Mute, Recenter, Route Options, End Navigation */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, isMuted && styles.actionBtnActive]}
            onPress={handleToggleMute}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color={isMuted ? COLORS.danger : COLORS.textPrimary}
            />
            <Text style={styles.actionBtnText}>{isMuted ? 'Muted' : 'Voice'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleRecenter}
            activeOpacity={0.7}
          >
            <Ionicons name="locate" size={20} color={COLORS.accent} />
            <Text style={styles.actionBtnText}>Recenter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onRouteChange}
            activeOpacity={0.7}
          >
            <Ionicons name="git-network-outline" size={20} color={COLORS.textPrimary} />
            <Text style={styles.actionBtnText}>Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endBtn}
            onPress={handleConfirmEnd}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
  },
  turnBanner: {
    backgroundColor: '#0F172A',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 10,
  },
  turnIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.ahead,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.md,
  },
  turnTextCol: {
    flex: 1,
  },
  turnDistance: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  turnInstruction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 1,
  },
  streetName: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  stepHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  stepHintText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  turnContentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNavBtnDisabled: {
    opacity: 0.35,
  },
  dotsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingBottom: SPACING.xs,
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#334155',
  },
  stepDotActive: {
    width: 14,
    backgroundColor: COLORS.ahead,
  },
  dotsLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '600',
  },
  laneGuidanceRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  laneItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#0F172A',
    gap: 4,
  },
  laneItemActive: {
    backgroundColor: '#16A34A',
  },
  laneText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  laneTextActive: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  recommendedPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  recommendedPillText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#16A34A',
  },
  hudOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    ...SHADOWS.sm,
  },
  simControlBtnActive: {
    backgroundColor: '#16A34A',
  },
  simControlText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  speedDial: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOWS.sm,
  },
  speedDialNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  speedDialUnit: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
  },
  detourBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    ...SHADOWS.lg,
  },
  detourLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detourTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detourSub: {
    color: '#94A3B8',
    fontSize: 10,
  },
  detourBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  detourBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  hudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ahead,
  },
  hudText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  timeNum: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ahead,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  distText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.aheadLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ahead,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    gap: 2,
  },
  actionBtnActive: {
    backgroundColor: '#FEE2E2',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  endBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger,
    gap: 4,
    ...SHADOWS.sm,
  },
  endBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
