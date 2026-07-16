import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';

import {Linking, Alert} from 'react-native';
import {supabase, deriveAuthEmailFromPhone} from '../lib/supabase';
import {AuthContextType, AuthState, AppRole, SignUpPayload} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({children}: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    mfaRequired: false,
    mfaSetupRequired: false,
    phoneVerified: true, // default true — only false during fresh phone signup
    devRole: null,
  });

  // Tracks the active dev-bypass role. Lives outside `state` so toggling it
  // never triggers an accidental Supabase auth state re-sync.
  const [devRole, setDevRole] = useState<AppRole | null>(null);

  const checkMfaStatus = useCallback(async () => {
    try {
      const {data} =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data) {
        setState(prev => ({
          ...prev,
          mfaRequired:
            data.nextLevel === 'aal2' && data.currentLevel !== 'aal2',
        }));
      }
    } catch {
      // MFA check failed — not critical
    }
  }, []);

  /**
   * MFA via TOTP is DISABLED — this app uses SMS OTP only.
   * Always sets mfaSetupRequired = false so no user is ever routed to MfaScreen.
   */
  const checkMfaSetupRequired = useCallback(async (_userId: string) => {
    setState(prev => ({...prev, mfaSetupRequired: false}));
  }, []);

  useEffect(() => {
    // Get initial session — timeout after 5s to avoid white screen with no internet
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{data: {session: null}}>(resolve =>
      setTimeout(() => resolve({data: {session: null}}), 5000),
    );

    Promise.race([sessionPromise, timeoutPromise]).then(({data: {session}}) => {
      const u = session?.user ?? null;
      setState(prev => ({
        ...prev,
        user: u,
        session,
        isLoading: false,
        // Derive phoneVerified from Supabase user metadata
        phoneVerified: u ? !!u.phone_confirmed_at : true,
      }));
      if (session?.user) {
        checkMfaStatus();
        checkMfaSetupRequired(session.user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: {subscription: authSub},
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setState(prev => ({
        ...prev,
        user: u,
        session,
        isLoading: false,
        phoneVerified: u ? !!u.phone_confirmed_at : prev.phoneVerified,
      }));
      if (session?.user) {
        checkMfaStatus();
        checkMfaSetupRequired(session.user.id);
      }
    });

    // Listen for OAuth deep-link redirects (com.signvision.app://auth#access_token=...)
    const handleDeepLink = async (event: {url: string}) => {
      const url = event.url;
      if (!url) return;
      console.log('[AuthContext] Deep link received:', url);

      // Supabase OAuth returns tokens as hash fragment:
      // com.signvision.app://auth#access_token=XYZ&refresh_token=ABC
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const params = new URLSearchParams(url.substring(hashIndex + 1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const {error} = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            console.error('[AuthContext] setSession error:', error.message);
            Alert.alert('Sign-in Error', error.message);
          }
          // onAuthStateChange will fire and update the UI automatically
        } catch (e: any) {
          console.error('[AuthContext] Deep link session error:', e);
          Alert.alert('Sign-in Error', e?.message ?? 'Failed to complete sign-in');
        }
      }
    };

    // Check if app was opened via a deep link (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({url});
    });

    // Listen for deep links while the app is running (warm start)
    const linkSub = Linking.addEventListener('url', handleDeepLink);

    return () => {
      authSub.unsubscribe();
      linkSub.remove();
    };
  }, [checkMfaStatus, checkMfaSetupRequired]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const {error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return {error};
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const {error} = await supabase.auth.signUp({email, password});
      return {error};
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const {data, error} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // redirectTo must match the URL registered in Supabase dashboard
          // and your app's deep-link scheme (e.g. com.signvision.app://auth)
          redirectTo: 'com.signvision.app://auth',
          skipBrowserRedirect: true, // we open the URL ourselves via Linking
        },
      });
      if (error) return {error: error.message};
      if (data?.url) {
        await Linking.openURL(data.url);
      }
      return {error: null};
    } catch (e: any) {
      return {error: e?.message ?? 'Google sign-in failed'};
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setDevRole(null);
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
      mfaRequired: false,
      mfaSetupRequired: false,
      phoneVerified: true,
      devRole: null,
    }));
  }, []);

  // DEV ONLY: Skip auth and assume the given role for rapid local testing.
  // Grants full RBAC bypass — useUserTier reads devRole before querying Supabase.
  const devLogin = useCallback((role: AppRole = 'admin') => {
    if (!__DEV__) return;
    setDevRole(role);
    setState(prev => ({
      ...prev,
      user: {id: `dev-user-${role}`, email: `dev-${role}@signvision.app`} as any,
      session: {} as any,
      isLoading: false,
      mfaRequired: false,
      mfaSetupRequired: false,
      phoneVerified: true,
      devRole: role,
    }));
  }, []);

  /**
   * enrollMfa — DISABLED: this app uses SMS OTP only, not TOTP authenticator.
   * Kept as a no-op stub so the type contract is satisfied.
   */
  const enrollMfa = useCallback(async () => null, []);

  /**
   * verifyMfa — DISABLED: this app uses SMS OTP only, not TOTP authenticator.
   * Kept as a no-op stub so the type contract is satisfied.
   */
  const verifyMfa = useCallback(
    async (_factorId: string, _code: string) => ({error: null}),
    [],
  );

  // ── Step 2: Phone OTP login ────────────────────────────────────────────────

  /** Sends a one-time password to the given phone number via Supabase Auth. */
  const signInWithPhone = useCallback(async (phone: string) => {
    const {error} = await supabase.auth.signInWithOtp({phone});
    return {error};
  }, []);

  /**
   * Signs in a phone-registered user with password.
   * Tries both E.164 (+XX…) and raw-digits formats to handle
   * Supabase instances that strip the leading '+' on storage.
   */
  const signInWithPhonePassword = useCallback(
    async (phone: string, password: string) => {
      // Try as-is first (e.g. "+919432938110")
      const {error} = await supabase.auth.signInWithPassword({phone, password});
      if (!error) return {error: null};

      // Retry with opposite format: strip or add '+'
      const altPhone = phone.startsWith('+') ? phone.slice(1) : `+${phone}`;
      const {error: error2} = await supabase.auth.signInWithPassword({
        phone: altPhone,
        password,
      });
      return {error: error2};
    },
    [],
  );

  /** Sends OTP to link a new phone to an already-authenticated user (e.g. Google/email users). */
  const addPhoneToAccount = useCallback(async (phone: string) => {
    const {error} = await supabase.auth.updateUser({phone});
    return {error};
  }, []);

  /**
   * Verifies the OTP token for the given phone.
   * On success, syncs the verified phone number and marks MFA as enabled in profiles.
   * type defaults to 'sms' (new signup); pass 'phone_change' when adding phone to existing account.
   */
  const verifyPhoneOtp = useCallback(
    async (phone: string, token: string, type: 'sms' | 'phone_change' = 'sms') => {
      const {data, error} = await supabase.auth.verifyOtp({
        phone,
        token,
        type,
      });
      if (!error && data.user) {
        // Phone is now confirmed — unlock the OTP gate and clear any MFA gates
        setState(prev => ({
          ...prev,
          phoneVerified: true,
          mfaSetupRequired: false,
          mfaRequired: false,
        }));
        // Sync phone + mfa_enabled → profiles table (best-effort, non-blocking)
        supabase
          .from('profiles')
          .update({phone, mfa_enabled: true, updated_at: new Date().toISOString()})
          .eq('id', data.user.id)
          .then(() => {/* fire and forget */});
      }
      return {error};
    },
    [],
  );

  // ── New user phone signup ──────────────────────────────────────────────────

  /**
   * Creates account with phone-based authentication.
   *   - Primary: Phone + OTP (native Supabase phone auth)
   *   - Password auth added later after phone verification (via updateUser)
   *
   * Does NOT pass email to signup to avoid email confirmation emails.
   * Email verification will be added as a separate step.
   * User verifies phone via SMS OTP before account is fully activated.
   */
  const signUpWithPhone = useCallback(
    async ({phone, password, displayName, dateOfBirth, email}: SignUpPayload) => {
      const {error: signupError} = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            // Picked up by handle_new_user trigger → inserted into profiles
            display_name: displayName,
            date_of_birth: dateOfBirth,
            email: email, // Store the actual contact email in profiles (for later email verification)
            phone_number: phone, // Store actual phone in metadata for profiles.phone
          },
        },
      });
      if (!signupError) {
        // Mark phone as unverified — OtpGateScreen will block until verified
        setState(prev => ({...prev, phoneVerified: false}));
      }
      return {error: signupError};
    },
    [],
  );

  // ── Email linking (post-signup, optional) ───────────────────────────────

  /**
   * Links an email to the current phone-authenticated user.
   * Supabase sends a verification email. Email remains untrusted until confirmed.
   */
  const addEmailToAccount = useCallback(async (email: string) => {
    const {error} = await supabase.auth.updateUser({email});
    return {error: error?.message ?? null};
  }, []);

  /** Resends the verification email for a previously linked but unverified email. */
  const resendVerificationEmail = useCallback(async () => {
    const email = state.user?.email;
    if (!email) return {error: 'No email linked to this account.'};
    const {error} = await supabase.auth.resend({type: 'email_change', email});
    return {error: error?.message ?? null};
  }, [state.user?.email]);

  // ── Step 3: MFA setup completion ─────────────────────────────────────────

  /**
   * Called by MfaScreen after the user has successfully enrolled and verified
   * their TOTP factor. Writes mfa_enabled = true to profiles and clears the
   * setup gate so AppNavigator proceeds to MainTabs.
   */
  const completeMfaSetup = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) return {error: 'Not authenticated'};

    const {error} = await supabase
      .from('profiles')
      .update({mfa_enabled: true, updated_at: new Date().toISOString()})
      .eq('id', userId);

    if (!error) {
      setState(prev => ({...prev, mfaSetupRequired: false}));
    }
    return {error: error?.message ?? null};
  }, [state.user?.id]);

  const value: AuthContextType = {
    ...state,
    devRole,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    enrollMfa,
    verifyMfa,
    signInWithGoogle,
    signInWithPhone,
    signInWithPhonePassword,
    verifyPhoneOtp,
    signUpWithPhone,
    addPhoneToAccount,
    addEmailToAccount,
    resendVerificationEmail,
    completeMfaSetup,
    devLogin: __DEV__ ? devLogin : undefined,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
