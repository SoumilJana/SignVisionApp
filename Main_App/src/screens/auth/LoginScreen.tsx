/**
 * LoginScreen — Entry Point
 *
 * Three distinct paths:
 *   1. "Login"          → ReturningLoginScreen
 *   2. "Create Account" → SignUpScreen
 *   3. "Continue with Google" → Google OAuth
 */
import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {FeatureGate} from '../../components/FeatureGate';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING} from '../../theme';

export default function LoginScreen() {
  const navigation = useNavigation();
  const {signInWithGoogle, devLogin} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    const {error} = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) setGoogleError(error);
  };

  return (
    <View style={styles.container}>
      {/* Brand */}
      <View style={styles.brandContainer}>
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          style={styles.logoBg}>
          <Icon name="hand-wave" size={40} color="#fff" />
        </LinearGradient>
        <Text style={styles.brandTitle}>SignVision</Text>
        <Text style={styles.brandSubtitle}>Sign language, simplified</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsCard}>
        {/* Login */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ReturningLogin' as never)}>
          <Icon name="login" size={20} color="#fff" style={styles.btnIcon} />
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>

        {/* Create Account */}
        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SignUp' as never)}>
          <Icon name="account-plus-outline" size={20} color={COLORS.primary} style={styles.btnIcon} />
          <Text style={styles.outlineBtnText}>Create Account</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google */}
        {googleError ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{googleError}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
          onPress={handleGoogle}
          disabled={googleLoading}
          activeOpacity={0.85}>
          {googleLoading ? (
            <ActivityIndicator color={COLORS.textMain} />
          ) : (
            <>
              <View style={styles.googleIconCircle}>
                <Text style={styles.googleIconText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Dev bypass — only visible to users with dev_mode flag (dev/admin role) */}
        <FeatureGate flag="dev_mode">
          {devLogin ? (
            <TouchableOpacity style={styles.devBtn} onPress={devLogin} activeOpacity={0.7}>
              <Text style={styles.devBtnText}>⚡ Skip to App (Dev / Admin)</Text>
            </TouchableOpacity>
          ) : null}
        </FeatureGate>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: theme.background,
      justifyContent: 'center', paddingHorizontal: SPACING.lg,
    },

    // Brand
    brandContainer: {alignItems: 'center', marginBottom: 40},
    logoBg: {
      width: 80, height: 80, borderRadius: RADIUS.xl,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACING.md, ...SHADOWS.card,
      shadowOpacity: isDark ? 0 : 0.08,
    },
    brandTitle: {fontSize: 32, fontWeight: '800', color: theme.textMain, letterSpacing: -0.5},
    brandSubtitle: {fontSize: 15, color: theme.textMuted, marginTop: 4},

    // Card
    buttonsCard: {
      backgroundColor: theme.cardBg, borderRadius: RADIUS['2xl'],
      padding: SPACING.lg, ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },

    // Buttons
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.primary, borderRadius: RADIUS.lg,
      height: 52, marginBottom: SPACING.sm, ...SHADOWS.fab,
    },
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    outlineBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: RADIUS.lg, height: 52, marginBottom: SPACING.md,
      borderWidth: 1.5, borderColor: theme.primary, backgroundColor: 'transparent',
    },
    outlineBtnText: {color: theme.primary, fontSize: 16, fontWeight: '700'},
    btnIcon: {marginRight: 8},
    btnDisabled: {opacity: 0.65},

    // Divider
    divider: {flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md},
    dividerLine: {flex: 1, height: 1, backgroundColor: theme.border},
    dividerText: {marginHorizontal: SPACING.sm, fontSize: 13, color: theme.textMuted, fontWeight: '500'},

    // Google
    googleBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
      height: 52, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: theme.border,
      backgroundColor: isDark ? 'transparent' : '#fff', marginBottom: SPACING.sm, ...SHADOWS.soft,
      shadowOpacity: isDark ? 0 : 0.05,
    },
    googleIconCircle: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
    },
    googleIconText: {color: '#fff', fontSize: 14, fontWeight: '800'},
    googleBtnText: {fontSize: 15, fontWeight: '600', color: theme.textMain},

    // Error
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.sm,
    },
    errorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500'},

    // Dev
    devBtn: {
      alignItems: 'center', marginTop: SPACING.xs, paddingVertical: 12,
      borderRadius: RADIUS.lg, borderWidth: 1, borderColor: isDark ? '#b45309' : '#f59e0b',
      borderStyle: 'dashed', backgroundColor: isDark ? '#451a03' : '#fffbeb',
    },
    devBtnText: {fontSize: 14, fontWeight: '600', color: isDark ? '#fcd34d' : '#d97706'},
  });
};
