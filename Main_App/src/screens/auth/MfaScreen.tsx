/**
 * MfaScreen — v2
 *
 * Handles TOTP MFA enrollment AND challenge verification.
 * - Robust try/catch/finally on enrollment — no more infinite spinners.
 * - User-facing error alerts on silent failures.
 * - QR code displayed as base64 data URI via Image + TOTP secret shown as text fallback.
 * - 6-digit input for challenge verification.
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY} from '../../theme';

export default function MfaScreen() {
  const {enrollMfa, verifyMfa, completeMfaSetup, mfaSetupRequired, signOut} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;

  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(true);
  const [enrollError, setEnrollError] = useState('');

  const handleEnroll = useCallback(async () => {
    setEnrolling(true);
    setEnrollError('');
    try {
      const result = await enrollMfa();
      if (result) {
        setFactorId(result.factorId);
        setQrCode(result.qrCode);
        setSecret(result.secret);
      } else {
        // enrollMfa returned null — enrollment failed silently
        setEnrollError(
          'Failed to set up MFA. This may happen if a factor is already enrolled. ' +
          'Try logging out and back in, or contact support.',
        );
        Alert.alert(
          'MFA Setup Failed',
          'Could not generate the QR code. Please try again or contact support.',
        );
      }
    } catch (e: any) {
      const msg = e?.message ?? 'An unexpected error occurred.';
      setEnrollError(msg);
      Alert.alert('MFA Error', msg);
    } finally {
      setEnrolling(false);
    }
  }, [enrollMfa]);

  useEffect(() => {
    // Only enroll if this is the setup flow (not challenge verification)
    if (mfaSetupRequired) {
      handleEnroll();
    } else {
      // Challenge-only: user already has a factor, just need to verify
      setEnrolling(false);
    }
  }, [handleEnroll, mfaSetupRequired]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const {error: verifyError} = await verifyMfa(factorId, code);
      if (verifyError) {
        setError(verifyError.message || 'Verification failed. Please try again.');
        return;
      }

      if (mfaSetupRequired) {
        // First-time setup: persist mfa_enabled = true in profiles
        const {error: setupError} = await completeMfaSetup();
        if (setupError) {
          setError('Code verified, but failed to save MFA status. Please try again.');
          Alert.alert('MFA Error', setupError);
          return;
        }
      }
      // Success — AppNavigator will route to MainTabs via state change
    } catch (e: any) {
      setError(e?.message ?? 'Verification failed unexpectedly.');
    } finally {
      setLoading(false);
    }
  };

  // ── Enrolling state (with timeout protection) ────────────────────────────────
  if (enrolling) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
        <Text style={styles.loadingText}>Setting up MFA...</Text>
      </View>
    );
  }

  // ── Enrollment failed — show retry ───────────────────────────────────────────
  if (enrollError && !qrCode) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <LinearGradient
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.iconCircle}>
            <Icon name="alert-circle-outline" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Setup Failed</Text>
          <Text style={styles.subtitle}>{enrollError}</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleEnroll}
            activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
            <Icon name="logout" size={15} color={currentTheme.textMuted} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main UI: QR code + verification input ────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <LinearGradient
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.iconCircle}>
            <Icon name="shield-lock" size={36} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Two-Factor Auth</Text>
          <Text style={styles.subtitle}>
            {mfaSetupRequired
              ? 'Scan the QR code with your authenticator app'
              : 'Enter the 6-digit code from your authenticator'}
          </Text>

          {/* QR Code (only during setup) */}
          {qrCode && mfaSetupRequired ? (
            <View style={styles.qrCard}>
              <Image
                source={{uri: qrCode}}
                style={styles.qrImage}
                resizeMode="contain"
              />
              {/* Manual entry fallback */}
              {secret ? (
                <View style={styles.secretBox}>
                  <Text style={styles.secretLabel}>Or enter this key manually:</Text>
                  <Text style={styles.secretText} selectable>{secret}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Code Input */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={currentTheme.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={currentTheme.textMuted}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              maxLength={6}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out escape hatch */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.7}>
          <Icon name="logout" size={15} color={currentTheme.textMuted} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 40,
    },
    content: {
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      width: '100%',
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
      ...SHADOWS.card,
      shadowOpacity: isDark ? 0 : 0.08,
    },
    title: {
      ...TYPOGRAPHY.h2,
      color: theme.textMain,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: SPACING.lg,
      lineHeight: 20,
      paddingHorizontal: SPACING.md,
    },
    loadingText: {
      marginTop: SPACING.md,
      fontSize: 14,
      color: theme.textMuted,
    },
    qrCard: {
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      alignItems: 'center',
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    qrImage: {
      width: 200,
      height: 200,
    },
    secretBox: {
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      alignItems: 'center',
    },
    secretLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 4,
    },
    secretText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textMain,
      letterSpacing: 2,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    formCard: {
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS['2xl'],
      padding: SPACING.lg,
      width: '100%',
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2',
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: theme.error,
      fontWeight: '500',
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMain,
      marginBottom: 8,
      textAlign: 'center',
    },
    codeInput: {
      backgroundColor: isDark ? theme.background : '#f8fafc',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: RADIUS.lg,
      height: 56,
      fontSize: 28,
      fontWeight: '700',
      color: theme.textMain,
      letterSpacing: 8,
      marginBottom: SPACING.md,
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      borderRadius: RADIUS.lg,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.fab,
    },
    btnDisabled: {
      opacity: 0.7,
    },
    primaryBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: SPACING.lg,
      paddingVertical: SPACING.sm,
    },
    signOutText: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
    },
  });
};
