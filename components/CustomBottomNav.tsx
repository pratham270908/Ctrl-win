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
                size={25}
                color={isActive ? COLORS.accentCyan : '#64748B'}
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
    backgroundColor: 'rgba(10, 15, 30, 0.98)',
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(99, 132, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 52,
    paddingVertical: 2,
  },
  iconWrapper: {
    position: 'relative',
    height: 38,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A0F1E',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.accentCyan,
    fontWeight: '800',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
});

