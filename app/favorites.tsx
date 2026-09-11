import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlaceCard } from '../components/PlaceCard';
import { useFavorites } from '../store/FavoritesContext';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface FavoritesScreenProps {
  onBack?: () => void;
  onPlacePress: (place: Place) => void;
  onNavigatePress: (place: Place) => void;
  onExplorePress: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onPlacePress,
  onNavigatePress,
  onExplorePress,
  onBack,
}) => {
  const { favorites, clearFavorites } = useFavorites();
  const safeFavorites = Array.isArray(favorites) ? favorites.filter((p) => p && p.id) : [];

  const handleClearAll = () => {
    if (safeFavorites.length === 0) return;
    Alert.alert(
      'Clear All Saved Places?',
      'Are you sure you want to remove all saved places from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearFavorites },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>LOCAL BOOKMARKS</Text>
          <Text style={styles.headerTitle}>Saved Useful Places</Text>
        </View>

        {safeFavorites.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {safeFavorites.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-dislike-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No saved places yet.</Text>
            <Text style={styles.emptySub}>
              Tap the heart icon on any place card to bookmark the most useful spots along your regular routes.
            </Text>

            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={onExplorePress}
              activeOpacity={0.85}
            >
              <Ionicons name="compass" size={18} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Explore Places Ahead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* List of Persisted Favorites */
          <View>
            <View style={styles.countBanner}>
              <Ionicons name="bookmark" size={14} color={COLORS.accent} />
              <Text style={styles.countText}>
                {safeFavorites.length} saved place{safeFavorites.length === 1 ? '' : 's'} ready for offline directional guidance
              </Text>
            </View>

            {safeFavorites.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onPress={onPlacePress}
                onNavigatePress={onNavigatePress}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerInfo: {
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
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
  },
  scrollContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  countBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.xl,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.xl,
    height: 48,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
