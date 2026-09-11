import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  onPress,
  onSubmitEditing,
  onClear,
  placeholder = 'What are you looking for ahead?',
  editable = true,
  autoFocus = false,
}) => {
  // If not editable (e.g. on Home screen), tap triggers onPress navigation
  if (!editable) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Search places ahead"
      >
        <Ionicons name="search" size={20} color={COLORS.accent} style={styles.searchIcon} />
        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>
        <View style={styles.filterChip}>
          <Ionicons name="compass-outline" size={14} color={COLORS.accent} />
          <Text style={styles.filterChipText}>Ahead</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={COLORS.accent} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        autoFocus={autoFocus}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={onClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  clearButton: {
    padding: 4,
  },
});
