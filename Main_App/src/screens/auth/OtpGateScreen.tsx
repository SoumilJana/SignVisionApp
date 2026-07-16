/**
 * OtpGateScreen
 *
 * Blocks new users until they verify their phone number via SMS OTP.
 * On success, phoneVerified is set to true, triggering AppNavigator to route to MainTabs.
 */
import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING} from '../../theme';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type NavProp  = NativeStackNavigationProp<AuthStackParamList, 'OtpGate'>;
type RoutePropT = RouteProp<AuthStackParamList, 'OtpGate'>;

export default function OtpGateScreen() {
  const route = useRoute<RoutePropT>();
  const {verifyPhoneOtp, signInWithPhone} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;

  // Phone passed from SignUpScreen
  const phone = route.params?.phone ?? '';

  const [code, setCode] = useState('');
  const [sending, setSending] = useState(true); // OTP send on mount
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Seconds until resend is allowed
  const [failCount, setFailCount] = useState(0); // Wrong attempts counter
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Send OTP immediately when screen mounts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {error: e} = await signInWithPhone(phone);
      if (cancelled) return;
      setSending(false);
      if (!e) {
        // OTP sent successfully — start the resend cooldown
        setCooldown(59);
      } else {
        setError('Failed to send code. Tap "Resend" to try again.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cooldown timer: decrement every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }
    setLoading(true);
    const {error: e} = await verifyPhoneOtp(phone, code);
    setLoading(false);
    if (e) {
      const msg = e.message.toLowerCase();
      const newFail = failCount + 1;
      setFailCount(newFail);
      if (msg.includes('expired')) {
        setError('Code expired. Tap "Resend" for a new one.');
      } else if (msg.includes('invalid')) {
        setError(newFail >= 3
          ? 'Too many incorrect attempts. Tap "Resend" for a new code.'
          : 'Incorrect code. Please try again.');
      } else if (msg.includes('rate') || msg.includes('security purposes') || msg.includes('too many')) {
        setError('Too many attempts. Please wait a minute before trying again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } else {
      // Phone verified → phoneVerified = true in auth state triggers AppNavigator to route to MainTabs
      // No explicit navigation needed; AppNavigator handles the routing
    }
  }, [code, phone, verifyPhoneOtp]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError('');
    setResendMsg('');
    const {error: e} = await signInWithPhone(phone);
    setResending(false);
    if (e) {
      const m = e.message.toLowerCase();
      if (m.includes('rate') || m.includes('security purposes') || m.includes('too many'))
        setError('Too many requests. Please wait a minute before resending.');
      else
        setError('Failed to send code. Please try again.');
    } else {
      setResendMsg('New code sent!');
      setCooldown(59); // Start cooldown after successful resend
      setFailCount(0); // Reset attempt counter on successful resend
    }
  }, [phone, signInWithPhone]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
          style={styles.iconCircle}>
          <Icon name="cellphone-message" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={{fontWeight: '700'}}>{phone}</Text>
        </Text>

        <View style={styles.formCard}>
          {sending ? (
            <View style={styles.infoBox}>
              <ActivityIndicator color={currentTheme.primary} size="small" />
              <Text style={styles.infoText}>Sending OTP…</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={14} color={currentTheme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {resendMsg ? (
            <View style={styles.successBox}>
              <Icon name="check-circle" size={14} color="#16a34a" />
              <Text style={styles.successText}>{resendMsg}</Text>
            </View>
          ) : null}

          <TextInput
            ref={inputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            placeholder="000000"
            placeholderTextColor={currentTheme.textMuted}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (loading || sending) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading || sending}
            activeOpacity={0.85}>
            {loading || sending
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Verify</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleResend} disabled={resending || cooldown > 0}>
              <Text style={[styles.linkText, (resending || cooldown > 0) && styles.linkTextDisabled]}>
                {resending
                  ? 'Sending…'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center'},
    content: {paddingHorizontal: SPACING.lg, alignItems: 'center', width: '100%'},
    iconCircle: {
      width: 80, height: 80, borderRadius: 40,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACING.md, ...SHADOWS.card, shadowOpacity: isDark ? 0 : 0.08,
    },
    title: {fontSize: 24, fontWeight: '800', color: theme.textMain, marginBottom: 4},
    subtitle: {fontSize: 14, color: theme.textMuted, textAlign: 'center', marginBottom: SPACING.lg, lineHeight: 20},
    formCard: {backgroundColor: theme.cardBg, borderRadius: RADIUS['2xl'], padding: SPACING.lg, width: '100%', ...SHADOWS.soft, shadowOpacity: isDark ? 0.2 : 0.05},
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.sm,
    },
    errorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500'},
    successBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#052e16' : '#f0fdf4', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.sm,
    },
    successText: {flex: 1, fontSize: 13, color: '#16a34a', fontWeight: '500'},
    infoBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.sm,
    },
    infoText: {flex: 1, fontSize: 13, color: theme.primary, fontWeight: '500'},
    codeInput: {
      backgroundColor: isDark ? theme.background : '#f8fafc', borderWidth: 1, borderColor: theme.border,
      borderRadius: RADIUS.lg, height: 60, fontSize: 28, fontWeight: '700',
      color: theme.textMain, letterSpacing: 10, paddingLeft: 10, marginBottom: SPACING.md,
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: theme.primary, borderRadius: RADIUS.lg, height: 52,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.fab,
    },
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    btnDisabled: {opacity: 0.65},
    footer: {alignItems: 'center', marginTop: SPACING.lg},
    linkText: {fontSize: 14, fontWeight: '600', color: theme.primary},
    linkTextDisabled: {color: theme.textMuted, opacity: 0.6},
  });
};
