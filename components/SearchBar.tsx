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
  placeholder = 'Where are you headed?',
  editable = true,
  autoFocus = false,
}) => {
  if (!editable) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Search places ahead"
      >
        <View style={styles.searchIconWrap}>
          <Ionicons name="search" size={17} color={COLORS.accent} />
        </View>
        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>
        <View style={styles.filterChip}>
          <Ionicons name="navigate" size={11} color={COLORS.accentCyan} />
          <Text style={styles.filterChipText}>Ahead</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchIconWrap}>
        <Ionicons name="search" size={17} color={COLORS.accent} />
      </View>
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
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginHorizontal: SPACING.lg,
    marginVertical: 6,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentCyan,
  },
  clearButton: {
    padding: 3,
  },
});
