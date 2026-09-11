import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { getDirectionBadgeInfo } from '../utils/directionUtils';
import { useFavorites } from '../store/FavoritesContext';
import { InteractiveMap } from '../components/InteractiveMap';

interface PlaceDetailsScreenProps {
  place: Place;
  onBack: () => void;
  onDirectionsPress: (place: Place) => void;
}

export const PlaceDetailsScreen: React.FC<PlaceDetailsScreenProps> = ({
  place,
  onBack,
  onDirectionsPress,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!place || !place.id) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' }}>
            Location details unavailable. Please select a valid place along your journey.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(place.id);
  const badgeInfo = getDirectionBadgeInfo(place.direction, place.routeDeviation);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place.name || 'Place'} is ${place.distance || 0}m ahead on your journey (${place.travelTime || 0} min). Address: ${place.address || ''}`,
      });
    } catch {
      // Ignore
    }
  };

  const handleCall = () => {
    Alert.alert(
      'Call Place',
      `Calling ${place.name} at ${place.phone || 'N/A'}.\n\n(Simulated for mobile prototype)`,
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  };

  const formatDistance = (meters?: number): string => {
    const m = meters ?? 0;
    if (m >= 1000) {
      return `${(m / 1000).toFixed(1)} km`;
    }
    return `${m} m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Floating App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={handleShare}
            accessibilityLabel="Share place"
          >
            <Ionicons name="share-outline" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.circleBtn, favorite && styles.circleBtnFavorite]}
            onPress={() => toggleFavorite(place)}
            accessibilityLabel="Save place"
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? COLORS.danger : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Map Area */}
        <View style={styles.mapVisualWrap}>
          <InteractiveMap
            height={220}
            places={[place]}
            selectedPlace={place}
            destinationName={place.name}
          />
        </View>

        {/* Place Card Main Info */}
        <View style={styles.contentCard}>
          {/* Directional Status Banner */}
          <View style={[styles.directionBanner, { backgroundColor: badgeInfo.bgColor }]}>
            <Ionicons name={badgeInfo.icon as any} size={16} color={badgeInfo.color} />
            <View style={styles.directionBannerTextWrap}>
              <Text style={[styles.directionBannerTitle, { color: badgeInfo.color }]}>
                {badgeInfo.label} • {badgeInfo.sublabel}
              </Text>
            </View>
          </View>

          {/* Title & Category */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.categoryName}>{place.category}</Text>
            </View>

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

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBar}>
            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.metricVal}>{(place.rating ?? 0).toFixed(1)}</Text>
              </View>
              <Text style={styles.metricSub}>{place.reviewCount ?? 0} reviews</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <Ionicons name="navigate" size={16} color={COLORS.accent} />
                <Text style={styles.metricVal}>{formatDistance(place.distance)}</Text>
              </View>
              <Text style={styles.metricSub}>From your spot</Text>
            </View>

            <View style={styles.verticalDivider} />

            <View style={styles.metricCol}>
              <View style={styles.metricHeader}>
                <Ionicons name="time" size={16} color={COLORS.ahead} />
                <Text style={styles.metricVal}>{place.travelTime ?? 0} min</Text>
              </View>
              <Text style={styles.metricSub}>Drive time</Text>
            </View>
          </View>

          {/* Address & Hours */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.accent} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{place.address || 'Address on corridor'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="alarm-outline" size={20} color={COLORS.accent} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Operating Hours</Text>
                <Text style={styles.infoValue}>{place.hours || 'Standard business hours'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={COLORS.accent} style={styles.infoIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Contact Phone</Text>
                <Text style={styles.infoValue}>{place.phone || 'Phone not listed'}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionHeaderTitle}>About This Stop</Text>
            <Text style={styles.descriptionText}>{place.description || 'Verified place along journey vector.'}</Text>
          </View>

          {/* Services & Amenities */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionHeaderTitle}>Available Services</Text>
            <View style={styles.servicesWrap}>
              {(place.services || []).map((service, index) => (
                <View key={index} style={styles.serviceChip}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.ahead} />
                  <Text style={styles.serviceChipText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar: Call + Directions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={18} color={COLORS.textPrimary} />
          <Text style={styles.secondaryActionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => onDirectionsPress(place)}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>View Route Options</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnFavorite: {
    backgroundColor: '#FEE2E2',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  mapVisualWrap: {
    width: '100%',
  },
  contentCard: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  directionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    gap: 8,
  },
  directionBannerTextWrap: {
    flex: 1,
  },
  directionBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  placeName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  categoryName: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusOpen: {
    backgroundColor: COLORS.aheadLight,
  },
  statusClosed: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextOpen: {
    color: COLORS.ahead,
  },
  statusTextClosed: {
    color: COLORS.danger,
  },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.cardBorder,
  },
  infoSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    marginRight: SPACING.md,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  serviceChipText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    flexDirection: 'row',
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surfaceLight,
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  primaryActionBtn: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.accent,
    gap: 6,
    ...SHADOWS.md,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
