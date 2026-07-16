/**
 * LibraryScreen — View-only sign library.
 * No emojis in grid, no practice CTA in detail modal.
 * Free: A-Z + 10 gestures. Pro: all 20 gestures.
 */
import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {COLORS, DARK_COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY} from '../theme';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {LETTERS, FREE_GESTURES, PRO_GESTURES, Sign} from '../data/signs';
import SignGridItem from '../components/learn/SignGridItem';
import SignDetailModal from '../components/learn/SignDetailModal';

const useIsPro = () => {
  const {user} = useAuth();
  return (user as any)?.app_metadata?.plan === 'pro';
};

const LETTER_COLS = 4;
const GESTURE_COLS = 2;
const GRID_GAP = 10;
const HORIZONTAL_PAD = 24; // SPACING.lg
const CELL_W =
  (Dimensions.get('window').width - 2 * HORIZONTAL_PAD - (LETTER_COLS - 1) * GRID_GAP) /
  LETTER_COLS;
const GESTURE_CELL_W =
  (Dimensions.get('window').width - 2 * HORIZONTAL_PAD - (GESTURE_COLS - 1) * GRID_GAP) /
  GESTURE_COLS;

export default function LibraryScreen() {
  const isPro = useIsPro();
  const {isDark} = useTheme();
  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const [query, setQuery] = useState('');
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const visibleGestures = useMemo(
    () => (isPro ? [...FREE_GESTURES, ...PRO_GESTURES] : FREE_GESTURES),
    [isPro],
  );

  const filteredLetters = useMemo(() => {
    if (!query.trim()) return LETTERS;
    const q = query.toLowerCase();
    return LETTERS.filter(
      s => s.label.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q),
    );
  }, [query]);

  const filteredGestures = useMemo(() => {
    if (!query.trim()) return visibleGestures;
    const q = query.toLowerCase();
    return visibleGestures.filter(
      s => s.label.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q),
    );
  }, [query, visibleGestures]);

  const handleSignPress = useCallback((sign: Sign) => {
    setSelectedSign(sign);
    setModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => setModalVisible(false), []);

  const renderLetterItem = useCallback(
    ({item}: {item: Sign}) => (
      <View style={styles.gridCell}>
        {/* showEmoji={false} → text-only grid item */}
        <SignGridItem sign={item} onPress={handleSignPress} showEmoji={false} />
      </View>
    ),
    [handleSignPress, styles.gridCell],
  );

  const renderGestureItem = useCallback(
    ({item}: {item: Sign}) => (
      <View style={styles.gestureCell}>
        <SignGridItem sign={item} onPress={handleSignPress} showEmoji={false} />
      </View>
    ),
    [handleSignPress, styles.gestureCell],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sign Library</Text>
          <Text style={styles.headerSubtitle}>Browse all signs</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Icon name="magnify" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for signs..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Alphabet */}
        {filteredLetters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              The Alphabet
              <Text style={styles.sectionCount}> · {filteredLetters.length}</Text>
            </Text>
            <FlatList
              data={filteredLetters}
              renderItem={renderLetterItem}
              keyExtractor={item => item.id}
              numColumns={LETTER_COLS}
              scrollEnabled={false}
              key={`lib-letters-${LETTER_COLS}`}
              columnWrapperStyle={styles.gridRow}
            />
          </View>
        )}

        {/* Common Phrases */}
        {filteredGestures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Common Phrases
              <Text style={styles.sectionCount}> · {filteredGestures.length}</Text>
            </Text>
            <FlatList
              data={filteredGestures}
              renderItem={renderGestureItem}
              keyExtractor={item => item.id}
              numColumns={GESTURE_COLS}
              scrollEnabled={false}
              key={`lib-gestures-${GESTURE_COLS}`}
              columnWrapperStyle={styles.gridRow}
            />
          </View>
        )}

        {/* Empty state */}
        {filteredLetters.length === 0 && filteredGestures.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="magnify-close" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No signs found</Text>
            <Text style={styles.emptySubtitle}>Try a different search</Text>
          </View>
        )}
      </ScrollView>

      {/* Detail modal — no practice CTA */}
      <SignDetailModal
        sign={selectedSign}
        visible={modalVisible}
        onClose={handleModalClose}
        onPractice={handleModalClose}
        showPractice={false}
      />
    </View>
  );
}

const getStyles = (isDark: boolean) => {
  const theme = isDark ? DARK_COLORS : COLORS;
  
  return StyleSheet.create({
    container: {flex: 1, backgroundColor: theme.background},
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingTop: Platform.OS === 'ios' ? 56 : 48,
      paddingBottom: 100,
    },
    header: {marginBottom: SPACING.lg},
    headerTitle: {...TYPOGRAPHY.h1, color: theme.textMain},
    headerSubtitle: {fontSize: 14, color: theme.textMuted, fontWeight: '500', marginTop: 2},
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.xl,
      paddingHorizontal: SPACING.md,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      marginBottom: SPACING.lg,
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
      gap: SPACING.sm,
    },
    searchIcon: {flexShrink: 0},
    searchInput: {flex: 1, fontSize: 15, color: theme.textMain, fontWeight: '500', padding: 0},
    section: {marginBottom: SPACING.xl},
    sectionTitle: {...TYPOGRAPHY.h3, color: theme.textMain, marginBottom: SPACING.md},
    sectionCount: {fontWeight: '500', color: theme.textMuted},
    gridRow: {gap: GRID_GAP, marginBottom: GRID_GAP},
    gridCell: {width: CELL_W},
    gestureCell: {width: GESTURE_CELL_W},
    phraseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.cardBg,
      borderRadius: RADIUS.xl,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      ...SHADOWS.soft,
      shadowOpacity: isDark ? 0.2 : 0.05,
    },
    phraseInfo: {flex: 1},
    phraseLabel: {fontSize: 15, fontWeight: '700', color: theme.textMain},
    emptyState: {alignItems: 'center', paddingTop: 60},
    emptyTitle: {...TYPOGRAPHY.h3, color: theme.textMain, marginTop: SPACING.md, marginBottom: 6},
    emptySubtitle: {fontSize: 14, color: theme.textMuted},
  });
};
