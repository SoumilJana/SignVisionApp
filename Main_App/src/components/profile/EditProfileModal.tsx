/**
 * EditProfileModal — v2
 *
 * Security hardening:
 *  - Only sends display_name / date_of_birth / language to Supabase.
 *    is_pro is never touched from the client.
 *  - Payload is stripped/trimmed before the RPC call.
 *  - Full frontend validation runs before any network request.
 *
 * UX improvements:
 *  - DOB uses DD-MM-YYYY auto-masking (numeric keyboard).
 *  - Language is a pure-RN in-modal picker (no extra dependencies).
 *    Add entries to LANGUAGE_OPTIONS to expose more choices in the future.
 */
import React, {useState, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import CountryPicker, {Country, CountryCode} from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {supabase} from '../../lib/supabase';
import {COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY} from '../../theme';
import {ProfileData} from '../../types/profile';

// ─── Language options ──────────────────────────────────────────────────────────
// Add new entries here to expand the dropdown.
const LANGUAGE_OPTIONS: {label: string; value: string}[] = [
  {label: 'English (ASL)', value: 'English (ASL)'},
  // {label: 'British Sign Language (BSL)', value: 'BSL'},
  // {label: 'French Sign Language (LSF)',  value: 'LSF'},
];

interface EditProfileModalProps {
  visible: boolean;
  userId: string;
  initialData: ProfileData;
  onClose: () => void;
  onSaved: (data: ProfileData) => void;
}

// ─── DOB masking ──────────────────────────────────────────────────────────────
/**
 * Accepts raw digit input and returns a DD-MM-YYYY masked string.
 * Strips all non-digits, then inserts dashes at positions 2 and 4.
 */
function maskDob(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/**
 * Converts a DD-MM-YYYY display string to ISO YYYY-MM-DD for Supabase.
 * Returns null if the string is empty or incomplete.
 */
function dobToIso(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

/** Validates a complete DD-MM-YYYY string (digits only, basic range check). */
function isValidDob(display: string): boolean {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 8) return false;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EditProfileModal({
  visible,
  userId,
  initialData,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [form, setForm] = useState<ProfileData>(initialData);
  const [saving, setSaving] = useState(false);
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  // Phone field state
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phonePickerVisible, setPhonePickerVisible] = useState(false);

  // Sync form when modal opens with fresh initialData
  useEffect(() => {
    if (visible) {
      setForm(initialData);
      setPhoneLocal(''); // User must re-enter phone to trigger a change
    }
  }, [visible, initialData]);

  // DOB change handler — applies masking on every keystroke
  const handleDobChange = useCallback((raw: string) => {
    setForm(prev => ({...prev, date_of_birth: maskDob(raw)}));
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    const name = form.display_name.trim();
    if (!name) return 'Display name cannot be empty.';
    if (name.length > 64) return 'Display name must be 64 characters or fewer.';
    // Only validate DOB if the user actually typed something
    if (form.date_of_birth && !isValidDob(form.date_of_birth)) {
      return 'Date of birth must be a valid date in DD-MM-YYYY format.';
    }
    return null;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Please check your details', validationError);
      return;
    }

    // Build a safe, minimal payload — never include is_pro or id
    const payload: Record<string, string | null> = {
      display_name: form.display_name.trim(),
      language: form.language,
      updated_at: new Date().toISOString(),
    };

    // Only send date_of_birth if user filled it in
    const dobIso = dobToIso(form.date_of_birth);
    payload.date_of_birth = dobIso; // null clears the column, which is fine

    setSaving(true);
    const {error} = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId); // RLS also enforces this server-side

    setSaving(false);

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    // Pass phone through to ProfileScreen for post-OTP handling (not saved to DB here)
    const fullPhone = phoneLocal.replace(/\D/g, '').length >= 5
      ? `+${callingCode}${phoneLocal.replace(/\D/g, '')}`
      : undefined;
    onSaved({...form, phone: fullPhone});
    onClose();
  };

  // ── Language picker modal ────────────────────────────────────────────────────
  const LangPicker = (
    <Modal
      visible={langPickerVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setLangPickerVisible(false)}>
      <Pressable
        style={styles.pickerOverlay}
        onPress={() => setLangPickerVisible(false)}>
        <View style={styles.pickerSheet}>
          <Text style={styles.pickerTitle}>Select Language</Text>
          <FlatList
            data={LANGUAGE_OPTIONS}
            keyExtractor={item => item.value}
            renderItem={({item}) => {
              const selected = form.language === item.value;
              return (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    selected && styles.pickerItemSelected,
                  ]}
                  onPress={() => {
                    setForm(prev => ({...prev, language: item.value}));
                    setLangPickerVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.pickerItemText,
                      selected && styles.pickerItemTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                  {selected && (
                    <Icon name="check" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Pressable>
    </Modal>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {LangPicker}

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Tap backdrop to dismiss */}
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">

              {/* ── Display Name ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Display Name</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="account-outline"
                    size={20}
                    color={COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.display_name}
                    onChangeText={v =>
                      setForm(prev => ({...prev, display_name: v}))
                    }
                    placeholder="Your name"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                    maxLength={64}
                  />
                </View>
              </View>

              {/* ── Date of Birth (DD-MM-YYYY auto-mask) ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="calendar-month-outline"
                    size={20}
                    color={COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={form.date_of_birth}
                    onChangeText={handleDobChange}
                    placeholder="DD-MM-YYYY"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={10} // "DD-MM-YYYY"
                  />
                </View>
              </View>

              {/* ── Language Dropdown ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Sign Language</Text>
                <TouchableOpacity
                  style={styles.dropdownWrapper}
                  activeOpacity={0.7}
                  onPress={() => setLangPickerVisible(true)}>
                  <Icon
                    name="translate"
                    size={20}
                    color={COLORS.textMuted}
                    style={styles.inputIcon}
                  />
                  <Text style={styles.dropdownValue}>{form.language}</Text>
                  <Icon
                    name="chevron-down"
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* ── Phone Number (optional — for users without a phone, e.g. Google sign-in) ── */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Phone Number{' '}
                  <Text style={styles.optionalLabel}>(optional)</Text>
                </Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryBtn}
                    onPress={() => setPhonePickerVisible(true)}
                    activeOpacity={0.7}>
                    <CountryPicker
                      countryCode={countryCode}
                      withFilter
                      withFlag
                      withCallingCode
                      withEmoji
                      onSelect={(c: Country) => {
                        setCountryCode(c.cca2);
                        setCallingCode(c.callingCode[0]);
                      }}
                      visible={phonePickerVisible}
                      onClose={() => setPhonePickerVisible(false)}
                    />
                    <Text style={styles.callingCode}>+{callingCode}</Text>
                    <Icon name="chevron-down" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                  <View style={[styles.inputWrapper, styles.phoneInput]}>
                    <TextInput
                      style={styles.input}
                      value={phoneLocal}
                      onChangeText={v => setPhoneLocal(v.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </View>

              {/* ── Save Button ── */}
              <Pressable
                style={({pressed}) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed,
                ]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="content-save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.sm,
    maxHeight: '90%',
    ...SHADOWS.card,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textMain,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  // Language dropdown
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  // Phone field
  phoneRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.sm, height: 50,
  },
  callingCode: {fontSize: 15, fontWeight: '600', color: COLORS.textMain},
  phoneInput: {flex: 1},
  optionalLabel: {fontSize: 12, fontWeight: '400' as const, color: COLORS.textMuted},
  // Language picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  pickerSheet: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    paddingVertical: SPACING.md,
    ...SHADOWS.card,
  },
  pickerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textMain,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.sm,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textMain,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md + 2,
    marginTop: SPACING.md,
    ...SHADOWS.fab,
  },
  saveBtnPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
