import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, DARK_COLORS, RADIUS, SPACING, TYPOGRAPHY} from '../theme';
import {useTheme} from '../contexts/ThemeContext';

export default function LearnScreen() {
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Icon name="school" size={52} color={COLORS.primary} style={styles.icon} />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>
          Guided lessons, learning paths, and quizzes are on their way.
        </Text>
      </View>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingBottom: Platform.OS === 'ios' ? 84 : 72,
    },
    card: {
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS['2xl'],
      paddingVertical: SPACING.xl,
      paddingHorizontal: SPACING.lg,
      alignItems: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    icon: {
      marginBottom: SPACING.md,
      opacity: 0.9,
    },
    title: {
      ...TYPOGRAPHY.h2,
      color: theme.textMain,
      marginBottom: SPACING.sm,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '500',
      textAlign: 'center',
      lineHeight: 22,
    },
  });
};
