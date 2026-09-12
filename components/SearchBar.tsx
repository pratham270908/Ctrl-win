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
          <Ionicons name="search" size={20} color={COLORS.accentCyan} />
        </View>
        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>
        <View style={styles.filterChip}>
          <Ionicons name="navigate" size={13} color={COLORS.accentCyan} />
          <Text style={styles.filterChipText}>Ahead</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchIconWrap}>
        <Ionicons name="search" size={20} color={COLORS.accentCyan} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
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
          <Ionicons name="close-circle" size={19} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 37, 64, 0.85)',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 132, 255, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
    marginHorizontal: SPACING.lg,
    marginVertical: 8,
  },
  searchIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  placeholderText: {
    flex: 1,
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accentCyan,
    letterSpacing: 0.3,
  },
  clearButton: {
    padding: 4,
  },
});
