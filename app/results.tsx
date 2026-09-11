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
import { PlaceCard } from '../components/PlaceCard';
import { InteractiveMap } from '../components/InteractiveMap';
import { SortSheet } from '../components/SortSheet';
import { placesService, GroupedPlacesResult } from '../services/placesService';
import { Place, SortCriteria } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface ResultsScreenProps {
  query: string;
  onBack: () => void;
  onPlacePress: (place: Place) => void;
  onNavigatePress: (place: Place) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  query,
  onBack,
  onPlacePress,
  onNavigatePress,
}) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('BEST_OVERALL');
  const [sortSheetVisible, setSortSheetVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupedData, setGroupedData] = useState<GroupedPlacesResult>({
    ahead: [],
    onRoute: [],
    behind: [],
    totalCount: 0,
  });

  useEffect(() => {
    fetchResults();
  }, [query, sortCriteria]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const results = await placesService.getGroupedResults(query, sortCriteria);
      setGroupedData(results);
    } finally {
      setIsLoading(false);
    }
  };

  const getSortLabel = () => {
    switch (sortCriteria) {
      case 'NEAREST':
        return 'Nearest';
      case 'HIGHEST_RATED':
        return 'Top Rated';
      case 'SHORTEST_TIME':
        return 'Shortest Time';
      case 'BEST_OVERALL':
      default:
        return 'Best Overall';
    }
  };

  const aheadList = Array.isArray(groupedData.ahead) ? groupedData.ahead.filter((p) => p && p.id) : [];
  const onRouteList = Array.isArray(groupedData.onRoute) ? groupedData.onRoute.filter((p) => p && p.id) : [];
  const behindList = Array.isArray(groupedData.behind) ? groupedData.behind.filter((p) => p && p.id) : [];
  const allPlaces = [...aheadList, ...onRouteList, ...behindList];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header Row */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerSubtitle}>SEARCH RESULTS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            "{query}"
          </Text>
        </View>

        {/* Map / List View Toggle */}
        <View style={styles.viewToggleWrap}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'LIST' && styles.toggleBtnActive]}
            onPress={() => setViewMode('LIST')}
          >
            <Ionicons
              name="list"
              size={16}
              color={viewMode === 'LIST' ? '#FFFFFF' : COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'MAP' && styles.toggleBtnActive]}
            onPress={() => setViewMode('MAP')}
          >
            <Ionicons
              name="map"
              size={16}
              color={viewMode === 'MAP' ? '#FFFFFF' : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter & Sort Bar */}
      <View style={styles.filterBar}>
        <View style={styles.summaryBadge}>
          <Ionicons name="compass" size={14} color={COLORS.accent} />
          <Text style={styles.summaryText}>
            {aheadList.length} Ahead • {onRouteList.length} On Route
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortSheetVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={16} color={COLORS.accent} />
          <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Ranking places along your journey vector...</Text>
        </View>
      ) : viewMode === 'MAP' ? (
        /* Map View with Bottom Slider */
        <View style={styles.mapViewContainer}>
          <InteractiveMap
            height={380}
            places={allPlaces}
            selectedPlace={allPlaces[0] || null}
            onSelectPlace={onPlacePress}
          />
          <View style={styles.mapListOverlay}>
            <Text style={styles.mapOverlayTitle}>Tappable Places on Vector</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allPlaces.map((p) => (
                <View key={p.id} style={{ width: 280, marginRight: 8 }}>
                  <PlaceCard
                    place={p}
                    onPress={onPlacePress}
                    onNavigatePress={onNavigatePress}
                    compact={true}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* List View with Categorical Sections */
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: AHEAD OF YOU */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionPillAhead}>
              <Ionicons name="arrow-up-circle" size={16} color={COLORS.ahead} />
              <Text style={styles.sectionTitleAhead}>AHEAD OF YOU</Text>
            </View>
            <Text style={styles.sectionBadgeCount}>{aheadList.length} places</Text>
          </View>
          <Text style={styles.sectionExplainer}>
            Directly in your line of travel. Zero turnaround time required.
          </Text>

          {aheadList.length > 0 ? (
            aheadList.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={onPlacePress}
                onNavigatePress={onNavigatePress}
              />
            ))
          ) : (
            <View style={styles.emptySectionBox}>
              <Text style={styles.emptySectionText}>No places directly ahead for this search.</Text>
            </View>
          )}

          {/* SECTION 2: ON YOUR ROUTE */}
          <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
            <View style={styles.sectionPillRoute}>
              <Ionicons name="navigate-circle" size={16} color={COLORS.onRoute} />
              <Text style={styles.sectionTitleRoute}>ON YOUR ROUTE</Text>
            </View>
            <Text style={styles.sectionBadgeCount}>{onRouteList.length} places</Text>
          </View>
          <Text style={styles.sectionExplainer}>
            Along the route corridor with minimal stopover deviation (+1 to 2 min).
          </Text>

          {onRouteList.length > 0 ? (
            onRouteList.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={onPlacePress}
                onNavigatePress={onNavigatePress}
              />
            ))
          ) : (
            <View style={styles.emptySectionBox}>
              <Text style={styles.emptySectionText}>No places on route corridor.</Text>
            </View>
          )}

          {/* SECTION 3: BEHIND YOU */}
          <View style={[styles.sectionHeader, { marginTop: SPACING.xl }]}>
            <View style={styles.sectionPillBehind}>
              <Ionicons name="alert-circle" size={16} color={COLORS.behind} />
              <Text style={styles.sectionTitleBehind}>BEHIND YOU (Requires going back)</Text>
            </View>
            <Text style={styles.sectionBadgeCount}>{behindList.length} places</Text>
          </View>
          <Text style={styles.sectionExplainer}>
            Located behind your current heading. Requires making a U-turn or back-tracking.
          </Text>

          {behindList.length > 0 ? (
            behindList.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={onPlacePress}
                onNavigatePress={onNavigatePress}
              />
            ))
          ) : (
            <View style={styles.emptySectionBox}>
              <Text style={styles.emptySectionText}>No places behind.</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Interactive Sorting Modal Sheet */}
      <SortSheet
        visible={sortSheetVisible}
        activeCriteria={sortCriteria}
        onSelect={(newCriteria) => setSortCriteria(newCriteria)}
        onClose={() => setSortSheetVisible(false)}
      />
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerSubtitle: {
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
  viewToggleWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.accent,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHigh,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: 2,
  },
  sectionPillAhead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleAhead: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ahead,
    letterSpacing: 0.5,
  },
  sectionPillRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleRoute: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.onRoute,
    letterSpacing: 0.5,
  },
  sectionPillBehind: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleBehind: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.behind,
    letterSpacing: 0.5,
  },
  sectionBadgeCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sectionExplainer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySectionBox: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginVertical: 4,
  },
  emptySectionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  mapViewContainer: {
    flex: 1,
  },
  mapListOverlay: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    marginTop: -20,
    ...SHADOWS.lg,
  },
  mapOverlayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
});

