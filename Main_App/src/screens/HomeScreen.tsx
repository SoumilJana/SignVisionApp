import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY} from '../theme';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useUserTier} from '../hooks/useUserTier';
import {ALL_SIGNS} from '../data/signs';

export default function HomeScreen() {
  const {user} = useAuth();
  const navigation = useNavigation();
  const {isDark} = useTheme();
  const {isPro} = useUserTier();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);

  const displayName = user?.user_metadata?.display_name || 'Learner';

  // Determine Sign of the Day using day-of-year for deterministic selection
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const signOfDay = ALL_SIGNS[dayOfYear % ALL_SIGNS.length];

  const handleQuickAction = (tab: string) => {
    navigation.navigate(tab as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {isPro && <View style={[styles.proBadge, {backgroundColor: isDark ? '#1E293B' : '#eff6ff'}]}>
                <Text style={[styles.proBadgeText, {color: COLORS.primary}]}>PRO</Text>
              </View>}
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} accessibilityLabel="Notifications">
            <Icon name="bell-outline" size={24} color={isDark ? DARK_COLORS.textMain : COLORS.textMain} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.heroCard}>
          {/* Decorative blurs */}
          <View style={styles.heroBlur1} />
          <View style={styles.heroBlur2} />

          <View style={styles.heroContent}>
            <View style={styles.heroIconWrap}>
              <Icon name="hand-wave" size={28} color="#fff" />
            </View>
            <Text style={styles.heroTitle}>Start Translating</Text>
            <Text style={styles.heroDesc}>
              Use your camera to translate sign language in real-time
            </Text>
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => navigation.navigate('Translator' as never)}
              activeOpacity={0.85}>
              <Icon name="camera" size={20} color={COLORS.primary} />
              <Text style={styles.heroCtaText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => handleQuickAction('Translator')}
              activeOpacity={0.7}
              accessibilityLabel="Translate sign language"
              accessibilityHint="Opens camera for real-time translation">
              <View style={[styles.actionIconWrap, {backgroundColor: isDark ? '#1E293B' : '#eff6ff'}]}>
                <Icon name="camera" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Translate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => handleQuickAction('Library')}
              activeOpacity={0.7}
              accessibilityLabel="Learn signs"
              accessibilityHint="Opens sign library to learn">
              <View style={[styles.actionIconWrap, {backgroundColor: isDark ? '#1E293B' : '#eff6ff'}]}>
                <Icon name="book-open-variant" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Learn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => handleQuickAction('Library')}
              activeOpacity={0.7}
              accessibilityLabel="Browse all signs"
              accessibilityHint="Opens full sign library">
              <View style={[styles.actionIconWrap, {backgroundColor: isDark ? '#1E293B' : '#eff6ff'}]}>
                <Icon name="hand-right" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Browse</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign of the Day Section */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={[styles.signOfDayCard, {borderLeftColor: COLORS.primary}]}>
            <View style={styles.signOfDayHeader}>
              <Text style={styles.signOfDayEmoji}>{signOfDay.emoji}</Text>
              <View style={styles.signOfDayTitleWrap}>
                <View style={styles.signLabelRow}>
                  <Text style={styles.signOfDayLabel}>{signOfDay.label}</Text>
                  <View style={[styles.difficultyBadge, {backgroundColor: isDark ? '#1E293B' : '#eff6ff'}]}>
                    <Text style={[styles.difficultyText, {color: COLORS.primary}]}>{signOfDay.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.signSubtitle} numberOfLines={1}>{signOfDay.subtitle}</Text>
              </View>
            </View>
            <View style={styles.signOfDayStep}>
              <Text style={styles.stepLabel}>Try it:</Text>
              <Text style={styles.stepText} numberOfLines={2}>{signOfDay.steps[0]}</Text>
            </View>
            <TouchableOpacity
              style={styles.tryButton}
              onPress={() => handleQuickAction('Translator')}
              activeOpacity={0.7}
              accessibilityLabel={`Try ${signOfDay.label} sign`}>
              <Text style={styles.tryButtonText}>Try it →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: 56,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: SPACING.lg,
      paddingTop: SPACING.md,
    },
    headerLeft: {
      flex: 1,
      marginRight: SPACING.md,
    },
    greeting: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textMuted,
      marginBottom: 2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    userName: {
      ...TYPOGRAPHY.h1,
      color: theme.textMain,
    },
    proBadge: {
      borderRadius: RADIUS.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minHeight: 20,
      justifyContent: 'center',
    },
    proBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    notifBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    heroCard: {
      borderRadius: RADIUS['2xl'],
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      overflow: 'hidden',
      ...SHADOWS.card,
      shadowOpacity: isDark ? 0 : 0.08,
    },
    heroBlur1: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    heroBlur2: {
      position: 'absolute',
      bottom: -15,
      left: -15,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    heroContent: {
      position: 'relative',
      zIndex: 1,
    },
    heroIconWrap: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.lg,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 6,
    },
    heroDesc: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: SPACING.lg,
      lineHeight: 20,
      maxWidth: 240,
    },
    heroCta: {
      backgroundColor: '#fff',
      borderRadius: RADIUS.lg,
      paddingVertical: 14,
      paddingHorizontal: SPACING.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    heroCtaText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '700',
    },
    section: {
      marginBottom: SPACING.lg,
    },
    lastSection: {
      marginBottom: 100,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: SPACING.md,
      justifyContent: 'space-between',
    },
    actionTile: {
      flex: 1,
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.xl,
      padding: SPACING.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    actionIconWrap: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.sm,
    },
    actionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textMain,
      textAlign: 'center',
    },
    signOfDayCard: {
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.xl,
      borderLeftWidth: 5,
      padding: SPACING.lg,
      gap: SPACING.md,
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    signOfDayHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING.md,
    },
    signOfDayEmoji: {
      fontSize: 40,
    },
    signOfDayTitleWrap: {
      flex: 1,
    },
    signLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: 4,
    },
    signOfDayLabel: {
      ...TYPOGRAPHY.h3,
      color: theme.textMain,
    },
    difficultyBadge: {
      borderRadius: RADIUS.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      minHeight: 20,
      justifyContent: 'center',
    },
    difficultyText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    signSubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 18,
    },
    signOfDayStep: {
      gap: 4,
    },
    stepLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    stepText: {
      fontSize: 14,
      color: theme.textMain,
      fontWeight: '500',
      lineHeight: 20,
    },
    tryButton: {
      backgroundColor: theme.primaryLight,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      alignItems: 'center',
    },
    tryButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '700',
    },
  });
};
