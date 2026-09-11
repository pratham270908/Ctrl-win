import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface OfflineMapsScreenProps {
  onBack: () => void;
}

export const OfflineMapsScreen: React.FC<OfflineMapsScreenProps> = ({ onBack }) => {
  const { offlineAreas, toggleOfflineDownload } = useApp();

  const handleToggle = (areaId: string, isDownloaded: boolean, areaName: string) => {
    if (isDownloaded) {
      Alert.alert(
        'Delete Offline Pack',
        `Remove offline map package for ${areaName}? You will require network data to calculate directional corridors in this zone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => toggleOfflineDownload(areaId),
          },
        ]
      );
    } else {
      Alert.alert(
        'Download Offline Pack',
        `Simulating offline map pack download for ${areaName}.\n\nIncludes road vectors, speed limits, and 500+ pre-classified directional locations.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download Now',
            onPress: () => toggleOfflineDownload(areaId),
          },
        ]
      );
    }
  };

  const downloadedList = offlineAreas.filter((a) => a.downloaded);
  const availableList = offlineAreas.filter((a) => !a.downloaded);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>STORAGE & DATA</Text>
          <Text style={styles.headerTitle}>Offline Journey Maps</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Storage Banner */}
        <View style={styles.storageCard}>
          <View style={styles.storageIconCircle}>
            <Ionicons name="cloud-offline" size={24} color={COLORS.ahead} />
          </View>
          <View style={styles.storageTextCol}>
            <Text style={styles.storageTitle}>Zero Signal? No Problem.</Text>
            <Text style={styles.storageSub}>
              Directional vectors and local POI caches operate seamlessly without cell service.
            </Text>
          </View>
        </View>

        {/* SECTION 1: DOWNLOADED REGIONS */}
        <Text style={styles.sectionTitle}>Downloaded on This Device</Text>
        <Text style={styles.sectionSubtitle}>
          Instantly accessible offline with turn guidance
        </Text>

        {downloadedList.map((area) => (
          <View key={area.id} style={styles.areaCard}>
            <View style={styles.areaIconCol}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.ahead} />
            </View>

            <View style={styles.areaDetails}>
              <Text style={styles.areaName}>{area.name}</Text>
              <Text style={styles.areaMeta}>
                {area.sizeMb} MB • {area.lastUpdated ? `Updated ${area.lastUpdated}` : 'Active'}
              </Text>
              <Text style={styles.areaStatusDownloaded}>Ready for offline journeys</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleToggle(area.id, true, area.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {/* SECTION 2: POPULAR REGIONS AVAILABLE */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>
          Popular Nearby Areas
        </Text>
        <Text style={styles.sectionSubtitle}>
          Download ahead of road trips to save battery and cellular bandwidth
        </Text>

        {availableList.map((area) => (
          <View key={area.id} style={styles.areaCard}>
            <View style={styles.areaIconCol}>
              <Ionicons name="map-outline" size={22} color={COLORS.accent} />
            </View>

            <View style={styles.areaDetails}>
              <Text style={styles.areaName}>{area.name}</Text>
              <Text style={styles.areaMeta}>{area.sizeMb} MB download size</Text>
              <Text style={styles.areaStatusPending}>Standard resolution vector pack</Text>
            </View>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => handleToggle(area.id, false, area.name)}
            >
              <Ionicons name="download-outline" size={16} color={COLORS.accent} />
              <Text style={styles.downloadBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        ))}

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
  storageCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  storageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.aheadLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  storageTextCol: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  storageSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
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
  areaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  areaIconCol: {
    marginRight: SPACING.md,
  },
  areaDetails: {
    flex: 1,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  areaMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  areaStatusDownloaded: {
    fontSize: 10,
    color: COLORS.ahead,
    fontWeight: '700',
    marginTop: 2,
  },
  areaStatusPending: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: SPACING.sm,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
});
