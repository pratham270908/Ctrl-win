import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '../components/SearchBar';
import { CATEGORIES } from '../data/mockCategories';
import { MOCK_PLACES } from '../data/mockPlaces';
import { useApp } from '../store/AppContext';
import { PlaceCategory, Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface SearchScreenProps {
  onBack: () => void;
  onSelectQuery: (query: string) => void;
  onSelectCategory: (category: PlaceCategory) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onBack,
  onSelectQuery,
  onSelectCategory,
}) => {
  const { recentSearches, addRecentSearch, clearRecentSearches } = useApp();
  const [searchText, setSearchText] = useState<string>('');
  const [radiusFilter, setRadiusFilter] = useState<number>(0); // 0 = Any
  const [vectorFilter, setVectorFilter] = useState<'ALL' | 'AHEAD' | 'ON_ROUTE'>('ALL');

  const handleSearchSubmit = async () => {
    const trimmed = searchText.trim();
    if (!trimmed) return;
    await addRecentSearch(trimmed);
    onSelectQuery(trimmed);
  };

  const handleRecentTap = (query: string) => {
    setSearchText(query);
    onSelectQuery(query);
  };

  // Live filter places based on query, radius, and vector
  const liveResults = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return MOCK_PLACES.filter((place) => {
      const matchesQuery =
        !q ||
        place.name.toLowerCase().includes(q) ||
        place.category.toLowerCase().includes(q) ||
        place.address.toLowerCase().includes(q) ||
        place.description.toLowerCase().includes(q) ||
        place.services.some((s) => s.toLowerCase().includes(q));

      const matchesRadius =
        radiusFilter === 0 || place.distance <= radiusFilter * 1000;

      const matchesVector =
        vectorFilter === 'ALL' || place.direction === vectorFilter;

      return matchesQuery && matchesRadius && matchesVector;
    });
  }, [searchText, radiusFilter, vectorFilter]);

  // Dynamic suggestions based on typed input
  const suggestions = [
    'Coffee Roasters Ahead',
    'Shell Petrol & EV Hub',
    'HDFC 24/7 ATM',
    'Medicover Emergency Hospital',
    'Apollo Pharmacy 24 Hours',
    'Paradise Biryani Takeaway',
  ].filter((s) => s.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Search Input Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            onClear={() => setSearchText('')}
            placeholder="Search coffee, fuel, ATM ahead..."
            editable={true}
            autoFocus={true}
          />
        </View>
      </View>

      {/* Interactive Filter Chips Bar: Distance Radius & Direction Vector */}
      <View style={styles.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {/* Radius Chips */}
          <TouchableOpacity
            style={[styles.filterChip, radiusFilter === 0 && styles.filterChipActive]}
            onPress={() => setRadiusFilter(0)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, radiusFilter === 0 && styles.filterChipTextActive]}>
              Any Distance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, radiusFilter === 1 && styles.filterChipActive]}
            onPress={() => setRadiusFilter(radiusFilter === 1 ? 0 : 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, radiusFilter === 1 && styles.filterChipTextActive]}>
              &lt; 1 km
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, radiusFilter === 3 && styles.filterChipActive]}
            onPress={() => setRadiusFilter(radiusFilter === 3 ? 0 : 3)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, radiusFilter === 3 && styles.filterChipTextActive]}>
              &lt; 3 km
            </Text>
          </TouchableOpacity>

          {/* Direction Filter Chips */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              vectorFilter === 'AHEAD' && styles.filterChipActiveAhead,
            ]}
            onPress={() => setVectorFilter(vectorFilter === 'AHEAD' ? 'ALL' : 'AHEAD')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-up"
              size={12}
              color={vectorFilter === 'AHEAD' ? '#FFFFFF' : COLORS.ahead}
            />
            <Text
              style={[
                styles.filterChipText,
                vectorFilter === 'AHEAD' && styles.filterChipTextActive,
              ]}
            >
              Ahead Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              vectorFilter === 'ON_ROUTE' && styles.filterChipActiveRoute,
            ]}
            onPress={() => setVectorFilter(vectorFilter === 'ON_ROUTE' ? 'ALL' : 'ON_ROUTE')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="git-commit-outline"
              size={12}
              color={vectorFilter === 'ON_ROUTE' ? '#FFFFFF' : COLORS.onRoute}
            />
            <Text
              style={[
                styles.filterChipText,
                vectorFilter === 'ON_ROUTE' && styles.filterChipTextActive,
              ]}
            >
              On Route
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Real-Time Live Results List (when typing or filter active) */}
        {(searchText.length > 0 || radiusFilter > 0 || vectorFilter !== 'ALL') && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Live Places Found</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>
                  {liveResults.length} {liveResults.length === 1 ? 'place' : 'places'}
                </Text>
              </View>
            </View>

            {liveResults.length === 0 ? (
              <View style={styles.emptyLiveBox}>
                <Ionicons name="search" size={24} color={COLORS.textMuted} />
                <Text style={styles.emptyLiveText}>
                  No places match your search &amp; filter criteria along this corridor.
                </Text>
              </View>
            ) : (
              liveResults.slice(0, 6).map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.livePlaceCard}
                  onPress={() => {
                    addRecentSearch(place.name);
                    onSelectQuery(place.name);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.livePlaceEmojiCircle}>
                    <Text style={{ fontSize: 18 }}>
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

                  <View style={styles.livePlaceInfo}>
                    <Text style={styles.livePlaceName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <View style={styles.livePlaceMetaRow}>
                      <View
                        style={[
                          styles.vectorBadge,
                          place.direction === 'AHEAD'
                            ? styles.vectorBadgeAhead
                            : styles.vectorBadgeOnRoute,
                        ]}
                      >
                        <Text style={styles.vectorBadgeText}>{place.direction}</Text>
                      </View>
                      <Text style={styles.livePlaceMetaText}>
                        {place.distance}m • {place.travelTime} min • ★ {place.rating}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Dynamic Live Suggestions when typing */}
        {searchText.length > 0 && suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggestions Ahead</Text>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => {
                  addRecentSearch(suggestion);
                  onSelectQuery(suggestion);
                }}
              >
                <Ionicons name="search-outline" size={16} color={COLORS.accent} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Searches */}
        {(Array.isArray(recentSearches) ? recentSearches : []).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentChipsWrap}>
              {(Array.isArray(recentSearches) ? recentSearches : []).map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentChip}
                  onPress={() => handleRecentTap(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.recentChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <Text style={styles.sectionSubtitle}>Quick filter places along your path</Text>

          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.gridCategoryCard}
                onPress={() => {
                  addRecentSearch(cat.name);
                  onSelectCategory(cat.id);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.gridCategoryIcon, { backgroundColor: cat.bgColor }]}>
                  <Text style={styles.gridCategoryEmoji}>{cat.emoji}</Text>
                </View>
                <View style={styles.gridCategoryInfo}>
                  <Text style={styles.gridCategoryName}>{cat.name}</Text>
                  <Text style={styles.gridCategoryDesc} numberOfLines={1}>
                    {cat.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
    paddingBottom: SPACING.xs,
  },
  backButton: {
    padding: SPACING.sm,
  },
  searchBarWrapper: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  clearText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  recentChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
    ...SHADOWS.sm,
  },
  recentChipText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    gap: SPACING.md,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  categoriesGrid: {
    gap: SPACING.sm,
  },
  gridCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  gridCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  gridCategoryEmoji: {
    fontSize: 22,
  },
  gridCategoryInfo: {
    flex: 1,
  },
  gridCategoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  gridCategoryDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filtersBar: {
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingVertical: SPACING.xs,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterChipActiveAhead: {
    backgroundColor: COLORS.ahead,
    borderColor: COLORS.ahead,
  },
  filterChipActiveRoute: {
    backgroundColor: COLORS.onRoute,
    borderColor: COLORS.onRoute,
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
  resultsBadge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  resultsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  emptyLiveBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  emptyLiveText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  livePlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  livePlaceEmojiCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  livePlaceInfo: {
    flex: 1,
  },
  livePlaceName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  livePlaceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  vectorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  vectorBadgeAhead: {
    backgroundColor: COLORS.aheadLight,
  },
  vectorBadgeOnRoute: {
    backgroundColor: '#FEF3C7',
  },
  vectorBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  livePlaceMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
});
