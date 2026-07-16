/**
 * dualHand.ts
 * 
 * Dual-hand feature combiner for two-hand ASL signs.
 * Uses 63-feature mode:
 *   - Single hand:  [63 features] + [63 zeros padding]
 *   - Dual hands:   [63 dominant] + [63 non-dominant]
 * Total: 126-dim feature vector
 */

import { HandDetectionResult } from '../utils/landmarkUtils';
import { extractRawFeatureVector } from './normalization';

const EMPTY_FEATURES = Array(63).fill(0) as number[];
const DUAL_HAND_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Determine which hand is dominant (right hand = dominant in ASL convention).
 * Returns [dominant, nonDominant] or [hand, null] for single hand.
 */
function orderHands(
  hands: HandDetectionResult[],
): [HandDetectionResult, HandDetectionResult | null] {
  if (hands.length === 1) {
    return [hands[0], null];
  }

  // Sort: right hand first (dominant), left hand second
  const rightHand = hands.find(h => !h.isLeftHand);
  const leftHand = hands.find(h => h.isLeftHand);

  if (rightHand && leftHand) {
    return [rightHand, leftHand];
  }

  // If both are same handedness, use first as dominant
  return [hands[0], hands[1]];
}

/**
 * Combine dual-hand features into a 126-dim vector.
 * 
 * @param hands Array of detected HandDetectionResult (1 or 2 hands)
 * @returns 126-element feature vector
 */
export function combineDualHandFeatures(hands: HandDetectionResult[]): number[] {
  if (hands.length === 0) {
    return [...EMPTY_FEATURES, ...EMPTY_FEATURES];
  }

  const [dominant, nonDominant] = orderHands(hands);

  const dominantFeatures = extractRawFeatureVector(dominant.landmarks);
  const nonDominantFeatures = nonDominant
    ? extractRawFeatureVector(nonDominant.landmarks)
    : EMPTY_FEATURES;

  return [...dominantFeatures, ...nonDominantFeatures]; // 126-dim
}

/**
 * Returns true if exactly 2 hands are detected with sufficient confidence.
 */
export function isDualHandSign(hands: HandDetectionResult[]): boolean {
  return (
    hands.length === 2 &&
    hands.every(h => h.confidence >= DUAL_HAND_CONFIDENCE_THRESHOLD)
  );
}
