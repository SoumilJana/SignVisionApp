import React, {useState} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {COLORS, RADIUS, SHADOWS} from '../../theme';
import {Sign} from '../../data/signs';
import {getLocalSignImage} from '../../utils/signImages';

interface SignGridItemProps {
  sign: Sign;
  onPress: (sign: Sign) => void;
  locked?: boolean;
  showEmoji?: boolean;
}

export default function SignGridItem({sign, onPress, locked = false, showEmoji = true}: SignGridItemProps) {
  const [useRemote, setUseRemote] = useState(true);
  const localSource = getLocalSignImage(sign.id);
  const imageSource = useRemote && sign.imageUrl ? {uri: sign.imageUrl} : localSource;

  return (
    <TouchableOpacity
      style={[styles.container, locked && styles.locked]}
      onPress={() => onPress(sign)}
      activeOpacity={locked ? 1 : 0.72}
      disabled={locked}>
      {locked && (
        <View style={styles.lockOverlay}>
          <Icon name="lock" size={18} color={COLORS.textMuted} />
        </View>
      )}
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.thumbnail, locked && styles.dimmed]}
          resizeMode="contain"
          onError={() => setUseRemote(false)}
        />
      ) : showEmoji ? (
        <Text style={[styles.emoji, locked && styles.dimmed]}>{sign.emoji}</Text>
      ) : null}
      <Text
        style={[
          imageSource ? styles.label : showEmoji ? styles.label : styles.labelLarge,
          locked && styles.dimmed,
        ]}
        numberOfLines={1}>
        {sign.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    ...SHADOWS.soft,
  },
  locked: {
    backgroundColor: COLORS.background,
  },
  lockOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  thumbnail: {
    width: '65%',
    height: '55%',
    marginBottom: 2,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    letterSpacing: -0.2,
  },
  labelLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.5,
  },

  dimmed: {
    opacity: 0.35,
  },
});
