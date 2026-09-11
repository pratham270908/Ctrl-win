import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, loginAsGuest, isLoading } = useAuth();

  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [password, setPassword] = useState<string>('journey2026');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [focusedField, setFocusedField] = useState<'phone' | 'password' | null>(null);

  const handleLogin = async () => {
    setErrorMessage('');
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedPhone || !trimmedPassword) {
      setErrorMessage('Please enter both your phone number and password.');
      return;
    }

    try {
      await login(trimmedPhone, trimmedPassword);
      onSuccess();
    } catch (e: any) {
      setErrorMessage(e?.message || 'Authentication error. Please verify your credentials.');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'To reset your password, please contact your operations supervisor or system dispatch administrator.',
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Account Registration',
      'New user accounts are provisioned by your fleet administrator. Please contact operations@ctrlwin.app or reach out to internal dispatch.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleGuest = async () => {
    try {
      await loginAsGuest();
      onSuccess();
    } catch {
      onSuccess();
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Full-Screen Dark City/Map Background with Grid, Corridors, Vehicles & HUD */}
      <View style={styles.mapBackground} pointerEvents="none">
        {/* Subtle grid pattern */}
        <View style={styles.gridLineHorizontal1} />
        <View style={styles.gridLineHorizontal2} />
        <View style={styles.gridLineHorizontal3} />
        <View style={styles.gridLineVertical1} />
        <View style={styles.gridLineVertical2} />
        <View style={styles.gridLineVertical3} />

        {/* Ambient Road Corridors */}
        <View style={styles.corridorPrimary} />
        <View style={styles.corridorSecondary} />
        <View style={styles.corridorHighway} />
        <View style={styles.corridorHighwayGlow} />

        {/* Dynamic Route Polyline */}
        <View style={styles.routePolyline} />

        {/* Navigation / Compass HUD Rings */}
        <View style={styles.hudRingOuter}>
          <View style={styles.hudRingMiddle}>
            <View style={styles.hudRingInner} />
          </View>
        </View>
        <View style={styles.hudCrosshairH} />
        <View style={styles.hudCrosshairV} />

        {/* Vehicle Telemetry Pulse Markers */}
        <View style={styles.vehicleMarker1}>
          <View style={styles.vehiclePulseRing1} />
          <View style={styles.vehicleDot1}>
            <Ionicons name="navigate" size={10} color="#050811" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
          <View style={styles.vehicleTag1}>
            <Text style={styles.vehicleTagText}>VEHICLE #04 • 42 km/h</Text>
          </View>
        </View>

        <View style={styles.vehicleMarker2}>
          <View style={styles.vehiclePulseRing2} />
          <View style={styles.vehicleDot2} />
          <View style={styles.vehicleTag2}>
            <Text style={styles.vehicleTagText2}>FLEET NODE #12</Text>
          </View>
        </View>

        <View style={styles.vehicleMarker3}>
          <View style={styles.vehiclePulseRing3} />
          <View style={styles.vehicleDot3} />
        </View>

        {/* Ambient Glows */}
        <View style={styles.ambientGlowTop} />
        <View style={styles.ambientGlowBottom} />
      </View>

      {/* 2. Interactive Centered Login Flow */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Centered Glassmorphism Login Card */}
            <View style={styles.loginCard}>
              {/* Brand Logo Header: Lime '+' Mark & Ctrl+Win */}
              <View style={styles.brandRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoPlusText}>+</Text>
                </View>
                <Text style={styles.brandTitle}>
                  Ctrl<Text style={styles.brandPlus}>+</Text>Win
                </Text>
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.welcomeTitle}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to your account to continue to the operations dashboard.
              </Text>

              {/* Error Banner if invalid */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Field 1: Phone Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'phone' && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={focusedField === 'phone' ? '#A3E635' : '#64748B'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#475569"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Field 2: Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'password' ? '#A3E635' : '#64748B'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.eyeBtn}
                    accessibilityLabel="Toggle password visibility"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberMeRow}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={13} color="#050811" />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.75}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Prominent Lime/Green Login Button: "Login →" */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#050811" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Login</Text>
                    <Ionicons name="arrow-forward" size={18} color="#050811" style={styles.arrowIcon} />
                  </>
                )}
              </TouchableOpacity>

              {/* Bottom Notice: Don't have an account? Contact your administrator */}
              <View style={styles.footerWrap}>
                <Text style={styles.footerText}>
                  Don't have an account?{' '}
                  <Text style={styles.footerLink} onPress={handleContactAdmin}>
                    Contact your administrator
                  </Text>
                </Text>
              </View>

              {/* Quick Guest Explorer Access */}
              <TouchableOpacity
                style={styles.guestLink}
                onPress={handleGuest}
                activeOpacity={0.75}
              >
                <Text style={styles.guestLinkText}>
                  Or explore directly as <Text style={styles.guestLinkBold}>Guest Explorer →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050811',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },

  /* ----------------------------------------------------
     FULL-SCREEN DARK CITY / MAP BACKGROUND
  ---------------------------------------------------- */
  mapBackground: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: '#050811',
    overflow: 'hidden',
  },
  gridLineHorizontal1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '22%',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
  },
  gridLineHorizontal3: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '78%',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  gridLineVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '18%',
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  gridLineVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.06)',
  },
  gridLineVertical3: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '82%',
    width: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.05)',
  },
  corridorPrimary: {
    position: 'absolute',
    width: '140%',
    height: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    top: '35%',
    left: '-20%',
    transform: [{ rotate: '-18deg' }],
  },
  corridorSecondary: {
    position: 'absolute',
    width: '130%',
    height: 2,
    backgroundColor: 'rgba(163, 230, 53, 0.1)',
    top: '65%',
    left: '-15%',
    transform: [{ rotate: '25deg' }],
  },
  corridorHighway: {
    position: 'absolute',
    width: '160%',
    height: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    top: '52%',
    left: '-30%',
    transform: [{ rotate: '-8deg' }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.18)',
  },
  corridorHighwayGlow: {
    position: 'absolute',
    width: '160%',
    height: 1,
    backgroundColor: 'rgba(163, 230, 53, 0.35)',
    top: '52.5%',
    left: '-30%',
    transform: [{ rotate: '-8deg' }],
  },
  routePolyline: {
    position: 'absolute',
    width: '120%',
    height: 3.5,
    backgroundColor: '#00D2FF',
    opacity: 0.28,
    top: '40%',
    left: '-10%',
    transform: [{ rotate: '12deg' }],
    borderRadius: 2,
  },

  /* HUD Radar Rings */
  hudRingOuter: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.07)',
    top: '50%',
    left: '50%',
    marginTop: -240,
    marginLeft: -240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudRingMiddle: {
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudRingInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.1)',
  },
  hudCrosshairH: {
    position: 'absolute',
    width: 120,
    height: 1,
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
    top: '50%',
    left: '50%',
    marginLeft: -60,
  },
  hudCrosshairV: {
    position: 'absolute',
    width: 1,
    height: 120,
    backgroundColor: 'rgba(163, 230, 53, 0.15)',
    top: '50%',
    left: '50%',
    marginTop: -60,
  },

  /* Vehicle Marker 1 (Active Ahead) */
  vehicleMarker1: {
    position: 'absolute',
    top: '28%',
    right: '12%',
    alignItems: 'center',
  },
  vehiclePulseRing1: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(163, 230, 53, 0.2)',
    top: -6,
  },
  vehicleDot1: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  vehicleTag1: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.4)',
    marginTop: 4,
  },
  vehicleTagText: {
    color: '#A3E635',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Vehicle Marker 2 */
  vehicleMarker2: {
    position: 'absolute',
    bottom: '22%',
    left: '10%',
    alignItems: 'center',
  },
  vehiclePulseRing2: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    top: -4,
  },
  vehicleDot2: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00D2FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  vehicleTag2: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  vehicleTagText2: {
    color: '#38BDF8',
    fontSize: 8,
    fontWeight: '700',
  },

  /* Vehicle Marker 3 */
  vehicleMarker3: {
    position: 'absolute',
    top: '16%',
    left: '15%',
  },
  vehiclePulseRing3: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(163, 230, 53, 0.3)',
    position: 'absolute',
    top: -3,
    left: -3,
  },
  vehicleDot3: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A3E635',
  },

  /* Ambient Glows */
  ambientGlowTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(163, 230, 53, 0.08)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -150,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },

  /* ----------------------------------------------------
     CENTERED GLASSMORPHISM LOGIN CARD
  ---------------------------------------------------- */
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(10, 15, 29, 0.88)',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
    elevation: 16,
    zIndex: 20,
  },

  /* Brand Header: Logo mark + Ctrl+Win */
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#1C2E05',
    borderWidth: 1.5,
    borderColor: '#A3E635',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  logoPlusText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#A3E635',
    lineHeight: 25,
    marginTop: -2,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandPlus: {
    color: '#A3E635',
    fontWeight: '900',
  },

  /* Welcome Typography */
  welcomeTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 19,
    paddingHorizontal: 8,
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },

  /* Field Groups */
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    paddingHorizontal: 14,
    height: 48,
  },
  inputContainerFocused: {
    borderColor: '#A3E635',
    backgroundColor: 'rgba(20, 30, 55, 0.95)',
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },

  /* Options Row: Remember Me & Forgot Password */
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 24,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#A3E635',
    borderColor: '#A3E635',
  },
  rememberMeText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  forgotPasswordText: {
    color: '#A3E635',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Prominent Lime/Green Login Button: "Login →" */
  loginButton: {
    backgroundColor: '#A3E635',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#A3E635',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 6,
  },
  loginButtonText: {
    color: '#050811',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  arrowIcon: {
    marginTop: 1,
  },

  /* Bottom Notice: Don't have an account? Contact your administrator */
  footerWrap: {
    marginTop: 22,
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#A3E635',
    fontWeight: '700',
  },

  /* Guest Shortcut Link */
  guestLink: {
    marginTop: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  guestLinkText: {
    color: '#475569',
    fontSize: 12,
  },
  guestLinkBold: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
