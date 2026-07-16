import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Props {
  selectedLetter: string;
  onSelectLetter: (l: string) => void;
  onRecord: () => void;
  isCapturing: boolean;
  sampleCount: number;
}

export default function CapturePanel({
  selectedLetter, onSelectLetter,
  onRecord, isCapturing, sampleCount,
}: Props) {
  const TARGET = 50;

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>Data Capture</Text>

      {/* Letter picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {LETTERS.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.letterBtn, l === selectedLetter && styles.letterActive]}
            onPress={() => onSelectLetter(l)}
          >
            <Text style={[styles.letterText, l === selectedLetter && styles.letterTextActive]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Progress + Record */}
      <View style={styles.row}>
        <Text style={styles.progress}>
          {isCapturing ? `${sampleCount} / ${TARGET}` : 'Ready'}
        </Text>
        <TouchableOpacity
          style={[styles.recordBtn, isCapturing && styles.recordBtnActive]}
          onPress={onRecord}
          disabled={isCapturing}
        >
          <Text style={styles.recordText}>
            {isCapturing ? 'Recording...' : '● Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#1e293b',
    padding: SPACING.md,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  heading: { color: '#fff', fontWeight: '700', fontSize: 13 },
  scroll: { flexGrow: 0 },
  letterBtn: {
    width: 34, height: 34, borderRadius: RADIUS.sm,
    backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  letterActive: { backgroundColor: COLORS.primary },
  letterText: { color: '#94a3b8', fontWeight: '600' },
  letterTextActive: { color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { color: '#94a3b8', fontSize: 12 },
  recordBtn: {
    backgroundColor: '#ef4444',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  recordBtnActive: { backgroundColor: '#6b7280' },
  recordText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});