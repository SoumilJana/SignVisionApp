import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import {Camera, useFrameProcessor, CameraDevice} from 'react-native-vision-camera';
import {useSharedValue, useRunOnJS} from 'react-native-worklets-core';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DebugOverlay from './DebugOverlay';
import {
  HandLandmarks,
  HandDetectionResult,
  getLatencyColor,
} from '../utils/landmarkUtils';
import {detectHandLandmarks} from '../plugins/handLandmarker';
import {TranslationResult} from '../ml/translationPipeline';
import {sendLandmarks, PredictionResult, setConnectionStateListener} from '../utils/landmarkService';
import {dataCapture} from '../ml/dataCapture';
import {speak as ttsSpeak} from '../utils/TtsService';
import {COLORS, SHADOWS, RADIUS, SPACING} from '../theme';

// ── Isolated child: ConfidenceBadge ─────────────────────────────────────────
// Replaces the static LIVE badge. Shows live confidence % from last prediction,
// color-coded: green ≥70%, yellow 50-69%, red <50%, gray when no detection.
interface ConfidenceBadgeProps {
  confidence: number | null;
}

const ConfidenceBadge = React.memo(function ConfidenceBadge({confidence}: ConfidenceBadgeProps) {
  const label = confidence === null ? '---' : `${(confidence * 100).toFixed(0)}%`;
  const color =
    confidence === null ? 'rgba(255,255,255,0.5)'
    : confidence >= 0.70 ? '#22c55e'
    : confidence >= 0.50 ? '#f59e0b'
    : '#ef4444';

  return (
    <View style={styles.confidenceBadge}>
      <Text style={[styles.confidenceText, {color}]}>{label}</Text>
    </View>
  );
});

// ── Isolated child: LatencyBadge ────────────────────────────────────────────
// Owns its own state + polling interval so it doesn't trigger parent re-renders.
interface LatencyBadgeProps {
  processingTime: {value: number};
  visible: boolean;
}

const LatencyBadge = React.memo(function LatencyBadge({processingTime, visible}: LatencyBadgeProps) {
  const [latencyMs, setLatencyMs] = React.useState(0);

  React.useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setLatencyMs(processingTime.value);
    }, 200);
    return () => clearInterval(interval);
  }, [processingTime, visible]);

  if (!visible) return null;

  const latencyColor = getLatencyColor(latencyMs);
  return (
    <View style={styles.latencyBadge}>
      <Text style={[styles.latencyText, {color: latencyColor}]}>
        {latencyMs.toFixed(1)}ms
      </Text>
    </View>
  );
});

// ── Isolated child: HoldProgressBar ─────────────────────────────────────────
// Owns its own progress state + 50ms interval so it doesn't trigger parent re-renders.
// Calls onCommit when hold duration is reached.
interface HoldProgressBarProps {
  predictionResult: string | null;
  captureMode: boolean;
  onCommit: (letter: string) => void;
}

const HOLD_DURATION_MS = 3000;

const HoldProgressBar = React.memo(function HoldProgressBar({
  predictionResult,
  captureMode,
  onCommit,
}: HoldProgressBarProps) {
  const [holdProgress, setHoldProgress] = React.useState(0);
  const holdStartRef = React.useRef<number | null>(null);
  const lastCommittedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (captureMode || !predictionResult) {
      holdStartRef.current = null;
      lastCommittedRef.current = null;
      setHoldProgress(0);
      return;
    }
    holdStartRef.current = Date.now();
    setHoldProgress(0);
    const interval = setInterval(() => {
      if (holdStartRef.current === null) return;
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setHoldProgress(progress);
      if (elapsed >= HOLD_DURATION_MS && lastCommittedRef.current !== predictionResult) {
        lastCommittedRef.current = predictionResult;
        onCommit(predictionResult);
        holdStartRef.current = Date.now();
        lastCommittedRef.current = null;
        setHoldProgress(0);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [predictionResult, captureMode, onCommit]);

  if (!predictionResult || holdProgress <= 0) return null;

  return (
    <View style={styles.holdBar}>
      <View style={[styles.holdFill, {width: `${holdProgress * 100}%`}]} />
    </View>
  );
});

// ── Main CameraView ─────────────────────────────────────────────────────────

interface CameraViewProps {
  device: CameraDevice;
  isActive: boolean;
  captureMode?: boolean;
  _onTranslationResult?: (result: TranslationResult | null) => void;
}

const CLEAR_DELAY_MS = 30;
const HAND_PRESENCE_THRESHOLD = 0.5; // Fix 2: ignore low-confidence ghost detections
const EMA_ALPHA = 0.4;               // Fix 1: landmark smoothing (0=frozen, 1=raw)
const WINDOW_SIZE = 5;               // Fix 3: rolling prediction window size

export default function CameraView({device, isActive, captureMode = false}: CameraViewProps) {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const cameraHeight = screenHeight * 0.75;

  const [showDebug] = React.useState(true);

  // null = no hand detected, overlay renders nothing
  const [overlayLandmarks, setOverlayLandmarks] = React.useState<HandLandmarks | null>(null);

  const [predictionResult, setPredictionResult] = React.useState<string | null>(null);
  const [outputSentence, setOutputSentence] = React.useState<string>('');
  const [isCameraActive, setIsCameraActive] = React.useState(isActive);
  const [lastConfidence, setLastConfidence] = React.useState<number | null>(null);
  const [isOffline, setIsOffline] = React.useState(false);

  const lastApiCallRef = React.useRef<number>(0);
  const predictionHistoryRef = React.useRef<string[]>([]);
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const smoothedLandmarksRef = React.useRef<HandLandmarks | null>(null); // Fix 1: EMA state

  const API_THROTTLE_MS = 150;
  const STABILITY_FRAMES = 3; // Fix 3: majority vote — must appear 3/5 times

  const processingTime = useSharedValue(0);
  const handCount = useSharedValue(0);

  const captureModeRef = React.useRef(captureMode);
  React.useEffect(() => {
    captureModeRef.current = captureMode;
  }, [captureMode]);

  // ── AppState: pause camera when backgrounded ───────────────────────────────
  React.useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        setTimeout(() => setIsCameraActive(true), 100);
      } else {
        setIsCameraActive(false);
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    if (AppState.currentState === 'active') {
      setIsCameraActive(isActive);
    }
  }, [isActive]);

  React.useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    setConnectionStateListener(state => setIsOffline(state === 'offline'));
    return () => setConnectionStateListener(null);
  }, []);

  const setHandsFromWorklet = useRunOnJS(
    async (hands: HandDetectionResult[], _latency: number) => {
      // Fix 2: confidence gate — treat low-confidence detections as "no hand"
      const handValid =
        hands.length > 0 &&
        hands[0].landmarks &&
        hands[0].confidence >= HAND_PRESENCE_THRESHOLD;

      if (!handValid) {
        // Short debounce: clears overlay after CLEAR_DELAY_MS of no detection
        // Prevents flicker on single dropped frames
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
          setOverlayLandmarks(null);
          smoothedLandmarksRef.current = null; // Fix 1: reset EMA on clear
          setPredictionResult(null);
          setLastConfidence(null); // clear confidence badge when hand gone
          predictionHistoryRef.current = [];
        }, CLEAR_DELAY_MS);
        return;
      }

      // Hand present — cancel pending clear, update overlay immediately
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }

      const rawLandmarks = hands[0].landmarks;

      /* EMA smoothing disabled (S2) — re-enable by removing this comment block
      const prev = smoothedLandmarksRef.current;
      const landmarks: HandLandmarks = rawLandmarks.map((lm, i) => {
        if (!prev || !prev[i]) return lm;
        return {
          x: EMA_ALPHA * lm.x + (1 - EMA_ALPHA) * prev[i].x,
          y: EMA_ALPHA * lm.y + (1 - EMA_ALPHA) * prev[i].y,
          z: EMA_ALPHA * lm.z + (1 - EMA_ALPHA) * prev[i].z,
        };
      });
      smoothedLandmarksRef.current = landmarks;
      */
      const landmarks = rawLandmarks;

      setOverlayLandmarks(landmarks);

      // ── Data capture ───────────────────────────────────────────────────────
      if (captureModeRef.current) {
        if (dataCapture.status.isCapturing) {
          dataCapture.addSample(landmarks);
        }
        return;
      }

      // ── Prediction (throttled + stability check) ───────────────────────────
      const flatLandmarks: number[] = [];
      landmarks.forEach((pt: any) => {
        flatLandmarks.push(1 - pt.x, pt.y, pt.z);
      });

      if (flatLandmarks.length !== 63) return;

      const now = Date.now();
      if (now - lastApiCallRef.current < API_THROTTLE_MS) return;
      if (hands.length !== 1) {
        predictionHistoryRef.current = [];
        return;
      }

      lastApiCallRef.current = now;
      try {
        const result: PredictionResult | null = await sendLandmarks(flatLandmarks);
        if (result) {
          setLastConfidence(result.confidence);

          if (result.top3.length > 0) {
            // Top-K voting: push all top-3 letters into history each frame.
            // A letter appearing at position 2 or 3 still accumulates votes,
            // making borderline signs register faster than top-1-only voting.
            result.top3.forEach(c => predictionHistoryRef.current.push(c.letter));
            while (predictionHistoryRef.current.length > WINDOW_SIZE * 3) {
              predictionHistoryRef.current.shift();
            }

            // Tally votes across the rolling window
            const freq: Record<string, number> = {};
            for (const l of predictionHistoryRef.current) {
              freq[l] = (freq[l] || 0) + 1;
            }
            const winner = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
            if (winner && winner[1] >= STABILITY_FRAMES) {
              setPredictionResult(winner[0]);
            }
          }
          // null result or empty top3 = low confidence — don't reset history,
          // let accumulated votes persist so a weak frame doesn't clear a stable sign
        }
      } catch (error) {
        console.error('Prediction failed:', error);
      }
    },
    [],
  );

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      const startTime = performance.now();
      const hands = detectHandLandmarks(frame);
      const endTime = performance.now();
      processingTime.value = endTime - startTime;
      handCount.value = hands.length;
      setHandsFromWorklet(hands, endTime - startTime);
    },
    [processingTime, handCount, setHandsFromWorklet],
  );

  // Stable callback for HoldProgressBar — appends committed letter to output
  const handleHoldCommit = React.useCallback((letter: string) => {
    setOutputSentence(prev => prev + letter);
  }, []);

  const frameW = device.formats[0]?.videoWidth || 1920;
  const frameH = device.formats[0]?.videoHeight || 1080;

  const handleSpeak = () => {
    const text = outputSentence || predictionResult || '';
    ttsSpeak(text);
  };
  const handleClearOutput = () => { setOutputSentence(''); setPredictionResult(null); };
  const handleCopyOutput = () => console.log('Copied:', outputSentence || predictionResult || '');

  return (
    <View style={styles.container}>
      <View style={[styles.cameraSection, {height: cameraHeight}]}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCameraActive}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
        />

        <View style={styles.frameOverlay}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* null landmarks = renders nothing, no mock fallback */}
        <DebugOverlay
          landmarks={overlayLandmarks}
          frameWidth={frameW}
          frameHeight={frameH}
          visible={showDebug}
          overlaySectionHeight={cameraHeight}
          screenWidth={screenWidth}
        />

        <View style={styles.topBar}>
          <ConfidenceBadge confidence={lastConfidence} />
          <LatencyBadge processingTime={processingTime} visible={showDebug} />
        </View>

        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Detection offline — check connection</Text>
          </View>
        )}

        <View style={styles.promptContainer}>
          <Text style={styles.promptText}>
            {captureMode ? 'Hold sign steady in frame' : 'Align hand in frame'}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.symbolBox}>
          <Text style={styles.label}>Symbol</Text>
          <View style={styles.symbolDisplay}>
            <Text style={styles.symbolValue}>{predictionResult || '-'}</Text>
            <HoldProgressBar
              predictionResult={predictionResult}
              captureMode={captureMode}
              onCommit={handleHoldCommit}
            />
          </View>
        </View>

        <View style={styles.middleControls}>
          <TouchableOpacity
            style={[styles.iconBtn, !predictionResult && !outputSentence && styles.btnDisabled]}
            onPress={handleSpeak}
            disabled={!predictionResult && !outputSentence}>
            <Icon name="volume-high" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, !predictionResult && !outputSentence && styles.btnDisabled]}
            onPress={handleCopyOutput}
            disabled={!predictionResult && !outputSentence}>
            <Icon name="content-copy" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.translationBox}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Translated Output</Text>
            {outputSentence && (
              <TouchableOpacity onPress={handleClearOutput} hitSlop={6}>
                <Icon name="close-circle" size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.outputText} showsVerticalScrollIndicator={false}>
            <Text style={styles.translationText}>
              {outputSentence || 'Output will appear here...'}
            </Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 25;
const CORNER_WIDTH = 2;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  cameraSection: {backgroundColor: '#000', position: 'relative'},
  frameOverlay: {
    position: 'absolute', top: '20%', left: '15%', right: '15%', bottom: '20%',
  },
  cornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: COLORS.primary, borderTopLeftRadius: 6,
  },
  cornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: COLORS.primary, borderTopRightRadius: 6,
  },
  cornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: COLORS.primary, borderBottomLeftRadius: 6,
  },
  cornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: COLORS.primary, borderBottomLeftRadius: 6,
  },
  topBar: {
    position: 'absolute', top: 12, left: SPACING.md, right: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  confidenceText: {fontSize: 11, fontWeight: '700'},
  latencyBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  latencyText: {fontSize: 11, fontWeight: '700'},
  offlineBanner: {
    position: 'absolute', bottom: 44, left: 0, right: 0,
    backgroundColor: 'rgba(220,38,38,0.85)', paddingVertical: 6, alignItems: 'center',
  },
  offlineText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  promptContainer: {position: 'absolute', bottom: 12, width: '100%', alignItems: 'center'},
  promptText: {color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500'},
  bottomSection: {
    flex: 1, flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.md, paddingBottom: 85,
    backgroundColor: COLORS.background, alignItems: 'stretch',
  },
  symbolBox: {
    width: 70, backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.sm, ...SHADOWS.soft,
  },
  symbolDisplay: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4, overflow: 'hidden',
  },
  symbolValue: {fontSize: 20, fontWeight: '800', color: COLORS.primary},
  holdBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: '#e2e8f0',
  },
  holdFill: {height: '100%', backgroundColor: COLORS.primary, borderRadius: 2},
  label: {
    fontSize: 9, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
  middleControls: {
    width: 'auto', flexDirection: 'column', gap: SPACING.xs,
    justifyContent: 'flex-start', paddingTop: SPACING.sm,
  },
  iconBtn: {
    width: 44, height: 44, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.soft,
  },
  translationBox: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, padding: SPACING.sm, ...SHADOWS.soft,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  outputText: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4,
  },
  translationText: {fontSize: 12, fontWeight: '500', color: COLORS.textMain, lineHeight: 16},
  btnDisabled: {opacity: 0.5},
});
