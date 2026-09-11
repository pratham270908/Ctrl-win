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
          { backgroundColor: category.bgColor },
          isSelected && { backgroundColor: category.color, borderColor: category.color },
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
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
    width: 66,
  },
  containerSelected: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: 6,
  },
  name: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  nameSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
