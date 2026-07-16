/**
 * ReturningLoginScreen
 *
 * Returning users: single form with Phone-or-Email + Password.
 * Auto-detects input format and calls the appropriate Supabase auth function.
 */
import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {deriveAuthEmailFromPhone} from '../../lib/supabase';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING} from '../../theme';

/** Simple heuristic: starts with + and has mostly digits → phone */
function looksLikePhone(input: string): boolean {
  return /^\+?\d[\d\s\-()]{6,}$/.test(input.trim());
}

export default function ReturningLoginScreen() {
  const navigation = useNavigation();
  const {signInWithEmail, signInWithPhonePassword} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    const trimmed = identity.trim();
    if (!trimmed) { setError('Enter your email or phone number.'); return; }
    if (!password) { setError('Enter your password.'); return; }

    setLoading(true);

    if (looksLikePhone(trimmed)) {
      const cleanPhone = trimmed.replace(/[\s\-()]/g, '');
      const {error: e} = await signInWithPhonePassword(cleanPhone, password);
      setLoading(false);
      if (e) {
        const msg = e.message.toLowerCase();
        if (msg.includes('invalid') || msg.includes('credentials'))
          setError('Incorrect phone number or password.');
        else if (msg.includes('network') || msg.includes('fetch'))
          setError('Connection error. Check your internet and try again.');
        else
          setError('Something went wrong. Please try again.');
      }
      // On success: onAuthStateChange fires → AppNavigator routes to MainTabs automatically
    } else {
      // Email login
      const {error: e} = await signInWithEmail(trimmed, password);
      setLoading(false);
      if (e) {
        const msg = e.message.toLowerCase();
        if (msg.includes('invalid login') || msg.includes('credentials'))
          setError('Incorrect email or password. If you signed up with Google, use the "Continue with Google" button on the previous screen.');
        else if (msg.includes('not confirmed'))
          setError('Please verify your email first. Check your inbox for a confirmation link.');
        else if (msg.includes('network') || msg.includes('fetch'))
          setError('Connection error. Check your internet and try again.');
        else
          setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Brand */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.logoBg}>
            <Icon name="login" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>Welcome Back</Text>
          <Text style={styles.brandSubtitle}>Sign in with your phone or email</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone or Email</Text>
            <View style={styles.inputWrap}>
              <Icon name="account-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={identity}
                onChangeText={v => { setIdentity(v); setError(''); }}
                placeholder="+91… or you@email.com"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Icon name="lock-outline" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                <Icon
                  name={showPw ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>
              <Icon name="arrow-left" size={14} color={COLORS.textMuted} /> Back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {flex: 1, backgroundColor: theme.background},
    scrollContent: {
      flexGrow: 1, paddingHorizontal: SPACING.lg,
      justifyContent: 'center', paddingVertical: 40,
    },
    brandContainer: {alignItems: 'center', marginBottom: 32},
    logoBg: {
      width: 72, height: 72, borderRadius: RADIUS.xl,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACING.md, ...SHADOWS.card,
      shadowOpacity: isDark ? 0 : 0.08,
    },
    brandTitle: {fontSize: 26, fontWeight: '800', color: theme.textMain, letterSpacing: -0.3},
    brandSubtitle: {fontSize: 14, color: theme.textMuted, marginTop: 4},
    formCard: {backgroundColor: theme.cardBg, borderRadius: RADIUS['2xl'], padding: SPACING.lg, ...SHADOWS.soft, shadowOpacity: isDark ? 0.2 : 0.05},
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.md,
    },
    errorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500'},
    inputGroup: {marginBottom: SPACING.md},
    inputLabel: {fontSize: 13, fontWeight: '600', color: theme.textMain, marginBottom: 6},
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? theme.background : '#f8fafc', borderWidth: 1, borderColor: theme.border,
      borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 50, gap: 10,
    },
    input: {flex: 1, fontSize: 15, color: theme.textMain, height: '100%'},
    primaryBtn: {
      backgroundColor: theme.primary, borderRadius: RADIUS.lg, height: 52,
      alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xs, ...SHADOWS.fab,
    },
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    btnDisabled: {opacity: 0.65},
    secondaryBtn: {alignItems: 'center', marginTop: SPACING.lg},
    secondaryBtnText: {fontSize: 14, color: theme.textMuted, fontWeight: '500'},
  });
};
