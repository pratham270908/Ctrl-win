import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteCard } from '../components/RouteCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { MOCK_ROUTE_OPTIONS } from '../data/mockRoutes';
import { Place, RouteOption, Coordinates } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { directionsService } from '../services/directionsService';
import { locationService } from '../services/locationService';

interface RouteOptionsScreenProps {
  destinationPlace?: Place | null;
  onBack: () => void;
  onStartNavigation: (route: RouteOption) => void;
}

export const RouteOptionsScreen: React.FC<RouteOptionsScreenProps> = ({
  destinationPlace,
  onBack,
  onStartNavigation,
}) => {
  const [routes, setRoutes] = useState<RouteOption[]>(MOCK_ROUTE_OPTIONS);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(MOCK_ROUTE_OPTIONS[0]);
  const [originLabel, setOriginLabel] = useState<string>('Current Location (GPS)');
  const [originCoords, setOriginCoords] = useState<Coordinates>(locationService.getCoordinates());
  const [routePolyline, setRoutePolyline] = useState<Coordinates[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const destName = destinationPlace?.name || 'Gachibowli Tech Campus';
  const destCategory = destinationPlace?.category || 'Destination';

  useEffect(() => {
    let isMounted = true;

    const fetchRouteData = async () => {
      setIsLoading(true);
      const loc = await locationService.getCurrentLocation();
      if (!isMounted) return;

      const userCoords: Coordinates = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      setOriginCoords(userCoords);
      setOriginLabel(loc.label || 'Your Device Location');

      const destCoordinates = destinationPlace?.coordinates;
      const computedRoutes = await directionsService.getRouteOptions(
        userCoords,
        destCoordinates
      );

      if (!isMounted) return;
      if (computedRoutes && computedRoutes.length > 0) {
        setRoutes(computedRoutes);
        setSelectedRoute(computedRoutes[0]);
      }
      setRoutePolyline(directionsService.getActiveRoutePolyline());
      setIsLoading(false);
    };

    fetchRouteData();

    return () => {
      isMounted = false;
    };
  }, [destinationPlace]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>CHOOSE JOURNEY ROUTE</Text>
          <Text style={styles.destTitle} numberOfLines={1}>
            {destName}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Preview Showing the Selected Route */}
        <View style={styles.mapWrap}>
          <InteractiveMap
            height={200}
            places={destinationPlace ? [destinationPlace] : []}
            selectedPlace={destinationPlace}
            destinationName={destName}
            destinationCoordinates={destinationPlace?.coordinates}
            routeCoordinates={routePolyline}
            userLocation={originCoords}
          />
        </View>

        {/* Journey Summary Card */}
        <View style={styles.journeySummaryCard}>
          <View style={styles.locationNode}>
            <View style={styles.nodeIconStart}>
              <Ionicons name="navigate" size={12} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeLabel}>START</Text>
              <Text style={styles.nodeVal} numberOfLines={1}>
                {originLabel}
              </Text>
            </View>
          </View>

          <View style={styles.routeConnectorLine} />

          <View style={styles.locationNode}>
            <View style={styles.nodeIconEnd}>
              <Ionicons name="location" size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeLabel}>DESTINATION ({destCategory.toUpperCase()})</Text>
              <Text style={styles.nodeVal} numberOfLines={1}>
                {destName}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Available Route Variants</Text>
            <Text style={styles.sectionSubtitle}>
              {isLoading
                ? 'Calculating real traffic & corridor distances...'
                : 'Real road routes calculated via Routes API'}
            </Text>
          </View>
          {isLoading && (
            <ActivityIndicator size="small" color={COLORS.accentCyan} style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Selectable Route Options */}
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            isSelected={selectedRoute.id === route.id}
            onSelect={(r) => setSelectedRoute(r)}
          />
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Action: Start Navigation */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.summaryTime}>{selectedRoute.estimatedMinutes} min</Text>
          <Text style={styles.summaryDist}>
            {selectedRoute.distanceKm} km • {selectedRoute.trafficLevel} TRAFFIC
          </Text>
        </View>

        <TouchableOpacity
          style={styles.startNavBtn}
          onPress={() => onStartNavigation(selectedRoute)}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.startNavBtnText}>Start Navigation</Text>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  destTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  mapWrap: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  journeySummaryCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  locationNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  nodeIconStart: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.onRoute,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIconEnd: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  nodeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  routeConnectorLine: {
    width: 2,
    height: 16,
    backgroundColor: COLORS.cardBorder,
    marginLeft: 12,
    marginVertical: 2,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  bottomBarInfo: {
    flex: 1,
  },
  summaryTime: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  summaryDist: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ahead,
    marginTop: 1,
  },
  startNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xl,
    height: 50,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  startNavBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
