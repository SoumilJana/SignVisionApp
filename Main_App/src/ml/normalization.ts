/**
 * normalization.ts
 * 
 * Feature extraction for ASL hand landmark features.
 * Uses 63-feature mode matching the training pipeline:
 *   21 HandLandmarks (x,y,z) → wrist-relative → normalize by max → 63-dim vector
 */

import { HandLandmarks, HandLandmark } from '../utils/landmarkUtils';

/**
 * Compute 63 raw features: wrist-relative landmarks, normalized by max value.
 * Matches extract_landmarks.py normalization in training pipeline.
 * 
 * @param landmarks 21 MediaPipe landmarks for one hand
 * @returns 63-element feature vector
 */
export function extractRawFeatureVector(landmarks: HandLandmarks): number[] {
  if (landmarks.length !== 21) {
    throw new Error(`Expected 21 landmarks, got ${landmarks.length}`);
  }

  const coords: number[] = [];
  for (const pt of landmarks) {
    coords.push(pt.x, pt.y, pt.z);
  }

  const landmarkArray = coords.reduce((acc, val, i) => {
    const idx = Math.floor(i / 3);
    const axis = i % 3;
    if (!acc[idx]) acc[idx] = [0, 0, 0];
    acc[idx][axis] = val;
    return acc;
  }, [] as number[][]);

  const wrist = landmarkArray[0];
  const wristRelative = landmarkArray.map(pt => [
    pt[0] - wrist[0],
    pt[1] - wrist[1],
    pt[2] - wrist[2],
  ]);

  const maxVal = Math.max(...wristRelative.flat().map(Math.abs));

  const normalized: number[] = [];
  for (const pt of wristRelative) {
    if (maxVal !== 0) {
      normalized.push(pt[0] / maxVal, pt[1] / maxVal, pt[2] / maxVal);
    } else {
      normalized.push(0, 0, 0);
    }
  }

  return normalized;
}
