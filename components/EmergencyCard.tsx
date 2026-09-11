import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface EmergencyCardProps {
  place: Place;
  onDirectionsPress: (place: Place) => void;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({
  place,
  onDirectionsPress,
}) => {
  const handleCallPress = () => {
    Alert.alert(
      'Simulated Emergency Call',
      `Calling ${place.name} at ${place.phone}.\n\n(In this prototype, external calls are safely simulated.)`,
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name="medical" size={13} color={COLORS.danger} />
          <Text style={styles.badgeText}>24/7 EMERGENCY READY</Text>
        </View>

        <Text style={styles.timeTag}>{place.travelTime} min away</Text>
      </View>

      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.addressText} numberOfLines={1}>
        {place.address}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{place.distance} meters ahead</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.ahead} />
          <Text style={[styles.infoText, { color: COLORS.ahead, fontWeight: '700' }]}>
            Trauma Unit Active
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCallPress}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={16} color={COLORS.danger} />
          <Text style={styles.callBtnText}>Emergency Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.directionsBtn}
          onPress={() => onDirectionsPress(place)}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.directionsBtnText}>Fastest Route</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    ...SHADOWS.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dangerLight,
    height: 44,
    borderRadius: RADIUS.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  directionsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    height: 44,
    borderRadius: RADIUS.lg,
    gap: 6,
    ...SHADOWS.sm,
  },
  directionsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
