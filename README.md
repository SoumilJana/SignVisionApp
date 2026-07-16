# SignVision Mobile App

Welcome to the SignVision Mobile App repository! This project is a complete, production-ready sign language translation mobile application.

## 📊 Project Overview

### **Objective**
A sign language translation mobile app built for Android (and optionally iOS) that translates ASL alphabet and words using on-device Machine Learning.

### **Technology Stack**
- **Framework:** React Native with TypeScript
- **ML (On-Device):** ONNX Runtime Mobile
- **ML Backend:** Python server hosted on [Render](https://render.com). [View Repository](https://github.com/SoumilJana/SignVision_ML_backend)
- **Backend Services:** Supabase (Auth + MFA/TOTP, PostgreSQL, Storage)
- **Analytics:** PostHog (product analytics) + Sentry (crash reporting)
- **Payments:** RevenueCat for subscriptions
- **Ads:** Google AdMob for free tier

### **App Features**
- **Real-time Translation:** Uses device camera to translate sign language gestures in real-time.
- **Sign Library:** An interactive dictionary to learn ASL letters and words.
- **Offline Mode:** Premium feature to download ML models and translate without an internet connection.
- **Secure Authentication:** MFA/TOTP supported via Supabase.

---

## 👩‍💻 How to Update or Make Changes (Developer Guide)

If you are picking up this project to make updates, fix bugs, or add new features, follow these steps to set up your local environment and run the app.

### 1. What to Download and Install
Before you can run or modify the code, you must install the following essential tools:
- **Node.js (LTS version)**: Required to run the React Native packager and install dependencies. Download from [nodejs.org](https://nodejs.org/).
- **Git**: To version control and manage the code. Download from [git-scm.com](https://git-scm.com/).
- **Code Editor**: We recommend [Visual Studio Code (VS Code)](https://code.visualstudio.com/).
- **For Android Development (Windows/Mac/Linux)**:
  - Download and install [Android Studio](https://developer.android.com/studio).
  - Open Android Studio, go to SDK Manager, and install the latest **Android SDK**, **Android SDK Platform-Tools**, and set up an **Android Virtual Device (Emulator)**.
  - Set up your `ANDROID_HOME` environment variable to point to the SDK path.
- **For iOS Development (Mac only)**:
  - Download and install **Xcode** from the Mac App Store.
  - Install CocoaPods by running `sudo gem install cocoapods` in your terminal.

### 2. Setting Up the Project
Once the tools are installed, open your terminal/command prompt and follow these steps:

1. **Navigate to the main app directory:**
   ```bash
   cd Main_App
   ```
2. **Install project dependencies:**
   ```bash
   npm install
   ```
   *(For iOS developers only: run `cd ios && pod install && cd ..` after installing npm packages)*

### 3. What to Turn On (Running the App)
To see your changes live, you need to start the development server (bundler) and run the app on an emulator or a connected physical device.

1. **Start the Metro Bundler:** Leave this terminal window open while you work.
   ```bash
   npm start
   ```
2. **Launch the App (in a new terminal window):**
   - **For Android (Ensure emulator is running or Android device is plugged in with USB debugging on):**
     ```bash
     npm run android
     ```
   - **For iOS (Mac only):**
     ```bash
     npm run ios
     ```

As you make changes to the code in your editor and save the files, the app will automatically reload to reflect your updates (Fast Refresh).

---

## 📞 Support & Resources

- **React Native Docs:** [reactnative.dev](https://reactnative.dev)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **PostHog Docs:** [posthog.com/docs](https://posthog.com/docs)
- **Sentry Docs:** [docs.sentry.io](https://docs.sentry.io)
- **RevenueCat Docs:** [docs.revenuecat.com](https://docs.revenuecat.com)

---

## 👥 Creators & Owners

This project was built and is maintained by:
- **Soumil Jana** – [janasoumil1005@gmail.com](mailto:janasoumil1005@gmail.com)
- **Pankaj Gop** – [pankaj@example.com](mailto:pankaj@example.com) 
- **Alokita Dutta** – [alokita@example.com](mailto:alokita@example.com) 
