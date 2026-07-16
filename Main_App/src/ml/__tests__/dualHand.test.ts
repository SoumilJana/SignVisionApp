import { combineDualHandFeatures, isDualHandSign } from '../dualHand';
import { HandDetectionResult, HandLandmarks } from '../../utils/landmarkUtils';

function makeLandmarks(offset: number = 0): HandLandmarks {
  return Array.from({ length: 21 }, (_, i) => ({
    x: (i + 1 + offset) * 0.05,
    y: 0,
    z: 0,
  }));
}

function makeHand(isLeft: boolean, confidence: number = 0.9): HandDetectionResult {
  return {
    landmarks: makeLandmarks(isLeft ? 10 : 0),
    isLeftHand: isLeft,
    confidence,
  };
}

describe('combineDualHandFeatures', () => {
  it('returns 126-dim output for single hand', () => {
    const hand = makeHand(false); // right hand
    const result = combineDualHandFeatures([hand]);
    expect(result).toHaveLength(126);
  });

  it('second half is all zeros for single hand', () => {
    const hand = makeHand(false);
    const result = combineDualHandFeatures([hand]);
    const nonDominantSlot = result.slice(63);
    expect(nonDominantSlot.every(v => v === 0)).toBe(true);
  });

  it('returns 126-dim output for dual hands', () => {
    const rightHand = makeHand(false);
    const leftHand = makeHand(true);
    const result = combineDualHandFeatures([rightHand, leftHand]);
    expect(result).toHaveLength(126);
  });

  it('both halves populated for dual hands', () => {
    const rightHand = makeHand(false);
    const leftHand = makeHand(true);
    const result = combineDualHandFeatures([rightHand, leftHand]);
    const dominantSlot = result.slice(0, 63);
    const nonDominantSlot = result.slice(63);
    expect(dominantSlot.some(v => v !== 0)).toBe(true);
    expect(nonDominantSlot.some(v => v !== 0)).toBe(true);
  });

  it('right hand (dominant) features appear in first 63 positions', () => {
    const rightHand = makeHand(false); // offset=0
    const leftHand = makeHand(true);  // offset=10
    const result = combineDualHandFeatures([leftHand, rightHand]); // order doesn't matter
    const dominantSlot = result.slice(0, 63);

    // Right hand features should be in first 63
    // Right hand landmarks start at 0.05, left start at 0.55
    // So right hand values should be smaller
    expect(dominantSlot[0]).toBeLessThan(result.slice(63)[0]);
  });

  it('returns 126 zeros for empty hand array', () => {
    const result = combineDualHandFeatures([]);
    expect(result).toHaveLength(126);
    expect(result.every(v => v === 0)).toBe(true);
  });
});

describe('isDualHandSign', () => {
  it('returns true for exactly 2 hands with sufficient confidence', () => {
    const hands = [makeHand(false, 0.9), makeHand(true, 0.8)];
    expect(isDualHandSign(hands)).toBe(true);
  });

  it('returns false for single hand', () => {
    expect(isDualHandSign([makeHand(false)])).toBe(false);
  });

  it('returns false for 2 hands with insufficient confidence', () => {
    const hands = [makeHand(false, 0.5), makeHand(true, 0.6)]; // below 0.7
    expect(isDualHandSign(hands)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(isDualHandSign([])).toBe(false);
  });
});
