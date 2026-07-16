import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/contexts/AuthContext';
import {ThemeProvider, useTheme} from './src/contexts/ThemeContext';
import {FeatureFlagsProvider} from './src/contexts/FeatureFlagsContext';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const {isDark} = useTheme();
  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={isDark ? '#121212' : '#f6f7f8'} 
      />
      <AppNavigator />
    </>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <ThemeProvider>
            <FeatureFlagsProvider>
              <Root />
            </FeatureFlagsProvider>
          </ThemeProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
