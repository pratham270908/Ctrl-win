import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { useFavorites } from '../store/FavoritesContext';
import { useApp } from '../store/AppContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface ProfileScreenProps {
  onOpenFavorites: () => void;
  onOpenReports: () => void;
  onOpenSettings: () => void;
  onOpenOfflineMaps: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenFavorites,
  onOpenReports,
  onOpenSettings,
  onOpenOfflineMaps,
  onLogout,
}) => {
  const { user, logout } = useAuth();
  const { favorites } = useFavorites();
  const { reports, recentSearches } = useApp();

  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const safeRecentSearches = Array.isArray(recentSearches) ? recentSearches : [];
  const safeReports = Array.isArray(reports) ? reports : [];

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onLogout();
        },
      },
    ]);
  };

  const handleSearchesModal = () => {
    Alert.alert(
      'Recent Searches History',
      safeRecentSearches.length > 0
        ? safeRecentSearches.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : 'No recent searches logged.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>ACCOUNT & PREFERENCES</Text>
          <Text style={styles.headerTitle}>Traveler Profile</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={onOpenSettings}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={32} color={COLORS.accent} />
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>

          <Text style={styles.userName}>{user?.name || 'Explorer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'explorer@smartdirectional.app'}</Text>

          <View style={styles.tagPill}>
            <Ionicons name="compass" size={12} color={COLORS.accent} />
            <Text style={styles.tagText}>
              {user?.isGuest ? 'Guest Traveler' : 'Verified Traveler Member'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={onOpenFavorites}
            activeOpacity={0.8}
          >
            <Ionicons name="heart" size={20} color={COLORS.danger} />
            <Text style={styles.statNumber}>{safeFavorites.length}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={handleSearchesModal}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color={COLORS.accent} />
            <Text style={styles.statNumber}>{safeRecentSearches.length}</Text>
            <Text style={styles.statLabel}>Searches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={onOpenReports}
            activeOpacity={0.8}
          >
            <Ionicons name="flag" size={20} color={COLORS.ahead} />
            <Text style={styles.statNumber}>{safeReports.length}</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Action Rows */}
        <Text style={styles.menuHeader}>Journey Hub</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenFavorites}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="heart" size={18} color={COLORS.danger} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Saved Favorite Places</Text>
              <Text style={styles.menuSub}>{favorites.length} bookmarked locations</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenReports}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="document-text" size={18} color={COLORS.ahead} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>My Activity & Road Reports</Text>
              <Text style={styles.menuSub}>{reports.length} road updates submitted</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenOfflineMaps}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="cloud-offline" size={18} color={COLORS.info} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Offline Map Packages</Text>
              <Text style={styles.menuSub}>Downloaded areas for zero-signal navigation</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="options" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Preferences & Settings</Text>
              <Text style={styles.menuSub}>Units, voice guidance, accessibility</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Row */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutBtnText}>Sign Out of Profile</Text>
        </TouchableOpacity>

        <Text style={styles.versionNote}>
          Smart Directional Location Finder â€¢ v1.0.0
        </Text>

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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.ahead,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    gap: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceHigh,
    marginLeft: 66,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.dangerLight,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  versionNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
});

