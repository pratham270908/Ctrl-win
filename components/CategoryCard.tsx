import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CategoryInfo } from '../data/mockCategories';
import { COLORS, SHADOWS } from '../constants/theme';

interface CategoryCardProps {
  category: CategoryInfo;
  isSelected?: boolean;
  onPress: (category: CategoryInfo) => void;
}

const getCategoryIconName = (category: CategoryInfo): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  switch (category.id) {
    case 'Coffee':
      return 'coffee';
    case 'Petrol':
      return 'gas-station';
    case 'ATM':
      return 'atm';
    case 'Pharmacy':
      return 'pill';
    case 'Restaurant':
      return 'silverware-fork-knife';
    case 'Hospital':
      return 'hospital-building';
    case 'Shopping':
      return 'cart';
    default:
      return (category.iconName as any) || 'map-marker';
  }
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onPress,
}) => {
  const iconName = getCategoryIconName(category);
  const iconColor = isSelected ? '#FFFFFF' : category.color;

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={() => onPress(category)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Search ${category.name}`}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: category.bgColor,
            borderColor: `${category.color}40`,
          },
          isSelected && {
            backgroundColor: category.color,
            borderColor: category.color,
            shadowColor: category.color,
            shadowOpacity: 0.6,
            shadowRadius: 10,
          },
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={28} color={iconColor} />
      </View>
      <Text
        style={[styles.name, isSelected && styles.nameSelected]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 14,
    width: 74,
  },
  containerSelected: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...SHADOWS.sm,
    marginBottom: 7,
  },
  name: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  nameSelected: {
    color: COLORS.accentCyan,
    fontWeight: '800',
  },
});

