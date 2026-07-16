# User Flow Diagrams: SignVision Mobile App

This document provides a comprehensive map of the user experience within the SignVision app, covering core functionality, premium features, and edge-case handling.

---

## 1. Authentication & Onboarding Flow (Level 1)
*Goal: Ensure the user is properly set up and understands the value prop before entering the core loop.*

```mermaid
graph TD
    Start((App Launch)) --> SessionCheck{Auth Session?}
    SessionCheck -- Yes --> TransView[Translator Screen]
    SessionCheck -- No --> Splash[Splash / Value Prop]
    
    Splash --> Onboard1[Onboarding: Intro to SignAI]
    Onboard1 --> Onboard2[Onboarding: Landmark Extraction Explained]
    Onboard2 --> Permission[Request Camera Permission]
    
    Permission -- Denied --> PermWarning[Permission Denied Screen]
    PermWarning --> Settings[Open System Settings]
    Settings --> Permission
    
    Permission -- Granted --> AuthOptions[Login / Create Account]
    
    AuthOptions -- Guest --> TransView
    AuthOptions -- Social --> OAuth[Google/Apple OAuth]
    AuthOptions -- Email --> EmailLogin[Email / Password]
    
    EmailLogin -- New User --> Register[Registration Flow]
    Register --> VerifyEmail[Verify Email]
    VerifyEmail --> MFA_Enroll[MFA / TOTP Setup]
    MFA_Enroll --> TransView
    
    EmailLogin -- Forgot Password --> Forgot[Password Recovery]
```

---

## 2. Core Translation Engine Loop (Level 2)
*Goal: Real-time sign detection with feedback and history.*

```mermaid
graph TD
    TransView[Translator Screen] --> CamActive{Camera Active?}
    CamActive -- No --> PermCheck[Check Permissions]
    CamActive -- Yes --> Landmark[Landmark Extraction MP]
    
    Landmark --> Hysteresis{Motion Scoring}
    
    Hysteresis -- "Score < 0.05 (Static)" --> StaticML[MLP Inference]
    Hysteresis -- "Score > 0.10 (Dynamic)" --> DynamicML[LSTM Inference]
    Hysteresis -- "Middle (Gate)" --> KeepPrev[Hold State]
    
    StaticML --> ConfCheck{Confidence > 0.90?}
    DynamicML --> ConfCheck
    
    ConfCheck -- Yes --> UpdateUI[Display Sign & Feedback]
    UpdateUI --> SaveHist[Append to Local History]
    UpdateUI --> CheckLimit{Translation Limit?}
    
    CheckLimit -- Hit --> Paywall[Show Paywall Modal]
    CheckLimit -- Under --> TransView
    
    ConfCheck -- No --> Ignore[Wait for Better Frame]
    Ignore --> TransView
```

---

## 3. Sign Library & Educational Flow (Level 2)
*Goal: Browsing the database and learning new signs.*

```mermaid
graph TD
    Library[Sign Library Tab] --> Search[Search / Filter Bar]
    Search --> Filter{Category Selection}
    Filter --> ViewList[Virtualized List of Signs]
    
    ViewList -- Tap Item --> IsPremium{Sign Premium?}
    
    IsPremium -- No --> Detail[Sign Detail Modal]
    IsPremium -- Yes --> UserStat{User Premium?}
    
    UserStat -- No --> UpgradePrompt[Show Premium Preview / Paywall]
    UserStat -- Yes --> Detail
    
    Detail --> PlayVideo[Play Demo Video]
    Detail --> Favorite[Toggle Favorite]
    Detail --> PracticeBtn[Jump to Practice Mode]
```

---

## 4. Practice Mode Flow (Level 3 - Premium)
*Goal: Gamified learning with AI-driven validation.*

```mermaid
graph TD
    PracticeInit[Practice Mode Tab] --> SelectSet[Select Sign Set / Category]
    SelectSet --> StartQuiz[Start Quiz Machine]
    
    StartQuiz --> DisplayPrompt[Prompt: Perform 'THANK YOU']
    DisplayPrompt --> StartCam[Activate Validator Camera]
    
    StartCam --> UserAction[User Performs Sign]
    UserAction --> ML_Validation[Compare against Ground Truth]
    
    ML_Validation -- Match --> Success[Success Animation + XP]
    ML_Validation -- Fail --> Hint[Show Video Hint]
    
    Success --> Next{More Signs?}
    Next -- Yes --> DisplayPrompt
    Next -- No --> Finish[Level Complete / Summary]
```

---

## 5. Monetization & Subscription Flow (System Level)
*Goal: Conversion and entitlement management.*

```mermaid
graph TD
    Trigger[Trigger: Limit Hit / Practice Tab / Premium Sign] --> Paywall[Paywall Modal]
    
    Paywall --> FeatureList[Show Premium Benefits]
    Paywall --> Plans[Select Plan: Monthly / Annual]
    
    Plans --> RevCat[RevenueCat Processing]
    
    RevCat -- Success --> GrantEntitlement[Update Supabase Profile]
    GrantEntitlement --> RefreshApp[Reactive UI Refresh]
    RefreshApp --> SuccessConf[Success Animation]
    
    RevCat -- Cancel/Fail --> ClosePaywall[Return to Previous State]
    
    Paywall -- AdOption --> RewardedAd[Watch Rewarded Ad]
    RewardedAd -- Finish --> GrantBonus[+10 Free Translations]
```

---

## 6. Edge Cases & Error Scenarios
| Scenario | App Reaction |
| :--- | :--- |
| **No Internet** | Show "Offline Mode" banner; use local cached models; disable Supabase sync. |
| **Camera Blocked** | Show full-screen overlay with "How to enable" instructions. |
| **Low Confidence** | Display "Keep hand steady" or "Better lighting needed" tooltips. |
| **Subscription Expired** | Revoke `is_premium` flag on next fetch; sync with RevenueCat beacon. |
| **Account Deletion** | Wipe all `translation_history` and `profiles` records via Supabase RLS delete. |
| **MFA Lost** | Trigger "Recovery Code" flow or "Contact Support" link. |

---

**Note:** All diagrams use **Mermaid** syntax, which can be visualized in VS Code, GitHub, and various design tools.
