import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { directionsService } from '../services/directionsService';
import { PublicTransitRoute } from '../data/mockRoutes';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface PublicTransportScreenProps {
  onBack: () => void;
  onSelectTransitRoute: (route: PublicTransitRoute) => void;
}

export const PublicTransportScreen: React.FC<PublicTransportScreenProps> = ({
  onBack,
  onSelectTransitRoute,
}) => {
  const [routes, setRoutes] = useState<PublicTransitRoute[]>([]);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>('transit-bus-216');

  useEffect(() => {
    directionsService.getPublicTransitRoutes().then(setRoutes);
  }, []);

  const getTransitBadge = (type: PublicTransitRoute['type']) => {
    switch (type) {
      case 'BUS':
        return {
          icon: 'bus',
          color: '#0284C7',
          bgColor: '#E0F2FE',
          label: 'CITY BUS',
        };
      case 'METRO':
        return {
          icon: 'subway',
          color: '#7C3AED',
          bgColor: '#EDE9FE',
          label: 'METRO EXPRESS',
        };
      case 'TRAIN':
      default:
        return {
          icon: 'train',
          color: '#059669',
          bgColor: '#D1FAE5',
          label: 'SUBURBAN MMTS',
        };
    }
  };

  const handleRouteSelect = (route: PublicTransitRoute) => {
    Alert.alert(
      'Transit Route Selected',
      `Locked guidance for ${route.routeNumber} to ${route.destination}.\n\nNext departure arrives in ${route.departureInMinutes} minutes at Cyber Gateway Terminal.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Journey', onPress: () => onSelectTransitRoute(route) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSub}>SCHEDULES & STOPS</Text>
          <Text style={styles.headerTitle}>Public Transport Lines</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hub Banner */}
        <View style={styles.hubBanner}>
          <Ionicons name="git-branch" size={20} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hubTitle}>Cyber Towers Transit Interchange</Text>
            <Text style={styles.hubSub}>
              Direct platform connections: Bus Stop 4, Hitec City Metro Entrance B
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Live Upcoming Departures</Text>

        {routes.map((route) => {
          const badge = getTransitBadge(route.type);
          const isExpanded = expandedRouteId === route.id;

          return (
            <View key={route.id} style={styles.routeCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedRouteId(isExpanded ? null : route.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeBadge, { backgroundColor: badge.bgColor }]}>
                  <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                  <Text style={[styles.typeText, { color: badge.color }]}>{badge.label}</Text>
                </View>

                <View style={styles.departurePill}>
                  <Text style={styles.departureText}>
                    In {route.departureInMinutes} min
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.mainInfo}>
                <Text style={styles.routeNumber}>{route.routeNumber}</Text>
                <Text style={styles.destText}>Towards: {route.destination}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaItem}>⏱ {route.totalDurationMinutes} min trip</Text>
                  <Text style={styles.metaItem}>💵 {route.fare}</Text>
                  <Text style={styles.metaItem}>🔄 {route.frequency}</Text>
                </View>
              </View>

              {/* Stop Timeline Accordion */}
              {isExpanded && (
                <View style={styles.stopsTimeline}>
                  <Text style={styles.stopsTitle}>Route Stops & Stations</Text>
                  {route.stops.map((stop, i) => (
                    <View key={i} style={styles.stopRow}>
                      <View style={styles.stopIndicatorCol}>
                        <View
                          style={[
                            styles.stopDot,
                            i === 1 && styles.stopDotCurrent,
                            i === route.stops.length - 1 && styles.stopDotDest,
                          ]}
                        />
                        {i < route.stops.length - 1 && <View style={styles.stopLine} />}
                      </View>
                      <Text
                        style={[
                          styles.stopName,
                          i === 1 && styles.stopNameCurrent,
                          i === route.stops.length - 1 && styles.stopNameDest,
                        ]}
                      >
                        {stop}
                      </Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.selectRouteBtn}
                    onPress={() => handleRouteSelect(route)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.selectRouteText}>Select This Transit Route</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  hubBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  hubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hubSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  routeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  departurePill: {
    backgroundColor: COLORS.aheadLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  departureText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ahead,
  },
  mainInfo: {
    marginBottom: SPACING.xs,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  destText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  metaItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  stopsTimeline: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
  },
  stopsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stopIndicatorCol: {
    alignItems: 'center',
    width: 14,
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
    marginTop: 4,
  },
  stopDotCurrent: {
    backgroundColor: COLORS.onRoute,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopDotDest: {
    backgroundColor: COLORS.danger,
  },
  stopLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.cardBorder,
  },
  stopName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  stopNameCurrent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onRoute,
  },
  stopNameDest: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  selectRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    height: 44,
    borderRadius: RADIUS.lg,
    gap: 6,
    marginTop: SPACING.md,
  },
  selectRouteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
