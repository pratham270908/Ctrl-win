import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
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

  useEffect(() => {
    directionsService.getTurnByTurnInstructions().then(setInstructions);
  }, []);

  const currentInstruction = instructions[currentStepIndex] || {
    instruction: 'Continue straight',
    distanceText: '250 m',
    icon: 'arrow-up',
    streetName: 'Cyber Towers Flyover',
  };

  const destName = destinationPlace?.name || 'Gachibowli Tech Campus';
  const remainingDist = activeRoute ? `${activeRoute.distanceKm} km` : '2.1 km';
  const remainingTime = activeRoute ? `${activeRoute.estimatedMinutes} min` : '8 min';

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Turn Instruction Banner */}
      <TouchableOpacity
        style={styles.turnBanner}
        onPress={handleNextStep}
        activeOpacity={0.9}
      >
        <View style={styles.turnIconCircle}>
          <Ionicons
            name={currentInstruction.icon as any}
            size={30}
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

        <View style={styles.stepHint}>
          <Text style={styles.stepHintText}>Tap next</Text>
          <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
        </View>
      </TouchableOpacity>

      {/* Main Full-Bleed Interactive Navigation Map */}
      <View style={styles.mapArea}>
        <InteractiveMap
          height={480}
          places={destinationPlace ? [destinationPlace] : []}
          selectedPlace={destinationPlace}
          destinationName={destName}
          isNavigationMode={true}
          onRecenter={handleRecenter}
        />

        {/* Floating Ahead Speed & Trajectory HUD */}
        <View style={styles.hudOverlay}>
          <View style={styles.hudPill}>
            <View style={styles.hudDot} />
            <Text style={styles.hudText}>TRAJECTORY LOCKED • 45° NE</Text>
          </View>
        </View>
      </View>

      {/* Bottom Navigation Journey Card */}
      <View style={styles.bottomCard}>
        {/* Progress Metrics Row */}
        <View style={styles.metricsRow}>
          <View>
            <View style={styles.timeWrap}>
              <Text style={styles.timeNum}>{remainingTime}</Text>
              <Text style={styles.etaText}>• ETA 1:15 PM</Text>
            </View>
            <Text style={styles.distText}>
              {remainingDist} remaining • Destination: {destName}
            </Text>
          </View>

          <View style={styles.statusIndicator}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.ahead} />
            <Text style={styles.statusText}>On Path</Text>
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
  hudOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
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
