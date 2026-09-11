import React, { useState, useEffect } from 'react';
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
import { EmergencyCard } from '../components/EmergencyCard';
import { placesService } from '../services/placesService';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface EmergencyScreenProps {
  onBack: () => void;
  onDirectionsPress: (place: Place) => void;
}

type EmergencyFilter = 'ALL' | 'HOSPITAL' | 'POLICE' | 'AMBULANCE' | 'PHARMACY';

export const EmergencyScreen: React.FC<EmergencyScreenProps> = ({
  onBack,
  onDirectionsPress,
}) => {
  const [emergencyPlaces, setEmergencyPlaces] = useState<Place[]>([]);
  const [activeFilter, setActiveFilter] = useState<EmergencyFilter>('ALL');

  useEffect(() => {
    placesService.getEmergencyPlaces().then(setEmergencyPlaces);
  }, []);

  const handleQuickSos = (serviceName: string, number: string) => {
    Alert.alert(
      `🚨 ${serviceName} (Emergency)`,
      `Simulating priority connection to ${number} in Hyderabad Cyberabad jurisdiction.\n\n(Prototype mode - no real dispatch triggered)`,
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  };

  const filteredList = emergencyPlaces.filter((p) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'HOSPITAL') return p.category === 'Hospital';
    if (activeFilter === 'PHARMACY') return p.category === 'Pharmacy';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Red Alert Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.sosPill}>
            <View style={styles.sosDot} />
            <Text style={styles.sosPillText}>PRIORITY TRIAGE MODE</Text>
          </View>
          <Text style={styles.headerTitle}>Emergency Services</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Rapid SOS Buttons Grid */}
        <View style={styles.quickSosGrid}>
          <TouchableOpacity
            style={[styles.sosCard, { backgroundColor: '#DC2626' }]}
            onPress={() => handleQuickSos('Ambulance / Medical Response', '108')}
            activeOpacity={0.85}
          >
            <Ionicons name="medical" size={24} color="#FFFFFF" />
            <Text style={styles.sosNumber}>108</Text>
            <Text style={styles.sosLabel}>Ambulance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sosCard, { backgroundColor: '#1E293B' }]}
            onPress={() => handleQuickSos('Cyberabad Police Control Room', '112')}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-half" size={24} color="#FFFFFF" />
            <Text style={styles.sosNumber}>112</Text>
            <Text style={styles.sosLabel}>Police SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sosCard, { backgroundColor: '#EA580C' }]}
            onPress={() => handleQuickSos('Fire & Rescue Services', '101')}
            activeOpacity={0.85}
          >
            <Ionicons name="flame" size={24} color="#FFFFFF" />
            <Text style={styles.sosNumber}>101</Text>
            <Text style={styles.sosLabel}>Fire Rescue</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['ALL', 'HOSPITAL', 'PHARMACY'] as EmergencyFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f === 'ALL' ? 'All Emergency Ahead' : f === 'HOSPITAL' ? '🏥 Trauma Centers' : '💊 24/7 Meds'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>
          Nearest Emergency Care on Your Forward Path
        </Text>
        <Text style={styles.sectionSubtitle}>
          Ranked by absolute shortest arrival time and active trauma units
        </Text>

        {filteredList.map((place) => (
          <EmergencyCard
            key={place.id}
            place={place}
            onDirectionsPress={onDirectionsPress}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#DC2626',
    ...SHADOWS.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sosDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
  },
  sosPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FEE2E2',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  quickSosGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  sosCard: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  sosNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sosLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  filterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: 2,
  },
});
