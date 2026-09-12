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
  const finalGreeting = greeting || `Hello, ${displayName}`;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.greeting} numberOfLines={1}>{finalGreeting}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={13} color={COLORS.accentCyan} />
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.75}
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications" size={21} color="#E2E8F0" />
          <View style={styles.badgeDot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onProfilePress}
          activeOpacity={0.75}
          accessibilityLabel="Profile"
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={COLORS.accentCyan} />
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
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  left: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(26, 37, 64, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.22)',
    ...SHADOWS.sm,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accentCyan,
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
