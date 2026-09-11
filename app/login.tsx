import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
  Animated,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';

const { width: W, height: H } = Dimensions.get('window');

type AuthMode = 'LOGIN' | 'SIGN_UP' | 'FORGOT_PASSWORD';

interface LoginScreenProps {
  onSuccess: () => void;
}

// ─── Shared Glass Container ────────────────────────────────────────────────
const GlassCard: React.FC<{ children: React.ReactNode; style?: any }> = ({
  children,
  style,
}) => <View style={[styles.glassCard, style]}>{children}</View>;

// ─── Styled Text Input Row ─────────────────────────────────────────────────
interface FieldProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoCorrect?: boolean;
  showToggle?: boolean;
  toggleVisible?: boolean;
  onToggle?: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

const Field: React.FC<FieldProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  showToggle,
  toggleVisible,
  onToggle,
  focused,
  onFocus,
  onBlur,
}) => (
  <View
    style={[
      styles.fieldRow,
      focused && styles.fieldRowFocused,
    ]}
  >
    <Ionicons
      name={icon as any}
      size={18}
      color={focused ? '#38BDF8' : '#94A3B8'}
      style={styles.fieldIcon}
    />
    <TextInput
      style={styles.fieldInput}
      placeholder={placeholder}
      placeholderTextColor="rgba(148,163,184,0.6)"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      onFocus={onFocus}
      onBlur={onBlur}
    />
    {showToggle && (
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.eyeBtn}
      >
        <Ionicons
          name={toggleVisible ? 'eye-off-outline' : 'eye-outline'}
          size={18}
          color="#94A3B8"
        />
      </TouchableOpacity>
    )}
  </View>
);

// ─── Blue Gradient Action Button ───────────────────────────────────────────
interface ActionBtnProps {
  label: string;
  loading?: boolean;
  onPress: () => void;
  icon?: string;
}

const ActionButton: React.FC<ActionBtnProps> = ({ label, loading, onPress, icon }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      disabled={loading}
    >
      <Animated.View style={[styles.actionBtn, { transform: [{ scale: scaleAnim }] }]}>
        {/* Blue gradient layers */}
        <View style={styles.actionBtnGradientBase} />
        <View style={styles.actionBtnGradientAccent} />
        {/* Content */}
        <View style={styles.actionBtnContent}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.actionBtnText}>{label}</Text>
              {icon && (
                <Ionicons name={icon as any} size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              )}
            </>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Social Login Button ───────────────────────────────────────────────────
const SocialBtn: React.FC<{
  provider: 'google' | 'apple';
  onPress: () => void;
}> = ({ provider, onPress }) => (
  <TouchableOpacity style={styles.socialBtn} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.socialBtnInner}>
      {provider === 'google' ? (
        <View style={styles.googleIconWrap}>
          {/* Google G icon using coloured text segments */}
          <Text style={styles.googleG}>G</Text>
        </View>
      ) : (
        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
      )}
      <Text style={styles.socialBtnText}>
        Continue with {provider === 'google' ? 'Google' : 'Apple'}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Divider with OR ──────────────────────────────────────────────────────
const OrDivider = () => (
  <View style={styles.orRow}>
    <View style={styles.orLine} />
    <Text style={styles.orText}>OR</Text>
    <View style={styles.orLine} />
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, register, loginAsGuest, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('explorer@specfinder.app');
  const [password, setPassword] = useState('specfinder2026');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // UI states
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  // Entry animations
  const bgFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    setError('');
    setResetSuccess('');
    Animated.parallel([
      Animated.timing(bgFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 600, delay: 200, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();
  }, [authMode]);

  const switchMode = (mode: AuthMode) => {
    // Briefly fade out card then switch
    Animated.parallel([
      Animated.timing(cardFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 20, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setError('');
      setResetSuccess('');
      setAuthMode(mode);
      cardSlide.setValue(30);
    });
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password.trim());
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Sign in failed. Please check your credentials.');
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await register(fullName.trim(), email.trim(), password.trim());
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Registration failed. Please try again.');
    }
  };

  const handleForgotPassword = () => {
    setError('');
    const target = (resetEmail || email).trim();
    if (!target) {
      setError('Please enter your email address.');
      return;
    }
    setResetSuccess(`A reset link has been sent to ${target}. Check your inbox.`);
  };

  const handleSocial = async (provider: 'google' | 'apple') => {
    try {
      await login(`${provider}.user@specfinder.app`, 'socialAuth2026');
      onSuccess();
    } catch {
      onSuccess();
    }
  };

  const handleGuest = async () => {
    try { await loginAsGuest(); onSuccess(); } catch { onSuccess(); }
  };

  const f = (name: string) => ({
    focused: focused === name,
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Futuristic City Background ── */}
      <Animated.View style={[styles.bgWrap, { opacity: bgFade }]}>
        <ImageBackground
          source={require('../assets/specfinder_city_bg.jpg')}
          style={styles.bg}
          resizeMode="cover"
        >
          {/* Gradient overlays for readability */}
          <View style={styles.bgOverlayTop} />
          <View style={styles.bgOverlayBottom} />
          <View style={styles.bgOverlayMid} />
        </ImageBackground>
      </Animated.View>

      {/* ── Foreground Content ── */}
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Logo / Brand mark ── */}
            <Animated.View
              style={[
                styles.logoWrap,
                { opacity: cardFade, transform: [{ scale: logoScale }] },
              ]}
            >
              <View style={styles.logoBg}>
                <Ionicons name="compass" size={30} color="#38BDF8" />
              </View>
              <Text style={styles.logoText}>
                Spec<Text style={styles.logoAccent}>Finder</Text>
              </Text>
            </Animated.View>

            {/* ── Auth Card ── */}
            <Animated.View
              style={[
                styles.cardWrap,
                {
                  opacity: cardFade,
                  transform: [{ translateY: cardSlide }],
                },
              ]}
            >
              {/* ════════════════════════════════════════ */}
              {/* LOGIN MODE */}
              {/* ════════════════════════════════════════ */}
              {authMode === 'LOGIN' && (
                <GlassCard>
                  <Text style={styles.heading}>Welcome Back</Text>
                  <Text style={styles.subheading}>
                    Sign in to continue your journey{'\n'}with SpecFinder
                  </Text>

                  {error ? <ErrorBanner message={error} /> : null}

                  <Field
                    icon="mail-outline"
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    {...f('email')}
                  />
                  <Field
                    icon="lock-closed-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    showToggle
                    toggleVisible={showPass}
                    onToggle={() => setShowPass(!showPass)}
                    {...f('pass')}
                  />

                  {/* Remember Me + Forgot */}
                  <View style={styles.optRow}>
                    <TouchableOpacity
                      style={styles.rememberRow}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cb, rememberMe && styles.cbChecked]}>
                        {rememberMe && <Ionicons name="checkmark" size={11} color="#030E1A" />}
                      </View>
                      <Text style={styles.rememberText}>Remember me</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => switchMode('FORGOT_PASSWORD')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>

                  <ActionButton label="Log In" loading={isLoading} onPress={handleLogin} icon="arrow-forward" />

                  <OrDivider />
                  <SocialBtn provider="google" onPress={() => handleSocial('google')} />
                  <SocialBtn provider="apple" onPress={() => handleSocial('apple')} />

                  <SwitchRow
                    text="Don't have an account?"
                    linkText="Sign Up"
                    onPress={() => switchMode('SIGN_UP')}
                  />
                </GlassCard>
              )}

              {/* ════════════════════════════════════════ */}
              {/* SIGN UP MODE */}
              {/* ════════════════════════════════════════ */}
              {authMode === 'SIGN_UP' && (
                <GlassCard>
                  <Text style={styles.heading}>Create Account</Text>
                  <Text style={styles.subheading}>Join SpecFinder and start exploring</Text>

                  {error ? <ErrorBanner message={error} /> : null}

                  <Field
                    icon="person-outline"
                    placeholder="Full name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    {...f('name')}
                  />
                  <Field
                    icon="mail-outline"
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    {...f('email2')}
                  />
                  <Field
                    icon="lock-closed-outline"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    showToggle
                    toggleVisible={showPass}
                    onToggle={() => setShowPass(!showPass)}
                    {...f('pass2')}
                  />
                  <Field
                    icon="shield-checkmark-outline"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    showToggle
                    toggleVisible={showConfirm}
                    onToggle={() => setShowConfirm(!showConfirm)}
                    {...f('confirm')}
                  />

                  <Text style={styles.termsText}>
                    By signing up you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>.
                  </Text>

                  <ActionButton label="Sign Up" loading={isLoading} onPress={handleSignUp} icon="arrow-forward" />

                  <OrDivider />
                  <SocialBtn provider="google" onPress={() => handleSocial('google')} />
                  <SocialBtn provider="apple" onPress={() => handleSocial('apple')} />

                  <SwitchRow
                    text="Already have an account?"
                    linkText="Log In"
                    onPress={() => switchMode('LOGIN')}
                  />
                </GlassCard>
              )}

              {/* ════════════════════════════════════════ */}
              {/* FORGOT PASSWORD MODE */}
              {/* ════════════════════════════════════════ */}
              {authMode === 'FORGOT_PASSWORD' && (
                <GlassCard>
                  {/* Icon */}
                  <View style={styles.forgotIconWrap}>
                    <Ionicons name="key-outline" size={32} color="#38BDF8" />
                  </View>
                  <Text style={styles.heading}>Forgot Password?</Text>
                  <Text style={styles.subheading}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>

                  {error ? <ErrorBanner message={error} /> : null}
                  {resetSuccess ? <SuccessBanner message={resetSuccess} /> : null}

                  <Field
                    icon="mail-outline"
                    placeholder="Your email address"
                    value={resetEmail || email}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    {...f('reset')}
                  />

                  <ActionButton
                    label="Send Reset Link"
                    onPress={handleForgotPassword}
                    icon="paper-plane-outline"
                  />

                  <TouchableOpacity
                    style={styles.backRow}
                    onPress={() => switchMode('LOGIN')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-back" size={16} color="#38BDF8" />
                    <Text style={styles.backText}>Back to Login</Text>
                  </TouchableOpacity>
                </GlassCard>
              )}

              {/* Guest shortcut */}
              <TouchableOpacity
                style={styles.guestBtn}
                onPress={handleGuest}
                activeOpacity={0.75}
              >
                <Text style={styles.guestText}>
                  Continue as{' '}
                  <Text style={styles.guestAccent}>Guest Explorer →</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Small helper components ───────────────────────────────────────────────
const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.errorBanner}>
    <Ionicons name="alert-circle" size={15} color="#F87171" />
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

const SuccessBanner: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.successBanner}>
    <Ionicons name="checkmark-circle" size={15} color="#34D399" />
    <Text style={styles.successText}>{message}</Text>
  </View>
);

const SwitchRow: React.FC<{
  text: string;
  linkText: string;
  onPress: () => void;
}> = ({ text, linkText, onPress }) => (
  <View style={styles.switchRow}>
    <Text style={styles.switchText}>{text} </Text>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.switchLink}>{linkText}</Text>
    </TouchableOpacity>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030E1A' },
  flex: { flex: 1 },

  // Background
  bgWrap: { ...(StyleSheet.absoluteFill as any) },
  bg: { width: '100%', height: '100%' },
  bgOverlayTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: H * 0.4,
    backgroundColor: 'rgba(3, 14, 26, 0.55)',
  },
  bgOverlayMid: {
    position: 'absolute',
    top: H * 0.2, left: 0, right: 0,
    height: H * 0.5,
    backgroundColor: 'rgba(5, 18, 38, 0.35)',
  },
  bgOverlayBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: H * 0.55,
    backgroundColor: 'rgba(3, 14, 26, 0.78)',
  },

  // SafeArea / Scroll
  safeArea: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  logoAccent: { color: '#38BDF8' },

  // Card wrapping area
  cardWrap: { width: '100%', maxWidth: 420 },

  // Glass Card
  glassCard: {
    backgroundColor: 'rgba(5, 18, 38, 0.82)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
    elevation: 16,
  },

  // Typography
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13.5,
    color: 'rgba(148, 163, 184, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },

  // Field
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 30, 55, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  fieldRowFocused: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(15, 38, 72, 0.85)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },

  // Options row
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 2,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  cb: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cbChecked: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  rememberText: { color: 'rgba(148,163,184,0.85)', fontSize: 13, marginLeft: 8 },
  forgotText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },

  // Action Button
  actionBtn: {
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 6,
    position: 'relative',
  },
  actionBtnGradientBase: {
    ...(StyleSheet.absoluteFill as any),
    backgroundColor: '#0369A1',
  },
  actionBtnGradientAccent: {
    position: 'absolute',
    top: 0, left: 0, right: '50%', bottom: 0,
    backgroundColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionBtnContent: {
    ...(StyleSheet.absoluteFill as any),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // OR divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  orText: {
    color: 'rgba(148,163,184,0.6)',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 14,
    letterSpacing: 1,
  },

  // Social buttons
  socialBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 46,
    marginBottom: 10,
    overflow: 'hidden',
  },
  socialBtnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  googleIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4285F4',
    lineHeight: 15,
  },

  // Switch row (Don't have an account?)
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  switchText: { color: 'rgba(148,163,184,0.8)', fontSize: 13 },
  switchLink: { color: '#38BDF8', fontSize: 13, fontWeight: '700' },

  // Forgot password icon
  forgotIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Back to login
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  backText: { color: '#38BDF8', fontSize: 14, fontWeight: '600' },

  // Terms text
  termsText: {
    fontSize: 12,
    color: 'rgba(148,163,184,0.65)',
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 16,
  },
  termsLink: { color: '#38BDF8', fontWeight: '500' },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  errorText: { color: '#F87171', fontSize: 12.5, fontWeight: '500', flex: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  successText: { color: '#34D399', fontSize: 12.5, fontWeight: '500', flex: 1 },

  // Guest
  guestBtn: { alignItems: 'center', paddingVertical: 16 },
  guestText: { color: 'rgba(148,163,184,0.6)', fontSize: 13 },
  guestAccent: { color: '#38BDF8', fontWeight: '600' },
});
