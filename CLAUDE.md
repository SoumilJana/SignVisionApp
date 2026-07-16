# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Quick Reference

**Project:** SignVision Mobile App – A React Native sign language translation app targeting Android/iOS with ML-based gesture recognition.

**Key Stack:**
- React Native 0.84 + TypeScript
- MediaPipe for hand landmark extraction (native Kotlin plugin)
- Flask + WebSocket backend (Render.com) for ML inference — RandomForest classifier
- Supabase for auth, database, storage
- RevenueCat for subscriptions, PostHog for analytics, Sentry for error tracking

**Launch Target:** March 24-31, 2026 (see [README.md](./README.md) for timeline)

---

## Essential Commands

### Development

```bash
# Terminal 1: Start Metro bundler
npm start

# Terminal 2: Build and run on Android device/emulator
npm run android

# Build and run on iOS simulator/device (requires macOS + Xcode)
npm run ios
```

### Code Quality

```bash
# Lint all TypeScript/JavaScript files
npm run lint

# Run tests (Jest)
npm test

# Run a single test file
npm test -- path/to/test.ts
```

### Directory Layout

```
Main_App/
├── src/
│   ├── screens/              # Screen components (HomeScreen, ProfileScreen, etc.)
│   ├── navigation/           # Navigation structure (AppNavigator, AuthStack, MainTabs)
│   ├── contexts/             # React Context providers (AuthContext, ThemeContext)
│   ├── components/           # Reusable UI components (CameraView, CapturePanel, etc.)
│   ├── ml/                   # Machine learning pipeline modules
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # External service integrations (Supabase client)
│   ├── data/                 # Static data (signs.ts with sign library)
│   ├── plugins/              # Native bridge integrations (handLandmarker)
│   ├── config.ts             # App configuration constants
│   └── theme.ts              # Color/style definitions
├── ios/                      # iOS native project (Xcode)
├── android/                  # Android native project (Android Studio)
├── __tests__/                # Integration/unit tests
└── training/                 # ML model training scripts (if any)
```

---

## Architecture Overview

### Core Concepts

**1. Authentication & Context Providers**
- **AuthContext** (`src/contexts/AuthContext.tsx`): Manages user login state, Supabase session, MFA/phone verification
- **ThemeContext** (`src/contexts/ThemeContext.tsx`): Handles dark/light mode toggle
- Both wrapped in `App.tsx` via SafeAreaProvider → NavigationContainer → Providers

**2. Navigation Structure**
- **AppNavigator** (`src/navigation/AppNavigator.tsx`): Top-level router that decides:
  - Unauthenticated users → AuthStack (login/signup screens)
  - Authenticated users → MainTabs (home, translate, library, profile)
  - MFA required → MfaScreen overlay
  - First-time users → OnboardingScreen
- Uses react-navigation Bottom Tab navigator

**3. ML Pipeline (Current Implementation)**

- **Landmark Extraction**: MediaPipe Tasks (Vision) via native Kotlin plugin (`src/plugins/handLandmarker`) extracts 21 hand landmarks per frame (x/y/z normalized)
- **Transport**: `src/utils/landmarkService.ts` sends 63 floats to Flask backend via WebSocket (`/ws` endpoint) with HTTP fallback and exponential backoff reconnect
- **Backend**: `SignVision_ML_backend/server.py` — RandomForest classifier (`asl_model.pkl`), returns top-3 predictions per frame
- **Frontend voting**: `CameraView.tsx` votes across top-3 × rolling 5-frame window; STABILITY_FRAMES=3 required to confirm
- **Confidence gate**: HAND_PRESENCE_THRESHOLD=0.5 filters ghost detections; MIN_CONFIDENCE=0.55 on backend
- **Data Capture**: Records training samples (`dataCapture.ts`)

**Scaffolded (not currently wired):**
- `src/ml/gatekeeper.ts` — wrist-velocity-based static/dynamic routing
- `src/ml/modelService.ts` + `src/ml/translationPipeline.ts` — local ONNX inference (future path)
- `src/ml/dualHand.ts` — dual-hand disambiguation

**4. Backend Integration**
- **Supabase Client** (`src/lib/supabase.ts`): Authenticated API instance
- Tables: `profiles`, `translation_history`, `practice_progress`
- Auth methods: Email/password, Google OAuth, Apple ID
- MFA: TOTP-based (Supabase built-in)
- Storage: Models bucket (`models/`) and demo videos (`sign-videos/`)

**5. Feature Gating**
- `useUserTier()` hook checks free/premium tier
- Free tier: A-Z alphabet only, 50 translations/day, ads shown
- Premium: 100+ words, unlimited translations, offline, practice mode

---

## Common Development Tasks

### Adding a New Screen

1. Create file in `src/screens/YourScreen.tsx`
2. Use `useAuth()` for user context and `useTheme()` for styling
3. Add route to `src/navigation/AppNavigator.tsx` or `MainTabs.tsx`
4. Import navigation type definitions from `@react-navigation/native`

Example:
```tsx
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function YourScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  // ... component logic
}
```

### Working with the ML Pipeline

- **Test inference**: Use `src/ml/__tests__/` Jest tests (run `npm test`)
- **Retrain model**: Collect samples with `CapturePanel`, run `python train_model.py` in `SignVision_ML_backend/`, redeploy to Render.com
- **Debug detection**: Check `DebugOverlay.tsx` (shows landmark overlay and latency badge in real time)
- **Add new sign**: Update `src/data/signs.ts` with label and video URL

### Integrating a Backend Change

1. Supabase schema changes → Write migration via Supabase CLI or dashboard
2. Update TypeScript types: Run `supabase gen types typescript` (or use mcp tools if available)
3. Update React Context if it affects auth/user state
4. Test with `npm test` and emulator

---

## Key Dependencies & Versions

| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.84.0 | Mobile framework |
| react | 19.2.3 | UI library |
| @react-navigation/* | 7.x | Navigation |
| @supabase/supabase-js | 2.97.0 | Backend client |
| react-native-vision-camera | 4.7.3 | Camera access |
| react-native-mediapipe | 0.5.1 | ML landmark detection |
| @shopify/react-native-skia | 2.4.21 | Canvas drawing |
| react-native-vector-icons | 10.3.0 | Icons |

**Minimum Node.js:** 22.11.0

---

## Testing Strategy

- **Jest**: Unit tests for ML modules (gatekeeper, normalization, dual-hand logic)
- **Tests live in**: `src/ml/__tests__/`, `__tests__/`
- **Run tests**: `npm test`
- **Run single test**: `npm test -- gatekeeper.test.ts`

ML tests validate:
- Landmark normalization correctness
- Gatekeeper thresholding logic
- Multi-hand disambiguation

---

## Critical Implementation Notes

### Gesture Recognition Pipeline

Current inference path:

1. **MediaPipe** extracts 21 hand landmarks on native thread (frame processor worklet)
2. **Confidence gate**: `hands[0].confidence >= 0.5` — filters ghost detections
3. **Throttle**: Max 1 API call per 150ms (`API_THROTTLE_MS`)
4. **WebSocket** sends `{landmarks: number[63], id: number}` to Flask backend on Render.com
5. **Backend** returns `{prediction, confidence, top3[3]}` — top-3 letter candidates
6. **Top-K voting**: All 3 candidates pushed into 5-frame rolling window; letter with 3+ votes wins
7. **Output** → `setPredictionResult()` → displayed in Symbol box + TTS on hold

HTTP fallback activates automatically if WebSocket is disconnected (with exponential backoff reconnect).

### Security & Privacy

- **No video uploaded**: All processing happens on-device via Frame Processors
- **Row-Level Security (RLS)**: Supabase tables enforce user isolation
- **MFA mandatory** for profile/billing access (premium security)

### Performance Considerations

- **VirtualizedList** in SignLibrary (handles 100+ items efficiently)
- **Frame Processor worklets** run on native thread (don't block JS)
- **Isolated child components**: `LatencyBadge`, `HoldProgressBar`, `ConfidenceBadge` own their own state/timers to prevent unnecessary CameraView re-renders

---

## Debugging Tips

**Metro bundler not starting?**
- Kill old process: `lsof -ti:8081 | xargs kill -9` (or equivalent on Windows)
- Restart: `npm start`

**Android emulator crashes on startup?**
- Check logcat: `adb logcat | grep com.signvision.app`
- Look for native library issues (react-native-vision-camera, mediapipe)

**Camera permissions denied?**
- Emulator: Set in Settings > Apps > Permissions > Camera
- Device: Check App Settings on phone

**Landmark detection not working?**
- Verify MediaPipe model is loaded (check Supabase `models/` bucket)
- Test with DebugOverlay enabled to see landmark coordinates

**Tests failing?**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Jest config in `jest.config.js`

---

## References

- **Full project docs**: See [README.md](./README.md) for timeline, business model, roadmap
- **Design spec**: [DESIGN_DOC.md](./DESIGN_DOC.md)
- **ML details**: [ML_PIPELINE.md](./4.%20Structure%20and%20Workflow/ML_PIPELINE.md)
- **Supabase auth guide**: [SUPABASE_AUTH_GUIDE.md](./2.%20Pricing%20and%20Backend/SUPABASE_AUTH_GUIDE.md)
- **Submission checklist**: [SUBMISSION_CHECKLIST.md](./5.%20App%20Store%20Submission/SUBMISSION_CHECKLIST.md)

---

## Implementation Timeline Context

Current phase: **Week 6 (Launch)** as of March 23, 2026.

Critical milestones already passed:
- ✅ Feb 17-23: Week 1 (foundation, navigation, auth)
- ✅ Feb 24-Mar 2: Week 2 (ML detection)
- ✅ Mar 3-9: Week 3 (all features)
- ✅ Mar 10-16: Week 4 (premium, analytics, app store prep)
- ✅ Mar 17-23: Week 5 (submissions, landing page, marketing)

Current focus: **Monitoring, bug fixes, and response to store reviews**.

See [TIMELINE.md](./3.%20Implementation%20Timeline/TIMELINE.md) for detailed weekly breakdown.

---

## State of the Codebase

- **Inference**: WebSocket to Flask backend (Render.com) — all alphabet detection goes here
- **Recent changes**: Camera permission fixes, top-K voting, confidence badge, WebSocket transport, frame throttling, render optimization, offline banner
- **Known limitations**: Training data sparse (~338 samples, 8 letters) — retrain with balanced data is the highest-priority improvement for detection quality
- **Dead code** (scaffolded, not wired): `modelService.ts`, `translationPipeline.ts`, `gatekeeper.ts`, `dualHand.ts` — safe to ignore until needed
- **Known TODOs**: Check git log and grep for `TODO` comments in source
- **Test coverage**: ML modules have unit tests; integration tests in `__tests__/`
- **Linting**: ESLint configured; run `npm run lint` before commits

---

**Last Updated:** March 2026
**Status:** Soft-launched; focusing on stability and user feedback loop
