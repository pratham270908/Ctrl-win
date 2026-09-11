import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { getDirectionBadgeInfo } from '../utils/directionUtils';
import { useFavorites } from '../store/FavoritesContext';

interface PlaceCardProps {
  place: Place;
  onPress: (place: Place) => void;
  onNavigatePress?: (place: Place) => void;
  compact?: boolean;
}

const getCategoryIcon = (category: string): any => {
  const cat = category.toLowerCase();
  if (cat.includes('coffee') || cat.includes('cafe')) return 'cafe';
  if (cat.includes('petrol') || cat.includes('fuel') || cat.includes('ev')) return 'flash';
  if (cat.includes('atm') || cat.includes('bank')) return 'card';
  if (cat.includes('restaurant') || cat.includes('food')) return 'restaurant';
  if (cat.includes('hospital') || cat.includes('health')) return 'medkit';
  if (cat.includes('pharmacy')) return 'medical';
  return 'location';
};

const getCategoryColor = (category: string): string => {
  const cat = category.toLowerCase();
  if (cat.includes('coffee') || cat.includes('cafe')) return COLORS.orange;
  if (cat.includes('petrol') || cat.includes('fuel') || cat.includes('ev')) return COLORS.accentCyan;
  if (cat.includes('atm') || cat.includes('bank')) return COLORS.ahead;
  if (cat.includes('restaurant') || cat.includes('food')) return COLORS.orange;
  if (cat.includes('hospital') || cat.includes('health')) return COLORS.danger;
  if (cat.includes('pharmacy')) return COLORS.warning;
  return COLORS.accent;
};

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onPress,
  onNavigatePress,
  compact = false,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!place || !place.id) return null;

  const favorite = isFavorite(place.id);
  const badgeInfo = getDirectionBadgeInfo(place.direction, place.routeDeviation);
  const categoryIcon = getCategoryIcon(place.category);
  const categoryColor = getCategoryColor(place.category);

  const formatDistance = (meters?: number): string => {
    const m = meters ?? 0;
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)} km`;
    }
    return `${m} m`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(place)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${place.name || 'Place'}, ${badgeInfo.label}`}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: badgeInfo.color }]} />

      <View style={styles.cardInner}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={[styles.categoryIconWrap, { backgroundColor: categoryColor + '22' }]}>
            <Ionicons name={categoryIcon as any} size={16} color={categoryColor} />
          </View>

          <View style={styles.titleCol}>
            <Text style={styles.placeName} numberOfLines={1}>
              {place.name}
            </Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {place.address}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.favButton}
            onPress={() => toggleFavorite(place)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={favorite ? 'Remove from saved' : 'Save place'}
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={19}
              color={favorite ? COLORS.danger : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.directionBadge, { backgroundColor: badgeInfo.bgColor }]}>
            <Ionicons
              name={badgeInfo.icon as any}
              size={11}
              color={badgeInfo.color}
            />
            <Text style={[styles.directionBadgeText, { color: badgeInfo.color }]}>
              {badgeInfo.label}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.ratingText}>{(place.rating ?? 0).toFixed(1)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="navigate-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{formatDistance(place.distance)}</Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.metricText}>{place.travelTime} min</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              place.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: place.status === 'OPEN' ? COLORS.ahead : COLORS.danger },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                place.status === 'OPEN' ? styles.statusTextOpen : styles.statusTextClosed,
              ]}
            >
              {place.status === 'OPEN' ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Footer: commentary + navigate button */}
        <View style={styles.footerRow}>
          <View style={styles.commentaryLeft}>
            <Text
              style={[
                styles.commentaryText,
                place.direction === 'BEHIND' && { color: COLORS.behind },
                place.direction === 'AHEAD' && { color: COLORS.ahead },
              ]}
              numberOfLines={1}
            >
              {place.direction === 'BEHIND'
                ? '⚠ Requires turning back'
                : place.direction === 'AHEAD'
                ? '✓ Directly ahead on path'
                : `On route (+${place.routeDeviation} min stop)`}
            </Text>
          </View>

          {onNavigatePress && (
            <TouchableOpacity
              style={styles.navigateBtn}
              onPress={() => onNavigatePress(place)}
              activeOpacity={0.75}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.navigateBtnText}>Route</Text>
              <Ionicons name="arrow-forward" size={12} color={COLORS.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.lg,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardCompact: {
    marginVertical: 3,
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: RADIUS.xl,
    borderBottomLeftRadius: RADIUS.xl,
  },
  cardInner: {
    flex: 1,
    padding: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    gap: 10,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  placeName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.1,
  },
  addressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  favButton: {
    padding: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: 9,
    gap: 5,
    flexWrap: 'nowrap',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 3,
    marginRight: 3,
  },
  directionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricDivider: {
    width: 1,
    height: 11,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  metricText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 3,
    marginLeft: 'auto',
  },
  statusOpen: {
    backgroundColor: COLORS.aheadLight,
  },
  statusClosed: {
    backgroundColor: COLORS.dangerLight,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  statusTextOpen: {
    color: COLORS.ahead,
  },
  statusTextClosed: {
    color: COLORS.danger,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentaryLeft: {
    flex: 1,
    marginRight: 6,
  },
  commentaryText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  navigateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
