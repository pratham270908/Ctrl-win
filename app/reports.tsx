import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { UserReport } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface ReportsScreenProps {
  onBack?: () => void;
  onSelectSearch?: (query: string) => void;
}

type ActivityTab = 'routes' | 'searches' | 'reports';
type ReportCategory = UserReport['reportType'];

const REPORT_TYPES: { id: ReportCategory; icon: string; label: string }[] = [
  { id: 'Wrong location', icon: 'location-outline', label: 'Wrong Location' },
  { id: 'Closed place', icon: 'lock-closed-outline', label: 'Place Closed' },
  { id: 'Road blocked', icon: 'warning-outline', label: 'Road Blocked' },
  { id: 'Incorrect route', icon: 'navigate-outline', label: 'Wrong Route' },
  { id: 'Other', icon: 'chatbox-outline', label: 'Other' },
];

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack, onSelectSearch }) => {
  const {
    reports,
    addReport,
    recentRoutes,
    clearRecentRoutes,
    recentSearches,
    clearRecentSearches,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ActivityTab>('routes');
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

  const handleClearRoutes = () => {
    Alert.alert(
      'Clear Route History',
      'Are you sure you want to clear all your recent journey routes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearRecentRoutes() },
      ]
    );
  };

  const handleClearSearches = () => {
    Alert.alert(
      'Clear Search History',
      'Are you sure you want to clear all your recent searches?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearRecentSearches() },
      ]
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

  const routeList = Array.isArray(recentRoutes) ? recentRoutes : [];
  const searchList = Array.isArray(recentSearches) ? recentSearches : [];
  const reportList = Array.isArray(reports) ? reports : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>LOCAL STORAGE LOGS</Text>
          <Text style={styles.headerTitle}>Activity & Journey History</Text>
        </View>
      </View>

      {/* Segmented Tab Filter */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'routes' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('routes')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="navigate"
            size={14}
            color={activeTab === 'routes' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'routes' && styles.segmentTextActive]}>
            Routes ({routeList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'searches' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('searches')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="search"
            size={14}
            color={activeTab === 'searches' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'searches' && styles.segmentTextActive]}>
            Searches ({searchList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'reports' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('reports')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="flag"
            size={14}
            color={activeTab === 'reports' ? '#FFFFFF' : COLORS.textSecondary}
          />
          <Text style={[styles.segmentText, activeTab === 'reports' && styles.segmentTextActive]}>
            Reports ({reportList.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TAB 1: RECENT ROUTES */}
        {activeTab === 'routes' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Recent Routes</Text>
                <Text style={styles.sectionSubtitle}>
                  Persisted locally via AsyncStorage
                </Text>
              </View>
              {routeList.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearRoutes}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {routeList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="map-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Routes Logged Yet</Text>
                <Text style={styles.emptySub}>
                  When you start a simulated route, it will automatically be recorded here.
                </Text>
              </View>
            ) : (
              routeList.map((route) => (
                <View key={route.id} style={styles.routeCard}>
                  <View style={styles.routeHeaderRow}>
                    <View style={styles.routeIconWrapper}>
                      <Ionicons name="navigate" size={18} color={COLORS.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.routeDestination}>{route.destinationName}</Text>
                      <Text style={styles.routeTitle}>{route.routeTitle}</Text>
                    </View>
                    <View style={styles.simBadge}>
                      <Text style={styles.simBadgeText}>Simulated</Text>
                    </View>
                  </View>

                  <View style={styles.routeDivider} />

                  <View style={styles.routeFooterRow}>
                    <View style={styles.metricItem}>
                      <Ionicons name="speedometer-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metricText}>{route.distanceKm.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metricText}>{route.estimatedMinutes} mins</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metricText}>{route.timestamp}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: RECENT SEARCHES */}
        {activeTab === 'searches' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Text style={styles.sectionSubtitle}>
                  Persisted queries from your search bar
                </Text>
              </View>
              {searchList.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClearSearches}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {searchList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No Searches Yet</Text>
                <Text style={styles.emptySub}>
                  Search for Coffee, Petrol, ATM, or places to build your history.
                </Text>
              </View>
            ) : (
              <View style={styles.searchListContainer}>
                {searchList.map((query, index) => (
                  <TouchableOpacity
                    key={`${query}-${index}`}
                    style={styles.searchItemRow}
                    onPress={() => onSelectSearch && onSelectSearch(query)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchItemLeft}>
                      <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                      <Text style={styles.searchItemText}>{query}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: COMMUNITY REPORTS */}
        {activeTab === 'reports' && (
          <View>
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
            <Text style={styles.sectionHeaderTitle}>Community Reports Log</Text>
            <Text style={styles.sectionSubtitle}>
              {reportList.length} reports logged locally on this device
            </Text>

            {reportList.map((rep) => {
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
          </View>
        )}

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
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primaryDark,
    ...SHADOWS.sm,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: SPACING.md,
  },
  routeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDestination: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  routeTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  simBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  simBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338CA',
  },
  routeDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  routeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  searchListContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  searchItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  searchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
