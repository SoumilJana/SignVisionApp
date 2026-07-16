/**
 * AddEmailScreen — Optional email linking after phone signup
 *
 * User can enter an email (Supabase sends a verification email)
 * or skip and go straight to the main app.
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING} from '../../theme';
import {useRoute, RouteProp} from '@react-navigation/native';
import type {AuthStackParamList} from '../../navigation/AuthStack';

type RoutePropT = RouteProp<AuthStackParamList, 'AddEmail'>;

export default function AddEmailScreen() {
  const route = useRoute<RoutePropT>();
  const {addEmailToAccount} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;

  // Pre-fill from the param passed by OtpGateScreen (originally entered in SignUpScreen)
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLinkEmail = async () => {
    setError('');
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    const {error: e} = await addEmailToAccount(trimmed);
    setLoading(false);
    if (e) {
      if (e.toLowerCase().includes('already'))
        setError('This email is already linked to another account.');
      else setError(e);
    } else {
      setSuccess(true);
    }
  };

  // After successful link, show confirmation + auto-proceed
  // (the user object updates via onAuthStateChange — AppNavigator
  //  sees phoneVerified=true, no mfaSetupRequired → MainTabs)
  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <LinearGradient
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.iconCircle}>
            <Icon name="email-check-outline" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Verification Sent!</Text>
          <Text style={styles.subtitle}>
            Check your inbox at{'\n'}
            <Text style={{fontWeight: '700'}}>{email.trim()}</Text>
            {'\n'}and tap the link to verify.
          </Text>
          <Text style={styles.noteText}>
            You can verify later — your account is ready to use.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <LinearGradient
          colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
          style={styles.iconCircle}>
          <Icon name="email-plus-outline" size={36} color="#fff" />
        </LinearGradient>
        <Text style={styles.title}>Add Your Email</Text>
        <Text style={styles.subtitle}>
          Link an email for password recovery{'\n'}and notifications. You can skip this.
        </Text>

        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={14} color={currentTheme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <Icon name="email-outline" size={20} color={currentTheme.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              placeholder="your@email.com"
              placeholderTextColor={currentTheme.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLinkEmail}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Link Email</Text>}
          </TouchableOpacity>

          {/* Skip — let AppNavigator do its job, phoneVerified is already true */}
          <TouchableOpacity style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    noteText: {fontSize: 13, color: theme.textMuted, textAlign: 'center', marginTop: SPACING.lg, lineHeight: 18},
    formCard: {backgroundColor: theme.cardBg, borderRadius: RADIUS['2xl'], padding: SPACING.lg, width: '100%', ...SHADOWS.soft, shadowOpacity: isDark ? 0.2 : 0.05},
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.sm,
    },
    errorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500'},
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? theme.background : '#f8fafc', borderWidth: 1, borderColor: theme.border,
      borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 50, gap: 10,
      marginBottom: SPACING.md,
    },
    input: {flex: 1, fontSize: 15, color: theme.textMain, height: '100%'},
    primaryBtn: {
      backgroundColor: theme.primary, borderRadius: RADIUS.lg, height: 52,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.fab,
    },
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    btnDisabled: {opacity: 0.65},
    skipBtn: {alignItems: 'center', marginTop: SPACING.lg},
    skipText: {fontSize: 14, fontWeight: '600', color: theme.textMuted},
  });
};
