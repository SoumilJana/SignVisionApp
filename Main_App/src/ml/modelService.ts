/**
 * modelService.ts
 * 
 * TFLite model loading and inference via react-native-fast-tflite (ADR-006).
 * Confirmed compatible with RN 0.84 New Architecture (JSI/TurboModules).
 * 
 * DO NOT use onnxruntime-react-native — not compatible with RN 0.84 new arch.
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

/** ASL labels: 26 letters (A-Z) */
export const ASL_LABELS: string[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const MIN_CONFIDENCE_THRESHOLD = 0.3;

export interface Prediction {
  label: string;
  confidence: number;
}

let cachedModel: TensorflowModel | null = null;

/**
 * Load the TFLite model from the Android assets folder.
 * Caches the model after first load.
 * 
 * @param modelName Filename in assets/models/ (default: asl_classifier.tflite)
 */
// Static require — model must be inside Metro's source tree (src/assets/)
// Metro cannot bundle files from android/app/src/main/assets/ directly
const MODEL_ASSET = require('../assets/models/asl_classifier.tflite') as number;

export async function loadModel(): Promise<TensorflowModel | null> {
  if (cachedModel) {
    return cachedModel;
  }

  const startTime = Date.now();
  try {
    const model = await loadTensorflowModel(MODEL_ASSET);
    const loadTime = Date.now() - startTime;
    console.log(`[ModelService] Model loaded in ${loadTime}ms`);
    cachedModel = model;
    return model;
  } catch (error) {
    console.error('[ModelService] Failed to load model:', error);
    return null;
  }
}

/**
 * Run inference on a 63-dim feature vector.
 * Returns raw probability distribution (26-class softmax output).
 * 
 * @param model Loaded TFLite model
 * @param features 63-element Float32 input vector (21 landmarks × 3 coords)
 */
export function runInference(
  model: TensorflowModel,
  features: number[],
): Float32Array {
  const inputTensor = new Float32Array(features);
  const outputs = model.runSync([inputTensor]);
  return outputs[0] as Float32Array;
}

/**
 * Get top-k predictions from a probability distribution.
 * 
 * @param output Probability distribution (Float32Array)
 * @param k Number of top predictions to return (default: 3)
 */
export function getTopPredictions(
  output: Float32Array,
  k: number = 3,
): Prediction[] {
  const pairs: Prediction[] = Array.from(output).map((confidence, i) => ({
    label: ASL_LABELS[i] ?? `class_${i}`,
    confidence,
  }));

  return pairs
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, k);
}

/**
 * Warm up the model with a dummy inference to prime JIT/cache on first use.
 */
export function warmUpModel(model: TensorflowModel): void {
  try {
    const dummyInput = new Float32Array(63).fill(0);
    model.runSync([dummyInput]);
    console.log('[ModelService] Model warmed up');
  } catch (_e) {
    // Warm-up failure is non-fatal
  }
}
