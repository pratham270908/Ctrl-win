import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const handleRecenter = () => {
    if (places.length > 0) {
      setSelectedPlace(places[0]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Floating Category Filter Bar */}
      <View style={styles.topFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { id: 'ALL' as const, name: 'All Ahead', icon: 'compass', iconColor: COLORS.ahead },
            { id: 'Coffee' as const, name: 'Coffee', icon: 'cafe', iconColor: '#8B5CF6' },
            { id: 'Petrol' as const, name: 'Petrol', icon: 'car', iconColor: '#F59E0B' },
            { id: 'ATM' as const, name: 'ATM', icon: 'card', iconColor: '#3B82F6' },
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isActive ? '#FFFFFF' : cat.iconColor}
                />
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
          onRecenter={handleRecenter}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    zIndex: 10,
    ...SHADOWS.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryDark,
    borderColor: COLORS.primaryDark,
    ...SHADOWS.sm,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
