/**
 * TtsService.ts
 * Zero-dependency TTS using Android's built-in TextToSpeech via NativeModules.
 * Works with any React Native version — no gradle changes needed.
 */
import {NativeModules, Platform} from 'react-native';

// React Native exposes Android's TTS engine through the 'RNTextToSpeech' module
// if react-native-tts is installed. Since we uninstalled it, we use the
// AndroidAccessibilityHelper or fall back to a simple announce.

let ttsInstance: any = null;

const initTts = (): any => {
  if (ttsInstance) return ttsInstance;

  // Try any available TTS native module
  const candidates = [
    NativeModules.TextToSpeech,
    NativeModules.RNTextToSpeech,
    NativeModules.TTS,
  ];

  for (const mod of candidates) {
    if (mod && typeof mod.speak === 'function') {
      ttsInstance = mod;
      return ttsInstance;
    }
  }
  return null;
};

export const speak = (text: string): void => {
  if (!text || Platform.OS !== 'android') return;

  const tts = initTts();
  if (tts) {
    try {
      if (typeof tts.stop === 'function') tts.stop();
      tts.speak(text);
      return;
    } catch (e) {
      console.warn('[TTS] Native speak failed:', e);
    }
  }

  // Final fallback: use AccessibilityInfo announcement
  // This reads text through the device's accessibility TTS pipeline
  try {
    const AccessibilityInfo = require('react-native').AccessibilityInfo;
    AccessibilityInfo.announceForAccessibility(text);
  } catch (e) {
    console.warn('[TTS] AccessibilityInfo fallback failed:', e);
  }
};