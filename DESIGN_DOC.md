# Design Document: SignVision Mobile App

## 1. System Architecture Overview
The SignVision mobile app is built using a modern, scalable stack designed for high-performance ML inference and secure data management.

### High-Level Components
-   **Frontend:** React Native (TypeScript)
-   **Mobile ML Engine:** ONNX Runtime Mobile & MediaPipe
-   **Backend (BaaS):** Supabase (Auth, DB, Storage, Functions)
-   **Payments:** RevenueCat
-   **Analytics:** PostHog & Sentry

---

## 2. ML Pipeline Design
The heart of the app is a **Two-Stage Gatekeeper Architecture**.

### 2.1 Landmark Extraction
-   **Provider:** MediaPipe Tasks (Vision).
-   **Input:** Camera frames from `react-native-vision-camera`.
-   **Output:** 21 hand landmarks (Static) or Holistic (Hands + Pose + Face for Dynamic).

### 2.2 Gatekeeper Logic
-   **Motion Scoring:** Tracks wrist velocity using a smoothed 5-frame moving average with Z-axis inclusion.
-   **Hysteresis Thresholds:**
    -   < 0.05: Routing to **Static Model**.
    -   > 0.10: Routing to **Dynamic Model**.
    -   0.05 - 0.10: Maintain current state to prevent "flicker".

### 2.3 Inference Models
-   **Static Model (MLP):** Input is 20 scale-invariant Euclidean distances (wrist-to-tip). Classifies A-Z.
-   **Dynamic Model (LSTM):** Input is a sequence of 30 frames of Holistic landmarks. Classifies words/phrases.
-   **Format:** ONNX (.onnx) or TFLite (.tflite).

---

## 3. Database Schema (Supabase/PostgreSQL)

### 3.1 `profiles`
-   `id`: UUID (Primary Key, matches Auth UID)
-   `display_name`: Text
-   `is_premium`: Boolean
-   `subscription_type`: Enum ('monthly', 'annual', 'lifetime')
-   `translations_today`: Integer
-   `last_reset_date`: Timestamp (for daily limits)

### 3.2 `translation_history`
-   `id`: UUID
-   `user_id`: UUID (Foreign Key)
-   `sign_label`: Text
-   `confidence`: Float
-   `timestamp`: Timestamp

### 3.3 `practice_progress`
-   `user_id`: UUID
-   `sign_id`: Text
-   `accuracy_score`: Float
-   `attempts`: Integer

---

## 4. API & Infrastructure

### 4.1 Authentication
-   **Supabase Auth:** Handles Email/Password, Google OAuth, and Apple ID.
-   **MFA:** Integrated via Supabase-provided TOTP flow for premium security.

### 4.2 Storage
-   **Bucket: `models`**: Stores ONNX/TFLite model files for remote updates.
-   **Bucket: `sign-videos`**: Stores demo MP4s for the Sign Library.

### 4.3 Analytics & Error Tracking
-   **PostHog:** Track `translation_started`, `subscription_converted`, `sign_searched`.
-   **Sentry:** Automatic error capturing in both Javascript and Native layers.

---

## 5. UI/UX Component Architecture

### 5.1 Main Layout
-   **Navigation:** `react-navigation` (Bottom Tabs).
-   **State Management:** React Context (AuthContext, SubscriptionContext).

### 5.2 Key Modules
-   **`TranslatorScreen`**: Contains `CameraView` with Frame Processor + `LandmarkOverlay` (SVG/Skia).
-   **`SignLibrary`**: Virtualized Grid for high performance with 100+ items.
-   **`PracticeQuiz`**: State machine to handle "Prompt -> Detect -> Feedback -> Next" flow.

---

## 6. Security and Compliance
-   **Row Level Security (RLS):** Enabled on all Supabase tables; users can only read/write their own data.
-   **Privacy-First ML:** All video processing is done via Frame Processors on-device. No images/video frames are uploaded.
-   **MFA Requirements:** Mandatory for accessing advanced profile settings or billing information.

---

## 7. Deployment and CI/CD
-   **Android:** Fastlane for automated Play Store internal/production distribution.
-   **iOS:** Xcode Cloud or Fastlane via GitHub Actions for App Store Connect.
-   **CodePush:** (Optional) For OTA updates to the Javascript layer.
