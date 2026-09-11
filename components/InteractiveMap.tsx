import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker, Polyline, Region, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Place, Coordinates, UserLocation } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { locationService } from '../services/locationService';
import { directionsService } from '../services/directionsService';

/**
 * Map rendering engine selector:
 * - 'LEAFLET': Real OpenStreetMap road tiles rendered in an embedded WebView (zero API keys, full browser headers, no tile blocking)
 * - 'NATIVE': React Native Maps MapView
 * - 'PLACEHOLDER': Clean telemetry placeholder
 */
export type MapEngineType = 'LEAFLET' | 'NATIVE' | 'PLACEHOLDER';
export const MAP_ENGINE: MapEngineType = 'LEAFLET' as MapEngineType;

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

export const DARK_MAP_STYLE = [
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

function generateLeafletHtml(
  center: Coordinates,
  userCoords: Coordinates,
  heading: number,
  destCoords: Coordinates,
  destinationName: string,
  polyline: Coordinates[],
  places: Place[],
  isNavigationMode: boolean,
  isSatellite: boolean
): string {
  const safePoly = polyline.map((p) => `[${p.latitude}, ${p.longitude}]`).join(',');
  const safePlaces = places.map((p) => ({
    id: p.id,
    name: (p.name || '').replace(/'/g, "\\'"),
    lat: p.coordinates.latitude,
    lng: p.coordinates.longitude,
    category: p.category,
    direction: p.direction,
  }));

  const tileUrl = isSatellite
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = isSatellite
    ? '© Esri, Maxar, Earthstar Geographics'
    : '© OpenStreetMap contributors';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0F172A; overflow: hidden; }
    .leaflet-tile { filter: contrast(1.04) brightness(0.98); }
    .leaflet-control-attribution {
      background: rgba(15, 23, 42, 0.85) !important;
      color: #94A3B8 !important;
      font-size: 8px !important;
      border-radius: 4px;
      padding: 2px 5px !important;
      margin: 4px !important;
    }
    .leaflet-control-attribution a { color: #38BDF8 !important; text-decoration: none; }
    .user-pin {
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-cone {
      position: absolute;
      top: -10px;
      width: 0;
      height: 0;
      border-left: 7px solid transparent;
      border-right: 7px solid transparent;
      border-bottom: 14px solid rgba(0, 210, 255, 0.45);
      transform-origin: 50% 100%;
    }
    .user-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #00D2FF;
      border: 2.5px solid #FFFFFF;
      box-shadow: 0 0 10px #00D2FF;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 800;
    }
    .dest-pin {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #EF4444;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 8px #EF4444;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      font-size: 12px;
    }
    .place-bubble {
      background: rgba(15, 23, 42, 0.92);
      border-radius: 12px;
      padding: 2px 7px;
      display: flex;
      align-items: center;
      gap: 3px;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9px;
      font-weight: 700;
      white-space: nowrap;
      border: 1.5px solid #38BDF8;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      cursor: pointer;
    }
    .place-bubble.ahead { border-color: #10B981; }
    .place-bubble.on-route { border-color: #3B82F6; }
    .place-bubble.behind { border-color: #F59E0B; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      maxZoom: 19
    }).setView([${center.latitude}, ${center.longitude}], ${isNavigationMode ? 16 : 15});

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      attribution: '${attribution}'
    }).addTo(map);

    // Route Polyline
    var polylinePoints = [${safePoly}];
    var polyline = null;
    if (polylinePoints.length > 1) {
      polyline = L.polyline(polylinePoints, {
        color: '#00D2FF',
        weight: 5,
        opacity: 0.88,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      if (!${isNavigationMode}) {
        try { map.fitBounds(polyline.getBounds(), { padding: [25, 25] }); } catch(e) {}
      }
    }

    // Vehicle / User Marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pin"><div class="user-cone" style="transform: rotate(${heading}deg);"></div><div class="user-dot">▲</div></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    var userMarker = L.marker([${userCoords.latitude}, ${userCoords.longitude}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);

    // Destination Pin
    var destIcon = L.divIcon({
      className: '',
      html: '<div class="dest-pin">🏁</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
    L.marker([${destCoords.latitude}, ${destCoords.longitude}], { icon: destIcon, zIndexOffset: 900 })
      .bindPopup('${destinationName}')
      .addTo(map);

    // Candidate Place Markers
    var places = ${JSON.stringify(safePlaces)};
    places.forEach(function(p) {
      var emoji = p.category === 'Coffee' ? '☕' : p.category === 'Petrol' ? '⛽' : p.category === 'Hospital' ? '🏥' : p.category === 'ATM' ? '🏧' : '📍';
      var cls = p.direction === 'AHEAD' ? 'ahead' : p.direction === 'ON_ROUTE' ? 'on-route' : 'behind';
      var icon = L.divIcon({
        className: '',
        html: '<div class="place-bubble ' + cls + '">' + emoji + ' ' + p.name + '</div>',
        iconSize: [80, 20],
        iconAnchor: [40, 10]
      });
      var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
      m.on('click', function() {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_PLACE', id: p.id }));
        }
      });
    });

    // Global controller API for React Native injection
    window.setMapView = function(lat, lng, zoom) {
      map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
    };
    window.updateUserPos = function(lat, lng, heading) {
      userMarker.setLatLng([lat, lng]);
      var cone = document.querySelector('.user-cone');
      if (cone) { cone.style.transform = 'rotate(' + heading + 'deg)'; }
      if (${isNavigationMode}) { map.panTo([lat, lng], { animate: true }); }
    };
    window.zoomInMap = function() { map.zoomIn(); };
    window.zoomOutMap = function() { map.zoomOut(); };
  </script>
</body>
</html>`;
}

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
  const webViewRef = useRef<WebView | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const [activeMarker, setActiveMarker] = useState<Place | null>(selectedPlace || null);
  const [mapLayer, setMapLayer] = useState<'STANDARD' | 'TRAFFIC' | 'SATELLITE'>('STANDARD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasWebViewError, setHasWebViewError] = useState<boolean>(false);

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
    let isMounted = true;

    if (userLocation) {
      setCurrentCoords(userLocation);
      return;
    }

    const unsubscribe = locationService.subscribe((loc: UserLocation) => {
      if (!isMounted) return;
      setCurrentCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
    });

    return () => {
      isMounted = false;
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

  const headingAngle = userHeading ?? 45;
  const isCompact = height <= 220;
  const isTraffic = mapLayer === 'TRAFFIC';
  const isSatellite = mapLayer === 'SATELLITE';
  const safePlaces = (places || []).filter((p) => p && p.id && p.coordinates);

  // Sync user position to Leaflet WebView dynamically without reloading
  useEffect(() => {
    if (MAP_ENGINE === 'LEAFLET' && webViewRef.current) {
      const js = `if (window.updateUserPos) { window.updateUserPos(${currentCoords.latitude}, ${currentCoords.longitude}, ${headingAngle}); } true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [currentCoords.latitude, currentCoords.longitude, headingAngle]);

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
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setCurrentRegion(target);

    if (MAP_ENGINE === 'LEAFLET' && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.setMapView) { window.setMapView(${currentCoords.latitude}, ${currentCoords.longitude}, 16); } true;`
      );
    } else if (MAP_ENGINE === 'NATIVE') {
      mapRef.current?.animateToRegion(target, 600);
    }

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
      showMapToast('🗺️ Standard OpenStreetMap Active');
      return 'STANDARD';
    });
  };

  const handleZoomIn = () => {
    if (MAP_ENGINE === 'LEAFLET' && webViewRef.current) {
      webViewRef.current.injectJavaScript('if (window.zoomInMap) { window.zoomInMap(); } true;');
    } else if (MAP_ENGINE === 'NATIVE') {
      setCurrentRegion((prev) => {
        const next = {
          ...prev,
          latitudeDelta: Math.max(0.003, prev.latitudeDelta * 0.6),
          longitudeDelta: Math.max(0.003, prev.longitudeDelta * 0.6),
        };
        mapRef.current?.animateToRegion(next, 300);
        return next;
      });
    }
    showMapToast('Zoom: Street Level');
  };

  const handleZoomOut = () => {
    if (MAP_ENGINE === 'LEAFLET' && webViewRef.current) {
      webViewRef.current.injectJavaScript('if (window.zoomOutMap) { window.zoomOutMap(); } true;');
    } else if (MAP_ENGINE === 'NATIVE') {
      setCurrentRegion((prev) => {
        const next = {
          ...prev,
          latitudeDelta: Math.min(0.2, prev.latitudeDelta * 1.6),
          longitudeDelta: Math.min(0.2, prev.longitudeDelta * 1.6),
        };
        mapRef.current?.animateToRegion(next, 300);
        return next;
      });
    }
    showMapToast('Zoom: Area Overview');
  };

  const handleCallPlace = (place: Place) => {
    Alert.alert(
      `Calling ${place.name}`,
      `Connecting to ${place.phone || '+91 40 2311 8899'}\nDirection: ${place.direction} (${place.distance}m, ~${place.travelTime} min)`
    );
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'SELECT_PLACE' && data.id) {
        const place = safePlaces.find((p) => p.id === data.id);
        if (place) {
          setActiveMarker(place);
          if (onSelectPlace) {
            onSelectPlace(place);
          }
        }
      }
    } catch {
      // Ignore parse issues
    }
  };

  // Generate Leaflet HTML with user props
  const leafletHtml = useMemo(() => {
    return generateLeafletHtml(
      currentCoords,
      currentCoords,
      headingAngle,
      destCoords,
      destinationName,
      activePolyline,
      safePlaces,
      isNavigationMode,
      isSatellite
    );
  }, [
    currentCoords.latitude,
    currentCoords.longitude,
    headingAngle,
    destCoords.latitude,
    destCoords.longitude,
    destinationName,
    activePolyline.length,
    safePlaces.length,
    isNavigationMode,
    isSatellite,
  ]);

  return (
    <View style={[styles.mapContainer, { height }]}>
      {MAP_ENGINE === 'LEAFLET' && !hasWebViewError ? (
        /* Real OpenStreetMap Powered by Leaflet JS in WebView */
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          style={styles.webView}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={handleWebViewMessage}
          onError={() => setHasWebViewError(true)}
          androidLayerType="hardware"
        />
      ) : MAP_ENGINE === 'NATIVE' ? (
        /* Native MapView (preserved for future toggles) */
        <MapView
          ref={mapRef}
          style={styles.mapCanvas}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          initialRegion={currentRegion}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          showsPointsOfInterests={true}
          showsBuildings={true}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            zIndex={1}
            maximumZ={19}
            minimumZ={1}
            flipY={false}
            shouldReplaceMapContent={Platform.OS === 'ios'}
          />
          {activePolyline.length > 1 && (
            <Polyline
              coordinates={activePolyline}
              strokeColor={COLORS.accentCyan}
              strokeWidth={4.5}
              lineCap="round"
              lineJoin="round"
              zIndex={10}
            />
          )}
          <Marker
            coordinate={{
              latitude: effectiveUserCoords.latitude,
              longitude: effectiveUserCoords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            zIndex={20}
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
          <Marker
            coordinate={{
              latitude: destCoords.latitude,
              longitude: destCoords.longitude,
            }}
            anchor={{ x: 0.5, y: 1.0 }}
            zIndex={18}
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
                zIndex={isSelected ? 16 : 14}
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
      ) : (
        /* Fault-Tolerant Telemetry Placeholder */
        <View style={styles.placeholderContainer}>
          <View style={styles.radarRingOuter} />
          <View style={styles.radarRingInner} />

          <View style={[styles.placeholderCard, isCompact && styles.placeholderCardCompact]}>
            <View style={styles.statusBadgeRow}>
              <View style={styles.statusBadgeDot} />
              <Text style={styles.statusBadgeTitle}>MAP TELEMETRY MODE</Text>
            </View>

            <Text style={styles.placeholderSubtext}>
              Navigation data continues to work normally
            </Text>

            <View style={[styles.telemetryDashboard, isCompact && styles.telemetryDashboardCompact]}>
              <View style={styles.telemetryGridRow}>
                <View style={styles.telemetryCell}>
                  <View style={styles.telemetryIconLabelRow}>
                    <Ionicons name="navigate-circle-outline" size={13} color={COLORS.accentCyan} />
                    <Text style={styles.telemetryCellLabel}>YOUR POSITION</Text>
                  </View>
                  <Text style={styles.telemetryCellValue} numberOfLines={1}>
                    {effectiveUserCoords.latitude.toFixed(4)}°N, {effectiveUserCoords.longitude.toFixed(4)}°E
                  </Text>
                </View>

                <View style={styles.telemetryCellDivider} />

                <View style={styles.telemetryCell}>
                  <View style={styles.telemetryIconLabelRow}>
                    <Ionicons name="compass-outline" size={13} color={COLORS.ahead} />
                    <Text style={styles.telemetryCellLabel}>VECTOR / SPEED</Text>
                  </View>
                  <Text style={styles.telemetryCellValue} numberOfLines={1}>
                    {headingAngle}° NE • {isNavigationMode ? '42 km/h' : 'Tracking'}
                  </Text>
                </View>
              </View>

              {!isCompact && (
                <View style={[styles.telemetryGridRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(51, 65, 85, 0.4)' }]}>
                  <View style={styles.telemetryCell}>
                    <View style={styles.telemetryIconLabelRow}>
                      <Ionicons name="flag-outline" size={13} color={COLORS.onRoute} />
                      <Text style={styles.telemetryCellLabel}>DESTINATION</Text>
                    </View>
                    <Text style={styles.telemetryCellValue} numberOfLines={1}>
                      {destinationName}
                    </Text>
                  </View>

                  <View style={styles.telemetryCellDivider} />

                  <View style={styles.telemetryCell}>
                    <View style={styles.telemetryIconLabelRow}>
                      <Ionicons name="git-branch-outline" size={13} color="#F59E0B" />
                      <Text style={styles.telemetryCellLabel}>CORRIDOR DATA</Text>
                    </View>
                    <Text style={styles.telemetryCellValue} numberOfLines={1}>
                      {activePolyline.length > 0
                        ? `${activePolyline.length} waypoints synced`
                        : 'Active corridor'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.placeholderConfigNotice}>
              Map will be enabled when map API is configured
            </Text>
          </View>
        </View>
      )}

      {/* Development / Live Simulation Badge */}
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

      {/* Active Marker Quick Action Sheet (if a place is tapped) */}
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
    backgroundColor: '#0A0F1D',
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: '#0F172A',
  },
  mapCanvas: {
    ...(StyleSheet.absoluteFill as any),
  },

  /* Placeholder Styling */
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
  },
  radarRingOuter: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.08)',
  },
  radarRingInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  placeholderCard: {
    width: '94%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    ...SHADOWS.md,
    zIndex: 10,
  },
  placeholderCardCompact: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  statusBadgeTitle: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  placeholderSubtext: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  telemetryDashboard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.6)',
  },
  telemetryDashboardCompact: {
    paddingVertical: 6,
    marginTop: 6,
  },
  telemetryGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryCell: {
    flex: 1,
  },
  telemetryCellDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    marginHorizontal: 8,
  },
  telemetryIconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  telemetryCellLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  telemetryCellValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  placeholderConfigNotice: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Controls & Badges */
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
