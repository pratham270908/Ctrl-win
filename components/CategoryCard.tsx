import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryInfo } from '../data/mockCategories';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface CategoryCardProps {
  category: CategoryInfo;
  isSelected?: boolean;
  onPress: (category: CategoryInfo) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
      ]}
      onPress={() => onPress(category)}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Search ${category.name}`}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: category.bgColor },
          isSelected && { backgroundColor: category.color },
        ]}
      >
        <Text style={styles.emoji}>{category.emoji}</Text>
      </View>
      <Text
        style={[
          styles.name,
          isSelected && styles.nameSelected,
        ]}
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
    marginRight: SPACING.md,
    width: 72,
  },
  containerSelected: {
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...SHADOWS.sm,
    marginBottom: 6,
  },
  emoji: {
    fontSize: 26,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  nameSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
