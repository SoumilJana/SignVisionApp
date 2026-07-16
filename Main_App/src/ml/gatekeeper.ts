/**
 * gatekeeper.ts
 * 
 * Motion-based routing between static (alphabet A-Z) and dynamic (gesture) models.
 * Uses a 5-frame circular buffer of wrist positions to compute smoothed velocity.
 * Hysteresis thresholds prevent flickering between states.
 */

export type ModelRoute = 'static' | 'dynamic';

interface WristPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * MotionTracker
 * 
 * Maintains a 5-frame circular buffer of wrist positions.
 * Computes smoothed velocity using frame-to-frame displacement averages.
 * 
 * Routing logic with hysteresis:
 *   velocity < 0.05  → 'static'
 *   velocity > 0.10  → 'dynamic'
 *   0.05–0.10        → maintain current state (prevents flicker)
 */
export class MotionTracker {
  private static readonly BUFFER_SIZE = 5;
  private static readonly STATIC_THRESHOLD = 0.05;
  private static readonly DYNAMIC_THRESHOLD = 0.10;

  private buffer: WristPosition[] = [];
  private currentRoute: ModelRoute = 'static';

  /**
   * Add a new wrist position to the circular buffer.
   * Automatically evicts the oldest frame when buffer is full.
   */
  addFrame(wristPosition: WristPosition): void {
    this.buffer.push(wristPosition);
    if (this.buffer.length > MotionTracker.BUFFER_SIZE) {
      this.buffer.shift();
    }
    // Update route after adding frame
    this._updateRoute();
  }

  /**
   * Compute smoothed wrist velocity as average frame-to-frame displacement.
   * Returns 0 if fewer than 2 frames in buffer.
   */
  getWristVelocity(): number {
    if (this.buffer.length < 2) {
      return 0;
    }

    let totalDisplacement = 0;
    for (let i = 1; i < this.buffer.length; i++) {
      const prev = this.buffer[i - 1];
      const curr = this.buffer[i];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dz = curr.z - prev.z;
      totalDisplacement += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return totalDisplacement / (this.buffer.length - 1);
  }

  /**
   * Get the current model routing decision.
   * Hysteresis: only switches when crossing clear thresholds.
   */
  getModelRoute(): ModelRoute {
    return this.currentRoute;
  }

  /**
   * Force-reset the route (used for testing or explicit state changes).
   */
  reset(): void {
    this.buffer = [];
    this.currentRoute = 'static';
  }

  private _updateRoute(): void {
    const velocity = this.getWristVelocity();

    if (velocity < MotionTracker.STATIC_THRESHOLD) {
      this.currentRoute = 'static';
    } else if (velocity > MotionTracker.DYNAMIC_THRESHOLD) {
      this.currentRoute = 'dynamic';
    }
    // In the hysteresis zone (0.05–0.10): maintain current state, no change
  }
}
