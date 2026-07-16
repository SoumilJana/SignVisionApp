/**
 * Profile domain types
 *
 * `SupabaseProfile` mirrors the `profiles` table exactly — use this when
 * reading a full row from Supabase (select *, or specific columns).
 *
 * `ProfileData` is the lightweight shape used by the edit modal and
 * ProfileScreen state — only the user-editable fields.
 */
import {AppRole} from './auth';

// ─── Full database row ────────────────────────────────────────────────────────

/** Mirrors every column in public.profiles. */
export interface SupabaseProfile {
  /** UUID — matches auth.users.id */
  id: string;

  /** User-chosen display name. */
  display_name: string | null;

  /** ISO date string (YYYY-MM-DD) as returned by Supabase. */
  date_of_birth: string | null;

  /** Selected sign language, e.g. "English (ASL)". */
  language: string | null;

  /**
   * DEPRECATED — kept for backward compatibility.
   * Use `role` as the authoritative source of truth.
   */
  is_pro: boolean;

  /** RBAC role. Governs all access control. */
  role: AppRole;

  /** Optional phone number for MFA / notifications. */
  phone: string | null;

  /** Contact email collected during signup. Stored in profiles, separate from auth email. */
  email: string | null;

  /**
   * True when the user has successfully enrolled at least one MFA factor.
   * Mirrors the server-side MFA state for quick client reads.
   */
  mfa_enabled: boolean;

  /** ISO timestamp — set once on row creation, never mutated. */
  created_at: string | null;

  /** ISO timestamp — updated on every profile save. */
  updated_at: string | null;
}

// ─── Edit-modal / screen state ────────────────────────────────────────────────

/**
 * Subset of SupabaseProfile that the user can edit through the UI.
 * date_of_birth is stored as a "DD-MM-YYYY" display string in local state;
 * the modal converts it to ISO before sending to Supabase.
 */
export interface ProfileData {
  display_name: string;
  /** Display-format string: "DD-MM-YYYY". Converted to ISO on save. */
  date_of_birth: string;
  language: string;
  /**
   * E.164 phone number — only set when the user is adding/changing their phone.
   * NOT saved directly by EditProfileModal; handled post-OTP in ProfileScreen.
   */
  phone?: string;
}
