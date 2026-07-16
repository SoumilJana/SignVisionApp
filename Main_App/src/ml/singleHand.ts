/**
 * singleHand.ts
 * 
 * Single-hand feature extraction for ASL alphabet recognition.
 * Uses 63 features: 21 landmarks × (x, y, z)
 * - Wrist-relative coordinates
 * - Normalized by max value
 */

import { HandDetectionResult, HandLandmarks } from '../utils/landmarkUtils';
import { extractRawFeatureVector } from './normalization';
import { MIN_CONFIDENCE_THRESHOLD } from './modelService';

export { MIN_CONFIDENCE_THRESHOLD } from './modelService';

/**
 * Validate hand detection meets minimum requirements.
 * 
 * @param hand Hand detection result
 * @returns true if hand is valid for prediction
 */
export function isValidHand(hand: HandDetectionResult): boolean {
  return (
    hand.landmarks.length === 21 &&
    hand.confidence >= MIN_CONFIDENCE_THRESHOLD
  );
}

/**
 * Extract 63 features from a single hand.
 * Returns null if hand is invalid.
 * 
 * @param hand Hand detection result
 * @returns 63-element feature vector or null
 */
export function extractSingleHandFeatures(hand: HandDetectionResult): number[] | null {
  if (!isValidHand(hand)) {
    return null;
  }
  return extractRawFeatureVector(hand.landmarks);
}
