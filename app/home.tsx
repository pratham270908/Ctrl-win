import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { DirectionIndicator } from '../components/DirectionIndicator';
import { InteractiveMap } from '../components/InteractiveMap';
import { PlaceCard } from '../components/PlaceCard';
import { CATEGORIES, CategoryInfo } from '../data/mockCategories';
import { placesService } from '../services/placesService';
import { locationService } from '../services/locationService';
import { useApp } from '../store/AppContext';
import { Place, PlaceCategory } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

interface HomeScreenProps {
  onSearchPress: () => void;
  onCategoryPress: (category: PlaceCategory) => void;
  onPlacePress: (place: Place) => void;
  onNavigatePress: (place: Place) => void;
  onProfilePress: () => void;
  onEmergencyPress: () => void;
  onOfflineMapsPress: () => void;
  onAccessibilityPress: () => void;
  onTransportPress: () => void;
  onMapPress?: () => void;
  onResumeNavigation?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSearchPress,
  onCategoryPress,
  onPlacePress,
  onNavigatePress,
  onProfilePress,
  onEmergencyPress,
  onOfflineMapsPress,
  onAccessibilityPress,
  onTransportPress,
  onMapPress,
  onResumeNavigation,
}) => {
  const { activeRoute, activeDestinationPlace, clearActiveRoute } = useApp();
  const [routeRecommendations, setRouteRecommendations] = useState<Place[]>([]);
  const [headingAngle, setHeadingAngle] = useState<number>(45);
  const [headingText, setHeadingText] = useState<string>('Travelling North-East');
  const [speedKmh, setSpeedKmh] = useState<number>(38);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AHEAD_ONLY' | 'OPEN_NOW' | 'TOP_RATED' | 'UNDER_1KM'>('ALL');
  const [vectorFeedback, setVectorFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadLocationData();
  }, []);

  useEffect(() => {
    if (activeRoute) {
      loadRouteRecommendations(activeRoute, activeFilter, headingAngle, speedKmh);
    } else {
      setRouteRecommendations([]);
    }
  }, [activeRoute, activeDestinationPlace, activeFilter, headingAngle, speedKmh]);

  const loadLocationData = async () => {
    const loc = await locationService.getCurrentLocation();
    setHeadingText(`Travelling ${loc.headingText}`);
    setSpeedKmh(loc.speedKmh);
  };

  const loadRouteRecommendations = async (
    route = activeRoute,
    filter = activeFilter,
    angle = headingAngle,
    speed = speedKmh
  ) => {
    if (!route) {
      setRouteRecommendations([]);
      return;
    }
    const places = await placesService.getRouteRecommendations(
      activeDestinationPlace,
      route,
      angle,
      speed,
      filter
    );
    setRouteRecommendations(places);
  };

  const handleVectorChange = async (angle: number, label: string) => {
    setHeadingAngle(angle);
    setHeadingText(label);
    setVectorFeedback(`Vector changed to ${angle}° • Route places re-calculated ahead`);
    if (activeRoute) {
      await loadRouteRecommendations(activeRoute, activeFilter, angle, speedKmh);
    }
    setTimeout(() => setVectorFeedback(null), 3200);
  };

  const handleSpeedChange = async (speed: number) => {
    setSpeedKmh(speed);
    setVectorFeedback(`Speed set to ${speed} km/h • Reach times updated`);
    if (activeRoute) {
      await loadRouteRecommendations(activeRoute, activeFilter, headingAngle, speed);
    }
    setTimeout(() => setVectorFeedback(null), 3200);
  };

  const handleFilterChange = async (
    filter: 'ALL' | 'AHEAD_ONLY' | 'OPEN_NOW' | 'TOP_RATED' | 'UNDER_1KM'
  ) => {
    setActiveFilter(filter);
    if (activeRoute) {
      await loadRouteRecommendations(activeRoute, filter, headingAngle, speedKmh);
    }
  };

  const handleEndActiveRoute = () => {
    Alert.alert(
      'End Route Guidance?',
      'Are you sure you want to cancel the active journey route? Route recommendations will be hidden.',
      [
        { text: 'Keep Route', style: 'cancel' },
        {
          text: 'End Route',
          style: 'destructive',
          onPress: () => {
            clearActiveRoute();
          },
        },
      ]
    );
  };

  const handleSimulateHeading = () => {
    Alert.alert(
      'Simulated Direction Vector',
      `Currently locked to ${headingAngle}° ${headingText} corridor.\n\nTap the vector chips in the card above to test other heading angles and watch places re-rank!`
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Journey Notifications',
      '• Ahead: Mindspace flyover traffic is moving smoothly (4 min saved).\n• Recommended: Shell EV station has 2 open fast chargers 1.1km ahead.'
    );
  };

  const currentDestinationName =
    activeDestinationPlace?.name || (activeRoute ? APP_CONFIG.defaultDestination.name : 'Destination');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header
        onProfilePress={onProfilePress}
        onNotificationPress={handleNotificationPress}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Trigger */}
        <SearchBar
          editable={false}
          onPress={onSearchPress}
          placeholder="What are you looking for ahead?"
        />

        {/* Active Journey Banner (Only shown when route is active) */}
        {activeRoute && (
          <View style={styles.activeJourneyCard}>
            <View style={styles.activeJourneyHeaderRow}>
              <View style={styles.activePill}>
                <View style={styles.activePulseDot} />
                <Text style={styles.activePillText}>ACTIVE JOURNEY ROUTE</Text>
              </View>

              <TouchableOpacity
                style={styles.cancelRouteBtn}
                onPress={handleEndActiveRoute}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.danger} />
                <Text style={styles.cancelRouteText}>End Route</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activeJourneyBodyRow}>
              <View style={styles.activeDestCol}>
                <Text style={styles.activeDestTitle} numberOfLines={1}>
                  {currentDestinationName}
                </Text>
                <Text style={styles.activeRouteStats} numberOfLines={1}>
                  {activeRoute.title} • {activeRoute.estimatedMinutes}m • {activeRoute.distanceKm} km
                </Text>
              </View>

              {onResumeNavigation && (
                <TouchableOpacity
                  style={styles.resumeNavBtn}
                  onPress={onResumeNavigation}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.resumeNavBtnText}>Resume</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Quick Categories Bar */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories Along Route</Text>
          <TouchableOpacity onPress={onSearchPress}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={(cat) => onCategoryPress(cat.id)}
            />
          ))}
        </ScrollView>

        {/* Direction Indicator Visual with Interactive Vectors & Speed */}
        <DirectionIndicator
          headingAngle={headingAngle}
          headingText={headingText}
          speedKmh={speedKmh}
          onAngleChange={handleVectorChange}
          onSpeedChange={handleSpeedChange}
          onSimulateChange={handleSimulateHeading}
        />

        {/* Map Preview Section */}
        <View style={styles.mapSectionCard}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapHeaderLeft}>
              <View style={styles.radarPill}>
                <View style={styles.radarDot} />
                <Text style={styles.radarText}>
                  {activeRoute ? 'LIVE ACTIVE ROUTE CORRIDOR' : 'LIVE TRAJECTORY PREVIEW'}
                </Text>
              </View>
              <Text style={styles.mapTitle}>
                {activeRoute ? `Route to ${currentDestinationName}` : 'Places on Current Path'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.expandMapButton}
              onPress={() => {
                if (onMapPress) {
                  onMapPress();
                } else if (routeRecommendations.length > 0) {
                  onPlacePress(routeRecommendations[0]);
                }
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="expand" size={16} color={COLORS.accent} />
              <Text style={styles.expandMapText}>Full Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            <InteractiveMap
              height={200}
              places={activeRoute ? routeRecommendations : []}
              selectedPlace={activeRoute && routeRecommendations.length > 0 ? routeRecommendations[0] : null}
              onSelectPlace={onPlacePress}
              destinationName={activeRoute ? currentDestinationName : APP_CONFIG.defaultDestination.name}
            />
          </View>
        </View>

        {/* Quick Utility Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
            onPress={onEmergencyPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: COLORS.danger }]}>
              <Ionicons name="alert" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: COLORS.danger }]}>Emergency</Text>
            <Text style={styles.shortcutSub}>Hospitals & Police</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={onTransportPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: COLORS.info }]}>
              <Ionicons name="bus" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: COLORS.info }]}>Transit</Text>
            <Text style={styles.shortcutSub}>Metro & Bus 216</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}
            onPress={onAccessibilityPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: COLORS.accent }]}>
              <Ionicons name="accessibility" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: COLORS.accent }]}>Accessible</Text>
            <Text style={styles.shortcutSub}>No-Stair Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={onOfflineMapsPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: COLORS.ahead }]}>
              <Ionicons name="cloud-offline" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: COLORS.ahead }]}>Offline</Text>
            <Text style={styles.shortcutSub}>Hyd Downloaded</Text>
          </TouchableOpacity>
        </View>

        {/* --------------------------------------------------------------- */}
        {/* RECOMMENDATION SECTION: DISPLAY ONLY WHEN ACTIVE ROUTE EXISTS    */}
        {/* --------------------------------------------------------------- */}
        {activeRoute ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.routePillTag}>
                  <Ionicons name="git-branch" size={12} color={COLORS.ahead} />
                  <Text style={styles.routePillTagText}>ACTIVE JOURNEY RECOMMENDATIONS</Text>
                </View>
                <Text style={styles.sectionTitle}>Recommended For Your Journey</Text>
                <Text style={styles.sectionSubtitle}>
                  Forward places on route to {currentDestinationName} • Minimal deviation
                </Text>
              </View>
            </View>

            {/* Dynamic Vector Change Alert Banner */}
            {vectorFeedback && (
              <View style={styles.feedbackBanner}>
                <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                <Text style={styles.feedbackBannerText}>{vectorFeedback}</Text>
              </View>
            )}

            {/* Interactive Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsRow}
            >
              {[
                { id: 'ALL', label: 'All Useful', icon: 'sparkles' },
                { id: 'AHEAD_ONLY', label: 'Ahead Only', icon: 'compass' },
                { id: 'OPEN_NOW', label: 'Open Now', icon: 'time' },
                { id: 'TOP_RATED', label: '4.5+ Rating', icon: 'star' },
                { id: 'UNDER_1KM', label: '< 1 km Close', icon: 'navigate' },
              ].map((pill) => {
                const isActive = activeFilter === pill.id;
                return (
                  <TouchableOpacity
                    key={pill.id}
                    style={[styles.filterPill, isActive && styles.filterPillActive]}
                    onPress={() => handleFilterChange(pill.id as any)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={pill.icon as any}
                      size={13}
                      color={isActive ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Route Recommendation Cards or Filter Reset */}
            {routeRecommendations.length === 0 ? (
              <View style={styles.emptyFilteredBox}>
                <Ionicons name="filter-outline" size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyFilteredTitle}>No places match this filter along active route</Text>
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => handleFilterChange('ALL')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.resetFilterText}>Reset to All Useful</Text>
                </TouchableOpacity>
              </View>
            ) : (
              routeRecommendations.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onPress={onPlacePress}
                  onNavigatePress={onNavigatePress}
                />
              ))
            )}
          </>
        ) : (
          /* When NO route is active: Show an en-route guidance card instead of recommendation cards */
          <View style={styles.noRoutePromptCard}>
            <View style={styles.noRouteIconCircle}>
              <Ionicons name="compass-outline" size={24} color={COLORS.accent} />
            </View>
            <View style={styles.noRouteTextCol}>
              <Text style={styles.noRoutePromptTitle}>En-Route Recommendations</Text>
              <Text style={styles.noRoutePromptSub}>
                Select a destination and start a route to unlock smart stops ahead with minimal detour.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.noRouteActionBtn}
              onPress={onSearchPress}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={15} color="#FFFFFF" />
              <Text style={styles.noRouteActionBtnText}>Find Destination</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  categoriesRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  mapSectionCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  mapHeaderLeft: {
    flex: 1,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  radarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ahead,
  },
  radarText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.5,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  expandMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  expandMapText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  mapWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  shortcutItem: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  shortcutIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  shortcutTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  shortcutSub: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  filterPillsRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: 8,
    marginBottom: SPACING.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyFilteredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyFilteredTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  resetFilterBtn: {
    marginTop: 12,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* Active Journey Banner */
  activeJourneyCard: {
    backgroundColor: '#0F172A',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOWS.md,
  },
  activeJourneyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ahead,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.5,
  },
  cancelRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  cancelRouteText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  activeJourneyBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 2,
  },
  activeDestCol: {
    flex: 1,
  },
  activeDestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeRouteStats: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  resumeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  resumeNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  routePillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  routePillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.5,
  },
  /* No Route Guidance Card */
  noRoutePromptCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  noRouteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  noRouteTextCol: {
    alignItems: 'center',
    marginBottom: 12,
  },
  noRoutePromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  noRoutePromptSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: SPACING.sm,
  },
  noRouteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  noRouteActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
