-- Migration: Add 'dev' role and feature flags RPC
-- Date: 2026-03-25
-- Purpose: Introduce the 'dev' role for authorized developers, expose feature
--          flags via a SECURITY DEFINER RPC, and block role self-escalation.

-- ============================================================
-- 1. Extend the role CHECK constraint to include 'dev'
--    (Drop the old constraint first — name may vary; adjust if needed)
-- ============================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'dev', 'pro', 'free'));

-- ============================================================
-- 2. RPC: get_my_feature_flags()
--    Returns { role, features } for the calling authenticated user.
--    SECURITY DEFINER runs as postgres so it can read profiles even
--    if the caller's RLS would normally block it — but only for their
--    own row (auth.uid() is immutable within the call).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_feature_flags()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Missing profile row → treat as 'free' (fail-closed)
  IF v_role IS NULL THEN
    v_role := 'free';
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'features', CASE v_role
      WHEN 'admin' THEN jsonb_build_object(
        'dev_mode',              true,
        'data_collection',       true,
        'premium_content',       true,
        'unlimited_translations',true,
        'offline_mode',          true,
        'debug_overlay',         true
      )
      WHEN 'dev' THEN jsonb_build_object(
        'dev_mode',              true,
        'data_collection',       true,
        'premium_content',       true,
        'unlimited_translations',true,
        'offline_mode',          false,
        'debug_overlay',         true
      )
      WHEN 'pro' THEN jsonb_build_object(
        'dev_mode',              false,
        'data_collection',       false,
        'premium_content',       true,
        'unlimited_translations',true,
        'offline_mode',          true,
        'debug_overlay',         false
      )
      ELSE jsonb_build_object(   -- 'free' (default)
        'dev_mode',              false,
        'data_collection',       false,
        'premium_content',       false,
        'unlimited_translations',false,
        'offline_mode',          false,
        'debug_overlay',         false
      )
    END
  );
END;
$$;

-- Only authenticated users may call this function; anonymous callers cannot
REVOKE ALL ON FUNCTION public.get_my_feature_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_feature_flags() TO authenticated;

-- ============================================================
-- 3. RLS: Block role self-escalation
--    Users can update their own profile but CANNOT change their role
--    unless they are already an admin.
--    NOTE: Drop the existing permissive self-update policy first.
--    Adjust the policy name below if yours differs.
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (no role escalation)"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND (
      -- Role is unchanged, OR caller is an admin (admins may change any role)
      role = (SELECT role FROM public.profiles WHERE id = auth.uid())
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- ============================================================
-- How to assign 'dev' role to a developer:
--   UPDATE public.profiles SET role = 'dev' WHERE id = '<user-uuid>';
-- (Must be run by an admin or directly in the Supabase dashboard)
-- ============================================================
