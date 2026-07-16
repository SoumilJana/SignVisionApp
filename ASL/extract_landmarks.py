# extract_landmarks.py (mediapipe Tasks API)
import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Download the model first:
# wget -q https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task

MODEL_PATH = 'hand_landmarker.task'
DATA_DIR = os.path.join('asl_alphabet_train', 'asl_alphabet_train')

landmark_data = []
labels = []
skipped = 0

def normalize(coords):
    landmarks = np.array(coords).reshape(-1, 3)
    landmarks -= landmarks[0]  # wrist-relative
    max_val = np.max(np.abs(landmarks))
    if max_val != 0:
        landmarks /= max_val
    return landmarks.flatten()

# Create HandLandmarker in IMAGE mode for static dataset extraction
base_options = mp.tasks.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_hand_presence_confidence=0.5,
)

with vision.HandLandmarker.create_from_options(options) as landmarker:
    for label in sorted(os.listdir(DATA_DIR)):
        label_dir = os.path.join(DATA_DIR, label)
        if not os.path.isdir(label_dir):
            continue
        count = 0
        for file in os.listdir(label_dir):
            if not file.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            img = cv2.imread(os.path.join(label_dir, file))
            if img is None:
                continue

            # New API: use mp.Image, not numpy directly
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

            result = landmarker.detect(mp_image)

            if result.hand_landmarks:
                lm = result.hand_landmarks[0]  # list of NormalizedLandmark
                coords = []
                for pt in lm:
                    coords.extend([pt.x, pt.y, pt.z])
                landmark_data.append(normalize(coords))
                labels.append(label.lower())
                count += 1
            else:
                skipped += 1

        print(f"  {label}: {count} samples extracted")

np.save('your_landmarks.npy', np.array(landmark_data))
np.save('your_labels.npy', np.array(labels))
print(f"\nSaved {len(landmark_data)} samples for {len(set(labels))} classes.")
print(f"Skipped {skipped} images (no hand detected).")