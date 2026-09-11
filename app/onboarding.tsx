import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useApp } from '../store/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideData {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  badgeColor: string;
  illustrationBg: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    title: "Know where you're going.",
    subtitle:
      'Set your travel destination and direction vector. Our smart engine continuously maps your forward movement.',
    icon: 'compass',
    badge: 'STEP 1: VECTOR AWARENESS',
    badgeColor: COLORS.accent,
    illustrationBg: COLORS.accentLight,
  },
  {
    id: 2,
    title: 'Find places ahead of you.',
    subtitle:
      'Say goodbye to frustrating U-turns. We prioritize stops directly in front of your trajectory and along your direct route corridor.',
    icon: 'arrow-up-circle',
    badge: 'STEP 2: DIRECTIONAL CLASSIFICATION',
    badgeColor: COLORS.ahead,
    illustrationBg: COLORS.aheadLight,
  },
  {
    id: 3,
    title: 'Choose the best place for your journey.',
    subtitle:
      'Pick places based on true journey utility — factoring distance, detour minutes, reviews, and open operating hours.',
    icon: 'checkmark-done-circle',
    badge: 'STEP 3: JOURNEY UTILITY',
    badgeColor: '#F59E0B',
    illustrationBg: '#FEF3C7',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { completeOnboarding } = useApp();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const currentSlide = SLIDES[currentSlideIndex];
  const isLastSlide = currentSlideIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (isLastSlide) {
      await completeOnboarding();
      onComplete();
    } else {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Top Bar: Skip button */}
      <View style={styles.topBar}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepIndicatorText}>
            {currentSlideIndex + 1} of {SLIDES.length}
          </Text>
        </View>

        {!isLastSlide ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Main Illustration & Narrative Area */}
      <View style={styles.mainArea}>
        {/* Large Aesthetic Illustration Circle */}
        <View style={[styles.illustrationCircle, { backgroundColor: currentSlide.illustrationBg }]}>
          <Ionicons
            name={currentSlide.icon as any}
            size={74}
            color={currentSlide.badgeColor}
          />
          <View style={[styles.miniBadge, { backgroundColor: currentSlide.badgeColor }]}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
        </View>

        {/* Pill Tag */}
        <View style={[styles.badgePill, { backgroundColor: currentSlide.illustrationBg }]}>
          <Text style={[styles.badgeText, { color: currentSlide.badgeColor }]}>
            {currentSlide.badge}
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{currentSlide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>

        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentSlideIndex && styles.dotActive,
                index === currentSlideIndex && { backgroundColor: currentSlide.badgeColor },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: currentSlide.badgeColor }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  stepIndicator: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  stepIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  skipButton: {
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  mainArea: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    marginVertical: 'auto',
  },
  illustrationCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    position: 'relative',
    ...SHADOWS.md,
  },
  miniBadge: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.xxl,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
  },
  dotActive: {
    width: 24,
  },
  bottomArea: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: RADIUS.xl,
    gap: 8,
    ...SHADOWS.md,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
