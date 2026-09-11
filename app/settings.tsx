import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { settings, updateSetting } = useApp();

  const handleUnitToggle = async (unit: 'km' | 'miles') => {
    await updateSetting('distanceUnit', unit);
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Assurance',
      'Smart Directional Location Finder prioritizes on-device processing. Your location vector and journey destinations are calculated locally without selling telemetry.'
    );
  };

  const handleAbout = () => {
    Alert.alert(
      APP_CONFIG.fullName,
      `Version: ${APP_CONFIG.version}\n\n“${APP_CONFIG.slogan}”\n\nBuilt for modern Android & iOS mobile navigation.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>SYSTEM PREFERENCES</Text>
          <Text style={styles.headerTitle}>Application Settings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation & Audio Preferences */}
        <Text style={styles.sectionTitle}>Navigation & Sensors</Text>
        <View style={styles.settingsCard}>
          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSub}>Alerts for upcoming useful places and traffic changes</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(val) => updateSetting('notifications', val)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Precise GPS Sensor Access</Text>
              <Text style={styles.rowSub}>Enable high-precision vector and heading tracking</Text>
            </View>
            <Switch
              value={settings.locationPermissions}
              onValueChange={(val) => updateSetting('locationPermissions', val)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Spoken Voice Guidance</Text>
              <Text style={styles.rowSub}>Audio prompts for turns and ahead pit-stops</Text>
            </View>
            <Switch
              value={settings.voiceGuidance}
              onValueChange={(val) => updateSetting('voiceGuidance', val)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Avoid Toll Roads</Text>
              <Text style={styles.rowSub}>Filter route options to prioritize free expressways</Text>
            </View>
            <Switch
              value={settings.avoidTolls}
              onValueChange={(val) => updateSetting('avoidTolls', val)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            />
          </View>
        </View>

        {/* Units & Measurement */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Units & Measurements</Text>
        <View style={styles.settingsCard}>
          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Distance Display Unit</Text>
              <Text style={styles.rowSub}>Choose metric or imperial distance format</Text>
            </View>

            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[
                  styles.unitBtn,
                  settings.distanceUnit === 'km' && styles.unitBtnActive,
                ]}
                onPress={() => handleUnitToggle('km')}
              >
                <Text
                  style={[
                    styles.unitBtnText,
                    settings.distanceUnit === 'km' && styles.unitBtnTextActive,
                  ]}
                >
                  KM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.unitBtn,
                  settings.distanceUnit === 'miles' && styles.unitBtnActive,
                ]}
                onPress={() => handleUnitToggle('miles')}
              >
                <Text
                  style={[
                    styles.unitBtnText,
                    settings.distanceUnit === 'miles' && styles.unitBtnTextActive,
                  ]}
                >
                  MILES
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Accessibility Shortcuts */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Accessibility Routing</Text>
        <View style={styles.settingsCard}>
          <View style={styles.row}>
            <View style={styles.textCol}>
              <Text style={styles.rowLabel}>Wheelchair Route Default</Text>
              <Text style={styles.rowSub}>Always calculate step-free and elevator-first journeys</Text>
            </View>
            <Switch
              value={settings.wheelchairAccessible}
              onValueChange={(val) => updateSetting('wheelchairAccessible', val)}
              trackColor={{ false: COLORS.cardBorder, true: COLORS.accent }}
            />
          </View>
        </View>

        {/* Information & Legal */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>App & Information</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.menuRow} onPress={handlePrivacyPolicy}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accent} />
            <Text style={styles.menuRowText}>Privacy & Data Protection</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow} onPress={handleAbout}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
            <Text style={styles.menuRowText}>About Smart Directional Finder</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  textCol: {
    flex: 1,
    marginRight: SPACING.md,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  rowSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  unitBtnActive: {
    backgroundColor: COLORS.accent,
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  menuRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
