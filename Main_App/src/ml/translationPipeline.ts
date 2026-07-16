/**
 * translationPipeline.ts
 * 
 * Single-hand ASL alphabet recognition pipeline.
 * - Accepts only single-hand detection
 * - 63 features: 21 landmarks × (x, y, z)
 * - Minimum confidence threshold: 0.3
 * - Targets < 200ms end-to-end latency
 */

import { HandDetectionResult } from '../utils/landmarkUtils';
import { extractSingleHandFeatures, isValidHand, MIN_CONFIDENCE_THRESHOLD } from './singleHand';
import {
  loadModel,
  runInference,
  getTopPredictions,
  warmUpModel,
  Prediction,
  MIN_CONFIDENCE_THRESHOLD as MODEL_MIN_CONF,
} from './modelService';
import { TensorflowModel } from 'react-native-fast-tflite';

export interface TranslationResult {
  label: string;
  confidence: number;
  latencyMs: number;
  topPredictions: Prediction[];
}

export class TranslationPipeline {
  private model: TensorflowModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    const model = await loadModel();
    if (!model) {
      console.error('[TranslationPipeline] Failed to initialize: model not loaded');
      return false;
    }

    warmUpModel(model);
    this.model = model;
    this.isInitialized = true;
    console.log('[TranslationPipeline] Initialized (single-hand mode, 63 features) ✅');
    return true;
  }

  processFrame(hands: HandDetectionResult[]): TranslationResult | null {
    if (!this.model || !this.isInitialized) {
      return null;
    }

    if (hands.length !== 1) {
      console.log('[TranslationPipeline] Ignoring: require exactly 1 hand, got', hands.length);
      return null;
    }

    const hand = hands[0];

    if (!isValidHand(hand)) {
      console.log('[TranslationPipeline] Ignoring: confidence', hand.confidence, '<', MIN_CONFIDENCE_THRESHOLD);
      return null;
    }

    const startTime = performance.now();

    const features = extractSingleHandFeatures(hand);
    if (!features) {
      return null;
    }

    const output = runInference(this.model, features);
    const predictions = getTopPredictions(output, 3);
    const top = predictions[0];

    if (top.confidence < MODEL_MIN_CONF) {
      console.log('[TranslationPipeline] Ignoring: prediction confidence', top.confidence, '<', MODEL_MIN_CONF);
      return null;
    }

    const latencyMs = performance.now() - startTime;

    return {
      label: top.label,
      confidence: top.confidence,
      latencyMs,
      topPredictions: predictions,
    };
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

export const translationPipeline = new TranslationPipeline();
