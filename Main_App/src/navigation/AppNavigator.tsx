import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import MfaScreen from '../screens/auth/MfaScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import {COLORS} from '../theme';

const ONBOARDING_KEY = '@signvision_onboarding_complete';

export default function AppNavigator() {
  const {user, isLoading, mfaRequired, mfaSetupRequired, phoneVerified} = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('[AppNavigator] Effect: checking onboarding...');
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      console.log('[AppNavigator] checkOnboarding: reading storage...');
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      console.log('[AppNavigator] checkOnboarding: value =', value);
      setShowOnboarding(value !== 'true');
    } catch (e) {
      console.error('[AppNavigator] checkOnboarding: error =', e);
      setShowOnboarding(true);
    }
  };

  const completeOnboarding = async () => {
    console.log('[AppNavigator] completeOnboarding: saving...');
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  console.log('[AppNavigator] Render: isLoading =', isLoading, 'showOnboarding =', showOnboarding, 'user =', !!user);

  // Loading state
  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Onboarding (first launch)
  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Not authenticated
  if (!user) {
    return <AuthStack />;
  }

  // Phone not verified yet — block new phone signups still in OTP gate.
  // Google OAuth users have no phone to verify, so let them through.
  const isGoogleUser = user?.app_metadata?.provider === 'google';
  if (!phoneVerified && !isGoogleUser) {
    return <AuthStack />;
  }

  // MFA TOTP verification required (factor enrolled but not verified this session)
  if (mfaRequired) {
    return <MfaScreen />;
  }

  // MFA setup required (user hasn't enrolled MFA at all yet — profiles.mfa_enabled = false)
  if (mfaSetupRequired) {
    return <MfaScreen />;
  }

  // Authenticated and all checks passed — show main app
  return <MainTabs />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
