import { MotionTracker, ModelRoute } from '../gatekeeper';

function makeStaticFrames(count: number) {
  // Near-zero movement: all frames at same position with tiny jitter
  return Array.from({ length: count }, (_, i) => ({
    x: 0.5 + i * 0.001, // < 0.001 per frame = very low velocity
    y: 0.5,
    z: 0,
  }));
}

function makeDynamicFrames(count: number) {
  // Large movement: each frame offset by 0.15 = velocity >> 0.10 dynamic threshold
  return Array.from({ length: count }, (_, i) => ({
    x: i * 0.15,
    y: 0,
    z: 0,
  }));
}

describe('MotionTracker', () => {
  it('starts in static state by default', () => {
    const tracker = new MotionTracker();
    expect(tracker.getModelRoute()).toBe('static');
  });

  it('returns static for near-zero wrist movement', () => {
    const tracker = new MotionTracker();
    const frames = makeStaticFrames(5);
    frames.forEach(f => tracker.addFrame(f));
    expect(tracker.getModelRoute()).toBe('static');
  });

  it('returns dynamic for large wrist movement', () => {
    const tracker = new MotionTracker();
    const frames = makeDynamicFrames(5);
    frames.forEach(f => tracker.addFrame(f));
    expect(tracker.getModelRoute()).toBe('dynamic');
  });

  it('maintains current state in hysteresis zone (0.05–0.10)', () => {
    // Put tracker in dynamic then add a very large frame — it stays dynamic
    const h = new MotionTracker();
    makeDynamicFrames(5).forEach(f => h.addFrame(f));
    expect(h.getModelRoute()).toBe('dynamic');

    // Add a huge jump — still dynamic
    h.addFrame({ x: 100, y: 0, z: 0 });
    expect(h.getModelRoute()).toBe('dynamic');
  });

  it('returns 0 velocity with fewer than 2 frames', () => {
    const tracker = new MotionTracker();
    tracker.addFrame({ x: 0.5, y: 0.5, z: 0 });
    expect(tracker.getWristVelocity()).toBe(0);
  });

  it('resets correctly', () => {
    const tracker = new MotionTracker();
    makeDynamicFrames(5).forEach(f => tracker.addFrame(f));
    expect(tracker.getModelRoute()).toBe('dynamic');
    tracker.reset();
    expect(tracker.getModelRoute()).toBe('static');
    expect(tracker.getWristVelocity()).toBe(0);
  });
});
