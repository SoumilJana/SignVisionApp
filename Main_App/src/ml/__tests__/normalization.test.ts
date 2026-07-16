import { extractRawFeatureVector } from '../normalization';
import { HandLandmarks } from '../../utils/landmarkUtils';

function makeKnownLandmarks(): HandLandmarks {
  const landmarks: HandLandmarks = [
    { x: 0.5, y: 0.5, z: 0 }, // wrist (index 0)
  ];
  for (let i = 1; i <= 20; i++) {
    landmarks.push({ x: 0.5 + i * 0.02, y: 0.5, z: 0 });
  }
  return landmarks;
}

describe('extractRawFeatureVector', () => {
  it('produces exactly 63-dim output', () => {
    const landmarks = makeKnownLandmarks();
    const vector = extractRawFeatureVector(landmarks);
    expect(vector).toHaveLength(63);
  });

  it('is wrist-relative: wrist becomes (0,0,0)', () => {
    const landmarks = makeKnownLandmarks();
    const vector = extractRawFeatureVector(landmarks);
    // First 3 values should be wrist relative to wrist = 0,0,0
    expect(vector[0]).toBeCloseTo(0, 5);
    expect(vector[1]).toBeCloseTo(0, 5);
    expect(vector[2]).toBeCloseTo(0, 5);
  });

  it('is scale-invariant: same hand at 2x scale → same output', () => {
    const landmarks = makeKnownLandmarks();
    const scale2x = landmarks.map(l => ({ x: l.x * 2, y: l.y * 2, z: l.z * 2 }));

    const vec1 = extractRawFeatureVector(landmarks);
    const vec2 = extractRawFeatureVector(scale2x);

    // After max-normalization, both should produce same result
    vec1.forEach((v, i) => {
      expect(v).toBeCloseTo(vec2[i], 5);
    });
  });

  it('throws for incorrect landmark count', () => {
    const badLandmarks = makeKnownLandmarks().slice(0, 10);
    expect(() => extractRawFeatureVector(badLandmarks)).toThrow();
  });
});
