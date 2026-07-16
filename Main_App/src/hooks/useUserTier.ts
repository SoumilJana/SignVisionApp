/**
 * useUserTier — v3 (RBAC)
 *
 * Single source of truth for the current user's role on the frontend.
 *
 * Role hierarchy:  admin > dev > pro > free
 *   - isPro:  true for 'pro', 'dev', AND 'admin' (inheritance)
 *   - isAdmin: true only for 'admin'
 *
 * Dev bypass: if AuthContext has devRole set (via devLogin()),
 *   no Supabase query is made — the override is used directly.
 *
 * Usage:
 *   const { role, isPro, isAdmin, isLoading } = useUserTier();
 *
 *   // Gate a pro feature (admins pass automatically):
 *   if (isPro) <PremiumContent />
 *
 *   // Gate an admin-only feature:
 *   if (isAdmin) <AdminPanel />
 *
 * To add more roles in the future, update the AppRole type in auth.ts
 * and extend the inheritance logic in deriveFlags() below.
 */
import {useState, useEffect, useCallback} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
import {AppRole} from '../types/auth';

export interface UserTierResult {
  role: AppRole;
  isPro: boolean;    // true for 'pro' | 'admin'
  isAdmin: boolean;  // true for 'admin' only
  isLoading: boolean;
  refresh: () => void;
}

/** Derives the boolean flags from a raw role string. Centralises inheritance logic. */
function deriveFlags(role: AppRole): Pick<UserTierResult, 'isPro' | 'isAdmin'> {
  return {
    isAdmin: role === 'admin',
    isPro:   role === 'admin' || role === 'dev' || role === 'pro',
  };
}

export function useUserTier(): UserTierResult {
  const {user, devRole} = useAuth();

  const [role, setRole] = useState<AppRole>('free');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRole = useCallback(async () => {
    // ── Dev bypass ────────────────────────────────────────────────────────────
    // If devRole is set, skip the DB entirely and trust the override.
    if (devRole !== null) {
      setRole(devRole);
      setIsLoading(false);
      return;
    }

    // ── Not authenticated ─────────────────────────────────────────────────────
    if (!user?.id) {
      setRole('free');
      setIsLoading(false);
      return;
    }

    // ── Fetch from profiles table ─────────────────────────────────────────────
    setIsLoading(true);
    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data?.role) {
        // Narrow the DB string into our typed union (guard against unexpected values)
        const fetched = data.role as string;
        const safeRole: AppRole =
          fetched === 'admin' ? 'admin'
          : fetched === 'dev'  ? 'dev'
          : fetched === 'pro'  ? 'pro'
          : 'free';
        setRole(safeRole);
      } else {
        setRole('free');
      }
    } catch {
      setRole('free');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, devRole]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return {
    role,
    ...deriveFlags(role),
    isLoading,
    refresh: fetchRole,
  };
}
