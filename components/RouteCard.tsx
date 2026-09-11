import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteOption } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface RouteCardProps {
  route: RouteOption;
  isSelected: boolean;
  onSelect: (route: RouteOption) => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  isSelected,
  onSelect,
}) => {
  const getBadgeStyle = () => {
    switch (route.type) {
      case 'FASTEST':
        return {
          bgColor: COLORS.aheadLight,
          textColor: COLORS.ahead,
          icon: 'flash',
        };
      case 'LOWEST_DEVIATION':
        return {
          bgColor: COLORS.onRouteLight,
          textColor: COLORS.onRoute,
          icon: 'git-commit',
        };
      case 'BEST_OVERALL':
      default:
        return {
          bgColor: COLORS.accentLight,
          textColor: COLORS.accent,
          icon: 'ribbon',
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => onSelect(route)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${route.title}, ${route.estimatedMinutes} minutes`}
    >
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: badge.bgColor }]}>
          <Ionicons
            name={badge.icon as any}
            size={12}
            color={badge.textColor}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.typeBadgeText, { color: badge.textColor }]}>
            {route.type.replace('_', ' ')}
          </Text>
        </View>

        <View style={styles.radioOuter}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{route.estimatedMinutes} min</Text>
        <Text style={styles.distanceText}>({route.distanceKm} km)</Text>
      </View>

      <Text style={styles.titleText}>{route.title}</Text>
      <Text style={styles.subtitleText}>{route.subtitle}</Text>

      <View style={styles.highlightsContainer}>
        {route.highlights.map((h, i) => (
          <View key={i} style={styles.highlightRow}>
            <Ionicons name="checkmark-circle" size={13} color={COLORS.ahead} />
            <Text style={styles.highlightText}>{h}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: '#FAF5FF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  timeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  highlightsContainer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingTop: SPACING.xs,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
