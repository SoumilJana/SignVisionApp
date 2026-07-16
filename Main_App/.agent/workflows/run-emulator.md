---
description: How to run the SignVision app on the Android emulator
---

# Run App on Android Emulator

// turbo-all

## Prerequisites

- Android Studio installed
- An AVD created (e.g. `Medium_Phone_API_36.1`)
- Node.js 22+ installed

---

## Steps

### 1. Open the Emulator

Open **Android Studio** → **Device Manager** (phone icon in the toolbar) → Click the **▶ Play** button next to your AVD.

Wait until the emulator is fully booted (you see the home screen / lock screen).

### 2. Start Metro Bundler

Open a terminal in VS Code and run:

```powershell
cd d:\Projects\SignVision App\Main_App
npx react-native start --reset-cache
```

Wait until you see `Welcome to React Native` and the Metro banner. Keep this terminal running.

### 3. Build and Install the App

Open a **second terminal** and run:

```powershell
cd d:\Projects\SignVision App\Main_App
npx react-native run-android --no-packager --port 8081
```

This compiles the native code, installs the APK, and launches the app. Takes ~2 minutes on first build.

> **Note:** `--no-packager` tells it to use the Metro from Step 2 instead of starting a new one. `--port 8081` tells it where Metro is running.

### 4. You're done!

The app should appear on the emulator. If you see:

- **Onboarding slides** → First launch, swipe through or tap Skip
- **Login screen** → Enter credentials or tap "⚡ Skip to App (Dev Mode)" to bypass auth
- **Home screen** → You're in!

---

## Troubleshooting

### White screen

- Kill Metro (`Ctrl+C`) and restart with `--reset-cache`
- Rebuild the app (Step 3)

### "Network request failed"

- Open Chrome on the emulator and check if websites load
- If Chrome works but app doesn't, rebuild (Step 3) — the network security config needs a native rebuild
- In dev, use "⚡ Skip to App (Dev Mode)" on the Login screen to bypass auth

### Metro says "Another process on port 8081"

- Close the other Metro terminal first, or use `--port 8082` on both commands

### App crashes on launch

- Check the terminal running Metro for red error text
- Run `adb logcat -t 50` in a separate terminal to see native crash logs

---

## Quick Reference

| What            | Command                                                  |
| --------------- | -------------------------------------------------------- |
| Start Metro     | `npx react-native start --reset-cache`                   |
| Build + Install | `npx react-native run-android --no-packager --port 8081` |
| Just rebuild    | `npx react-native run-android --no-packager --port 8081` |
| See native logs | `adb logcat -t 50`                                       |
| List emulators  | `adb devices`                                            |
| Kill emulator   | `adb emu kill`                                           |
