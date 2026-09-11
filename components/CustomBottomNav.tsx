import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useFavorites } from '../store/FavoritesContext';

export type TabScreen = 'home' | 'map' | 'favorites' | 'activity' | 'profile';

interface CustomBottomNavProps {
  currentTab: TabScreen;
  onSelectTab: (tab: TabScreen) => void;
}

interface TabItem {
  id: TabScreen;
  label: string;
  activeIcon: string;
  inactiveIcon: string;
}

const TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    id: 'map',
    label: 'Map',
    activeIcon: 'map',
    inactiveIcon: 'map-outline',
  },
  {
    id: 'favorites',
    label: 'Favorites',
    activeIcon: 'heart',
    inactiveIcon: 'heart-outline',
  },
  {
    id: 'activity',
    label: 'Activity',
    activeIcon: 'document-text',
    inactiveIcon: 'document-text-outline',
  },
  {
    id: 'profile',
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
  },
];

export const CustomBottomNav: React.FC<CustomBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { favorites } = useFavorites();

  return (
    <View style={styles.navBar}>
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        const showBadge = tab.id === 'favorites' && favorites.length > 0;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                size={24}
                color={isActive ? COLORS.accent : COLORS.textMuted}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{favorites.length}</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>

            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.cardBg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  iconContainer: {
    position: 'relative',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -10,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: COLORS.textMuted,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 2,
  },
});
