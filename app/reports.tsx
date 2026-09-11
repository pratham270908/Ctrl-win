import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { UserReport } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface ReportsScreenProps {
  onBack?: () => void;
}

type ReportCategory = UserReport['reportType'];

const REPORT_TYPES: { id: ReportCategory; icon: string; label: string }[] = [
  { id: 'Wrong location', icon: 'location-outline', label: 'Wrong Location' },
  { id: 'Closed place', icon: 'lock-closed-outline', label: 'Place Closed' },
  { id: 'Road blocked', icon: 'warning-outline', label: 'Road Blocked' },
  { id: 'Incorrect route', icon: 'navigate-outline', label: 'Wrong Route' },
  { id: 'Other', icon: 'chatbox-outline', label: 'Other' },
];

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const { reports, addReport } = useApp();

  const [selectedType, setSelectedType] = useState<ReportCategory>('Road blocked');
  const [placeName, setPlaceName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!placeName.trim()) {
      Alert.alert('Missing Field', 'Please enter the place or road intersection name.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Field', 'Please describe the issue observed.');
      return;
    }

    setIsSubmitting(true);
    await addReport({
      placeName: placeName.trim(),
      reportType: selectedType,
      description: description.trim(),
    });

    setIsSubmitting(false);
    setPlaceName('');
    setDescription('');

    Alert.alert(
      'Report Submitted! 🙏',
      'Thank you for improving directional journey accuracy for fellow travelers. Your report is now logged locally.'
    );
  };

  const getStatusBadge = (status: UserReport['status']) => {
    switch (status) {
      case 'Resolved':
        return { color: COLORS.ahead, bgColor: COLORS.aheadLight };
      case 'In Review':
        return { color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'Received':
      default:
        return { color: COLORS.onRoute, bgColor: COLORS.onRouteLight };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>COMMUNITY ACCURACY</Text>
          <Text style={styles.headerTitle}>Journey Activity & Reports</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* New Report Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Submit a Route or Place Update</Text>
          <Text style={styles.formSub}>Help improve directional vector classifications</Text>

          {/* Type Selector Pills */}
          <Text style={styles.inputLabel}>Issue Type</Text>
          <View style={styles.typeSelectorRow}>
            {REPORT_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typePill, isSelected && styles.typePillSelected]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                  />
                  <Text style={[styles.typePillText, isSelected && styles.typePillTextSelected]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Place Name Input */}
          <Text style={styles.inputLabel}>Place / Intersection Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Mindspace Circular Flyover"
            placeholderTextColor={COLORS.textMuted}
            value={placeName}
            onChangeText={setPlaceName}
          />

          {/* Description Input */}
          <Text style={styles.inputLabel}>What happened?</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="e.g. Center lane blocked by utility repairs, right detour takes 3 min..."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Submitting...' : 'Submit Journey Report'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION: PREVIOUS ACTIVITY LOGS */}
        <Text style={styles.sectionHeaderTitle}>Your Activity History</Text>
        <Text style={styles.sectionSubtitle}>
          {reports.length} reports logged locally on this device
        </Text>

        {reports.map((rep) => {
          const badge = getStatusBadge(rep.status);
          return (
            <View key={rep.id} style={styles.reportItemCard}>
              <View style={styles.reportTopRow}>
                <View style={styles.reportTypeBadge}>
                  <Text style={styles.reportTypeBadgeText}>{rep.reportType}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                    {rep.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.reportPlaceName}>{rep.placeName}</Text>
              <Text style={styles.reportDescription}>{rep.description}</Text>

              <View style={styles.reportMetaRow}>
                <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                <Text style={styles.reportMetaText}>{rep.timestamp}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  formSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typePillSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  typePillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  typePillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  textArea: {
    height: 70,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    height: 48,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.lg,
    gap: 8,
    ...SHADOWS.sm,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  reportItemCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  reportTypeBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  reportTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reportPlaceName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  reportDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: SPACING.xs,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportMetaText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
