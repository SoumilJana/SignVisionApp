import React from 'react';
import {createBottomTabNavigator, BottomTabBarProps} from '@react-navigation/bottom-tabs';
import TranslatorScreen from '../screens/TranslatorScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LearnScreen from '../screens/LearnScreen';
import LibraryScreen from '../screens/LibraryScreen';
import CustomTabBar from '../components/CustomTabBar';

export type MainTabsParamList = {
  Home: undefined;
  Learn: undefined;
  Translator: undefined;
  Library: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

function CustomTabBarRenderer(props: BottomTabBarProps) {
  return <CustomTabBar {...props} />;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={CustomTabBarRenderer}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Translator" component={TranslatorScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

