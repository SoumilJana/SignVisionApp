import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ReturningLoginScreen from '../screens/auth/ReturningLoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import OtpGateScreen from '../screens/auth/OtpGateScreen';
import AddEmailScreen from '../screens/auth/AddEmailScreen';

export type AuthStackParamList = {
  Entry: undefined;
  ReturningLogin: undefined;
  SignUp: undefined;
  OtpGate: {phone: string; email?: string};
  AddEmail: {email?: string};
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Entry" component={LoginScreen} />
      <Stack.Screen name="ReturningLogin" component={ReturningLoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OtpGate" component={OtpGateScreen} />
      <Stack.Screen name="AddEmail" component={AddEmailScreen} />
    </Stack.Navigator>
  );
}
