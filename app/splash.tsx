import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const roadAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(roadAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 2.8 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Decorative Night Highway & Horizon Glow */}
      <View style={styles.sceneryBackground}>
        {/* Sky gradient simulation */}
        <View style={styles.starsRow}>
          <View style={[styles.star, { top: 40, left: 60 }]} />
          <View style={[styles.star, { top: 80, right: 90 }]} />
          <View style={[styles.star, { top: 130, left: 180 }]} />
          <View style={[styles.star, { top: 160, right: 40 }]} />
        </View>

        {/* Horizon Glow */}
        <View style={styles.horizonGlow} />

        {/* Perspective Road Highway lines */}
        <View style={styles.roadContainer}>
          <View style={styles.roadSurface}>
            <View style={styles.laneMarker1} />
            <View style={styles.laneMarker2} />
            <View style={styles.laneMarker3} />
          </View>
        </View>
      </View>

      {/* Main Animated Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Badge with Pulse */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPulseRing} />
          <View style={styles.logoCircle}>
            <Ionicons name="compass" size={44} color="#FFFFFF" />
            <View style={styles.pinOverlay}>
              <Ionicons name="location" size={20} color={COLORS.ahead} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.appNamePrefix}>Smart Directional</Text>
        <Text style={styles.appNameHighlight}>Location Finder</Text>

        {/* Direction Indicator Pill */}
        <View style={styles.vectorPill}>
          <Ionicons name="navigate" size={14} color={COLORS.ahead} />
          <Text style={styles.vectorText}>AHEAD-FIRST NAVIGATION</Text>
        </View>

        {/* Slogan */}
        <View style={styles.sloganBox}>
          <Text style={styles.sloganQuote}>“</Text>
          <Text style={styles.sloganText}>
            Not the nearest place —{'\n'}the most useful place for your journey.
          </Text>
        </View>
      </Animated.View>

      {/* Bottom Action / Skip Button */}
      <Animated.View style={[styles.bottomContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onFinish}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.versionText}>v{APP_CONFIG.version} • Offline & Online Ready</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sceneryBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  starsRow: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  horizonGlow: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.45,
    left: -SCREEN_WIDTH * 0.5,
    width: SCREEN_WIDTH * 2,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    transform: [{ scaleX: 1.4 }],
  },
  roadContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.42,
    alignItems: 'center',
  },
  roadSurface: {
    width: SCREEN_WIDTH * 0.9,
    height: '100%',
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    alignItems: 'center',
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  laneMarker1: {
    width: 6,
    height: 35,
    backgroundColor: '#FDE68A',
    borderRadius: 3,
    marginBottom: 25,
    opacity: 0.7,
  },
  laneMarker2: {
    width: 8,
    height: 50,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    marginBottom: 30,
    opacity: 0.85,
  },
  laneMarker3: {
    width: 10,
    height: 70,
    backgroundColor: '#FDE68A',
    borderRadius: 5,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SCREEN_HEIGHT * 0.16,
    zIndex: 10,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  logoPulseRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    position: 'relative',
  },
  pinOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  appNamePrefix: {
    fontSize: 22,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  appNameHighlight: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  vectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  vectorText: {
    color: COLORS.ahead,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sloganBox: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  sloganQuote: {
    color: COLORS.accent,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 20,
  },
  sloganText: {
    fontSize: 15,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  bottomContainer: {
    width: '100%',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    alignItems: 'center',
    zIndex: 10,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 54,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.lg,
    marginBottom: SPACING.md,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  versionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
