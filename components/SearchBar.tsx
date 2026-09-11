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
  if (!editable) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Search places ahead"
      >
        <Ionicons name="search" size={18} color={COLORS.accent} style={styles.searchIcon} />
        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>
        <View style={styles.filterChip}>
          <Ionicons name="compass" size={12} color={COLORS.accent} />
          <Text style={styles.filterChipText}>Ahead</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={COLORS.accent} style={styles.searchIcon} />
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
          <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
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
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
    marginHorizontal: SPACING.lg,
    marginVertical: 6,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  clearButton: {
    padding: 3,
  },
});
