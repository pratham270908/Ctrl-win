import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

const PRESET_AVATARS = [
  {
    id: 'preset-1',
    name: 'Cyber Neon',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    name: 'Urban Pilot',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    name: 'Aero Explorer',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    name: 'Vector Nomad',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenFavorites,
  onOpenReports,
  onOpenSettings,
  onOpenOfflineMaps,
  onLogout,
}) => {
  const { user, logout, updateUserProfile } = useAuth();
  const { favorites } = useFavorites();
  const { settings, updateSetting, reports, recentSearches } = useApp();

  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const safeRecentSearches = Array.isArray(recentSearches) ? recentSearches : [];
  const safeReports = Array.isArray(reports) ? reports : [];

  // Edit Profile Modal State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(user?.name || 'Explorer');
  const [tempAvatar, setTempAvatar] = useState<string>(user?.avatar || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showAvatarPresets, setShowAvatarPresets] = useState<boolean>(false);

  const currentDisplayName = user?.name || 'Explorer';
  const currentEmail = user?.email || 'explorer@specfinder.app';

  // Open Edit Profile Modal
  const handleStartEditing = () => {
    setTempName(user?.name || 'Explorer');
    setTempAvatar(user?.avatar || '');
    setShowAvatarPresets(false);
    setIsEditing(true);
  };

  // Discard changes and close modal
  const handleCancelEditing = () => {
    setTempName(user?.name || 'Explorer');
    setTempAvatar(user?.avatar || '');
    setShowAvatarPresets(false);
    setIsEditing(false);
  };

  // Validate and Save Changes
  const handleSaveProfile = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) {
      Alert.alert('Invalid Display Name', 'Display name cannot be empty.');
      return;
    }
    if (trimmed.length < 2) {
      Alert.alert('Invalid Display Name', 'Display name must be at least 2 characters long.');
      return;
    }
    if (trimmed.length > 40) {
      Alert.alert('Invalid Display Name', 'Display name cannot exceed 40 characters.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        name: trimmed,
        avatar: tempAvatar,
      });
      setIsEditing(false);
      setShowAvatarPresets(false);
      Alert.alert('Profile Updated', 'Your profile details have been successfully saved.');
    } catch {
      Alert.alert('Update Failed', 'Could not save profile changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Photo Selection: Device Gallery
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access in device settings to upload a custom profile avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setTempAvatar(pickedUri);
        if (!isEditing) {
          await updateUserProfile({ avatar: pickedUri });
          Alert.alert('Photo Updated', 'Your profile avatar has been updated.');
        }
      }
    } catch {
      Alert.alert('Gallery Error', 'Could not open photo library. You can also select a traveler avatar.');
    }
  };

  // Photo Selection: Curated Presets
  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setTempAvatar(presetUrl);
    setShowAvatarPresets(false);
    if (!isEditing) {
      await updateUserProfile({ avatar: presetUrl });
      Alert.alert('Avatar Updated', 'Your traveler avatar has been updated.');
    }
  };

  // Photo Selection: Reset to Default
  const handleResetAvatar = async () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
    setTempAvatar(defaultUrl);
    setShowAvatarPresets(false);
    if (!isEditing) {
      await updateUserProfile({ avatar: defaultUrl });
      Alert.alert('Avatar Reset', 'Your profile avatar has been restored to default.');
    }
  };

  // Action Sheet / Dialog for Photo Options
  const handleChangePhotoMenu = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose how you would like to update your traveler avatar:',
      [
        {
          text: 'Select from Photo Library',
          onPress: handlePickFromGallery,
        },
        {
          text: 'Choose Traveler Avatar',
          onPress: () => setShowAvatarPresets((prev) => !prev),
        },
        {
          text: 'Reset to Default',
          onPress: handleResetAvatar,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

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

  const handlePermissionsModal = () => {
    Alert.alert(
      'Privacy & App Permissions',
      'Active SpecFinder Device Permissions:\n\n' +
        '• GPS Location: High Accuracy (Active)\n' +
        '• Photo Library: Granted for Avatar\n' +
        '• Notifications: Enabled for Corridor Alerts\n' +
        '• Offline Storage: Encrypted Local Cache'
    );
  };

  const handleSupportModal = () => {
    Alert.alert(
      'SpecFinder Help & Support',
      'Need assistance with routes, directional recommendations, or account sync?\n\n' +
        'Email: support@specfinder.app\n' +
        'Version: 1.0.0 (Build 57)\n' +
        'Documentation: specfinder.app/docs'
    );
  };

  const handleSearchesModal = () => {
    Alert.alert(
      'Recent Searches History',
      safeRecentSearches.length > 0
        ? safeRecentSearches.map((s, i) => `${i + 1}. ${s}`).join('\n')
        : 'No recent searches logged.'
    );
  };

  const activeAvatarUri = user?.avatar || tempAvatar;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>ACCOUNT & PREFERENCES</Text>
          <Text style={styles.headerTitle}>Traveler Profile</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={onOpenSettings}
          accessibilityLabel="Settings"
          activeOpacity={0.75}
        >
          <Ionicons name="settings-outline" size={20} color={COLORS.accentCyan} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Interactive Profile Card */}
        <View style={styles.userCard}>
          {/* Avatar with Camera Badge */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarTouch}
              onPress={handleChangePhotoMenu}
              activeOpacity={0.85}
              accessibilityLabel="Tap to change profile picture"
            >
              {activeAvatarUri ? (
                <Image source={{ uri: activeAvatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={44} color={COLORS.accentCyan} />
                </View>
              )}

              {/* Camera Badge */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>

              {/* Online Indicator Dot */}
              <View style={styles.onlineBadge} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={handleChangePhotoMenu}
              activeOpacity={0.7}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* User Details */}
          <Text style={styles.userName}>{currentDisplayName}</Text>
          <Text style={styles.userEmail}>{currentEmail}</Text>

          {/* Member Badge */}
          <View style={styles.tagPill}>
            <Ionicons name="shield-checkmark" size={13} color={COLORS.ahead} />
            <Text style={styles.tagText}>
              {user?.isGuest ? 'Guest Traveler' : 'Verified Traveler Member'}
            </Text>
          </View>

          {/* Primary Edit Profile Action Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={handleStartEditing}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={onOpenFavorites}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="heart" size={18} color={COLORS.danger} />
            </View>
            <Text style={styles.statNumber}>{safeFavorites.length}</Text>
            <Text style={styles.statLabel}>Saved Places</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={handleSearchesModal}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="search" size={18} color={COLORS.accent} />
            </View>
            <Text style={styles.statNumber}>{safeRecentSearches.length}</Text>
            <Text style={styles.statLabel}>Searches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={onOpenReports}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.aheadLight }]}>
              <Ionicons name="flag" size={18} color={COLORS.ahead} />
            </View>
            <Text style={styles.statNumber}>{safeReports.length}</Text>
            <Text style={styles.statLabel}>Road Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Real Profile Preferences Controls */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.menuHeader}>Journey Preferences</Text>
          <Text style={styles.menuHeaderSub}>Real-time routing & defaults</Text>
        </View>

        <View style={styles.preferencesCard}>
          {/* Travel Mode Selector */}
          <View style={styles.prefBlock}>
            <View style={styles.prefLabelRow}>
              <Ionicons name="navigate-circle-outline" size={18} color={COLORS.accentCyan} />
              <Text style={styles.prefLabel}>Travel Mode</Text>
            </View>
            <View style={styles.pillGroup}>
              {[
                { id: 'DRIVE', label: 'Driving', icon: 'car-outline' },
                { id: 'WALK', label: 'Walking', icon: 'walk-outline' },
                { id: 'BICYCLE', label: 'Cycling', icon: 'bicycle-outline' },
                { id: 'TRANSIT', label: 'Transit', icon: 'subway-outline' },
              ].map((mode) => {
                const isSelected = (settings.travelMode || 'DRIVE') === mode.id;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.segmentPill, isSelected && styles.segmentPillActive]}
                    onPress={() => updateSetting('travelMode', mode.id as any)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={mode.icon as any}
                      size={14}
                      color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.segmentPillText, isSelected && styles.segmentPillTextActive]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.menuDivider} />

          {/* Distance Units Selector */}
          <View style={styles.prefBlock}>
            <View style={styles.prefLabelRow}>
              <Ionicons name="speedometer-outline" size={18} color={COLORS.accent} />
              <Text style={styles.prefLabel}>Distance Units</Text>
            </View>
            <View style={styles.pillGroup}>
              {[
                { id: 'km', label: 'Kilometers (km)' },
                { id: 'miles', label: 'Miles (mi)' },
              ].map((unit) => {
                const isSelected = (settings.distanceUnit || 'km') === unit.id;
                return (
                  <TouchableOpacity
                    key={unit.id}
                    style={[styles.segmentPill, isSelected && styles.segmentPillActive]}
                    onPress={() => updateSetting('distanceUnit', unit.id as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.segmentPillText, isSelected && styles.segmentPillTextActive]}>
                      {unit.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.menuDivider} />

          {/* Route Preference Selector */}
          <View style={styles.prefBlock}>
            <View style={styles.prefLabelRow}>
              <Ionicons name="git-network-outline" size={18} color={COLORS.ahead} />
              <Text style={styles.prefLabel}>Route Optimization</Text>
            </View>
            <View style={styles.pillGroup}>
              {[
                { id: 'FASTEST', label: 'Fastest Path', icon: 'flash-outline' },
                { id: 'SHORTEST', label: 'Shortest Dist', icon: 'navigate-outline' },
                { id: 'USEFUL_STOPS', label: 'Useful Stops', icon: 'sparkles-outline' },
              ].map((opt) => {
                const isSelected = (settings.routePreference || 'FASTEST') === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.segmentPill, isSelected && styles.segmentPillActive]}
                    onPress={() => updateSetting('routePreference', opt.id as any)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={13}
                      color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                    />
                    <Text style={[styles.segmentPillText, isSelected && styles.segmentPillTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.menuDivider} />

          {/* Navigation Voice Guidance Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={[styles.switchIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="volume-high" size={18} color={COLORS.accent} />
              </View>
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.switchTitle}>Voice Guidance</Text>
                <Text style={styles.switchSub}>Turn-by-turn spoken directional audio</Text>
              </View>
            </View>
            <Switch
              value={Boolean(settings.voiceGuidance)}
              onValueChange={(val) => updateSetting('voiceGuidance', val)}
              trackColor={{ false: '#334155', true: COLORS.ahead }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.menuDivider} />

          {/* Journey Alerts Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={[styles.switchIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="notifications" size={18} color={COLORS.warning} />
              </View>
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.switchTitle}>Corridor Alerts</Text>
                <Text style={styles.switchSub}>Traffic warnings and pit-stop reminders</Text>
              </View>
            </View>
            <Switch
              value={Boolean(settings.notifications)}
              onValueChange={(val) => updateSetting('notifications', val)}
              trackColor={{ false: '#334155', true: COLORS.ahead }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.menuDivider} />

          {/* Accessibility Route Switch */}
          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <View style={[styles.switchIconBox, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                <Ionicons name="accessibility" size={18} color={COLORS.ahead} />
              </View>
              <View style={{ marginLeft: SPACING.md, flex: 1 }}>
                <Text style={styles.switchTitle}>Wheelchair Accessibility</Text>
                <Text style={styles.switchSub}>Avoid steep grades, stairs, and narrow curbs</Text>
              </View>
            </View>
            <Switch
              value={Boolean(settings.wheelchairAccessible)}
              onValueChange={(val) => updateSetting('wheelchairAccessible', val)}
              trackColor={{ false: '#334155', true: COLORS.ahead }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Journey Hub Navigation Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.menuHeader}>Journey Hub</Text>
          <Text style={styles.menuHeaderSub}>Saved data & regional assets</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenFavorites}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.dangerLight }]}>
              <Ionicons name="heart" size={20} color={COLORS.danger} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Saved Favorite Places</Text>
              <Text style={styles.menuSub}>{safeFavorites.length} bookmarked locations along corridors</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenReports}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.aheadLight }]}>
              <Ionicons name="document-text" size={20} color={COLORS.ahead} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>My Activity & Road Reports</Text>
              <Text style={styles.menuSub}>{safeReports.length} road updates submitted</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenOfflineMaps}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Ionicons name="cloud-offline" size={20} color={COLORS.accentCyan} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Offline Map Packages</Text>
              <Text style={styles.menuSub}>Downloaded city corridors for zero-signal trips</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={onOpenSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="options" size={20} color="#A855F7" />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>System Preferences & Cache</Text>
              <Text style={styles.menuSub}>Data saver, map layer presets, clearing history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account & Security Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.menuHeader}>Account & Security</Text>
          <Text style={styles.menuHeaderSub}>Security & account controls</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleStartEditing}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(79, 142, 247, 0.15)' }]}>
              <Ionicons name="person-circle-outline" size={20} color={COLORS.accent} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuSub}>Edit display name and profile picture</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handlePermissionsModal}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.ahead} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Privacy & Permissions</Text>
              <Text style={styles.menuSub}>Location, storage, and telemetry access</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleSupportModal}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>Help & Support</Text>
              <Text style={styles.menuSub}>FAQ, guides, and email support</Text>
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
          SpecFinder Smart Directional Navigation • v1.0.0 (Build 57)
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelEditing}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalCard} edges={['bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={handleCancelEditing}
                disabled={isSaving}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Preview & Picker */}
              <View style={styles.modalAvatarSection}>
                <TouchableOpacity
                  style={styles.modalAvatarWrap}
                  onPress={handleChangePhotoMenu}
                  activeOpacity={0.85}
                >
                  {tempAvatar ? (
                    <Image source={{ uri: tempAvatar }} style={styles.modalAvatar} />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <Ionicons name="person" size={50} color={COLORS.accentCyan} />
                    </View>
                  )}
                  <View style={styles.modalCameraBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalChangePhotoBtn}
                  onPress={handleChangePhotoMenu}
                  activeOpacity={0.75}
                >
                  <Ionicons name="image-outline" size={16} color={COLORS.accentCyan} />
                  <Text style={styles.modalChangePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Preset Avatars Palette (Collapsible) */}
              {showAvatarPresets && (
                <View style={styles.presetPalette}>
                  <Text style={styles.presetPaletteTitle}>Select Traveler Avatar:</Text>
                  <View style={styles.presetRow}>
                    {PRESET_AVATARS.map((preset) => (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.presetItem,
                          tempAvatar === preset.url && styles.presetItemActive,
                        ]}
                        onPress={() => handleSelectPresetAvatar(preset.url)}
                      >
                        <Image source={{ uri: preset.url }} style={styles.presetThumb} />
                        <Text style={styles.presetName} numberOfLines={1}>
                          {preset.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Display Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>DISPLAY NAME</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="person-outline" size={18} color={COLORS.accentCyan} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="Enter your name"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    maxLength={40}
                  />
                  {tempName.length > 0 && (
                    <TouchableOpacity onPress={() => setTempName('')} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.formHint}>
                  This name is displayed on your profile card, HUD vector, and home greeting.
                </Text>
              </View>

              {/* Email (Read Only) */}
              <View style={styles.formGroup}>
                <View style={styles.emailLabelRow}>
                  <Text style={styles.formLabel}>ACCOUNT IDENTIFIER</Text>
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={11} color={COLORS.textMuted} />
                    <Text style={styles.lockBadgeText}>Read-Only</Text>
                  </View>
                </View>
                <View style={[styles.inputWrap, styles.inputWrapDisabled]}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, styles.textInputDisabled]}
                    value={currentEmail}
                    editable={false}
                  />
                </View>
                <Text style={styles.formHint}>
                  Your email is the permanent authentication key for SpecFinder.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={handleCancelEditing}
                  disabled={isSaving}
                  activeOpacity={0.75}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                      <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1E',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#0D1628',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 132, 255, 0.15)',
  },
  headerInfo: {
    flex: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentCyan,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.2)',
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // Profile Card
  userCard: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.25)',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarTouch: {
    position: 'relative',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: COLORS.accentCyan,
  },
  avatarPlaceholder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.accentCyan,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  onlineBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.ahead,
    borderWidth: 2,
    borderColor: '#111827',
  },
  changePhotoBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: SPACING.lg,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ahead,
    letterSpacing: 0.3,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 6,
    ...SHADOWS.sm,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.15)',
    ...SHADOWS.sm,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },

  // Section Headers
  sectionHeaderRow: {
    marginBottom: SPACING.sm,
  },
  menuHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  menuHeaderSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },

  // Preferences Card
  preferencesCard: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.15)',
    marginBottom: SPACING.xl,
  },
  prefBlock: {
    paddingVertical: 4,
  },
  prefLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  prefLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.12)',
  },
  segmentPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  segmentPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Menu Card
  menuCard: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.15)',
    marginBottom: SPACING.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  menuIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(99, 132, 255, 0.1)',
    marginHorizontal: SPACING.md,
    marginVertical: 4,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: SPACING.md,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },
  versionNote: {
    textAlign: 'center',
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0D1628',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.3)',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 132, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: SPACING.xl,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalAvatarWrap: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.accentCyan,
  },
  modalAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.accentCyan,
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0D1628',
  },
  modalChangePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  modalChangePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  presetPalette: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.2)',
  },
  presetPaletteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetItem: {
    alignItems: 'center',
    width: '23%',
    padding: 4,
    borderRadius: RADIUS.md,
  },
  presetItemActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
  },
  presetThumb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  emailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.25)',
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  inputWrapDisabled: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderColor: 'rgba(99, 132, 255, 0.1)',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  textInputDisabled: {
    color: COLORS.textMuted,
  },
  formHint: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 132, 255, 0.2)',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...SHADOWS.sm,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
