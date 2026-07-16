import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Derives a consistent auth email from a phone number.
 * Used during signup (phone+password) and signin (phone+password).
 * Supabase only supports password auth with email; phone auth requires OTP.
 * Uses plus-addressing format (RFC 5322 compliant): auth+919432938110@signvision.app
 */
export function deriveAuthEmailFromPhone(phone: string): string {
  const phoneDigitsOnly = phone.replace(/\D/g, '');
  return `auth+${phoneDigitsOnly}@signvision.app`;
}
