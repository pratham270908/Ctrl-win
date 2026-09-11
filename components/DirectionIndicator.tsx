import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

export interface DirectionVectorOption {
  angle: number;
  label: string;
  sublabel: string;
  compassName: string;
}

export const DIRECTION_VECTORS: DirectionVectorOption[] = [
  {
    angle: 45,
    label: '45° NE',
    sublabel: 'Gachibowli / Inorbit',
    compassName: 'North-East',
  },
  {
    angle: 135,
    label: '135° SE',
    sublabel: 'Jubilee Hills / Road 36',
    compassName: 'South-East',
  },
  {
    angle: 225,
    label: '225° SW',
    sublabel: 'Financial Dist / ORR',
    compassName: 'South-West',
  },
  {
    angle: 315,
    label: '315° NW',
    sublabel: 'Miyapur / Kukatpally',
    compassName: 'North-West',
  },
];

interface DirectionIndicatorProps {
  headingAngle?: number;
  headingText?: string;
  speedKmh?: number;
  onAngleChange?: (angle: number, label: string) => void;
  onSpeedChange?: (speed: number) => void;
  onSimulateChange?: () => void;
}

export const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({
  headingAngle = 45,
  headingText = 'Travelling North-East',
  speedKmh = 38,
  onAngleChange,
  onSpeedChange,
  onSimulateChange,
}) => {
  const [showVectors, setShowVectors] = useState(false);

  const handleSelectVector = (vector: DirectionVectorOption) => {
    if (onAngleChange) {
      onAngleChange(vector.angle, `Travelling ${vector.compassName}`);
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [15, 38, 65, 85];
    const nextIdx = (speeds.indexOf(speedKmh) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    if (onSpeedChange) {
      onSpeedChange(nextSpeed);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Bar: Title & Toggle Vector Selector */}
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>YOUR JOURNEY VECTOR</Text>
        </View>

        <TouchableOpacity
          style={[styles.simButton, showVectors && styles.simButtonActive]}
          onPress={() => setShowVectors(!showVectors)}
          activeOpacity={0.75}
        >
          <View style={{ transform: [{ rotate: `${headingAngle}deg` }] }}>
            <Ionicons name="navigate" size={13} color={showVectors ? '#FFFFFF' : COLORS.accent} />
          </View>
          <Text style={[styles.simButtonText, showVectors && styles.simButtonTextActive]}>
            {headingAngle}° ({showVectors ? 'Close' : 'Change'})
          </Text>
          <Ionicons
            name={showVectors ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={showVectors ? '#FFFFFF' : COLORS.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Interactive Vector Selector Chips (Visible on tap) */}
      {showVectors && (
        <View style={styles.vectorSelectorBox}>
          <Text style={styles.vectorSelectorTitle}>Tap a Direction Vector to Re-rank Places Ahead:</Text>
          <View style={styles.vectorGrid}>
            {DIRECTION_VECTORS.map((v) => {
              const isActive = headingAngle === v.angle;
              return (
                <TouchableOpacity
                  key={v.angle}
                  style={[styles.vectorChip, isActive && styles.vectorChipActive]}
                  onPress={() => handleSelectVector(v)}
                  activeOpacity={0.75}
                >
                  <View style={{ transform: [{ rotate: `${v.angle}deg` }], marginRight: 6 }}>
                    <Ionicons
                      name="navigate"
                      size={14}
                      color={isActive ? '#FFFFFF' : COLORS.accent}
                    />
                  </View>
                  <View>
                    <Text style={[styles.vectorChipLabel, isActive && styles.vectorChipLabelActive]}>
                      {v.label}
                    </Text>
                    <Text
                      style={[styles.vectorChipSub, isActive && styles.vectorChipSubActive]}
                      numberOfLines={1}
                    >
                      {v.sublabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Main Direction Status & Corridor Visual */}
      <View style={styles.mainRow}>
        {/* Visual Direction Corridor Axis with Animated Orientation */}
        <View style={styles.corridorVisual}>
          <View style={styles.aheadPoint}>
            <Ionicons name="arrow-up" size={14} color={COLORS.ahead} />
            <Text style={styles.aheadLabel}>AHEAD</Text>
          </View>

          <View style={styles.lineSegmentAhead} />

          <View style={styles.userPoint}>
            <View style={styles.userPulseRing} />
            <View
              style={[
                styles.userCoreDot,
                { transform: [{ rotate: `${headingAngle}deg` }] },
              ]}
            >
              <Ionicons name="navigate" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.userLabel}>YOU</Text>
          </View>

          <View style={styles.lineSegmentBehind} />

          <View style={styles.behindPoint}>
            <Ionicons name="arrow-down" size={12} color={COLORS.behind} />
            <Text style={styles.behindLabel}>BEHIND</Text>
          </View>
        </View>

        {/* Narrative & Interactive Stats Row */}
        <View style={styles.narrativeCol}>
          <Text style={styles.directionTitle}>{headingText}</Text>
          <Text style={styles.directionSubtitle}>
            Actively prioritizing stops along your forward travel vector. Avoiding U-turns and traffic detours.
          </Text>

          <View style={styles.statsRow}>
            <TouchableOpacity
              style={styles.statPill}
              onPress={handleCycleSpeed}
              activeOpacity={0.7}
            >
              <Ionicons name="speedometer-outline" size={13} color={COLORS.accent} />
              <Text style={styles.statText}>{speedKmh} km/h</Text>
              <Ionicons name="sync-outline" size={10} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.statPill}
              onPress={() => setShowVectors(!showVectors)}
              activeOpacity={0.7}
            >
              <Ionicons name="compass-outline" size={13} color={COLORS.ahead} />
              <Text style={[styles.statText, { color: COLORS.ahead, fontWeight: '700' }]}>
                {headingAngle}° Vector Locked
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  simButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  corridorVisual: {
    alignItems: 'center',
    width: 56,
    paddingVertical: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    marginRight: 14,
  },
  aheadPoint: {
    alignItems: 'center',
  },
  aheadLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.ahead,
    marginTop: 1,
  },
  lineSegmentAhead: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.ahead,
    marginVertical: 2,
  },
  userPoint: {
    alignItems: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  userPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  userCoreDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.onRoute,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  lineSegmentBehind: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.behind,
    marginVertical: 2,
  },
  behindPoint: {
    alignItems: 'center',
  },
  behindLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.behind,
    marginTop: 1,
  },
  narrativeCol: {
    flex: 1,
  },
  directionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  directionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  simButtonActive: {
    backgroundColor: COLORS.accent,
  },
  simButtonTextActive: {
    color: '#FFFFFF',
  },
  vectorSelectorBox: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vectorSelectorTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    width: '48%',
  },
  vectorChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
    ...SHADOWS.sm,
  },
  vectorChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  vectorChipLabelActive: {
    color: '#FFFFFF',
  },
  vectorChipSub: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  vectorChipSubActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
