/**
 * SignUpScreen — v2
 *
 * Full profile capture at registration:
 *   - Display Name
 *   - Date of Birth (DD-MM-YYYY auto-mask, age ≥ 13 check)
 *   - Phone + Country Code (react-native-country-picker-modal)
 *   - Email (optional — linked via AddEmailScreen after OTP)
 *   - Password + Confirm Password
 *
 * On success: navigates to OtpGate for phone verification.
 */
import React, {useState, useCallback} from 'react';
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
import CountryPicker, {
  Country,
  CountryCode,
} from 'react-native-country-picker-modal';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../contexts/AuthContext';
import {useTheme} from '../../contexts/ThemeContext';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING} from '../../theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../../navigation/AuthStack';
import {useNavigation} from '@react-navigation/native';

// ─── DOB helpers (matches EditProfileModal) ────────────────────────────────────
function maskDob(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function dobToIso(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDob(display: string): boolean {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return false;
  const day   = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year  = parseInt(digits.slice(4, 8), 10);
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  return true;
}

/** Returns age in years from a DD-MM-YYYY string. Returns null if invalid. */
function ageFromDob(display: string): number | null {
  const iso = dobToIso(display);
  if (!iso) return null;
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function SignUpScreen() {
  const navigation = useNavigation<NavProp>();
  const {signUpWithPhone} = useAuth();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;

  // ── Form fields ──────────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // ── Country picker ───────────────────────────────────────────────────────────
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [phoneLocal, setPhoneLocal] = useState(''); // digits after country code

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSelectCountry = useCallback((country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
  }, []);

  // Full E.164 phone: +{callingCode}{phoneLocal}
  const fullPhone = `+${callingCode}${phoneLocal.replace(/\D/g, '')}`;

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!displayName.trim()) return 'Please enter your display name.';
    if (!isValidDob(dob)) return 'Enter a valid date of birth (DD-MM-YYYY).';
    const age = ageFromDob(dob);
    if (age !== null && age < 13) return 'You must be at least 13 years old to sign up.';
    if (!phoneLocal.trim() || phoneLocal.replace(/\D/g, '').length < 5)
      return 'Enter a valid phone number.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!email.includes('@')) return 'Enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPw) return 'Passwords do not match.';
    return null;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);

    const isoDate = dobToIso(dob)!;

    const {error: authError} = await signUpWithPhone({
      phone: fullPhone,
      password,
      displayName: displayName.trim(),
      dateOfBirth: isoDate,
      email: email.trim(),
    });
    setLoading(false);

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('duplicate') ||
        msg.includes('already in use') ||
        msg.includes('already exists')
      ) {
        setError('This phone number is already registered. Try signing in instead.');
      } else if (msg.includes('rate') || msg.includes('security purposes')) {
        setError('Too many sign-up attempts. Please wait a minute and try again.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setError('Connection error. Check your internet and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } else {
      // Supabase sends SMS OTP — navigate to the verification screen with email
      navigation.navigate('OtpGate', {
        phone: fullPhone,
        email: email.trim(),
      });
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
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
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.logoBg}>
            <Icon name="account-plus" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.brandTitle}>Create Account</Text>
          <Text style={styles.brandSubtitle}>Let's get to know you</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={14} color={currentTheme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Display Name ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <View style={styles.inputWrap}>
              <Icon name="account-outline" size={20} color={currentTheme.textMuted} />
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={v => { setDisplayName(v); setError(''); }}
                placeholder="Your name"
                placeholderTextColor={currentTheme.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* ── Date of Birth ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.inputWrap}>
              <Icon name="calendar-outline" size={20} color={currentTheme.textMuted} />
              <TextInput
                style={styles.input}
                value={dob}
                onChangeText={raw => { setDob(maskDob(raw)); setError(''); }}
                placeholder="DD-MM-YYYY"
                placeholderTextColor={currentTheme.textMuted}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                maxLength={10}
              />
            </View>
          </View>

          {/* ── Phone + Country Code ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.phoneRow}>
              {/* Country Picker trigger */}
              <TouchableOpacity
                style={styles.countryBtn}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.7}>
                <CountryPicker
                  theme={{
                    backgroundColor: currentTheme.cardBg,
                    onBackgroundTextColor: currentTheme.textMain,
                    fontSize: 15,
                    filterPlaceholderTextColor: currentTheme.textMuted,
                  }}
                  countryCode={countryCode}
                  withFilter
                  withFlag
                  withCallingCode
                  withAlphaFilter
                  withEmoji
                  onSelect={onSelectCountry}
                  visible={pickerVisible}
                  onClose={() => setPickerVisible(false)}
                  containerButtonStyle={styles.countryPickerContainer}
                />
                <Text style={styles.callingCode}>+{callingCode}</Text>
                <Icon name="chevron-down" size={16} color={currentTheme.textMuted} />
              </TouchableOpacity>

              {/* Phone digits */}
              <View style={[styles.inputWrap, styles.phoneInput]}>
                <TextInput
                  style={styles.input}
                  value={phoneLocal}
                  onChangeText={v => { setPhoneLocal(v); setError(''); }}
                  placeholder="98765 43210"
                  placeholderTextColor={currentTheme.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* ── Email ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
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
              />
            </View>
          </View>

          {/* ── Password ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Icon name="lock-outline" size={20} color={currentTheme.textMuted} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                placeholder="Min. 6 characters"
                placeholderTextColor={currentTheme.textMuted}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)}>
                <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={currentTheme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Confirm Password ── */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrap}>
              <Icon name="lock-check-outline" size={20} color={currentTheme.textMuted} />
              <TextInput
                style={styles.input}
                value={confirmPw}
                onChangeText={v => { setConfirmPw(v); setError(''); }}
                placeholder="Re-enter password"
                placeholderTextColor={currentTheme.textMuted}
                secureTextEntry={!showPw}
              />
            </View>
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>
              Already have an account?{' '}
              <Text style={styles.linkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {flex: 1, backgroundColor: theme.background},
    scrollContent: {
      flexGrow: 1, paddingHorizontal: SPACING.lg,
      paddingBottom: 40, paddingTop: 24,
    },

    // Brand
    brandContainer: {alignItems: 'center', marginBottom: 24},
    logoBg: {
      width: 72, height: 72, borderRadius: RADIUS.xl,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: SPACING.md, ...SHADOWS.card, shadowOpacity: isDark ? 0 : 0.08,
    },
    brandTitle: {fontSize: 26, fontWeight: '800', color: theme.textMain, letterSpacing: -0.3},
    brandSubtitle: {fontSize: 14, color: theme.textMuted, marginTop: 4},

    // Form card
    formCard: {backgroundColor: theme.cardBg, borderRadius: RADIUS['2xl'], padding: SPACING.lg, ...SHADOWS.soft, shadowOpacity: isDark ? 0.2 : 0.05},

    // Error
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderRadius: RADIUS.lg,
      padding: SPACING.sm, marginBottom: SPACING.md,
    },
    errorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500'},

    // Inputs
    inputGroup: {marginBottom: SPACING.md},
    inputLabel: {fontSize: 13, fontWeight: '600', color: theme.textMain, marginBottom: 6},
    optionalLabel: {fontSize: 12, fontWeight: '400', color: theme.textMuted},
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: isDark ? theme.background : '#f8fafc', borderWidth: 1, borderColor: theme.border,
      borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 50, gap: 10,
    },
    input: {flex: 1, fontSize: 15, color: theme.textMain, height: '100%'},

    // Phone row
    phoneRow: {flexDirection: 'row', gap: 8},
    countryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: isDark ? theme.background : '#f8fafc', borderWidth: 1, borderColor: theme.border,
      borderRadius: RADIUS.lg, paddingHorizontal: SPACING.sm, height: 50,
    },
    countryPickerContainer: {marginRight: 0},
    callingCode: {fontSize: 15, fontWeight: '600', color: theme.textMain},
    phoneInput: {flex: 1},

    // Buttons
    primaryBtn: {
      backgroundColor: theme.primary, borderRadius: RADIUS.lg, height: 52,
      alignItems: 'center', justifyContent: 'center',
      marginTop: SPACING.xs, ...SHADOWS.fab,
    },
    primaryBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
    btnDisabled: {opacity: 0.65},
    secondaryBtn: {alignItems: 'center', marginTop: SPACING.lg},
    secondaryBtnText: {fontSize: 14, color: theme.textMuted},
    linkText: {color: theme.primary, fontWeight: '700'},
  });
};
