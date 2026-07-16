# Quick Test Guide — Gesture Images

## 🚀 Build & Run

```bash
cd Main_App
npm start
npm run android    # or npm run ios
```

---

## ✅ Test Scenarios (5 minutes)

### Test 1: Images Display (Online)
1. App starts → Navigate to **Library** screen
2. Tap letter **A** → SignDetailModal opens
3. **Expected**: Full gesture image displays at top of modal
4. **Actual**: _(what you see)_

### Test 2: Multiple Signs (Online)
1. Close modal (tap X)
2. Tap gesture **hello** → Image shows
3. Tap gesture **wait** → Image shows
4. Tap letter **M** → Image shows
5. **Expected**: All images load from Supabase
6. **Status**: ✅ Pass / ❌ Fail

### Test 3: Offline Fallback
1. Enable **Airplane Mode** on device
2. App still running (don't restart)
3. Tap letter **B** → Modal opens
4. **Expected**: Image loads instantly from bundled local files
5. **Status**: ✅ Pass / ❌ Fail

### Test 4: Network Error Handling
1. Exit Airplane Mode
2. Tap gesture **sorry** → Image loads from Supabase
3. **During image load**, kill network (airplane mode again)
4. Image `onError` should fire → fallback to local
5. **Expected**: No crash, image either from Supabase or local
6. **Status**: ✅ Pass / ❌ Fail

### Test 5: No Image Fallback (Optional)
1. Manually comment out `imageUrl` in `signs.ts` for letter C
2. Tap letter **C** → Modal opens
3. **Expected**: Emoji gradient placeholder shows (purple-blue gradient with emoji)
4. Uncomment and rebuild
5. **Status**: ✅ Pass / ❌ Fail

---

## 🔍 Debug Checklist

If images don't show:

- [ ] Local images exist: `Main_App/src/assets/ImageData/A.png`, `hello.png`, etc.?
- [ ] Supabase bucket is **public** (not private)?
- [ ] URLs in `signs.ts` end with `.png` (not `.jpg`)?
- [ ] Network is enabled (not airplane mode)?
- [ ] Metro bundler restarted after adding images?
  ```bash
  npm start -- --reset-cache
  ```

---

## 📱 Expected UI

**Before (Placeholder)**:
```
┌─────────────────────┐
│   Purple gradient   │  ← SignDetailModal header
│   64px emoji        │
│   "Video coming     │
│    soon" text       │
└─────────────────────┘
```

**After (With Images)**:
```
┌─────────────────────┐
│   ACTUAL GESTURE    │  ← SignDetailModal header
│   IMAGE FROM        │  ← From Supabase or local
│   SUPABASE/LOCAL    │
│   (800×800 cropped  │
│    to 180px height) │
└─────────────────────┘
```

---

## 🎯 Success Criteria

✅ **PASS** if:
- Images display in Library sign detail modal
- Both online (Supabase) and offline (local) work
- No crashes or errors in console
- All 46 signs have images or gracefully fall back

❌ **FAIL** if:
- Images don't load online
- App crashes when accessing Library
- Offline mode shows broken image instead of local fallback
- Some signs missing images without fallback

---

## 📊 Performance (optional check)

Open DevTools → Network tab:
- Images from Supabase: Should see requests to `hscicvuy...signs/A.png`
- Caching: Subsequent taps should use cached images (0ms load)
- Offline: No network requests, images load instantly

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Images not bundled | `npm start -- --reset-cache` then rebuild |
| 404 on Supabase URLs | Verify bucket is `sign-videos` and folder is `signs/` |
| Wrong file extension | Check `signs.ts` — all imageUrl must end in `.png` |
| App crashes on Library | Check that `getLocalSignImage()` exists in `signImages.ts` |
| Emoji placeholder shows | Either imageUrl undefined or network/local both failed (by design) |

---

## 📝 Test Results Template

```
Date: ____
Device: ____ (Android / iOS)
Network: ____ (Online / Offline)

Test 1 (Images online): _____ ✅ / ❌
Test 2 (Multiple signs): _____ ✅ / ❌
Test 3 (Offline fallback): _____ ✅ / ❌
Test 4 (Error handling): _____ ✅ / ❌
Test 5 (No image fallback): _____ ✅ / ❌ (optional)

Notes:
_________________________________
_________________________________
```

---

**All tests should pass before deployment.**
