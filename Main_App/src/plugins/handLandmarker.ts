import { VisionCameraProxy, Frame } from 'react-native-vision-camera';
import {
  HandLandmarks,
  HandDetectionResult,
} from '../utils/landmarkUtils';

// Initialize the native plugin — must match the name registered in HandLandmarkerPluginPackage.kt
const plugin = VisionCameraProxy.initFrameProcessorPlugin('handLandmarker', {});

if (!plugin) {
  console.warn(
    '[HandLandmarker] Plugin not found. Did you rebuild the native code after adding HandLandmarkerPluginPackage?',
  );
}

/** Result shape returned by the native Kotlin plugin */
interface NativeLandmark {
  x: number;
  y: number;
  z: number;
}

interface NativeHandResult {
  isLeftHand: boolean;
  confidence: number;
  landmarks: NativeLandmark[];
}

interface NativePluginResult {
  hands: NativeHandResult[];
  handCount: number;
  error?: string;
}

/**
 * Worklet function that calls the native MediaPipe Hand Landmarker plugin.
 *
 * Must be called inside a `useFrameProcessor` worklet context.
 * The frame is processed entirely on the native side including YUV→RGB conversion.
 *
 * ADR-007: DO NOT set pixelFormat="rgb" on <Camera>. YUV is handled natively here.
 *
 * @returns Array of HandDetectionResult (up to 2 hands), or empty array if no hands detected.
 */
export function detectHandLandmarks(frame: Frame): HandDetectionResult[] {
  'worklet';
  if (!plugin) {
    return [];
  }

  const result = plugin.call(frame) as unknown as NativePluginResult | null;

  if (!result || result.handCount === 0 || !result.hands) {
    return [];
  }

  // Convert native result to our internal HandDetectionResult type
  return result.hands.map(hand => ({
    landmarks: hand.landmarks as HandLandmarks,
    isLeftHand: hand.isLeftHand,
    confidence: hand.confidence,
  }));
}
