import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InteractiveMap } from '../components/InteractiveMap';
import { PlaceCard } from '../components/PlaceCard';
import { placesService } from '../services/placesService';
import { Place, PlaceCategory } from '../types';
import { CATEGORIES } from '../data/mockCategories';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

interface MapScreenProps {
  onPlacePress: (place: Place) => void;
  onNavigatePress: (place: Place) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  onPlacePress,
  onNavigatePress,
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | 'ALL'>('ALL');

  useEffect(() => {
    loadMapPlaces();
  }, [activeCategory]);

  const loadMapPlaces = async () => {
    if (activeCategory === 'ALL') {
      const rec = await placesService.getRecommendedPlaces();
      setPlaces(rec);
      if (rec.length > 0) setSelectedPlace(rec[0]);
    } else {
      const filtered = await placesService.getPlacesByCategory(activeCategory);
      setPlaces(filtered);
      if (filtered.length > 0) setSelectedPlace(filtered[0]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Floating Category Filter Bar */}
      <View style={styles.topFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeCategory === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveCategory('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeCategory === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All Ahead
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text
                  style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Full Canvas Interactive Map */}
      <View style={styles.mapArea}>
        <InteractiveMap
          height={400}
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => setSelectedPlace(p)}
          destinationName={APP_CONFIG.defaultDestination.name}
        />
      </View>

      {/* Bottom Tray: Selected Place Preview */}
      <View style={styles.bottomTray}>
        <View style={styles.trayHandle} />

        <View style={styles.trayHeader}>
          <Text style={styles.trayTitle}>
            {selectedPlace ? 'Selected Directional Stop' : 'Interactive Road Map'}
          </Text>
          <Text style={styles.traySub}>
            Tap any marker on the map to inspect forward travel metrics
          </Text>
        </View>

        {selectedPlace ? (
          <PlaceCard
            place={selectedPlace}
            onPress={onPlacePress}
            onNavigatePress={onNavigatePress}
            compact={false}
          />
        ) : (
          <View style={styles.emptyTrayBox}>
            <Text style={styles.emptyTrayText}>Select a pin above to view place card</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topFilterBar: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    zIndex: 10,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mapArea: {
    flex: 1,
  },
  bottomTray: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  trayHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  trayHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  trayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  traySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  emptyTrayBox: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyTrayText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
