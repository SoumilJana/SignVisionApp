# Detailed SignVision ML Pipeline Analysis

Based on the Research Help.md document, here are comprehensive answers to your questions:

---

## Feature Representation ✅

**Answer: Combination of both (wrist-relative + scale normalization)**

**Details from the code:**

1. **Wrist-relative subtraction** (Server-side, `server.py`):
   ```python
   landmarks -= landmarks[0]  # Subtract wrist point (index 0)
   ```

2. **Scale normalization**:
   ```python
   max_val = np.max(np.abs(landmarks))
   if max_val != 0:
       landmarks /= max_val  # Scales to [-1, 1] range
   ```

**Formula from the doc:**
$$\mathbf{v}_i = \frac{\mathbf{l}_i - \mathbf{l}_0}{\max_{j \in [0,20]} |{\mathbf{l}_j - \mathbf{l}_0}|}$$

**Client-side preprocessing** also occurs before sending:
- X-coordinate is mirrored: `1 - pt.x` (compensates for front-facing camera mirror image)
- Then flattened to 63 floats: `[1-x₀, y₀, z₀, 1-x₁, y₁, z₁, ..., 1-x₂₀, y₂₀, z₂₀]`

---

## Model Input Format ✅

**Answer: Single frame (63 features: 21 landmarks × 3 coordinates)**

**Details:**
- Each hand produces 21 landmarks (MediaPipe standard)
- Each landmark has x, y, z coordinates normalized to [0, 1]
- Flattened to a 1D vector: **63 floats per frame**
- **Not a sequence** — each frame is classified independently
- Transport: Sent every ~150ms (throttled, see below)

---

## Model Type (RandomForest) — Confirmed ✅

| Parameter | `train_model.py` | `train_model2.py` (Regularized) |
|-----------|------------------|--------------------------------|
| **n_estimators** | 200 | 200 |
| **max_depth** | None (unlimited) | 20 |
| **min_samples_leaf** | 1 (default) | 2 |
| **Loss Function** | Gini impurity | Gini impurity |
| **predict_proba()** | ✅ Yes | ✅ Yes |

**Key detail:** Uses `predict_proba()` to get a **probability distribution over 26 classes (A–Z)**, not just class labels.

---

## Confidence Filtering ✅

**Answers:**
- ✅ **YES** — filtering applied **after** prediction probabilities
- **Below threshold (0.55):** Predictions are **discarded** — the server returns only top-3 candidates ≥ 0.55
- If no predictions exceed 0.55, the response contains an empty list or null prediction

**Multiple confidence gates exist:**
| Gate | Threshold | Location |
|------|-----------|----------|
| Backend min confidence | 0.55 | `server.py` |
| Backend dev mode | 0.3 | Optional lower threshold |
| Frontend hand presence | 0.5 | MediaPipe confidence score |
| Frontend model confidence | 0.3 | Local TFLite path (scaffolded) |
| Dual-hand detection | 0.7 | Both hands required |

---

## Temporal Stabilization (Top-K Voting) ✅

**Exact logic confirmed:**

```
Window size: 5 frames
Entries per window: 5 frames × 3 candidates = 15 entries
Acceptance threshold: ≥ 3 votes (STABILITY_FRAMES = 3)
Prediction type: Top-3 per frame (NOT top-1)
```

**Algorithm walkthrough** (from the doc):

```
Frame t:   top3 = [A(0.8), S(0.1), E(0.05)]  → push A, S, E to window
Frame t+1: top3 = [A(0.7), S(0.2), D(0.05)]  → push A, S, D
Frame t+2: top3 = [A(0.9), E(0.05), S(0.03)] → push A, E, S
Window = [A, S, E, A, S, D, A, E, S]
Tally: A=3, S=3, E=2, D=1
Winner: A (first to reach 3 votes)
```

**Critical insight:** The system votes on *all three* candidates per frame, not just top-1. This means a letter that consistently appears as #2 or #3 can still win through ensemble voting.

---

## Frame Handling ✅

**Continuous processing with throttling:**

1. **Capture rate:** Continuous from camera (native thread, ~30 FPS typical)
2. **Processing rate:** All frames processed through confidence gate + voting window
3. **Transmission rate:** **Throttled to 150ms intervals** (~6.67 Hz)
4. **Buffering:** Rolling window of **5 frames** for voting logic
5. **Server frame dropping:** The backend processes only the **latest queued message per client** (intermediate frames dropped to prevent backlog)

**Timing:**
- MediaPipe landmark extraction: ~15-30ms
- YUV→Bitmap conversion: ~5-10ms
- Network transport (WebSocket): ~50-200ms
- Server inference: ~5-15ms
- Client voting: ~1-2ms
- **Total latency (warm):** ~80-260ms

---

## Communication ✅

**WebSocket is throttled:**

| Aspect | Value |
|--------|-------|
| **Throttle interval** | 150ms (`API_THROTTLE_MS = 150ms`) |
| **Transmission rate** | ~6.67 Hz (~1 frame per 150ms) |
| **Message format** | `{landmarks: number[63], id: number}` |
| **Endpoint** | `wss://signvision-ml-backend.onrender.com/ws` |
| **Fallback** | HTTP POST to `/predict` on WebSocket disconnect |
| **Reconnect strategy** | Exponential backoff: 1s → 2s → 4s → ... → 10s cap |
| **Request IDs** | Monotonic for stale-response filtering |
| **Response timeout** | 2 seconds |

---

## Output Construction ✅

**Builds sentences continuously:**

```
Single predicted letter → appended to sentence buffer
Display: Updated in symbol box (real-time)
TTS trigger: 3-second hold gesture (HOLD_DURATION_MS = 3000ms)
TTS fallback: Three native modules tried in sequence
```

**Output pipeline:**
1. Top-K voting confirms a letter (≥3 votes)
2. Letter displayed in UI (ConfidenceBadge shows prediction + score)
3. Letter appended to running sentence buffer
4. User can hold for 3s to hear pronunciation via TTS
5. User can clear/delete previous letters

---

## Training Data ✅

**Confirmed details:**

| Aspect | Value |
|--------|-------|
| **Sample count** | ~338 samples |
| **Letter coverage** | ~8 letters (A, F, I, L, V, W + others) |
| **Data sources** | Mixed: static images + in-app capture |
| **Static images** | `asl_alphabet_train/` folder (MediaPipe batch extraction) |
| **In-app capture** | JSON format, local device storage, x-flipped for consistency |
| **Pipeline** | `merge_captures.py` → `extract_landmarks.py` → `train_model.py` |

**Training variants:**
- `train_model.py`: Baseline (no regularization)
- `train_model2.py`: Regularized variant with 5-fold cross-validation, depth limit (max_depth=20), min_samples_leaf=2

**Critical note:** Dataset is **severely under-resourced** (338 samples, 8 classes = ~42 samples per class). This is explicitly flagged as the highest-priority improvement in the research analysis.

---

## Additional Logic ✅

### 1. Motion Detection (Scaffolded)
**Component:** `gatekeeper.ts` — `MotionTracker` class

```typescript
Wrist velocity threshold (5-frame circular buffer):
- v < 0.05  → 'static' (fingerspelling, alphabet)
- v > 0.10  → 'dynamic' (gestures with motion)
- 0.05 ≤ v ≤ 0.10 → maintain current state (hysteresis)
```

**Status:** Code exists but **not wired into production** (no separate dynamic model trained yet).

---

### 2. Dual-Hand Detection (Scaffolded)
**Component:** `dualHand.ts`

```typescript
Single hand:  [63 features, 63 zeros]
Dual hands:   [63 dominant-hand, 63 non-dominant-hand]
Format:       126-dimensional feature vector
Dominant hand: Right hand (ASL convention)
Trigger:      Both hands detected with confidence ≥ 0.7
```

**Status:** Feature engineering complete, **but no trained model** for 126-dim vector. Currently unused in production.

---

### 3. Gesture Hold Timing (Active)
**Component:** `TtsService.ts` + hold detection in UI

```typescript
HOLD_DURATION_MS = 3000ms (3 seconds)
Triggers TTS pronunciation of confirmed letter
Three native module fallbacks (+ AccessibilityInfo.announceForAccessibility final fallback)
```

**Status:** ✅ **Actively implemented**

---

### 4. Debug Overlay (Active)
**Component:** `DebugOverlay.tsx`

Displays real-time:
- Landmark visualization (Skia canvas)
- Confidence score badge
- Latency badge
- Hand presence gate indicator

---

### 5. Data Capture (Active)
**Component:** `dataCapture.ts` + `CapturePanel.tsx`

- Users can record labeled training samples in-app
- Applies x-flip compensation (`1 - pt.x`)
- Stores as JSON: `{label, samples: [[63]...]}`
- Directly consumable by `merge_captures.py` → retraining pipeline

---

## Summary Table

| Feature | Status | Implemented | Notes |
|---------|--------|-------------|-------|
| Wrist-relative + scale normalization | ✅ Active | Yes | Server-side in `server.py` |
| 63-dim single-frame input | ✅ Active | Yes | Per-frame classification |
| RandomForest (200 trees, predict_proba) | ✅ Active | Yes | Cloud inference on Render |
| 0.55 confidence threshold | ✅ Active | Yes | Backend filtering |
| Top-K voting (5-frame, 3 candidates, ≥3 votes) | ✅ Active | Yes | Core temporal smoothing |
| 150ms throttle + WebSocket | ✅ Active | Yes | Primary transport |
| Sentence building + TTS on hold | ✅ Active | Yes | User-facing output |
| ~338 samples, 8 letters | ⚠️ Limitation | Yes | Under-resourced training set |
| Motion detection (gatekeeper) | 🟡 Scaffolded | Code exists | Not wired to production |
| Dual-hand support | 🟡 Scaffolded | Code exists | No trained model |
| In-app data capture | ✅ Active | Yes | Enables active learning loop |

---

**Key Takeaway:** The system is **production-ready for single-hand static alphabet recognition** with robust temporal voting and mobile-optimized inference. The scaffolded components (gatekeeper, dual-hand, local TFLite) represent future extensions that are designed but not yet activated.