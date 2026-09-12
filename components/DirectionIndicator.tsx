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
            <Ionicons name="navigate" size={13} color={showVectors ? '#FFFFFF' : COLORS.accentCyan} />
          </View>
          <Text style={[styles.simButtonText, showVectors && styles.simButtonTextActive]}>
            {headingAngle}° ({showVectors ? 'Close' : 'Change'})
          </Text>
          <Ionicons
            name={showVectors ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={showVectors ? '#FFFFFF' : COLORS.accentCyan}
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
                  <View style={{ transform: [{ rotate: `${v.angle}deg` }], marginRight: 8 }}>
                    <Ionicons
                      name="navigate"
                      size={15}
                      color={isActive ? COLORS.accentCyan : '#94A3B8'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
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
            <Ionicons name="arrow-up" size={16} color="#10B981" />
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
              <Ionicons name="navigate" size={13} color="#FFFFFF" />
            </View>
            <Text style={styles.userLabel}>YOU</Text>
          </View>

          <View style={styles.lineSegmentBehind} />

          <View style={styles.behindPoint}>
            <Ionicons name="arrow-down" size={14} color="#F59E0B" />
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
              activeOpacity={0.75}
            >
              <Ionicons name="speedometer" size={14} color={COLORS.accentCyan} />
              <Text style={styles.statText}>{speedKmh} km/h</Text>
              <Ionicons name="sync-outline" size={10} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.vectorLockedPill}
              onPress={() => setShowVectors(!showVectors)}
              activeOpacity={0.75}
            >
              <Ionicons name="compass" size={14} color="#10B981" />
              <Text style={styles.vectorLockedText}>
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
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 22,
    padding: 18,
    marginHorizontal: SPACING.lg,
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
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
    backgroundColor: 'rgba(6, 182, 212, 0.14)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.accentCyan,
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.accentCyan,
    letterSpacing: 0.8,
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 37, 64, 0.8)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.3)',
  },
  simButtonActive: {
    backgroundColor: COLORS.accentCyan,
    borderColor: COLORS.accentCyan,
  },
  simButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  simButtonTextActive: {
    color: '#0A0F1E',
    fontWeight: '800',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  corridorVisual: {
    alignItems: 'center',
    width: 62,
    paddingVertical: 12,
    backgroundColor: 'rgba(10, 15, 30, 0.85)',
    borderRadius: 16,
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.18)',
  },
  aheadPoint: {
    alignItems: 'center',
  },
  aheadLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  lineSegmentAhead: {
    width: 3,
    height: 18,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginVertical: 3,
    shadowColor: '#10B981',
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  userPoint: {
    alignItems: 'center',
    position: 'relative',
    marginVertical: 2,
  },
  userPulseRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
  },
  userCoreDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  userLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  lineSegmentBehind: {
    width: 3,
    height: 18,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginVertical: 3,
  },
  behindPoint: {
    alignItems: 'center',
  },
  behindLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#F59E0B',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  narrativeCol: {
    flex: 1,
  },
  directionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  directionSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 37, 64, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.25)',
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vectorLockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  vectorLockedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.2,
  },
  vectorSelectorBox: {
    backgroundColor: 'rgba(13, 22, 40, 0.95)',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.3)',
  },
  vectorSelectorTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  vectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 37, 64, 0.75)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.2)',
    width: '48%',
  },
  vectorChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.22)',
    borderColor: COLORS.accentCyan,
    shadowColor: COLORS.accentCyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  vectorChipLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vectorChipLabelActive: {
    color: COLORS.accentCyan,
  },
  vectorChipSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  vectorChipSubActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
