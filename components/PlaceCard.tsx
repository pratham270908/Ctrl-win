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
      {/* Top row: Directional Badge & Favorite Button */}
      <View style={styles.headerRow}>
        <View style={[styles.directionBadge, { backgroundColor: badgeInfo.bgColor }]}>
          <Ionicons
            name={badgeInfo.icon as any}
            size={12}
            color={badgeInfo.color}
            style={styles.badgeIcon}
          />
          <Text style={[styles.directionBadgeText, { color: badgeInfo.color }]}>
            {badgeInfo.label}
          </Text>
          {(place.routeDeviation ?? 0) > 0 && place.direction === 'ON_ROUTE' && (
            <Text style={[styles.deviationText, { color: badgeInfo.color }]}>
              • +{place.routeDeviation}m
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.favButton}
          onPress={() => toggleFavorite(place)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={favorite ? 'Remove from saved' : 'Save place'}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={favorite ? COLORS.danger : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Place Name and Category */}
      <View style={styles.titleRow}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
      </View>

      <Text style={styles.addressText} numberOfLines={1}>
        {place.address}
      </Text>

      {/* Metrics Row: Rating, Distance, Travel Time, Status */}
      <View style={styles.metricsRow}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.ratingText}>{(place.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({place.reviewCount ?? 0})</Text>
        </View>

        <View style={styles.dotSeparator} />

        <View style={styles.metricItem}>
          <Ionicons name="navigate-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.metricText}>{formatDistance(place.distance)}</Text>
        </View>

        <View style={styles.dotSeparator} />

        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.metricText}>{place.travelTime} min</Text>
        </View>

        <View style={styles.dotSeparator} />

        <View
          style={[
            styles.statusPill,
            place.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              place.status === 'OPEN' ? styles.statusTextOpen : styles.statusTextClosed,
            ]}
          >
            {place.status}
          </Text>
        </View>
      </View>

      {/* Direction Commentary */}
      <View style={styles.commentaryRow}>
        <Text
          style={[
            styles.commentaryText,
            place.direction === 'BEHIND' && { color: COLORS.behind, fontWeight: '600' },
          ]}
          numberOfLines={1}
        >
          {place.direction === 'BEHIND'
            ? '⚠️ Requires turning back'
            : place.direction === 'AHEAD'
            ? '✓ Right on your path ahead'
            : `✓ On route (${place.routeDeviation} min stop)`}
        </Text>

        {onNavigatePress && (
          <TouchableOpacity
            style={styles.navigateAction}
            onPress={() => onNavigatePress(place)}
            activeOpacity={0.75}
          >
            <Text style={styles.navigateActionText}>View Route</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
          </TouchableOpacity>
        )}
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
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  cardCompact: {
    padding: SPACING.md,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeIcon: {
    marginRight: 4,
  },
  directionBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deviationText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  favButton: {
    padding: 2,
  },
  titleRow: {
    marginTop: 2,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: COLORS.aheadLight,
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextOpen: {
    color: COLORS.ahead,
  },
  statusTextClosed: {
    color: COLORS.danger,
  },
  commentaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  commentaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  navigateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navigateActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
