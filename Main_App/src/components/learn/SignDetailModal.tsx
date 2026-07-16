import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY} from '../../theme';
import {Sign} from '../../data/signs';
import {getLocalSignImage} from '../../utils/signImages';

interface SignDetailModalProps {
  sign: Sign | null;
  visible: boolean;
  onClose: () => void;
  onPractice: () => void;
  showPractice?: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: '#10b981',
  Intermediate: '#f59e0b',
  Advanced: '#ef4444',
};

export default function SignDetailModal({
  sign,
  visible,
  onClose,
  onPractice,
  showPractice = true,
}: SignDetailModalProps) {
  const [useRemote, setUseRemote] = useState(true);

  if (!sign) return null;

  const localSource = getLocalSignImage(sign.id);
  const imageSource = useRemote && sign.imageUrl ? {uri: sign.imageUrl} : localSource;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card */}
      <View style={styles.centeredView} pointerEvents="box-none">
        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Icon name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Image / Video placeholder */}
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.signImage}
              resizeMode="cover"
              onError={() => setUseRemote(false)}
            />
          ) : (
            <LinearGradient
              colors={['#4f46e5', '#1978e5']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.videoPlaceholder}>
              <Text style={styles.videoEmoji}>{sign.emoji}</Text>
              <View style={styles.playButton}>
                <Icon name="play" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.videoCaption}>Video coming soon</Text>
            </LinearGradient>
          )}

          {/* Sign info */}
          <View style={styles.body}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title row */}
              <View style={styles.titleRow}>
                <Text style={styles.signLabel}>{sign.label}</Text>
                {showPractice && (
                  <View
                    style={[
                      styles.difficultyBadge,
                      {backgroundColor: DIFFICULTY_COLOR[sign.difficulty] + '22'},
                    ]}>
                    <Text
                      style={[
                        styles.difficultyText,
                        {color: DIFFICULTY_COLOR[sign.difficulty]},
                      ]}>
                      {sign.difficulty}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.subtitle}>{sign.subtitle}</Text>

              {/* Steps — only in practice/learn mode */}
              {showPractice && (
                <>
                  <Text style={styles.sectionTitle}>How to Sign</Text>
                  {sign.steps.map((step, i) => (
                    <View key={i} style={styles.stepRow}>
                      <View style={styles.stepBullet}>
                        <Text style={styles.stepNumber}>{i + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.practiceCta}
                    onPress={onPractice}
                    activeOpacity={0.85}>
                    <Icon name="camera" size={18} color={COLORS.white} />
                    <Text style={styles.practiceCtaText}>Open Camera to Practice</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  signImage: {
    height: 180,
    width: '100%',
  },
  videoPlaceholder: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  playButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  videoCaption: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  body: {
    padding: SPACING.lg,
    maxHeight: 340,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  signLabel: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textMain,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  stepBullet: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain,
    lineHeight: 20,
    fontWeight: '500',
  },
  practiceCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  practiceCtaText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
