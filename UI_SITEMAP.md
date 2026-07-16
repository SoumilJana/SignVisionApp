# Comprehensive UI Sitemap: SignVision Mobile App

This document lists every screen, sub-screen, and scenario-specific UI state required for a production-grade implementation of the SignVision app.

---

## 1. PRE-AUTHENTICATION & ONBOARDING
*Goal: Convert the visitor into a registered user.*

1.  **Splash_Screen** (Animated Logo + App Load)
2.  **Landing_Screen** (Hero CTA + App Overview)
3.  **Onboarding Carousel** (Module: Onboard)
    *   **Onboard_1_ValueProp** (Translation Value Prop: "Signs to Words in Real-Time")
    *   **Onboard_2_Camera** (Camera Setup & Privacy: "On-Device processing")
    *   **Onboard_3_Library** (Learning Value Prop: "Practice mode with AI feedback")
    *   **Onboard_4_History** (History & Progress tracking)
    *   **Onboard_5_Final** (Final CTA to Join/Login)
4.  **Permissions Gateway** (Fullscreen request for Camera Access)

---

## 2. AUTHENTICATION FLOW
*Goal: Secure user entry and data persistence.*

5.  **Auth_SignUp** (Email Sign-Up Screen: Fields: Name, Email, Password, Confirm)
6.  **Auth_Login** (Email Login Screen: Fields: Email, Password)
7.  **Auth_PasswordReset_Request** (Forgot Password Screen: Field: Email)
    *   **Auth_PasswordReset_Success** ("Check your inbox" confirmation)
8.  **Auth_PasswordUpdate** (New Password Input Screen)
9.  **Security_MFA_Module**
    *   **Security_MFA_Intro** (MFA Explanation: "Secure your premium history")
    *   **Security_MFA_Setup** (QR Code Enrollment/TOTP)
    *   **Security_MFA_Recovery** (Backup Codes Display)
    *   **Security_MFA_Verify** (MFA Verification Screen: Input for 6-digit TOTP code)

---

## 3. TAB 1: TRANSLATOR (Core Engine)
*Goal: The primary utility of the app.*

10. **Tab_Translator_Main** (Main Dashboard)
    *   **Active State:** Live Camera + Landmark Skeleton Overlay
    *   **State_Inference_Processing:** Bottom sheet showing detected sign + confidence bar
    *   **State_Model_Loading:** Overlay when downloading ML assets
11. **Translation History Sidebar/Modal**
    *   **Empty State:** "Start your first translation" illustration
    *   **Populated State:** List items with sign name, time, and "Save to Library" button

---

## 4. TAB 2: SIGN LIBRARY
*Goal: Browsing and reference.*

12. **Tab_Library_Main** (Library Master View)
    *   **Overlay_Library_Search** (Search Bar Active/Focused state)
    *   Horizontal Category Scroller (Alphabet, Numbers, Daily Phrases)
    *   "Sign of the Day" Featured Card
13. **Category Detail View** (Grid of sign cards)
14. **Sign Detail Modal** (Deep level)

---

## 5. TAB 3: HISTORY (Core Navigation)
*Goal: Review past interactions.*

15. **Tab_History_Main** (Translation History logs and saved items)

---

## 6. TAB 4: PROFILE & SETTINGS
*Goal: Account management and personalization.*

16. **Tab_Profile_Main** (Profile Dashboard)
    *   User stats (Total translations, Streak, Badges)
    *   Premium Status Badge (Free vs PRO)
17. **Profile_Edit_Details** (Edit Profile Page: Name, Avatar, Preferences)
18. **Profile_Delete_Confirm** (Delete Account Dialog)
19. **Subscription Management**
    *   **Paywall_Intro** (Full-screen premium feature pitch)
    *   **Paywall_TierSelection** (Monthly vs Annual cards)
    *   **Paywall_Checkout** (Payment processing screen)
    *   **Paywall_Success** (Success/Confirmation page)

---

## 7. LEGAL & COMPLIANCE
20. **Legal_PrivacyPolicy**
21. **Legal_TermsOfService**
22. **App Credits & Versioning**

---

## 8. OVERLAYS & SCENARIOS (Edge Cases)
23. **Daily Limit Dial** (Free user reached limit)
24. **"Camera Blocked" Alert**
25. **"No Internet" Overlay**
26. **Success/Error Snackbars** (Toast notifications)

---

**Summary:**
*   **Main Pages:** 12
*   **Sub-Pages:** 14
*   **States/Overlays:** 6
*   **Total UI Views:** **32+**

