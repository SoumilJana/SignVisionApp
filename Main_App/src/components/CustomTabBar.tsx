import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS} from '../theme';
import {useTheme} from '../contexts/ThemeContext';

const {width} = Dimensions.get('window');

const TAB_CONFIG: Record<string, {icon: string; filledIcon: string; label: string}> = {
  Home: {icon: 'home-outline', filledIcon: 'home', label: 'Home'},
  Learn: {icon: 'school-outline', filledIcon: 'school', label: 'Learn'},
  Library: {icon: 'book-open-outline', filledIcon: 'book-open-variant', label: 'Library'},
  Profile: {icon: 'account-outline', filledIcon: 'account', label: 'Profile'},
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Camera FAB center button
          if (route.name === 'Translator') {
            return (
              <View key={route.key} style={styles.fabWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onPress}
                  style={styles.fab}>
                  <Icon name="camera" size={30} color={currentTheme.white} />
                </TouchableOpacity>
              </View>
            );
          }

          const config = TAB_CONFIG[route.name] || {icon: 'help', filledIcon: 'help', label: route.name};

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}>
              <Icon
                name={isFocused ? config.filledIcon : config.icon}
                size={26}
                color={isFocused ? currentTheme.primary : currentTheme.textMuted}
              />
              {isFocused && (
                <Text style={styles.activeLabel}>{config.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      width: width,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: theme.cardBg,
      height: Platform.OS === 'ios' ? 88 : 72,
      borderTopLeftRadius: RADIUS['2xl'],
      borderTopRightRadius: RADIUS['2xl'],
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
      paddingTop: 8,
      ...SHADOWS.nav,
      shadowOpacity: isDark ? 0.3 : 0.08,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      minWidth: 50,
    },
    fabWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 70,
    },
    fab: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      top: -30,
      borderWidth: 4,
      borderColor: isDark ? theme.background : theme.white,
      ...SHADOWS.fab,
    },
    activeLabel: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: '700',
      marginTop: 2,
    },
  });
};
