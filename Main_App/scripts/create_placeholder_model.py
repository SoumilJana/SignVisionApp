"""
create_placeholder_model.py

Creates a minimal MLP model (input:40, hidden:64, output:36) with random weights
and exports it as a TFLite flatbuffer for Phase 2 testing.

The model accepts a 40-dim feature vector (Z-score normalized Euclidean distances
from dual-hand MediaPipe landmarks) and outputs a 36-class probability distribution
(26 ASL letters + 10 gestures).

Usage:
    pip install tensorflow numpy
    python scripts/create_placeholder_model.py

Output:
    android/app/src/main/assets/models/asl_classifier.tflite
"""

import os
import numpy as np

# Try TensorFlow, fall back to tflite_model_maker approach
try:
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
except ImportError:
    print("ERROR: TensorFlow not installed. Run: pip install tensorflow")
    exit(1)

INPUT_DIM = 40   # 20 wrist-distances per hand x 2 hands
HIDDEN_DIM = 64
OUTPUT_DIM = 36  # 26 letters + 10 gestures

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__),
    "..", "android", "app", "src", "main", "assets", "models"
)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, "asl_classifier.tflite")

def create_model():
    """Build a simple MLP classifier."""
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(HIDDEN_DIM, activation='relu', input_shape=(INPUT_DIM,)),
        tf.keras.layers.Dense(HIDDEN_DIM // 2, activation='relu'),
        tf.keras.layers.Dense(OUTPUT_DIM, activation='softmax'),
    ])
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    model.summary()
    return model


def export_tflite(model):
    """Convert Keras model to TFLite flatbuffer."""
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_PATH, 'wb') as f:
        f.write(tflite_model)

    size_kb = len(tflite_model) / 1024
    print(f"\n[SUCCESS] Placeholder model saved: {OUTPUT_PATH}")
    print(f"   Size: {size_kb:.1f} KB")
    print(f"   Input: [{INPUT_DIM}] float32")
    print(f"   Output: [{OUTPUT_DIM}] float32 (softmax probabilities)")
    print(f"\n[WARNING] This model has RANDOM weights - for pipeline testing only!")
    print(f"   Replace with a trained model after data collection.")


def verify_model():
    """Quick sanity check: run inference on dummy input."""
    interpreter = tf.lite.Interpreter(model_path=OUTPUT_PATH)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    dummy_input = np.zeros((1, INPUT_DIM), dtype=np.float32)
    interpreter.set_tensor(input_details[0]['index'], dummy_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])

    print(f"\n[VERIFY] Verification:")
    print(f"   Input shape: {input_details[0]['shape']}")
    print(f"   Output shape: {output_details[0]['shape']}")
    print(f"   Output sums to: {output.sum():.4f} (should be ~1.0)")
    print(f"   Max class probability: {output.max():.4f}")


if __name__ == "__main__":
    print("=" * 50)
    print(" SignVision - Placeholder TFLite Model Creator")
    print("=" * 50)

    model = create_model()
    export_tflite(model)
    verify_model()

    print("\n[DONE] Done! Place the model in:")
    print(f"   {OUTPUT_PATH}")
