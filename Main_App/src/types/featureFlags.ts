/**
 * Feature flags — controls UI visibility of dev-only and premium features.
 * Flags are derived from user role and returned by the Supabase RPC get_my_feature_flags().
 * All flags default to false (fail-closed).
 */

export interface FeatureFlags {
  /** Show the dev bypass button on LoginScreen. */
  dev_mode: boolean;
  /** Show the data capture FAB on TranslatorScreen. */
  data_collection: boolean;
  /** Unlock premium sign library, practice mode. */
  premium_content: boolean;
  /** Remove the 50 translations/day cap. */
  unlimited_translations: boolean;
  /** Allow offline ONNX inference (future). */
  offline_mode: boolean;
  /** Show DebugOverlay landmark view. */
  debug_overlay: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  dev_mode: false,
  data_collection: false,
  premium_content: false,
  unlimited_translations: false,
  offline_mode: false,
  debug_overlay: false,
};

/** Shape returned by the Supabase RPC get_my_feature_flags(). */
export interface FeatureFlagsResponse {
  role: string;
  features: FeatureFlags;
}
