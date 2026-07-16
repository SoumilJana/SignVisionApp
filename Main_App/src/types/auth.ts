import {User, Session, AuthError} from '@supabase/supabase-js';

/** The four RBAC roles in the system. admin > dev > pro > free. */
export type AppRole = 'admin' | 'dev' | 'pro' | 'free';

/** Full profile payload sent at registration. */
export interface SignUpPayload {
  phone: string;
  password: string;
  displayName: string;
  dateOfBirth: string; // ISO format: YYYY-MM-DD
  email?: string;      // optional — linked via updateUser after OTP
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  /** True when the user has a TOTP factor enrolled but hasn't verified it this session. */
  mfaRequired: boolean;
  /**
   * True when the authenticated user has NOT yet set up MFA (profiles.mfa_enabled = false).
   * Triggers routing to MfaScreen for mandatory setup.
   */
  mfaSetupRequired: boolean;
  /**
   * True when the user has verified their phone number.
   * False immediately after phone+password signup before OTP is verified.
   */
  phoneVerified: boolean;
  /** Non-null only when the dev bypass is active (DEV builds only). */
  devRole: AppRole | null;
}

export interface AuthContextType extends AuthState {
  signInWithEmail: (email: string, password: string) => Promise<{error: AuthError | null}>;
  signUpWithEmail: (email: string, password: string) => Promise<{error: AuthError | null}>;
  signOut: () => Promise<void>;
  enrollMfa: () => Promise<{qrCode: string; secret: string; factorId: string} | null>;
  verifyMfa: (factorId: string, code: string) => Promise<{error: AuthError | null}>;
  /** Opens Supabase Google OAuth flow in system browser. */
  signInWithGoogle: () => Promise<{error: string | null}>;
  /** Sends OTP to the given phone number (returning user login). */
  signInWithPhone: (phone: string) => Promise<{error: AuthError | null}>;
  /** Signs in a phone-registered user with password (no OTP needed). */
  signInWithPhonePassword: (phone: string, password: string) => Promise<{error: AuthError | null}>;
  /** Verifies OTP and syncs phone → profiles. */
  verifyPhoneOtp: (phone: string, token: string, type?: 'sms' | 'phone_change') => Promise<{error: AuthError | null}>;
  /** Sends OTP to link a new phone to an already-authenticated user (e.g. Google users). */
  addPhoneToAccount: (phone: string) => Promise<{error: AuthError | null}>;
  /**
   * Signs up a NEW user with full profile metadata.
   * Supabase creates the account and sends an SMS OTP automatically.
   * display_name, date_of_birth, and email are embedded as user metadata
   * so the handle_new_user DB trigger inserts them into profiles.
   */
  signUpWithPhone: (payload: SignUpPayload) => Promise<{error: AuthError | null}>;
  /**
   * Links an email to the currently authenticated user's account.
   * Supabase sends a verification email. Email is NOT trusted until confirmed.
   */
  addEmailToAccount: (email: string) => Promise<{error: string | null}>;
  /** Resends the verification email for a previously linked but unverified email. */
  resendVerificationEmail: () => Promise<{error: string | null}>;
  /** Sets profiles.mfa_enabled = true and clears mfaSetupRequired. */
  completeMfaSetup: () => Promise<{error: string | null}>;
  /** DEV only — bypasses real auth and sets the given role (default 'admin'). */
  devLogin?: (role?: AppRole) => void;
}
