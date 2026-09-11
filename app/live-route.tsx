import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InteractiveMap } from '../components/InteractiveMap';
import { PlaceCard } from '../components/PlaceCard';
import { placesService } from '../services/placesService';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

interface LiveRouteScreenProps {
  onBack: () => void;
  onPlacePress: (place: Place) => void;
  onStartNavigation: () => void;
}

export const LiveRouteScreen: React.FC<LiveRouteScreenProps> = ({
  onBack,
  onPlacePress,
  onStartNavigation,
}) => {
  const [placesAhead, setPlacesAhead] = useState<Place[]>([]);

  useEffect(() => {
    placesService.getPlacesAlongRoute().then(setPlacesAhead);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSub}>ROUTE AWARENESS</Text>
          <Text style={styles.headerTitle}>Places Along Journey</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Route Aware Map Area */}
        <View style={styles.mapWrap}>
          <InteractiveMap
            height={260}
            places={placesAhead}
            selectedPlace={placesAhead[0] || null}
            onSelectPlace={onPlacePress}
            destinationName={APP_CONFIG.defaultDestination.name}
          />
        </View>

        {/* Live Journey Progress Banner */}
        <View style={styles.progressBanner}>
          <View style={styles.progressCol}>
            <Text style={styles.progressLabel}>REMAINING</Text>
            <Text style={styles.progressVal}>8 min • 2.1 km</Text>
          </View>

          <View style={styles.progressCol}>
            <Text style={styles.progressLabel}>DIRECTION</Text>
            <Text style={[styles.progressVal, { color: COLORS.ahead }]}>45° North-East</Text>
          </View>

          <View style={styles.progressCol}>
            <Text style={styles.progressLabel}>EST. ARRIVAL</Text>
            <Text style={styles.progressVal}>1:15 PM</Text>
          </View>
        </View>

        {/* Narrative & List of upcoming points */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Useful Pit-Stops En Route</Text>
          <Text style={styles.sectionSubtitle}>
            These places are situated directly on your corridor before the final destination
          </Text>
        </View>

        {placesAhead.map((p) => (
          <PlaceCard key={p.id} place={p} onPress={onPlacePress} />
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky Action: Resume Live Navigation */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.navActionBtn}
          onPress={onStartNavigation}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.navActionText}>Start Turn-by-Turn Guidance</Text>
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
  headerTitleWrap: {
    flex: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
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
  progressBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  progressCol: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  progressVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
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
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  navActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    height: 50,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  navActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
