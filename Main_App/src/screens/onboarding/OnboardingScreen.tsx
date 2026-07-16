import React, {useState, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../../contexts/ThemeContext';
import {COLORS, DARK_COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY} from '../../theme';

const SLIDES = [
  {
    id: '1',
    icon: 'hand-wave',
    title: 'Welcome to SignVision',
    subtitle: 'Learn and translate sign language in real-time using AI',
    color: '#4f46e5',
  },
  {
    id: '2',
    icon: 'camera',
    title: 'Real-time Translation',
    subtitle: 'Point your camera at sign language and see instant translations',
    color: '#1978e5',
  },
  {
    id: '3',
    icon: 'book-open-variant',
    title: 'Learn at Your Pace',
    subtitle: 'Access a library of signs with video demonstrations',
    color: '#7c3aed',
  },
  {
    id: '4',
    icon: 'rocket-launch',
    title: 'Ready to Start?',
    subtitle: 'Create an account and begin your sign language journey',
    color: '#059669',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({onComplete}: OnboardingScreenProps) {
  const {width} = useWindowDimensions();
  const {isDark} = useTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const currentTheme = isDark ? DARK_COLORS : COLORS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChangedRef = useRef(
    ({viewableItems}: {viewableItems: Array<{index: number | null}>}) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  );
  const viewabilityConfigRef = useRef({viewAreaCoveragePercentThreshold: 50});

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({index: currentIndex + 1});
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
        viewabilityConfig={viewabilityConfigRef.current}
        renderItem={({item}) => (
          <View style={[styles.slide, {width}]}>
            <LinearGradient
              colors={[item.color, currentTheme.gradientEnd]}
              style={styles.iconCircle}>
              <Icon name={item.icon} size={48} color="#fff" />
            </LinearGradient>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}>
          <LinearGradient
            colors={[currentTheme.gradientStart, currentTheme.gradientEnd]}
            style={styles.nextBtnGradient}>
            <Text style={styles.nextBtnText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon
              name={currentIndex === SLIDES.length - 1 ? 'check' : 'arrow-right'}
              size={20}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>
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
    },
    skipBtn: {
      position: 'absolute',
      top: 56,
      right: SPACING.lg,
      zIndex: 10,
      backgroundColor: theme.cardBg,
      paddingHorizontal: SPACING.md,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
    },
    slide: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      ...SHADOWS.card,
      shadowOpacity: isDark ? 0 : 0.08,
    },
    slideTitle: {
      ...TYPOGRAPHY.h1,
      color: theme.textMain,
      textAlign: 'center',
      marginBottom: SPACING.md,
    },
    slideSubtitle: {
      fontSize: 16,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 280,
    },
    bottomControls: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: 48,
      gap: SPACING.lg,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
    dotActive: {
      width: 24,
      backgroundColor: theme.primary,
    },
    dotInactive: {
      width: 8,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
    },
    nextBtn: {
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
    },
    nextBtnGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 56,
      gap: 8,
      paddingHorizontal: SPACING.lg,
    },
    nextBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },
  });
};
