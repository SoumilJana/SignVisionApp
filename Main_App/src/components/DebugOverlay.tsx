import React from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {HandLandmarks, HAND_CONNECTIONS} from '../utils/landmarkUtils';

interface DebugOverlayProps {
  landmarks: HandLandmarks | null;
  frameWidth: number;
  frameHeight: number;
  latencyMs?: number;
  visible: boolean;
  overlaySectionHeight?: number;
  screenWidth?: number;
}

const DOT_SIZE = 8;
const DOT_RADIUS = DOT_SIZE / 2;

function DebugOverlay({
  landmarks,
  frameWidth,
  frameHeight,
  visible,
  overlaySectionHeight,
  screenWidth: providedScreenWidth,
}: DebugOverlayProps) {
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();

  const cameraHeight = overlaySectionHeight || screenHeight * 0.75;
  const displayWidth = providedScreenWidth || screenWidth;

  // Always compute — hooks must not be conditional
  const scaleX = displayWidth / frameHeight;
  const scaleY = cameraHeight / frameWidth;
  const scale = Math.min(scaleX, scaleY);
  const offsetX = (displayWidth - frameHeight * scale) / 2;
  const offsetY = (cameraHeight - frameWidth * scale) / 2;

  // null landmarks OR not visible = render nothing
  if (!visible || !landmarks || landmarks.length === 0) return null;

  const pixels = landmarks.map(lm => ({
    x: (1 - lm.y) * frameHeight * scale + offsetX,
    y: (1 - lm.x) * frameWidth * scale + offsetY,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Connection lines */}
      {HAND_CONNECTIONS.map(([s, e], i) => {
        const p1 = pixels[s];
        const p2 = pixels[e];
        if (!p1 || !p2) return null;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`l-${i}`}
            style={[
              styles.line,
              {
                width: length,
                left: (p1.x + p2.x) / 2 - length / 2,
                top: (p1.y + p2.y) / 2 - 1,
                transform: [{rotate: `${angle}deg`}],
              },
            ]}
          />
        );
      })}

      {/* Dots */}
      {pixels.map((p, i) => (
        <View
          key={`d-${i}`}
          style={[
            styles.dot,
            {
              left: p.x - DOT_RADIUS,
              top: p.y - DOT_RADIUS,
              backgroundColor: i === 0 ? '#FF6B6B' : '#00FF80',
            },
          ]}
        />
      ))}
    </View>
  );
}

export default React.memo(DebugOverlay, (prev, next) => {
  // Only re-render when landmark data or visibility actually changes
  return (
    prev.landmarks === next.landmarks &&
    prev.visible === next.visible &&
    prev.overlaySectionHeight === next.overlaySectionHeight &&
    prev.screenWidth === next.screenWidth
  );
});

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(0,255,128,0.6)',
  },
});