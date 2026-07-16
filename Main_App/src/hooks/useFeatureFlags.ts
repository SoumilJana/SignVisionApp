/**
 * useFeatureFlags — access the current user's feature flags.
 *
 * Usage:
 *   const { flags, isLoading } = useFeatureFlags();
 *   if (flags.data_collection) { ... }
 *
 * Flags are fetched from Supabase on login and reset to DEFAULT_FLAGS on sign-out.
 * All flags default to false (fail-closed).
 */
export {useFeatureFlags} from '../contexts/FeatureFlagsContext';
