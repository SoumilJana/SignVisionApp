/**
 * Hand landmark types and utilities for the SignVision camera pipeline.
 *
 * Each hand has 21 landmarks (MediaPipe format):
 * 0: Wrist
 * 1-4: Thumb (CMC, MCP, IP, TIP)
 * 5-8: Index finger (MCP, PIP, DIP, TIP)
 * 9-12: Middle finger (MCP, PIP, DIP, TIP)
 * 13-16: Ring finger (MCP, PIP, DIP, TIP)
 * 17-20: Pinky (MCP, PIP, DIP, TIP)
 */

export interface HandLandmark {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  z: number; // Depth relative to wrist
}

export type HandLandmarks = HandLandmark[];

export interface HandDetectionResult {
  landmarks: HandLandmarks;
  isLeftHand: boolean;
  confidence: number;
}

/** Connections between landmarks for drawing the hand skeleton */
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17],
];

/** Convert normalized coordinates (0-1) to pixel coordinates */
export function normalizedToPixel(
  landmark: HandLandmark,
  frameWidth: number,
  frameHeight: number,
): {x: number; y: number} {
  return {
    x: landmark.x * frameWidth,
    y: landmark.y * frameHeight,
  };
}

/**
 * Generate mock hand landmarks for testing the debug overlay.
 * Returns 21 landmarks arranged in a realistic hand-like pattern.
 */
export function generateMockLandmarks(
  centerX: number = 0.5,
  centerY: number = 0.5,
  scale: number = 0.15,
): HandLandmarks {
  const landmarks: HandLandmarks = [];

  // Wrist (0)
  landmarks.push({x: centerX, y: centerY + scale * 2.5, z: 0});

  // Thumb (1-4) - extends to the left
  landmarks.push({x: centerX - scale * 0.5, y: centerY + scale * 1.8, z: -0.02});
  landmarks.push({x: centerX - scale * 1.0, y: centerY + scale * 1.2, z: -0.03});
  landmarks.push({x: centerX - scale * 1.3, y: centerY + scale * 0.6, z: -0.04});
  landmarks.push({x: centerX - scale * 1.5, y: centerY + scale * 0.2, z: -0.05});

  // Index finger (5-8)
  landmarks.push({x: centerX - scale * 0.6, y: centerY + scale * 0.8, z: -0.01});
  landmarks.push({x: centerX - scale * 0.6, y: centerY - scale * 0.2, z: -0.02});
  landmarks.push({x: centerX - scale * 0.6, y: centerY - scale * 0.8, z: -0.03});
  landmarks.push({x: centerX - scale * 0.6, y: centerY - scale * 1.3, z: -0.04});

  // Middle finger (9-12)
  landmarks.push({x: centerX - scale * 0.2, y: centerY + scale * 0.7, z: -0.01});
  landmarks.push({x: centerX - scale * 0.2, y: centerY - scale * 0.4, z: -0.02});
  landmarks.push({x: centerX - scale * 0.2, y: centerY - scale * 1.0, z: -0.03});
  landmarks.push({x: centerX - scale * 0.2, y: centerY - scale * 1.5, z: -0.04});

  // Ring finger (13-16)
  landmarks.push({x: centerX + scale * 0.2, y: centerY + scale * 0.8, z: -0.01});
  landmarks.push({x: centerX + scale * 0.2, y: centerY - scale * 0.2, z: -0.02});
  landmarks.push({x: centerX + scale * 0.2, y: centerY - scale * 0.8, z: -0.03});
  landmarks.push({x: centerX + scale * 0.2, y: centerY - scale * 1.2, z: -0.04});

  // Pinky (17-20)
  landmarks.push({x: centerX + scale * 0.6, y: centerY + scale * 0.9, z: -0.01});
  landmarks.push({x: centerX + scale * 0.6, y: centerY + scale * 0.1, z: -0.02});
  landmarks.push({x: centerX + scale * 0.6, y: centerY - scale * 0.5, z: -0.03});
  landmarks.push({x: centerX + scale * 0.6, y: centerY - scale * 0.9, z: -0.04});

  return landmarks;
}

/** Get latency color based on milliseconds */
export function getLatencyColor(ms: number): string {
  if (ms < 30) return '#00FF00';   // Green — excellent
  if (ms < 50) return '#FFFF00';   // Yellow — acceptable
  return '#FF0000';                 // Red — too slow
}
