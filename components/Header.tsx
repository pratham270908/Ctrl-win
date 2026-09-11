import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

interface HeaderProps {
  greeting?: string;
  subtitle?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  greeting,
  subtitle = 'Cyber Towers Corridor • Hyderabad',
  onProfilePress,
  onNotificationPress,
}) => {
  const { user } = useAuth();
  const displayName = user?.name || 'Explorer';
  const finalGreeting = greeting || `Hello, ${displayName} 👋`;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.greeting}>{finalGreeting}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.accent} />
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onProfilePress}
          activeOpacity={0.7}
          accessibilityLabel="Profile"
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={17} color={COLORS.accent} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: COLORS.background,
  },
  left: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    ...SHADOWS.sm,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
