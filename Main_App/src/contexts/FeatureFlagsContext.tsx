import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
import {supabase} from '../lib/supabase';
import {useAuth} from './AuthContext';
import {FeatureFlags, DEFAULT_FLAGS} from '../types/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isLoading: boolean;
  /** Re-fetch flags from the backend (call after role change). */
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: DEFAULT_FLAGS,
  isLoading: true,
  refresh: async () => {},
});

export function useFeatureFlags(): FeatureFlagsContextType {
  return useContext(FeatureFlagsContext);
}

export function FeatureFlagsProvider({children}: PropsWithChildren) {
  const {user, session} = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    // Not authenticated — apply defaults immediately (fail-closed)
    if (!user?.id || !session) {
      setFlags(DEFAULT_FLAGS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // SECURITY DEFINER RPC — server reads profiles.role; client cannot influence result
      const {data, error} = await supabase.rpc('get_my_feature_flags');
      if (!error && data?.features) {
        // Spread over DEFAULT_FLAGS so unknown future keys default to false
        setFlags({...DEFAULT_FLAGS, ...data.features});
      } else {
        setFlags(DEFAULT_FLAGS);
      }
    } catch {
      // Network error or unexpected failure — fail-closed
      setFlags(DEFAULT_FLAGS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session]);

  // Re-fetch whenever auth state changes (login, session restore)
  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Immediately reset to defaults on sign-out
  useEffect(() => {
    if (!user) {
      setFlags(DEFAULT_FLAGS);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <FeatureFlagsContext.Provider value={{flags, isLoading, refresh: fetchFlags}}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
