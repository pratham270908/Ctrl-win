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
import { VoiceAiOverlay } from '../components/VoiceAiOverlay';
import { CATEGORIES, CategoryInfo } from '../data/mockCategories';
import { placesService } from '../services/placesService';
import { locationService } from '../services/locationService';
import { useApp } from '../store/AppContext';
import { Place, PlaceCategory, Coordinates, RouteOption } from '../types';
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
  onAutonomousNavigation?: (place: Place, route: RouteOption) => void;
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
  onAutonomousNavigation,
}) => {
  const { activeRoute, activeDestinationPlace, clearActiveRoute } = useApp();
  const [isVoiceOverlayVisible, setIsVoiceOverlayVisible] = useState<boolean>(false);
  const [routeRecommendations, setRouteRecommendations] = useState<Place[]>([]);
  const [headingAngle, setHeadingAngle] = useState<number>(45);
  const [headingText, setHeadingText] = useState<string>('Travelling North-East');
  const [speedKmh, setSpeedKmh] = useState<number>(38);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AHEAD_ONLY' | 'OPEN_NOW' | 'TOP_RATED' | 'UNDER_1KM'>('ALL');
  const [vectorFeedback, setVectorFeedback] = useState<string | null>(null);
  const [locationSubtitle, setLocationSubtitle] = useState<string>(APP_CONFIG.defaultLocation.label);
  const [userCoords, setUserCoords] = useState<Coordinates>(locationService.getCoordinates());

  useEffect(() => {
    let isMounted = true;
    let watcherCleanup: (() => void) | null = null;

    // Subscribe to location updates
    const unsubscribe = locationService.subscribe((loc) => {
      if (!isMounted) return;
      setLocationSubtitle(loc.label);
      setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
      setHeadingText(`Travelling ${loc.headingText}`);
      setSpeedKmh(loc.speedKmh);
    });

    // Start active device GPS tracking
    locationService.startWatchingLocation().then((cleanup) => {
      if (isMounted) {
        watcherCleanup = cleanup;
      } else if (cleanup) {
        cleanup();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (watcherCleanup) watcherCleanup();
    };
  }, []);

  useEffect(() => {
    if (activeRoute) {
      loadRouteRecommendations(activeRoute, activeFilter, headingAngle, speedKmh, userCoords);
    } else {
      setRouteRecommendations([]);
    }
  }, [activeRoute, activeDestinationPlace, activeFilter, headingAngle, speedKmh, userCoords]);

  const loadRouteRecommendations = async (
    route = activeRoute,
    filter = activeFilter,
    angle = headingAngle,
    speed = speedKmh,
    coords = userCoords
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
      filter,
      coords
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
        subtitle={locationSubtitle}
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
          <View>
            <Text style={styles.sectionTitle}>Categories Along Route</Text>
            <Text style={styles.sectionSubtitle}>Tap to discover places on your travel corridor</Text>
          </View>
          <TouchableOpacity onPress={onSearchPress} activeOpacity={0.7}>
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

        {/* Map Preview Section - CONTAINER ONLY REDESIGNED, MAP COMPONENT IS UNTOUCHED */}
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
              <Ionicons name="expand" size={14} color={COLORS.accentCyan} />
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
              destinationCoordinates={activeDestinationPlace?.coordinates}
              userLocation={userCoords}
              userHeading={headingAngle}
            />
          </View>
        </View>

        {/* Quick Utility Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' }]}
            onPress={onEmergencyPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: COLORS.danger }]}>
              <Ionicons name="alert" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: '#F87171' }]}>Emergency</Text>
            <Text style={styles.shortcutSub}>Hospitals & Police</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)' }]}
            onPress={onTransportPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="bus" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: '#60A5FA' }]}>Transit</Text>
            <Text style={styles.shortcutSub}>Metro & Bus 216</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.35)' }]}
            onPress={onAccessibilityPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: '#A855F7' }]}>
              <Ionicons name="accessibility" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: '#C084FC' }]}>Accessible</Text>
            <Text style={styles.shortcutSub}>No-Stair Paths</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutItem, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' }]}
            onPress={onOfflineMapsPress}
            activeOpacity={0.8}
          >
            <View style={[styles.shortcutIconCircle, { backgroundColor: '#10B981' }]}>
              <Ionicons name="cloud-offline" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.shortcutTitle, { color: '#34D399' }]}>Offline</Text>
            <Text style={styles.shortcutSub}>Hyd Cached</Text>
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

      {/* SpecFinder Autonomous Voice AI Floating Trigger Button */}
      <TouchableOpacity
        style={styles.floatingAiButton}
        onPress={() => setIsVoiceOverlayVisible(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="SpecFinder AI Voice Assistant"
      >
        <View style={styles.aiGlowRing} />
        <View style={styles.aiButtonInner}>
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          <View style={styles.aiBadgeDot} />
        </View>
      </TouchableOpacity>

      {/* SpecFinder Autonomous Voice AI Overlay */}
      <VoiceAiOverlay
        visible={isVoiceOverlayVisible}
        onClose={() => setIsVoiceOverlayVisible(false)}
        onAutonomousNavigation={(place, route) => {
          setIsVoiceOverlayVisible(false);
          if (onAutonomousNavigation) {
            onAutonomousNavigation(place, route);
          }
        }}
      />
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  categoriesRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 6,
  },
  mapSectionCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    marginHorizontal: SPACING.lg,
    marginVertical: 10,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.22)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 6,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mapHeaderLeft: {
    flex: 1,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  radarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  radarText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.6,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  expandMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  expandMapText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentCyan,
  },
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.25)',
  },
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginVertical: 10,
    gap: 8,
  },
  shortcutItem: {
    flex: 1,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...SHADOWS.sm,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  shortcutSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 1,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.14)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    gap: 8,
  },
  feedbackBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.accentCyan,
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
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26, 37, 64, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.25)',
    ...SHADOWS.sm,
  },
  filterPillActive: {
    backgroundColor: COLORS.accentCyan,
    borderColor: COLORS.accentCyan,
    shadowColor: COLORS.accentCyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  filterPillTextActive: {
    color: '#0A0F1E',
    fontWeight: '800',
  },
  emptyFilteredBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(26, 37, 64, 0.75)',
    borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.2)',
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
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0F1E',
  },
  /* Active Journey Banner */
  activeJourneyCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.35)',
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  activePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.ahead,
    shadowColor: COLORS.ahead,
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.6,
  },
  cancelRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  cancelRouteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F87171',
  },
  activeJourneyBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: 4,
  },
  activeDestCol: {
    flex: 1,
  },
  activeDestTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeRouteStats: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  resumeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  resumeNavBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A0F1E',
  },
  routePillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  routePillTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.5,
  },
  /* No Route Guidance Card */
  noRoutePromptCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    marginHorizontal: SPACING.lg,
    marginTop: 16,
    marginBottom: SPACING.sm,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.22)',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  noRouteIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  noRouteTextCol: {
    alignItems: 'center',
    marginBottom: 14,
  },
  noRoutePromptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  noRoutePromptSub: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: SPACING.sm,
  },
  noRouteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  noRouteActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0F1E',
  },
  floatingAiButton: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
  },
  aiGlowRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(6, 182, 212, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
  },
  aiButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  aiBadgeDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
  },
});
