/**
 * dataCapture.ts
 *
 * In-app training data collection mode.
 * Collects RAW 63 landmark values (not normalized) to match server.py
 *
 * Flow:
 *   1. User selects a sign label ('A', 'B', etc.)
 *   2. User holds the sign and taps "Record"
 *   3. System saves a JSON file to /sdcard/Android/data/<pkg>/files/DATA/
 *   4. Pull to laptop:  adb pull /sdcard/Android/data/<pkg>/files/DATA ./DATA
 *   5. Run merge_captures.py → train_model.py
 */

import RNFS from 'react-native-fs';
import { HandLandmarks } from '../utils/landmarkUtils';

export interface CapturedSample {
  label: string;
  landmarks: number[]; // RAW 63 values (21 landmarks × 3 coords)
  timestamp: number;
}

export class DataCaptureSession {
  private label: string = '';
  private samples: CapturedSample[] = [];
  private isCapturing = false;

  startCapture(label: string): void {
    this.label = label.toUpperCase();
    this.samples = [];
    this.isCapturing = true;
    console.log(`[DataCapture] Started capturing label: ${this.label}`);
  }

  /**
   * Add RAW landmarks (63 values) — called from the frame processor callback.
   * Mirrors the x-flip that CameraView applies before sending to Flask.
   */
  addSample(landmarks: HandLandmarks): void {
    if (!this.isCapturing || !this.label) return;

    const rawLandmarks: number[] = [];
    for (const pt of landmarks) {
      rawLandmarks.push(1 - pt.x, pt.y, pt.z);
    }

    if (rawLandmarks.length !== 63) {
      console.warn(`[DataCapture] Invalid landmark count: ${rawLandmarks.length}`);
      return;
    }

    this.samples.push({
      label: this.label,
      landmarks: rawLandmarks,
      timestamp: Date.now(),
    });
  }

  /** How many samples collected so far in the current session. */
  getSampleCount(): number {
    return this.samples.length;
  }

  stopCapture(): CapturedSample[] {
    this.isCapturing = false;
    console.log(
      `[DataCapture] Stopped. ${this.samples.length} samples for "${this.label}"`,
    );
    return [...this.samples];
  }

  /**
   * Save samples as a JSON file directly to the device filesystem.
   * Path: <ExternalDirectoryPath>/DATA/<LABEL>_<timestamp>.json
   *
   * Pull to laptop:
   *   adb pull /sdcard/Android/data/<your.package>/files/DATA ./DATA
   */
  async saveToLocalStorage(label: string, data: CapturedSample[]): Promise<void> {
    if (data.length === 0) {
      console.warn('[DataCapture] No samples to save.');
      return;
    }

    try {
      const dataDir = `${RNFS.ExternalDirectoryPath}/DATA`;

      // Create DATA folder if it doesn't exist
      const exists = await RNFS.exists(dataDir);
      if (!exists) {
        await RNFS.mkdir(dataDir);
      }

      const timestamp = Date.now();
      const filename = `${label.toUpperCase()}_${timestamp}.json`;
      const filePath = `${dataDir}/${filename}`;

      // Save: { label, samples: [[63 floats], ...] }
      // merge_captures.py reads this exact shape
      const payload = JSON.stringify({
        label: label.toUpperCase(),
        samples: data.map(s => s.landmarks),
      });

      await RNFS.writeFile(filePath, payload, 'utf8');
      console.log(`[DataCapture] ✅ Saved ${data.length} samples → ${filePath}`);
    } catch (error) {
      console.error('[DataCapture] ❌ Failed to save file:', error);
      throw error; // re-throw so TranslatorScreen can show an error alert if needed
    }
  }

  async loadFromStorage(label: string): Promise<CapturedSample[]> {
    try {
      const dataDir = `${RNFS.ExternalDirectoryPath}/DATA`;
      const files = await RNFS.readDir(dataDir);
      const matching = files.filter(f =>
        f.name.startsWith(`${label.toUpperCase()}_`) && f.name.endsWith('.json'),
      );

      const all: CapturedSample[] = [];
      for (const file of matching) {
        const content = await RNFS.readFile(file.path, 'utf8');
        const parsed = JSON.parse(content);
        // Re-hydrate into CapturedSample shape
        if (parsed.samples && Array.isArray(parsed.samples)) {
          parsed.samples.forEach((lm: number[]) => {
            all.push({ label: parsed.label, landmarks: lm, timestamp: 0 });
          });
        }
      }
      return all;
    } catch {
      return [];
    }
  }

  exportToJSON(data: CapturedSample[]): string {
    return JSON.stringify({ version: 1, samples: data }, null, 2);
  }

  get status(): { isCapturing: boolean; label: string; sampleCount: number } {
    return {
      isCapturing: this.isCapturing,
      label: this.label,
      sampleCount: this.samples.length,
    };
  }
}

export const dataCapture = new DataCaptureSession();