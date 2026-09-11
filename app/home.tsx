import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
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
}) => {
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([]);
  const [headingText, setHeadingText] = useState<string>('Travelling North-East');
  const [speedKmh, setSpeedKmh] = useState<number>(38);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const places = await placesService.getRecommendedPlaces();
    setRecommendedPlaces(places);
    const loc = await locationService.getCurrentLocation();
    setHeadingText(`Travelling ${loc.headingText}`);
    setSpeedKmh(loc.speedKmh);
  };

  const handleSimulateHeading = () => {
    Alert.alert(
      'Simulated Direction Vector',
      'Currently locked to 45° North-East along the Cyber Towers corridor toward Gachibowli.\n\nAll nearby places are dynamically ranked by forward trajectory.'
    );
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Journey Notifications',
      '• Ahead: Mindspace flyover traffic is moving smoothly (4 min saved).\n• Recommended: Shell EV station has 2 open fast chargers 1.1km ahead.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

        {/* Direction Indicator Visual */}
        <DirectionIndicator
          headingText={headingText}
          speedKmh={speedKmh}
          onSimulateChange={handleSimulateHeading}
        />

        {/* Map Preview Section */}
        <View style={styles.mapSectionCard}>
          <View style={styles.mapHeaderRow}>
            <View style={styles.mapHeaderLeft}>
              <View style={styles.radarPill}>
                <View style={styles.radarDot} />
                <Text style={styles.radarText}>LIVE TRAJECTORY PREVIEW</Text>
              </View>
              <Text style={styles.mapTitle}>Places on Current Path</Text>
            </View>

            <TouchableOpacity
              style={styles.expandMapButton}
              onPress={() => onPlacePress(recommendedPlaces[0] || ({} as Place))}
            >
              <Ionicons name="expand" size={16} color={COLORS.accent} />
              <Text style={styles.expandMapText}>Full Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            <InteractiveMap
              height={200}
              places={recommendedPlaces}
              selectedPlace={recommendedPlaces[0] || null}
              onSelectPlace={onPlacePress}
              destinationName={APP_CONFIG.defaultDestination.name}
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
              <Ionicons name="body" size={18} color="#FFFFFF" />
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

        {/* Recommended Places Section */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended For Your Journey</Text>
            <Text style={styles.sectionSubtitle}>
              Ranked by forward trajectory & minimal deviation
            </Text>
          </View>
        </View>

        {recommendedPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onPress={onPlacePress}
            onNavigatePress={onNavigatePress}
          />
        ))}

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
});
