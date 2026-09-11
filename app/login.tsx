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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAuth } from '../store/AuthContext';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, register, loginAsGuest, isLoading } = useAuth();
  const { width } = useWindowDimensions();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isCompact = width < 520;

  const handleAuth = async () => {
    setErrorMessage('');

    if (!phone.trim() || !password.trim()) {
      setErrorMessage('Please enter both phone number and password.');
      return;
    }

    if (isSignUp && !name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    try {
      // Keep the existing authentication flow untouched. The current auth service
      // accepts the first credential as a string, so the phone number is passed
      // through without changing the authentication implementation.
      if (isSignUp) {
        await register(name, phone, password);
      } else {
        await login(phone, password);
      }
      onSuccess();
    } catch (e: any) {
      setErrorMessage(e.message || 'Authentication error. Please try again.');
    }
  };

  const handleGuest = async () => {
    try {
      await loginAsGuest();
      onSuccess();
    } catch (e) {
      Alert.alert('Guest Login', 'Proceeding as Guest traveler.');
      onSuccess();
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot password?',
      'Password recovery is not connected to the existing authentication service yet.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Full-screen fleet/map backdrop. Decorative only; no app logic is changed. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={styles.mapGlowOne} />
        <View style={styles.mapGlowTwo} />

        <View style={[styles.road, styles.roadOne]} />
        <View style={[styles.road, styles.roadTwo]} />
        <View style={[styles.road, styles.roadThree]} />
        <View style={[styles.road, styles.roadFour]} />
        <View style={[styles.routeLine, styles.routeOne]} />
        <View style={[styles.routeLine, styles.routeTwo]} />

        <View style={[styles.vehicleMarker, styles.vehicleOne]}>
          <Ionicons name="car-sport" size={14} color={COLORS.accent} />
        </View>
        <View style={[styles.vehicleMarker, styles.vehicleTwo]}>
          <Ionicons name="navigate" size={13} color={COLORS.ahead} />
        </View>
        <View style={[styles.vehicleMarker, styles.vehicleThree]}>
          <Ionicons name="car" size={13} color={COLORS.accentCyan} />
        </View>
        <View style={[styles.mapPin, styles.pinOne]} />
        <View style={[styles.mapPin, styles.pinTwo]} />
      </View>

      <View style={styles.backdropOverlay} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isCompact ? styles.scrollContentCompact : styles.scrollContentWide,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.loginCard,
              isCompact ? styles.loginCardCompact : styles.loginCardWide,
            ]}
          >
            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>+</Text>
              </View>
              <Text style={styles.brandText}>Ctrl<Text style={styles.brandPlus}>+</Text>Win</Text>
            </View>

            <View style={styles.headingBlock}>
              <Text style={styles.welcomeTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {isSignUp
                  ? 'Create your account to continue to the operations dashboard.'
                  : 'Sign in to your account to continue to the operations dashboard.'}
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Ionicons name="call-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((visible) => !visible)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isSignUp && (
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((value) => !value)}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={13} color="#0A0F1E" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.75}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleAuth}
              disabled={isLoading}
              activeOpacity={0.86}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0F1E" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {isSignUp ? 'Create Account' : 'Login'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#0A0F1E" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => {
                setIsSignUp((value) => !value);
                setErrorMessage('');
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.switchModeText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.switchModeHighlight}>
                  {isSignUp ? 'Sign in' : 'Contact your administrator'}
                </Text>
              </Text>
            </TouchableOpacity>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuest}
                activeOpacity={0.8}
              >
                <Ionicons name="compass-outline" size={17} color={COLORS.textSecondary} />
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.secureFooter}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.ahead} />
            <Text style={styles.secureFooterText}>Secure fleet operations</Text>
            <View style={styles.footerDot} />
            <Text style={styles.secureFooterText}>Ctrl+Win</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B13',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContentWide: {
    paddingHorizontal: 32,
    paddingVertical: 42,
  },
  scrollContentCompact: {
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 9, 16, 0.76)',
  },
  mapGlowOne: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: 'rgba(79, 142, 247, 0.07)',
    top: -150,
    left: -120,
  },
  mapGlowTwo: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(34, 197, 94, 0.035)',
    bottom: -250,
    right: -180,
  },
  road: {
    position: 'absolute',
    height: 56,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 159, 196, 0.09)',
    backgroundColor: 'rgba(20, 29, 46, 0.38)',
  },
  roadOne: {
    width: '130%',
    left: '-15%',
    top: '18%',
    transform: [{ rotate: '-18deg' }],
  },
  roadTwo: {
    width: '125%',
    left: '-10%',
    top: '61%',
    transform: [{ rotate: '13deg' }],
  },
  roadThree: {
    width: '120%',
    left: '-10%',
    top: '40%',
    transform: [{ rotate: '38deg' }],
    opacity: 0.65,
  },
  roadFour: {
    width: '120%',
    left: '-10%',
    top: '73%',
    transform: [{ rotate: '-42deg' }],
    opacity: 0.55,
  },
  routeLine: {
    position: 'absolute',
    width: '62%',
    height: 2,
    backgroundColor: COLORS.ahead,
    opacity: 0.45,
  },
  routeOne: {
    left: '-5%',
    top: '30%',
    transform: [{ rotate: '24deg' }],
  },
  routeTwo: {
    right: '-7%',
    top: '68%',
    transform: [{ rotate: '-29deg' }],
    backgroundColor: COLORS.accent,
  },
  vehicleMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 15, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(139, 159, 196, 0.18)',
  },
  vehicleOne: {
    top: '23%',
    right: '13%',
  },
  vehicleTwo: {
    top: '70%',
    left: '12%',
  },
  vehicleThree: {
    top: '42%',
    left: '7%',
  },
  mapPin: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.ahead,
    shadowColor: COLORS.ahead,
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 5,
  },
  pinOne: {
    top: '16%',
    right: '31%',
  },
  pinTwo: {
    bottom: '18%',
    right: '17%',
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
  },
  loginCard: {
    width: '100%',
    backgroundColor: 'rgba(12, 17, 28, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(139, 159, 196, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 16,
  },
  loginCardWide: {
    maxWidth: 470,
    borderRadius: 28,
    paddingHorizontal: 38,
    paddingVertical: 36,
  },
  loginCardCompact: {
    maxWidth: 470,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#B7F34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    ...SHADOWS.sm,
  },
  brandMarkText: {
    color: '#0A0F1E',
    fontSize: 22,
    lineHeight: 23,
    fontWeight: '900',
  },
  brandText: {
    color: '#F0F4FF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandPlus: {
    color: '#B7F34A',
  },
  headingBlock: {
    alignItems: 'center',
    marginBottom: 26,
  },
  welcomeTitle: {
    color: '#F5F7FA',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  welcomeSubtitle: {
    color: '#8290A8',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 340,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 7,
  },
  errorText: {
    flex: 1,
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#B5C0D2',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: 'rgba(24, 31, 45, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(139, 159, 196, 0.16)',
  },
  input: {
    flex: 1,
    color: '#F0F4FF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    paddingVertical: 0,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
    marginBottom: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#52627B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#B7F34A',
    borderColor: '#B7F34A',
  },
  rememberText: {
    color: '#9BA8BC',
    fontSize: 12,
    fontWeight: '600',
  },
  forgotText: {
    color: '#B7F34A',
    fontSize: 12,
    fontWeight: '700',
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#B7F34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#B7F34A',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  loginButtonText: {
    color: '#0A0F1E',
    fontSize: 15,
    fontWeight: '800',
  },
  switchModeButton: {
    alignItems: 'center',
    marginTop: 21,
  },
  switchModeText: {
    color: '#7F8DA4',
    fontSize: 12,
    textAlign: 'center',
  },
  switchModeHighlight: {
    color: '#B7F34A',
    fontWeight: '700',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 159, 196, 0.10)',
  },
  guestButtonText: {
    color: '#8C99AE',
    fontSize: 12,
    fontWeight: '600',
  },
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 6,
  },
  secureFooterText: {
    color: 'rgba(139, 159, 196, 0.62)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(139, 159, 196, 0.45)',
  },
});
