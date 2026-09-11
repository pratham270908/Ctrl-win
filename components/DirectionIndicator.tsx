import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../store/AppContext';

interface DirectionIndicatorProps {
  headingText?: string;
  speedKmh?: number;
  onSimulateChange?: () => void;
}

export const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({
  headingText = 'Travelling North-East',
  speedKmh = 38,
  onSimulateChange,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <View style={styles.pulseDot} />
          <Text style={styles.badgeText}>YOUR JOURNEY VECTOR</Text>
        </View>

        <TouchableOpacity
          style={styles.simButton}
          onPress={onSimulateChange}
          activeOpacity={0.7}
        >
          <Ionicons name="compass" size={14} color={COLORS.accent} />
          <Text style={styles.simButtonText}>45° NE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainRow}>
        {/* Visual Direction Corridor Axis */}
        <View style={styles.corridorVisual}>
          <View style={styles.aheadPoint}>
            <Ionicons name="arrow-up" size={14} color={COLORS.ahead} />
            <Text style={styles.aheadLabel}>AHEAD</Text>
          </View>

          <View style={styles.lineSegmentAhead} />

          <View style={styles.userPoint}>
            <View style={styles.userPulseRing} />
            <View style={styles.userCoreDot} />
            <Text style={styles.userLabel}>YOU</Text>
          </View>

          <View style={styles.lineSegmentBehind} />

          <View style={styles.behindPoint}>
            <Ionicons name="arrow-down" size={12} color={COLORS.behind} />
            <Text style={styles.behindLabel}>BEHIND</Text>
          </View>
        </View>

        {/* Narrative & Status Description */}
        <View style={styles.narrativeCol}>
          <Text style={styles.directionTitle}>{headingText}</Text>
          <Text style={styles.directionSubtitle}>
            Prioritizing places directly in your path. Avoiding unnecessary U-turns and traffic detours.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Ionicons name="speedometer-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.statText}>{speedKmh} km/h</Text>
            </View>

            <View style={styles.statPill}>
              <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.ahead} />
              <Text style={[styles.statText, { color: COLORS.ahead, fontWeight: '700' }]}>
                Vector Active
              </Text>
            </View>
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
    width: 60,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    marginRight: SPACING.md,
  },
  aheadPoint: {
    alignItems: 'center',
  },
  aheadLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.ahead,
    marginTop: -2,
  },
  lineSegmentAhead: {
    width: 2,
    height: 18,
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
    top: -3,
    left: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  userCoreDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.onRoute,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  lineSegmentBehind: {
    width: 2,
    height: 18,
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
    marginTop: -2,
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
});
