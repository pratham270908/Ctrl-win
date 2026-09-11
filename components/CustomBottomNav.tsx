import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    id: 'favorites',
    label: 'Favorites',
    activeIcon: 'heart',
    inactiveIcon: 'heart-outline',
  },
  {
    id: 'activity',
    label: 'Activity',
    activeIcon: 'pulse',
    inactiveIcon: 'pulse-outline',
  },
  {
    id: 'profile',
    label: 'Profile',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
];

export const CustomBottomNav: React.FC<CustomBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const { favorites } = useFavorites();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.navBar,
        {
          paddingBottom: Math.max(12, insets.bottom),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        const favCount = Array.isArray(favorites) ? favorites.length : 0;
        const showBadge = tab.id === 'favorites' && favCount > 0;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.inactiveIcon) as any}
                size={22}
                color={isActive ? COLORS.navActive : COLORS.navInactive}
              />
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{favCount}</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
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
    backgroundColor: COLORS.navBg,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    ...SHADOWS.md,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 50,
    paddingVertical: 2,
  },
  iconWrapper: {
    position: 'relative',
    height: 34,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: COLORS.accentLight,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navBg,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.navActive,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: COLORS.navInactive,
  },
});

