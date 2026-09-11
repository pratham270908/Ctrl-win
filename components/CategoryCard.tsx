import React from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';
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
          isSelected && { backgroundColor: category.color, borderColor: category.color },
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
    marginRight: 14,
    width: 66,
  },
  containerSelected: {
    transform: [{ scale: 1.04 }],
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
    marginBottom: 5,
  },
  emoji: {
    fontSize: 24,
  },
  name: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  nameSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
});
