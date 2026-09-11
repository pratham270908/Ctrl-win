import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Entry animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(24)).current;
  const ctaScaleAnim = useRef(new Animated.Value(0.92)).current;

  // Subtle glowing emblem pulse
  const logoPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Initial entrance transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ctaScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle glowing emblem pulse
    const logoPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulseAnim, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    logoPulseLoop.start();

    return () => {
      logoPulseLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. Full-Screen Cinematic Nature Background: Deep Rainforest Trees + Turquoise Waterfall */}
      <ImageBackground
        source={require('../assets/specfinder_waterfall.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Subtle static cinematic dark gradient at bottom for Get Started & text readability */}
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.85)']}
          locations={[0, 0.3, 0.65, 1]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* 2. Center Branding & Identity Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: contentSlideAnim }],
            },
          ]}
        >
          {/* Logo Mark: Glowing SpecFinder Explorer Compass Emblem */}
          <View style={styles.brandIconWrapper}>
            <Animated.View
              style={[
                styles.brandGlowAura,
                {
                  transform: [{ scale: logoPulseAnim }],
                },
              ]}
            />
            <View style={styles.brandIconDisc}>
              <Ionicons name="compass" size={42} color="#FFFFFF" />
              <View style={styles.brandLocationPinBadge}>
                <Ionicons name="sparkles" size={14} color="#10B981" />
              </View>
            </View>
          </View>

          {/* App Title */}
          <Text style={styles.brandTitle}>SpecFinder</Text>

          {/* Nature Discovery Badge */}
          <View style={styles.discoveryBadge}>
            <Ionicons name="leaf" size={13} color="#10B981" />
            <Text style={styles.discoveryBadgeText}>DISCOVER • EXPLORE • NAVIGATE</Text>
          </View>

          {/* Tagline / Subtitle */}
          <Text style={styles.brandTagline}>
            Experience destinations ahead with seamless directional intelligence.
          </Text>
        </Animated.View>

        {/* 3. Lower Action Area: "Get Started →" */}
        <Animated.View
          style={[
            styles.bottomActionContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: ctaScaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onFinish}
            activeOpacity={0.88}
          >
            <View style={styles.buttonInnerRow}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <View style={styles.buttonIconCircle}>
                <Ionicons name="arrow-forward" size={18} color="#064E3B" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={styles.versionLabel}>
            SpecFinder v{APP_CONFIG.version} • Offline & Online Ready
          </Text>
        </Animated.View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021B14',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* Clean subtle full-width bottom dark gradient */
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.42,
  },

  /* Center Branding Content */
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: SCREEN_HEIGHT * 0.14,
    zIndex: 10,
  },
  brandIconWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  brandGlowAura: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: 'rgba(16, 185, 129, 0.32)',
  },
  brandIconDisc: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#064E3B',
    borderWidth: 2,
    borderColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  brandLocationPinBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#022C22',
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  discoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    gap: 7,
  },
  discoveryBadgeText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  /* Bottom Call To Action */
  bottomActionContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: SCREEN_HEIGHT * 0.05,
    alignItems: 'center',
    zIndex: 10,
  },
  getStartedButton: {
    backgroundColor: '#10B981',
    width: '100%',
    maxWidth: 380,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  getStartedButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#022C22',
    letterSpacing: 0.3,
  },
  buttonIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 14,
    letterSpacing: 0.3,
  },
});
