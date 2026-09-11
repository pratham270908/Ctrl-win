import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

interface InteractiveMapProps {
  height?: number;
  places?: Place[];
  selectedPlace?: Place | null;
  onSelectPlace?: (place: Place) => void;
  showRecenterButton?: boolean;
  onRecenter?: () => void;
  destinationName?: string;
  isNavigationMode?: boolean;
  userProgress?: number; // 0.0 to 1.0
  userHeading?: number; // 0 to 360 degrees
  showSimulationBadge?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  height = 240,
  places = [],
  selectedPlace,
  onSelectPlace,
  showRecenterButton = true,
  onRecenter,
  destinationName = APP_CONFIG.defaultDestination.name,
  isNavigationMode = false,
  userProgress = 0,
  userHeading = 45,
  showSimulationBadge = false,
}) => {
  const [activeMarker, setActiveMarker] = useState<Place | null>(selectedPlace || null);
  const [mapLayer, setMapLayer] = useState<'STANDARD' | 'TRAFFIC' | 'SATELLITE'>('STANDARD');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 2D Pan state for touch dragging around map
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset({
          x: panRef.current.x + gestureState.dx,
          y: panRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        panRef.current = {
          x: panRef.current.x + gestureState.dx,
          y: panRef.current.y + gestureState.dy,
        };
        setPanOffset({ ...panRef.current });
      },
    })
  ).current;

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
    panRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1.0);
    showMapToast('📍 Camera re-centered on vehicle');
    if (onRecenter) {
      onRecenter();
    } else {
      setActiveMarker(null);
    }
  };

  const handleCycleLayers = () => {
    setMapLayer((prev) => {
      if (prev === 'STANDARD') {
        showMapToast('🚦 Live Traffic Layer: Flowing Normal');
        return 'TRAFFIC';
      }
      if (prev === 'TRAFFIC') {
        showMapToast('🛰️ Satellite Dark Mode Active');
        return 'SATELLITE';
      }
      showMapToast('🗺️ Standard Daylight Map Active');
      return 'STANDARD';
    });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => {
      const next = Math.min(1.4, prev + 0.15);
      showMapToast(`Zoom: ${next.toFixed(2)}x (Street Level)`);
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.7, prev - 0.15);
      showMapToast(`Zoom: ${next.toFixed(2)}x (Corridor Level)`);
      return next;
    });
  };

  const handleCallPlace = (place: Place) => {
    Alert.alert(
      `Calling ${place.name}`,
      `Connecting to +91 40 2311 8899\nDirection: ${place.direction} (${place.distance}m ahead, ~${place.travelTime} min)`
    );
  };

  const safePlaces = (places || []).filter((p) => p && p.id);
  const isDark = mapLayer === 'SATELLITE';
  const isTraffic = mapLayer === 'TRAFFIC';

  // Calculate dynamic simulated user position along route corridor
  const progress = Math.max(0, Math.min(1, userProgress));
  const userLeft = 75 + progress * (SCREEN_WIDTH - 160);
  const userTop = Math.max(25, (height - 65) - progress * (height - 90));
  const headingAngle = userHeading ?? 45;

  return (
    <View style={[styles.mapContainer, { height }, isDark && styles.mapContainerDark]}>
      {/* Development Simulation Mode Badge */}
      {(isNavigationMode || showSimulationBadge) && (
        <View style={styles.simBadge}>
          <View style={styles.simBadgePulseDot} />
          <Text style={styles.simBadgeText}>DEV SIMULATION: ACTIVE</Text>
        </View>
      )}

      {/* Simulated Map Canvas with Pan & Zoom Transform */}
      <View
        {...panResponder.panHandlers}
        style={[
          styles.mapCanvas,
          isDark && styles.mapCanvasDark,
          {
            transform: [
              { translateX: panOffset.x },
              { translateY: panOffset.y },
              { scale: zoomLevel },
            ],
          },
        ]}
      >
        {/* Secondary Cross Roads */}
        <View style={[styles.roadHorizontal1, isDark && styles.roadDark]} />
        <View style={[styles.roadHorizontal2, isDark && styles.roadDark]} />
        <View style={[styles.roadVertical1, isDark && styles.roadDark]} />
        <View style={[styles.roadVertical2, isDark && styles.roadDark]} />

        {/* Primary Main Expressway / Corridor */}
        <View style={[styles.expresswayDiagonal, isDark && styles.expresswayDark]} />
        <View style={[styles.expresswayCenterLine, isDark && styles.expresswayCenterLineDark]} />

        {/* Traffic Congestion Visual Overlays (if Traffic Layer Active) */}
        {isTraffic && (
          <>
            <View style={styles.trafficSegmentGreen} />
            <View style={styles.trafficSegmentOrange} />
            <View style={styles.trafficSegmentRed} />
          </>
        )}

        {/* Active Journey Route Line */}
        <View style={styles.routePathLine} />

        {/* Green Area / Tech Park Landmark */}
        <View style={[styles.landmarkPark, isDark && styles.landmarkParkDark]}>
          <Text style={[styles.landmarkText, isDark && styles.landmarkTextDark]}>
            Knowledge Park
          </Text>
        </View>

        {/* Water body landmark */}
        <View style={[styles.landmarkLake, isDark && styles.landmarkLakeDark]}>
          <Text style={[styles.landmarkText, isDark && styles.landmarkTextDark]}>
            Durgam Lake
          </Text>
        </View>

        {/* User Location Marker with Dynamic Movement & Heading Cone */}
        <View
          style={[
            styles.userMarkerContainer,
            {
              top: userTop,
              left: userLeft,
              bottom: undefined,
            },
          ]}
        >
          <View
            style={[
              styles.headingCone,
              {
                transform: [{ rotate: `${headingAngle}deg` }, { scaleX: 0.6 }],
              },
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
              {isNavigationMode
                ? `You (${Math.round(headingAngle)}° • ${(progress * 100).toFixed(0)}%)`
                : `You (${Math.round(headingAngle)}° NE)`}
            </Text>
          </View>
        </View>

        {/* Destination Marker */}
        <View style={styles.destinationMarker}>
          <View style={styles.destPin}>
            <Ionicons name="flag" size={12} color="#FFFFFF" />
          </View>
          <View style={styles.destLabelBubble}>
            <Text style={styles.destLabelText} numberOfLines={1}>
              {destinationName}
            </Text>
          </View>
        </View>

        {/* Place Markers plotted along the visual journey */}
        {safePlaces.slice(0, 4).map((place, index) => {
          let top = 40;
          let left = 60;

          if (place.direction === 'AHEAD') {
            top = index === 0 ? 55 : 30;
            left = index === 0 ? SCREEN_WIDTH * 0.45 : SCREEN_WIDTH * 0.65;
          } else if (place.direction === 'ON_ROUTE') {
            top = 110;
            left = SCREEN_WIDTH * 0.58;
          } else {
            top = 175;
            left = SCREEN_WIDTH * 0.25;
          }

          const isSelected = activeMarker?.id === place.id;

          return (
            <TouchableOpacity
              key={place.id}
              style={[styles.placeMarker, { top, left }, isSelected && styles.placeMarkerSelected]}
              onPress={() => handleMarkerTap(place)}
              activeOpacity={0.8}
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
                    : '📍'}
                </Text>
              </View>
              <View style={styles.markerTag}>
                <Text style={styles.markerTagText} numberOfLines={1}>
                  {place.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

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
            activeOpacity={0.7}
            accessibilityLabel="Recenter location"
          >
            <Ionicons name="locate" size={18} color={COLORS.accent} />
          </TouchableOpacity>
        )}

        {/* Map Layer Switcher: Standard -> Traffic -> Satellite */}
        <TouchableOpacity
          style={[
            styles.controlBtn,
            isTraffic && { backgroundColor: '#DBEAFE', borderColor: COLORS.accent },
            isDark && { backgroundColor: '#1E293B', borderColor: '#38BDF8' },
          ]}
          activeOpacity={0.7}
          onPress={handleCycleLayers}
          accessibilityLabel="Toggle map layers"
        >
          <Ionicons
            name={isDark ? 'moon' : isTraffic ? 'speedometer' : 'layers-outline'}
            size={18}
            color={isDark ? '#38BDF8' : isTraffic ? COLORS.accent : COLORS.primary}
          />
        </TouchableOpacity>

        {/* Zoom In Button */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomIn}
          activeOpacity={0.7}
          accessibilityLabel="Zoom In"
        >
          <Ionicons name="add" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Zoom Out Button */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleZoomOut}
          activeOpacity={0.7}
          accessibilityLabel="Zoom Out"
        >
          <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {isNavigationMode && (
          <View style={styles.speedBadge}>
            <Text style={styles.speedNum}>38</Text>
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
              {activeMarker.direction === 'AHEAD' ? '🟢 AHEAD' : '🟡 ' + activeMarker.direction} • {activeMarker.distance ?? 0}m • ~{activeMarker.travelTime ?? 0} min detour
            </Text>
          </View>

          <View style={styles.quickCardActionsWrap}>
            <TouchableOpacity
              style={styles.quickCardCallBtn}
              onPress={() => handleCallPlace(activeMarker)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={13} color={COLORS.accent} />
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
    backgroundColor: '#E4EBF1',
    overflow: 'hidden',
    position: 'relative',
  },
  mapCanvas: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: '#E8EDF2',
  },
  roadHorizontal1: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D3DCE6',
  },
  roadHorizontal2: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D3DCE6',
  },
  roadVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 80,
    width: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D3DCE6',
  },
  roadVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 70,
    width: 14,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D3DCE6',
  },
  expresswayDiagonal: {
    position: 'absolute',
    top: -40,
    left: -20,
    width: 480,
    height: 28,
    backgroundColor: '#FEF3C7',
    transform: [{ rotate: '32deg' }],
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#FDE68A',
  },
  expresswayCenterLine: {
    position: 'absolute',
    top: -27,
    left: -20,
    width: 480,
    height: 2,
    backgroundColor: '#F59E0B',
    transform: [{ rotate: '32deg' }],
  },
  routePathLine: {
    position: 'absolute',
    top: 20,
    left: 100,
    width: 220,
    height: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 3,
    transform: [{ rotate: '25deg' }],
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  landmarkPark: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  landmarkLake: {
    position: 'absolute',
    top: 15,
    left: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E0F2FE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  landmarkText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0F766E',
  },
  userMarkerContainer: {
    position: 'absolute',
    bottom: 50,
    left: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCone: {
    position: 'absolute',
    top: -30,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 20,
    transform: [{ scaleX: 0.6 }],
  },
  userPulseRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  userCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  userHeadingIcon: {
    transform: [{ rotate: '45deg' }],
  },
  userLabelBubble: {
    position: 'absolute',
    bottom: -18,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  userLabelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  destinationMarker: {
    position: 'absolute',
    top: 20,
    right: 40,
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
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  destLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  placeMarker: {
    position: 'absolute',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.ahead,
    ...SHADOWS.sm,
  },
  markerIconCircleSelected: {
    backgroundColor: COLORS.accentLight,
    borderWidth: 2.5,
  },
  markerEmoji: {
    fontSize: 14,
  },
  markerTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  markerTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    maxWidth: 70,
  },
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  speedBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  quickCard: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  quickCardLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  quickCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quickCardMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  quickCardAction: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  quickCardActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapContainerDark: {
    backgroundColor: '#0B132B',
  },
  mapCanvasDark: {
    backgroundColor: '#0F172A',
  },
  roadDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  expresswayDark: {
    backgroundColor: '#1E293B',
    borderColor: '#0284C7',
  },
  expresswayCenterLineDark: {
    backgroundColor: '#38BDF8',
  },
  landmarkParkDark: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  landmarkLakeDark: {
    backgroundColor: '#0C4A6E',
    borderColor: '#0284C7',
  },
  landmarkTextDark: {
    color: '#38BDF8',
  },
  trafficSegmentGreen: {
    position: 'absolute',
    top: 50,
    left: 40,
    width: 90,
    height: 4,
    backgroundColor: '#22C55E',
    borderRadius: 2,
    transform: [{ rotate: '32deg' }],
  },
  trafficSegmentOrange: {
    position: 'absolute',
    top: 95,
    left: 120,
    width: 80,
    height: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    transform: [{ rotate: '32deg' }],
  },
  trafficSegmentRed: {
    position: 'absolute',
    top: 140,
    left: 190,
    width: 60,
    height: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    transform: [{ rotate: '32deg' }],
  },
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 60,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
    zIndex: 25,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  quickCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickCardEmoji: {
    fontSize: 14,
  },
  quickCardCloseBtn: {
    marginLeft: 6,
    padding: 2,
  },
  quickCardActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickCardCallBtn: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  quickCardCallText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  /* Development Simulation Mode Badge */
  simBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  simBadgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  simBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
});
