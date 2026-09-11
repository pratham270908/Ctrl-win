import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InteractiveMap } from '../components/InteractiveMap';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../store/AppContext';

interface AccessibilityScreenProps {
  onBack: () => void;
  onStartAccessibleNavigation: () => void;
}

export const AccessibilityScreen: React.FC<AccessibilityScreenProps> = ({
  onBack,
  onStartAccessibleNavigation,
}) => {
  const { settings, updateSetting } = useApp();

  const [avoidStairs, setAvoidStairs] = useState<boolean>(settings.avoidStairs);
  const [wheelchairFriendly, setWheelchairFriendly] = useState<boolean>(
    settings.wheelchairAccessible
  );
  const [avoidSteepPaths, setAvoidSteepPaths] = useState<boolean>(true);
  const [accessibleEntrances, setAccessibleEntrances] = useState<boolean>(true);

  const handleToggleStairs = async (val: boolean) => {
    setAvoidStairs(val);
    await updateSetting('avoidStairs', val);
  };

  const handleToggleWheelchair = async (val: boolean) => {
    setWheelchairFriendly(val);
    await updateSetting('wheelchairAccessible', val);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>INCLUSIVE ROUTING</Text>
          <Text style={styles.headerTitle}>Accessibility Route</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        <View style={styles.mapWrap}>
          <InteractiveMap height={200} destinationName="Gachibowli Accessible Campus" />
        </View>

        {/* Route Certification Card */}
        <View style={styles.certCard}>
          <View style={styles.certIconCircle}>
            <Ionicons name="body" size={24} color={COLORS.accent} />
          </View>
          <View style={styles.certTextCol}>
            <Text style={styles.certTitle}>100% Step-Free Route Configured</Text>
            <Text style={styles.certSub}>
              Route leverages wide pedestrian ramps, street-level crosswalks, and elevator-equipped transit corridors.
            </Text>
          </View>
        </View>

        {/* Preference Toggles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routing Preferences</Text>
          <Text style={styles.sectionSubtitle}>
            Tailor route calculation to your physical mobility requirements
          </Text>

          <View style={styles.togglesCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>Wheelchair Accessible Corridors</Text>
                <Text style={styles.toggleDesc}>
                  Routes with min 1.5m wide ramps, smooth paved paths, and curb cuts
                </Text>
              </View>
              <Switch
                value={wheelchairFriendly}
                onValueChange={handleToggleWheelchair}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>Avoid Stairs & Footbridges</Text>
                <Text style={styles.toggleDesc}>
                  Eliminates pedestrian overpasses that lack operating elevators
                </Text>
              </View>
              <Switch
                value={avoidStairs}
                onValueChange={handleToggleStairs}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>Avoid Steep Inclines (> 5% Grade)</Text>
                <Text style={styles.toggleDesc}>
                  Prioritizes flatter contours even if travel distance increases slightly
                </Text>
              </View>
              <Switch
                value={avoidSteepPaths}
                onValueChange={setAvoidSteepPaths}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>Prioritize Automatic Doors</Text>
                <Text style={styles.toggleDesc}>
                  Directs directly to accessible building entries and drop-off zones
                </Text>
              </View>
              <Switch
                value={accessibleEntrances}
                onValueChange={setAccessibleEntrances}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
              />
            </View>
          </View>
        </View>

        {/* Route Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>11 min</Text>
            <Text style={styles.statLabel}>Est. Travel Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>2.4 km</Text>
            <Text style={styles.statLabel}>Smooth Paved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.ahead }]}>0</Text>
            <Text style={styles.statLabel}>Stairs Encountered</Text>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onStartAccessibleNavigation}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Start Accessible Navigation</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: SPACING.xxxl,
  },
  mapWrap: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  certCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  certIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  certTextCol: {
    flex: 1,
  },
  certTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  certSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  togglesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: SPACING.sm,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.cardBorder,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    ...SHADOWS.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    height: 50,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
