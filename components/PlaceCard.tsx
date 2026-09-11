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
  if (cat.includes('coffee') || cat.includes('cafe')) return 'cafe-outline';
  if (cat.includes('petrol') || cat.includes('fuel') || cat.includes('ev')) return 'car-outline';
  if (cat.includes('atm') || cat.includes('bank')) return 'card-outline';
  if (cat.includes('restaurant') || cat.includes('food')) return 'restaurant-outline';
  if (cat.includes('hospital') || cat.includes('health')) return 'medkit-outline';
  if (cat.includes('pharmacy')) return 'medical-outline';
  return 'location-outline';
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
      {/* Header Row: Direction Badge & Favorite Heart */}
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
              • +{place.routeDeviation}m detour
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.favButton}
          onPress={() => toggleFavorite(place)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={favorite ? 'Remove from saved' : 'Save place'}
        >
          <Ionicons
            name={favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={favorite ? COLORS.danger : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Place Title & Category */}
      <View style={styles.titleSection}>
        <Text style={styles.placeName} numberOfLines={1}>
          {place.name}
        </Text>
        <View style={styles.categoryRow}>
          <Ionicons name={categoryIcon} size={12} color={COLORS.textSecondary} />
          <Text style={styles.categoryText}>{place.category}</Text>
          <View style={styles.inlineDot} />
          <Text style={styles.addressText} numberOfLines={1}>
            {place.address}
          </Text>
        </View>
      </View>

      {/* Metrics Row: Rating, Distance, Travel Time, Status */}
      <View style={styles.metricsRow}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.ratingText}>{(place.rating ?? 0).toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({place.reviewCount ?? 0})</Text>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Ionicons name="navigate-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.metricText}>{formatDistance(place.distance)}</Text>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
          <Text style={styles.metricText}>{place.travelTime} min</Text>
        </View>

        <View style={styles.metricSeparator} />

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

      {/* Journey Relevance Commentary & Action Button */}
      <View style={styles.commentaryRow}>
        <View style={styles.relevanceLeft}>
          <Ionicons
            name={
              place.direction === 'BEHIND'
                ? 'warning-outline'
                : place.direction === 'AHEAD'
                ? 'checkmark-circle-outline'
                : 'git-commit-outline'
            }
            size={13}
            color={
              place.direction === 'BEHIND'
                ? COLORS.behind
                : place.direction === 'AHEAD'
                ? COLORS.ahead
                : COLORS.onRoute
            }
          />
          <Text
            style={[
              styles.commentaryText,
              place.direction === 'BEHIND' && { color: COLORS.behind, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {place.direction === 'BEHIND'
              ? 'Requires turning back'
              : place.direction === 'AHEAD'
              ? 'Directly ahead on your path'
              : `On route (+${place.routeDeviation} min stop)`}
          </Text>
        </View>

        {onNavigatePress && (
          <TouchableOpacity
            style={styles.navigateAction}
            onPress={() => onNavigatePress(place)}
            activeOpacity={0.75}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.navigateActionText}>View Route</Text>
            <Ionicons name="arrow-forward" size={13} color={COLORS.accent} />
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
    padding: 14,
    marginHorizontal: SPACING.lg,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  cardCompact: {
    padding: 10,
    marginVertical: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deviationText: {
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 3,
  },
  favButton: {
    padding: 2,
  },
  titleSection: {
    marginBottom: 8,
  },
  placeName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  categoryText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  inlineDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 3,
  },
  addressText: {
    flex: 1,
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  metricSeparator: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    gap: 4,
    marginLeft: 'auto',
  },
  statusOpen: {
    backgroundColor: COLORS.aheadLight,
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
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
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  relevanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 6,
  },
  commentaryText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  navigateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  navigateActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
