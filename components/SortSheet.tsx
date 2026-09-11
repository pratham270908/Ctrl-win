import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortCriteria } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface SortOption {
  id: SortCriteria;
  title: string;
  subtitle: string;
  icon: string;
}

const SORT_OPTIONS: SortOption[] = [
  {
    id: 'BEST_OVERALL',
    title: 'Best Overall Journey Fit',
    subtitle: 'Prioritizes forward direction, high rating & minimal detour',
    icon: 'ribbon-outline',
  },
  {
    id: 'NEAREST',
    title: 'Nearest Distance',
    subtitle: 'Sort strictly by direct proximity (in meters)',
    icon: 'navigate-outline',
  },
  {
    id: 'HIGHEST_RATED',
    title: 'Highest Rated',
    subtitle: 'Top customer reviews and star scores',
    icon: 'star-outline',
  },
  {
    id: 'SHORTEST_TIME',
    title: 'Shortest Travel Time',
    subtitle: 'Fastest arrival time in minutes',
    icon: 'time-outline',
  },
];

interface SortSheetProps {
  visible: boolean;
  activeCriteria: SortCriteria;
  onSelect: (criteria: SortCriteria) => void;
  onClose: () => void;
}

export const SortSheet: React.FC<SortSheetProps> = ({
  visible,
  activeCriteria,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />

              <View style={styles.titleRow}>
                <View>
                  <Text style={styles.sheetTitle}>Sort & Filter</Text>
                  <Text style={styles.sheetSubtitle}>Choose how journey places are prioritized</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsList}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = activeCriteria === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                      onPress={() => {
                        onSelect(opt.id);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                        <Ionicons
                          name={opt.icon as any}
                          size={20}
                          color={isSelected ? COLORS.accent : COLORS.textSecondary}
                        />
                      </View>

                      <View style={styles.textCol}>
                        <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                          {opt.title}
                        </Text>
                        <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                      </View>

                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cardBorder,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  optionsList: {
    gap: SPACING.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  optionItemSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  textCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  optionTitleSelected: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
});
