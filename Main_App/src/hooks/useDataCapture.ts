import { useState, useRef, useCallback } from 'react';
import RNFS from 'react-native-fs';

const TARGET_SAMPLES = 50;

export function useDataCapture() {
  const [isCapturing, setIsCapturing]   = useState(false);
  const [captureMode, setCaptureMode]   = useState(false); // panel open
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [sampleCount, setSampleCount]   = useState(0);

  const samplesRef = useRef<number[][]>([]);

  const startCapture = useCallback(() => {
    samplesRef.current = [];
    setSampleCount(0);
    setIsCapturing(true);
  }, []);

  // Called from frame processor callback — feed one landmark array (63 floats)
  const feedSample = useCallback(async (landmarks: number[]) => {
    if (!isCapturing) return;
    if (samplesRef.current.length >= TARGET_SAMPLES) return;

    samplesRef.current.push(landmarks);
    const count = samplesRef.current.length;
    setSampleCount(count);

    if (count === TARGET_SAMPLES) {
      setIsCapturing(false);
      await saveSamples(selectedLetter, samplesRef.current);
      samplesRef.current = [];
    }
  }, [isCapturing, selectedLetter]);

  return {
    captureMode, setCaptureMode,
    isCapturing, startCapture,
    selectedLetter, setSelectedLetter,
    sampleCount,
    feedSample,
  };
}

async function saveSamples(letter: string, samples: number[][]) {
  // DATA folder lives at the app's external documents root
  const dataDir = `${RNFS.ExternalDirectoryPath}/DATA`;
  await RNFS.mkdir(dataDir);

  const timestamp = Date.now();
  const path = `${dataDir}/${letter.toUpperCase()}_${timestamp}.json`;
  const payload = JSON.stringify({ label: letter.toUpperCase(), samples });
  await RNFS.writeFile(path, payload, 'utf8');
  console.log(`[DataCapture] Saved → ${path}`);
}