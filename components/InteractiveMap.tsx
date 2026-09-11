import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Place, Coordinates, UserLocation } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { locationService } from '../services/locationService';
import { directionsService } from '../services/directionsService';

export interface InteractiveMapProps {
  height?: number;
  places?: Place[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place) => void;
  showRecenterButton?: boolean;
  onRecenter?: () => void;
  destinationName?: string;
  destinationCoordinates?: Coordinates | null;
  isNavigationMode?: boolean;
  userProgress?: number; // 0.0 to 1.0
  userHeading?: number; // 0 to 360 degrees
  showSimulationBadge?: boolean;
  routeCoordinates?: Coordinates[];
  userLocation?: Coordinates | null;
}

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#CBD5E1' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748B' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#064E3B' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1E293B' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#334155' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94A3B8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1E3A8A' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1D4ED8' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1E293B' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0C4A6E' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38BDF8' }],
  },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  height = 240,
  places = [],
  selectedPlace,
  onSelectPlace,
  showRecenterButton = true,
  onRecenter,
  destinationName = APP_CONFIG.defaultDestination.name,
  destinationCoordinates,
  isNavigationMode = false,
  userProgress = 0,
  userHeading = 45,
  showSimulationBadge = false,
  routeCoordinates,
  userLocation,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const [activeMarker, setActiveMarker] = useState<Place | null>(selectedPlace || null);
  const [mapLayer, setMapLayer] = useState<'STANDARD' | 'TRAFFIC' | 'SATELLITE'>('STANDARD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(
    userLocation || locationService.getCoordinates()
  );
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: userLocation?.latitude ?? APP_CONFIG.defaultLocation.latitude,
    longitude: userLocation?.longitude ?? APP_CONFIG.defaultLocation.longitude,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  });

  // Keep state in sync with prop selection
  useEffect(() => {
    if (selectedPlace) {
      setActiveMarker(selectedPlace);
    }
  }, [selectedPlace]);

  // Subscribe to live GPS updates from locationService
  useEffect(() => {
    if (userLocation) {
      setCurrentCoords(userLocation);
      return;
    }

    const unsubscribe = locationService.subscribe((loc: UserLocation) => {
      setCurrentCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [userLocation]);

  // Active route polyline: prioritize prop, fallback to directionsService cache
  const activePolyline =
    routeCoordinates && routeCoordinates.length > 0
      ? routeCoordinates
      : directionsService.getActiveRoutePolyline();

  // Determine destination coordinates
  const destCoords: Coordinates =
    destinationCoordinates ||
    selectedPlace?.coordinates || {
      latitude: APP_CONFIG.defaultDestination.latitude,
      longitude: APP_CONFIG.defaultDestination.longitude,
    };

  // Calculate current vehicle location (advancing along polyline if in navigation mode)
  let effectiveUserCoords: Coordinates = currentCoords;
  if (isNavigationMode && activePolyline.length > 1 && userProgress > 0) {
    const totalPoints = activePolyline.length;
    const clampedProgress = Math.max(0, Math.min(1, userProgress));
    const targetIdx = Math.min(
      totalPoints - 1,
      Math.floor(clampedProgress * (totalPoints - 1))
    );
    effectiveUserCoords = activePolyline[targetIdx] || currentCoords;
  }

  // Update map center when effectiveUserCoords changes in navigation mode
  useEffect(() => {
    if (isNavigationMode && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: effectiveUserCoords.latitude,
          longitude: effectiveUserCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    }
  }, [isNavigationMode, effectiveUserCoords.latitude, effectiveUserCoords.longitude]);

  const showMapToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleMarkerTap = (place: Place) => {
    if (!place || !place.id) return;
    setActiveMarker(place);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  const handleRecenter = () => {
    const target: Region = {
      latitude: effectiveUserCoords.latitude,
      longitude: effectiveUserCoords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setCurrentRegion(target);
    mapRef.current?.animateToRegion(target, 600);
    showMapToast('📍 Centered on your position');
    if (onRecenter) {
      onRecenter();
    }
  };

  const handleCycleLayers = () => {
    setMapLayer((prev) => {
      if (prev === 'STANDARD') {
        showMapToast('🚦 Live Traffic Layer Active');
        return 'TRAFFIC';
      }
      if (prev === 'TRAFFIC') {
        showMapToast('🛰️ Satellite View Active');
        return 'SATELLITE';
      }
      showMapToast('🗺️ Standard Dark Navigation Active');
      return 'STANDARD';
    });
  };

  const handleZoomIn = () => {
    setCurrentRegion((prev) => {
      const next: Region = {
        ...prev,
        latitudeDelta: Math.max(0.003, prev.latitudeDelta * 0.6),
        longitudeDelta: Math.max(0.003, prev.longitudeDelta * 0.6),
      };
      mapRef.current?.animateToRegion(next, 300);
      showMapToast('Zoom: Street Level');
      return next;
    });
  };

  const handleZoomOut = () => {
    setCurrentRegion((prev) => {
      const next: Region = {
        ...prev,
        latitudeDelta: Math.min(0.2, prev.latitudeDelta * 1.6),
        longitudeDelta: Math.min(0.2, prev.longitudeDelta * 1.6),
      };
      mapRef.current?.animateToRegion(next, 300);
      showMapToast('Zoom: Area Overview');
      return next;
    });
  };

  const handleCallPlace = (place: Place) => {
    Alert.alert(
      `Calling ${place.name}`,
      `Connecting to ${place.phone || '+91 40 2311 8899'}\nDirection: ${place.direction} (${place.distance}m, ~${place.travelTime} min)`
    );
  };

  const safePlaces = (places || []).filter((p) => p && p.id && p.coordinates);
  const isTraffic = mapLayer === 'TRAFFIC';
  const isSatellite = mapLayer === 'SATELLITE';
  const headingAngle = userHeading ?? 45;

  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Real Geographic MapView */}
      <MapView
        ref={mapRef}
        style={styles.mapCanvas}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isSatellite ? undefined : DARK_MAP_STYLE}
        mapType={isSatellite ? 'hybrid' : 'standard'}
        showsTraffic={isTraffic}
        initialRegion={currentRegion}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        showsPointsOfInterests={true}
        showsBuildings={true}
        loadingEnabled={true}
        loadingBackgroundColor="#0F172A"
        loadingIndicatorColor={COLORS.accentCyan}
      >
        {/* Real Road Route Polyline */}
        {activePolyline.length > 1 && (
          <Polyline
            coordinates={activePolyline}
            strokeColor={COLORS.accentCyan}
            strokeWidth={4.5}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}

        {/* Real User Vehicle Location Marker */}
        <Marker
          coordinate={{
            latitude: effectiveUserCoords.latitude,
            longitude: effectiveUserCoords.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          zIndex={10}
        >
          <View style={styles.userMarkerContainer}>
            <View
              style={[
                styles.headingCone,
                { transform: [{ rotate: `${headingAngle}deg` }] },
              ]}
            />
            <View style={styles.userPulseRing} />
            <View style={styles.userCore}>
              <Ionicons
                name="navigate"
                size={14}
                color="#FFFFFF"
                style={{ transform: [{ rotate: `${headingAngle}deg` }] }}
              />
            </View>
            <View style={styles.userLabelBubble}>
              <Text style={styles.userLabelText}>
                {isNavigationMode ? 'You' : 'You (Live)'}
              </Text>
            </View>
          </View>
        </Marker>

        {/* Destination Flag Marker */}
        <Marker
          coordinate={{
            latitude: destCoords.latitude,
            longitude: destCoords.longitude,
          }}
          anchor={{ x: 0.5, y: 1.0 }}
          zIndex={9}
        >
          <View style={styles.destinationMarker}>
            <View style={styles.destPin}>
              <Ionicons name="flag" size={13} color="#FFFFFF" />
            </View>
            <View style={styles.destLabelBubble}>
              <Text style={styles.destLabelText} numberOfLines={1}>
                {destinationName}
              </Text>
            </View>
          </View>
        </Marker>

        {/* Candidate Place Markers at Real Latitude/Longitude */}
        {safePlaces.map((place) => {
          const isSelected = activeMarker?.id === place.id;
          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.coordinates.latitude,
                longitude: place.coordinates.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => handleMarkerTap(place)}
              zIndex={isSelected ? 8 : 5}
            >
              <View
                style={[
                  styles.placeMarker,
                  isSelected && styles.placeMarkerSelected,
                ]}
              >
                <View
                  style={[
                    styles.markerIconCircle,
                    place.direction === 'AHEAD' && { borderColor: COLORS.ahead },
                    place.direction === 'ON_ROUTE' && { borderColor: COLORS.onRoute },
                    place.direction === 'BEHIND' && { borderColor: COLORS.behind },
                    isSelected && styles.markerIconCircleSelected,
                  ]}
                >
                  <Text style={styles.markerEmoji}>
                    {place.category === 'Coffee'
                      ? '☕'
                      : place.category === 'Petrol'
                      ? '⛽'
                      : place.category === 'Hospital'
                      ? '🏥'
                      : place.category === 'ATM'
                      ? '🏧'
                      : place.category === 'Pharmacy'
                      ? '💊'
                      : place.category === 'Restaurant'
                      ? '🍽'
                      : '📍'}
                  </Text>
                </View>
                <View style={styles.markerTag}>
                  <Text style={styles.markerTagText} numberOfLines={1}>
                    {place.name}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Development Simulation Badge */}
      {(isNavigationMode || showSimulationBadge) && (
        <View style={styles.simBadge}>
          <View style={styles.simBadgePulseDot} />
          <Text style={styles.simBadgeText}>
            {locationService.isLiveGpsActive() ? 'LIVE GPS ACTIVE' : 'DEV SIMULATION: ACTIVE'}
          </Text>
        </View>
      )}

      {/* Interactive Toast Notification Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{toastMessage}</Text>
        </View>
      )}

      {/* Floating Map Controls Stack */}
      <View style={styles.mapControls}>
        {showRecenterButton && (
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={handleRecenter}
            activeOpacity={0.75}
            accessibilityLabel="Recenter location"
          >
            <Ionicons name="locate" size={18} color={COLORS.accentCyan} />
          </TouchableOpacity>
        )}

        {/* Map Layer Switcher: Standard -> Traffic -> Satellite */}
        <TouchableOpacity
          style={[
            styles.controlBtn,
            isTraffic && { backgroundColor: '#1E293B', borderColor: COLORS.ahead },
            isSatellite && { backgroundColor: '#1E293B', borderColor: COLORS.accentCyan },
          ]}
          activeOpacity={0.75}
          onPress={handleCycleLayers}
          accessibilityLabel="Toggle map layers"
        >
          <Ionicons
            name={isSatellite ? 'planet' : isTraffic ? 'speedometer' : 'layers-outline'}
            size={18}
            color={isSatellite ? COLORS.accentCyan : isTraffic ? COLORS.ahead : '#FFFFFF'}
          />
        </TouchableOpacity>

        {/* Zoom In Button */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomIn}
          activeOpacity={0.75}
          accessibilityLabel="Zoom In"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Zoom Out Button */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomOut}
          activeOpacity={0.75}
          accessibilityLabel="Zoom Out"
        >
          <Ionicons name="remove" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {isNavigationMode && (
          <View style={styles.speedBadge}>
            <Text style={styles.speedNum}>42</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        )}
      </View>

      {/* Active Marker Quick Action Sheet (if tapped) */}
      {activeMarker && activeMarker.id && (
        <View style={styles.quickCard}>
          <View style={styles.quickCardLeft}>
            <View style={styles.quickCardHeaderRow}>
              <Text style={styles.quickCardEmoji}>
                {activeMarker.category === 'Coffee'
                  ? '☕'
                  : activeMarker.category === 'Petrol'
                  ? '⛽'
                  : activeMarker.category === 'Hospital'
                  ? '🏥'
                  : activeMarker.category === 'ATM'
                  ? '🏧'
                  : activeMarker.category === 'Pharmacy'
                  ? '💊'
                  : '📍'}
              </Text>
              <Text style={styles.quickCardName} numberOfLines={1}>
                {activeMarker.name || 'Selected Place'}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveMarker(null)}
                style={styles.quickCardCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.quickCardMeta}>
              {activeMarker.direction === 'AHEAD'
                ? '🟢 AHEAD'
                : activeMarker.direction === 'ON_ROUTE'
                ? '🔵 ON ROUTE'
                : '🟡 BEHIND'} • {activeMarker.distance ?? 0}m • ~{activeMarker.travelTime ?? 0} min
            </Text>
          </View>

          <View style={styles.quickCardActionsWrap}>
            <TouchableOpacity
              style={styles.quickCardCallBtn}
              onPress={() => handleCallPlace(activeMarker)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={13} color={COLORS.accentCyan} />
              <Text style={styles.quickCardCallText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCardAction}
              onPress={() => onSelectPlace && activeMarker && onSelectPlace(activeMarker)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={13} color="#FFFFFF" />
              <Text style={styles.quickCardActionText}>Route</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    position: 'relative',
  },
  mapCanvas: {
    ...(StyleSheet.absoluteFill as any),
  },
  simBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    zIndex: 15,
  },
  simBadgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ahead,
  },
  simBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  userMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCone: {
    position: 'absolute',
    top: -24,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(0, 210, 255, 0.22)',
    borderRadius: 16,
    transform: [{ scaleX: 0.65 }],
  },
  userPulseRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 210, 255, 0.28)',
  },
  userCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  userLabelBubble: {
    position: 'absolute',
    bottom: -16,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  userLabelText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
  },
  destinationMarker: {
    alignItems: 'center',
  },
  destPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  destLabelBubble: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    ...SHADOWS.sm,
  },
  destLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeMarker: {
    alignItems: 'center',
  },
  placeMarkerSelected: {
    transform: [{ scale: 1.15 }],
    zIndex: 10,
  },
  markerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.ahead,
    ...SHADOWS.sm,
  },
  markerIconCircleSelected: {
    backgroundColor: '#0F172A',
    borderWidth: 2.5,
    borderColor: COLORS.accentCyan,
  },
  markerEmoji: {
    fontSize: 13,
  },
  markerTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  markerTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    maxWidth: 75,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
    zIndex: 20,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOWS.sm,
  },
  speedBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    ...SHADOWS.sm,
  },
  speedNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  speedUnit: {
    color: '#94A3B8',
    fontSize: 8,
    fontWeight: '600',
  },
  toastBanner: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    zIndex: 25,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickCard: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 30,
    ...SHADOWS.lg,
  },
  quickCardLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  quickCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickCardEmoji: {
    fontSize: 14,
  },
  quickCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  quickCardCloseBtn: {
    padding: 2,
  },
  quickCardMeta: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  quickCardActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickCardCallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickCardCallText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
  quickCardAction: {
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  quickCardActionText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
});
