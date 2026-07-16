import React from 'react';
import {StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Pressable, TextInput} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY} from '../theme';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import EditProfileModal from '../components/profile/EditProfileModal';
import {ProfileData} from '../types/profile';
import {useUserTier} from '../hooks/useUserTier';
import {supabase} from '../lib/supabase';



export default function ProfileScreen() {
  const {user, addEmailToAccount, resendVerificationEmail, signOut, addPhoneToAccount, verifyPhoneOtp} = useAuth();
  const {isPro, isLoading: tierLoading} = useUserTier();

  const emailVerified = !!user?.email_confirmed_at;
  const emailLinkedToAuth = !!user?.email;
  const {isDark, toggleTheme} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const [linking, setLinking] = React.useState(false);

  // Profile data from Supabase (phone, email, display_name, date_of_birth)
  const [profileEmail, setProfileEmail] = React.useState<string | null>(null);
  const [profilePhone, setProfilePhone] = React.useState<string | null>(null);

  // Profile data loading state
  const [profileLoading, setProfileLoading] = React.useState(true);

  // Phone OTP verification state (for Google/email users adding a phone)
  const [pendingPhone, setPendingPhone] = React.useState<string | null>(null);
  const [phoneOtpCode, setPhoneOtpCode] = React.useState('');
  const [verifyingPhone, setVerifyingPhone] = React.useState(false);
  const [phoneOtpError, setPhoneOtpError] = React.useState('');
  const [phoneOtpFailCount, setPhoneOtpFailCount] = React.useState(0);

  // Edit profile modal state
  const [editVisible, setEditVisible] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileData>({
    display_name: '',
    date_of_birth: '',
    language: 'English (ASL)',
  });

  // Fetch real profile data from Supabase on mount
  React.useEffect(() => {
    if (!user?.id) return;

    const applyProfileData = (data: {display_name?: string; date_of_birth?: string; language?: string; email?: string; phone?: string}) => {
      const displayDob = data.date_of_birth
        ? data.date_of_birth.split('-').reverse().join('-')
        : '';
      setProfile(prev => ({
        ...prev,
        display_name: data.display_name || 'User',
        date_of_birth: displayDob,
        language: data.language || 'English (ASL)',
      }));
      setProfileEmail(data.email ?? null);
      setProfilePhone(data.phone ?? null);
    };

    supabase
      .from('profiles')
      .select('display_name, date_of_birth, language, email, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(async ({data}) => {
        if (data) {
          applyProfileData(data);
          setProfileLoading(false);
          return;
        }

        // No profile row — create one from auth metadata (trigger may have missed this user)
        const meta = user.user_metadata ?? {};
        const displayName = meta.display_name || meta.full_name || meta.name || '';
        const email = meta.email || user.email || null;
        const phone = meta.phone_number || user.phone || null;
        const dob = meta.date_of_birth || null;

        const row = {
          id: user.id,
          display_name: displayName,
          date_of_birth: dob,
          email,
          phone,
          language: 'English (ASL)',
          role: 'free',
          mfa_enabled: false,
        };
        await supabase.from('profiles').upsert(row, {onConflict: 'id'});
        applyProfileData(row);
        setProfileLoading(false);
      });
  }, [user?.id]);

  const displayName = profile.display_name;

  // Phone formatter: +919432938110 → +91 9432938110
  const formatPhoneDisplay = (e164: string): string => {
    if (!e164 || !e164.startsWith('+')) return e164;
    const match = e164.match(/^(\+\d{1,3})(\d+)$/);
    if (!match) return e164;
    return `${match[1]} ${match[2]}`;
  };

  const phone = profilePhone ? formatPhoneDisplay(profilePhone) : null;
  const email = profileEmail;

  // Email verification tap handler
  const handleVerifyBadgeTap = async () => {
    if (!email || linking) return;
    setLinking(true);
    if (!emailLinkedToAuth) {
      // First time: link email to auth → Supabase sends verification email
      const {error} = await addEmailToAccount(email);
      setLinking(false);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Verification Email Sent', `Check your inbox at ${email} and tap the link to verify.`);
      }
    } else {
      // Already linked but not verified: resend verification email
      const {error} = await resendVerificationEmail();
      setLinking(false);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Email Resent', 'Check your inbox.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{displayName}</Text>
          </View>
        </View>

        {/* Profile Hero Card — tap to edit */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setEditVisible(true)}
          style={styles.heroCardTouchable}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.heroCard}>
            <View style={styles.heroBlur1} />
            <View style={styles.heroBlur2} />

            {/* Edit hint icon */}
            <Icon
              name="pencil-outline"
              size={18}
              color="rgba(255,255,255,0.7)"
              style={styles.editHintIcon}
            />

            <View style={styles.heroContent}>
              {/* Avatar */}
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Icon name="account" size={40} color="#fff" />
                </View>
              </View>
              <Text style={styles.heroName}>{displayName}</Text>
              <View style={[styles.proBadge, !isPro && styles.proBadgeFree]}>
                <Icon
                  name={isPro ? 'check-decagram' : 'account-outline'}
                  size={14}
                  color="#fff"
                />
                <Text style={styles.proBadgeText}>
                  {tierLoading ? '…' : isPro ? 'Pro Member' : 'Free Member'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Your Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Details</Text>
          <View style={styles.detailsCard}>
            {profileLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading your details…</Text>
              </View>
            ) : (
              <>
            {/* Phone */}
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <View style={styles.detailIcon}>
                <Icon name="phone-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{phone || 'Not set'}</Text>
              </View>
            </View>

            {/* Email + verification badge (tappable if not verified) */}
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <View style={styles.detailIcon}>
                <Icon name="email-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Email</Text>
                <View style={styles.emailValueRow}>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {email || 'Not set'}
                  </Text>
                  {email && !emailVerified ? (
                    <TouchableOpacity
                      style={[styles.verifiedBadge, styles.unverifiedBadge]}
                      onPress={handleVerifyBadgeTap}
                      disabled={linking}
                      activeOpacity={0.75}>
                      {linking ? (
                        <ActivityIndicator size={10} color="#d97706" />
                      ) : (
                        <>
                          <Icon name="alert-circle-outline" size={12} color="#d97706" />
                          <Text style={[styles.verifiedText, styles.unverifiedText]}>
                            Tap to Verify
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : email && emailVerified ? (
                    <View style={styles.verifiedBadge}>
                      <Icon name="check-circle" size={12} color="#16a34a" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* DOB */}
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <View style={styles.detailIcon}>
                <Icon name="calendar-month-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{profile.date_of_birth || 'Not set'}</Text>
              </View>
            </View>

            {/* Language */}
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon name="translate" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Language</Text>
                <Text style={styles.detailValue}>{profile.language}</Text>
              </View>
            </View>
              </>
            )}
          </View>
        </View>

        {/* Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="trophy-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Current Plan</Text>
              <Text style={styles.detailValue}>
                {tierLoading ? 'Loading…' : isPro ? 'Pro Plan' : 'Free Plan'}
              </Text>
            </View>
          </View>
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <Icon name="weather-night" size={18} color={COLORS.textMuted} />
            </View>
            <Text style={styles.toggleLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{false: '#e2e8f0', true: COLORS.primary}}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutCard}
          activeOpacity={0.8}
          onPress={() =>
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Sign Out', style: 'destructive', onPress: signOut},
            ])
          }>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, styles.signOutIconBg]}>
              <Icon name="logout" size={18} color={isDark ? DARK_COLORS.error : COLORS.error} />
            </View>
            <Text style={styles.signOutText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          visible={editVisible}
          userId={user.id}
          initialData={profile}
          onClose={() => setEditVisible(false)}
          onSaved={async updated => {
            setProfile(updated);
            if (updated.phone && updated.phone !== profilePhone) {
              const {error} = await addPhoneToAccount(updated.phone);
              if (error) {
                Alert.alert('Error', error.message ?? 'Failed to send OTP.');
              } else {
                setPendingPhone(updated.phone);
                setPhoneOtpCode('');
                setPhoneOtpError('');
                setPhoneOtpFailCount(0);
              }
            }
          }}
        />
      )}

      {/* Inline Phone OTP Verification Modal (for Google/email users adding a phone) */}
      {pendingPhone ? (
        <Modal
          visible
          animationType="slide"
          transparent
          onRequestClose={() => setPendingPhone(null)}>
          <KeyboardAvoidingView
            style={styles.otpOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={styles.otpBackdrop} onPress={() => setPendingPhone(null)} />
            <View style={styles.otpSheet}>
              <Text style={styles.otpTitle}>Verify Phone</Text>
              <Text style={styles.otpSubtitle}>
                Enter the 6-digit code sent to {pendingPhone}
              </Text>
              {phoneOtpError ? (
                <View style={styles.otpErrorBox}>
                  <Icon name="alert-circle" size={14} color={COLORS.error} />
                  <Text style={styles.otpErrorText}>{phoneOtpError}</Text>
                </View>
              ) : null}
              <TextInput
                style={styles.otpInput}
                value={phoneOtpCode}
                onChangeText={v => {
                  setPhoneOtpCode(v.replace(/\D/g, '').slice(0, 6));
                  setPhoneOtpError('');
                }}
                placeholder="000000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                maxLength={6}
                textAlign="center"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.otpBtn, verifyingPhone && styles.otpBtnDisabled]}
                disabled={verifyingPhone}
                activeOpacity={0.85}
                onPress={async () => {
                  if (phoneOtpCode.length !== 6) {
                    setPhoneOtpError('Enter the 6-digit code.');
                    return;
                  }
                  setVerifyingPhone(true);
                  const {error} = await verifyPhoneOtp(pendingPhone, phoneOtpCode, 'phone_change');
                  setVerifyingPhone(false);
                  if (error) {
                    const msg = error.message.toLowerCase();
                    const newFail = phoneOtpFailCount + 1;
                    setPhoneOtpFailCount(newFail);
                    if (msg.includes('expired'))
                      setPhoneOtpError('Code expired. Tap "Resend Code" for a new one.');
                    else if (msg.includes('invalid'))
                      setPhoneOtpError(newFail >= 3
                        ? 'Too many incorrect attempts. Tap "Resend Code" for a new one.'
                        : 'Incorrect code. Please try again.');
                    else if (msg.includes('rate') || msg.includes('security purposes'))
                      setPhoneOtpError('Too many attempts. Please wait a minute then resend.');
                    else
                      setPhoneOtpError('Something went wrong. Please try again.');
                  } else {
                    setProfilePhone(pendingPhone);
                    setPendingPhone(null);
                    Alert.alert('Phone Verified', 'Your phone number has been added to your account.');
                  }
                }}>
                {verifyingPhone ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.otpBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.otpResendBtn}
                onPress={async () => {
                  const {error} = await addPhoneToAccount(pendingPhone!);
                  if (error) {
                    const m = error.message.toLowerCase();
                    setPhoneOtpError(
                      m.includes('rate') || m.includes('security purposes')
                        ? 'Too many requests. Please wait a minute.'
                        : 'Failed to resend. Please try again.',
                    );
                  } else {
                    setPhoneOtpCode('');
                    setPhoneOtpError('');
                    setPhoneOtpFailCount(0);
                    Alert.alert('Code Sent', 'A new verification code has been sent.');
                  }
                }}>
                <Text style={styles.otpResendText}>Resend Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPendingPhone(null)}
                style={styles.otpCancelBtn}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;
  
  const bg = theme.background;
  const cardBg = theme.cardBg;
  const textMain = theme.textMain;
  const textMuted = theme.textMuted;
  const border = theme.border;
  const iconBg = isDark ? theme.primaryLight : COLORS.primaryLight;
  const toggleBg = isDark ? '#334155' : '#f1f5f9';
  const successBadgeBg = isDark ? '#064e3b' : '#f0fdf4';
  const successBadgeText = isDark ? '#34d399' : '#16a34a';
  const warningBadgeBg = isDark ? '#78350f' : '#fffbeb';
  const warningBadgeText = isDark ? '#fbbf24' : '#d97706';

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: bg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: textMuted,
    marginBottom: 2,
  },
  userName: {
    ...TYPOGRAPHY.h1,
    color: textMain,
  },
  heroCardTouchable: {
    borderRadius: RADIUS['2xl'],
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  heroCard: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    overflow: 'hidden',
    alignItems: 'center',
  },
  editHintIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 2,
  },
  heroBlur1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroBlur2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  proBadgeFree: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: textMain,
    marginBottom: SPACING.md,
  },
  detailsCard: {
    backgroundColor: cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    ...SHADOWS.soft,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.label,
    color: textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: textMain,
  },
  planCard: {
    backgroundColor: cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  toggleCard: {
    backgroundColor: cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: toggleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: textMain,
  },

  // Email verification
  emailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: successBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unverifiedBadge: {
    backgroundColor: warningBadgeBg,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: successBadgeText,
  },
  unverifiedText: {
    color: warningBadgeText,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginTop: -4,
    marginBottom: 4,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  signOutCard: {
    backgroundColor: cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: 100,
    ...SHADOWS.soft,
  },
  signOutIconBg: {
    backgroundColor: isDark ? '#450a0a' : '#fef2f2',
  },
  signOutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.error,
  },

  // Phone OTP verification modal
  otpOverlay: {flex: 1, justifyContent: 'flex-end'},
  otpBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)'},
  otpSheet: {
    backgroundColor: cardBg,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  otpTitle: {fontSize: 20, fontWeight: '800' as const, color: textMain, marginBottom: 4},
  otpSubtitle: {fontSize: 14, color: textMuted, marginBottom: SPACING.lg},
  otpInput: {
    backgroundColor: isDark ? bg : '#f8fafc',
    borderWidth: 1, borderColor: border,
    borderRadius: RADIUS.lg, height: 60,
    fontSize: 28, fontWeight: '700' as const,
    color: textMain, letterSpacing: 10,
    marginBottom: SPACING.md, textAlign: 'center' as const,
  },
  otpBtn: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.lg, height: 52,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  otpBtnText: {color: '#fff', fontSize: 16, fontWeight: '700' as const},
  otpBtnDisabled: {opacity: 0.65},
  otpCancelBtn: {alignItems: 'center' as const, marginTop: SPACING.lg},
  otpCancelText: {fontSize: 14, color: textMuted},
  otpErrorBox: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: isDark ? '#450a0a' : '#fef2f2',
    borderRadius: RADIUS.lg, padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  otpErrorText: {flex: 1, fontSize: 13, color: theme.error, fontWeight: '500' as const},
  otpResendBtn: {alignItems: 'center' as const, marginTop: SPACING.md},
  otpResendText: {fontSize: 14, fontWeight: '600' as const, color: theme.primary},

  // Profile loading
  loadingRow: {flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, padding: SPACING.md},
  loadingText: {fontSize: 14, color: textMuted},
});

};
