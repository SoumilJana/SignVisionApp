import React, {PropsWithChildren} from 'react';
import {useFeatureFlags} from '../hooks/useFeatureFlags';
import {FeatureFlags} from '../types/featureFlags';

interface FeatureGateProps extends PropsWithChildren {
  /** The flag key that must be true to render children. */
  flag: keyof FeatureFlags;
  /** Optional element rendered when the flag is false. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * FeatureGate — renders children only when the given feature flag is enabled
 * for the current user's role. Renders nothing (fail-closed) while flags are loading.
 *
 * Example:
 *   <FeatureGate flag="data_collection">
 *     <CaptureButton />
 *   </FeatureGate>
 *
 *   <FeatureGate flag="dev_mode" fallback={null}>
 *     <DevBypassButton />
 *   </FeatureGate>
 */
export function FeatureGate({flag, fallback = null, children}: FeatureGateProps) {
  const {flags, isLoading} = useFeatureFlags();

  // Render nothing while loading — never reveal gated content prematurely
  if (isLoading) {
    return null;
  }

  if (!flags[flag]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
