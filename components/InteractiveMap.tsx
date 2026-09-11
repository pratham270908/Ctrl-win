import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
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
}) => {
  const [activeMarker, setActiveMarker] = useState<Place | null>(selectedPlace || null);

  const handleMarkerTap = (place: Place) => {
    setActiveMarker(place);
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Simulated Map Background with Modern Stylized Roads */}
      <View style={styles.mapCanvas}>
        {/* Secondary Cross Roads */}
        <View style={styles.roadHorizontal1} />
        <View style={styles.roadHorizontal2} />
        <View style={styles.roadVertical1} />
        <View style={styles.roadVertical2} />

        {/* Primary Main Expressway / Corridor */}
        <View style={styles.expresswayDiagonal} />
        <View style={styles.expresswayCenterLine} />

        {/* Active Journey Route Line */}
        <View style={styles.routePathLine} />

        {/* Green Area / Tech Park Landmark */}
        <View style={styles.landmarkPark}>
          <Text style={styles.landmarkText}>Knowledge Park</Text>
        </View>

        {/* Water body landmark */}
        <View style={styles.landmarkLake}>
          <Text style={styles.landmarkText}>Durgam Lake</Text>
        </View>

        {/* User Location Marker with Directional Heading Cone */}
        <View style={styles.userMarkerContainer}>
          <View style={styles.headingCone} />
          <View style={styles.userPulseRing} />
          <View style={styles.userCore}>
            <Ionicons name="navigate" size={14} color="#FFFFFF" style={styles.userHeadingIcon} />
          </View>
          <View style={styles.userLabelBubble}>
            <Text style={styles.userLabelText}>You (45° NE)</Text>
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
        {places.slice(0, 4).map((place, index) => {
          // Compute mock relative layout positions based on place direction
          let top = 40;
          let left = 60;

          if (place.direction === 'AHEAD') {
            top = index === 0 ? 55 : 30;
            left = index === 0 ? SCREEN_WIDTH * 0.45 : SCREEN_WIDTH * 0.65;
          } else if (place.direction === 'ON_ROUTE') {
            top = 110;
            left = SCREEN_WIDTH * 0.58;
          } else {
            // BEHIND
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

      {/* Floating Map Controls */}
      <View style={styles.mapControls}>
        {showRecenterButton && (
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onRecenter}
            activeOpacity={0.7}
            accessibilityLabel="Recenter location"
          >
            <Ionicons name="locate" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.7}>
          <Ionicons name="layers-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        {isNavigationMode && (
          <View style={styles.speedBadge}>
            <Text style={styles.speedNum}>38</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        )}
      </View>

      {/* Active Marker Quick Info Sheet (if tapped) */}
      {activeMarker && (
        <View style={styles.quickCard}>
          <View style={styles.quickCardLeft}>
            <Text style={styles.quickCardName} numberOfLines={1}>
              {activeMarker.name}
            </Text>
            <Text style={styles.quickCardMeta}>
              {activeMarker.direction} • {activeMarker.distance}m • {activeMarker.travelTime} min
            </Text>
          </View>

          <TouchableOpacity
            style={styles.quickCardAction}
            onPress={() => onSelectPlace && onSelectPlace(activeMarker)}
          >
            <Text style={styles.quickCardActionText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </TouchableOpacity>
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
    ...StyleSheet.absoluteFillObject,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quickCardActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
