# Lusapp - Google Sign-In on Android: DEVELOPER_ERROR Troubleshooting

## The Problem

When tapping "Google" sign-in button on Android (production AAB from Google Play Store), the error displayed is:

```
DEVELOPER_ERROR: Follow troubleshooting instructions at https://react-native-google-signin.github.io/docs/troubleshooting
```

Google Sign-In works on iOS. Only Android is broken.

---

## Current Configuration

### Tech Stack
- **Framework:** React Native 0.81.4 with Expo SDK 54.0
- **Build system:** EAS Build (Expo Application Services)
- **Google Sign-In library:** `@react-native-google-signin/google-signin` v16.1.1
- **Firebase project:** `lusapp-1aea1`
- **Android package name:** `com.lusapp.mobile`

### Firebase Console Configuration
- **Project number:** 899499968631
- **Project ID:** lusapp-1aea1

### OAuth Client IDs in google-services.json
```json
{
  "oauth_client": [
    {
      "client_id": "899499968631-60pqr49dpbabtu2k4ii6v6gv5je0m9u5.apps.googleusercontent.com",
      "client_type": 1,
      "android_info": {
        "package_name": "com.lusapp.mobile",
        "certificate_hash": "6ce492f6a153752a8f451e1b1e98ef5d1cd2382e"
      }
    },
    {
      "client_id": "899499968631-7b9mavttokuj4kcur9lppi1tvavsi84l.apps.googleusercontent.com",
      "client_type": 3
    }
  ]
}
```

- **client_type 1** = Android OAuth client (SHA-1: `6C:E4:92:F6:A1:53:75:2A:8F:45:1E:1B:1E:98:EF:5D:1C:D2:38:2E`)
- **client_type 3** = Web OAuth client

### app.json (Android section)
```json
{
  "android": {
    "googleServicesFile": "./google-services.json",
    "package": "com.lusapp.mobile"
  },
  "plugins": [
    "expo-web-browser",
    [
      "@react-native-google-signin/google-signin",
      {
        "iosUrlScheme": "com.googleusercontent.apps.899499968631-ij9igb0746b6484f3i6t51ab4410cqh7"
      }
    ]
  ]
}
```

### Google Sign-In Code (OnboardingScreen.js)
```javascript
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

// Sign-in handler:
const handleGoogleSignIn = async () => {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (idToken) {
    await signupWithGoogle(idToken);
  }
};
```

### Environment Variables (set as secrets, passed via .env)
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=$GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=$GOOGLE_ANDROID_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=$GOOGLE_IOS_CLIENT_ID
```

---

## Steps Already Taken

1. **Added `google-services.json`** to the Lusapp directory with the correct Android OAuth client and SHA-1 fingerprint
2. **Configured `app.json`** with `"googleServicesFile": "./google-services.json"` under the android section
3. **Added the `@react-native-google-signin/google-signin` plugin** to app.json plugins array
4. **Set `webClientId`** in `GoogleSignin.configure()` — this is required for getting an `idToken`
5. **Built production AAB** via `eas build --platform android --profile production`
6. **Uploaded AAB to Google Play Store** for testing

---

## Key Questions to Investigate

### 1. SHA-1 Fingerprint Mismatch
The SHA-1 in `google-services.json` is: `6C:E4:92:F6:A1:53:75:2A:8F:45:1E:1B:1E:98:EF:5D:1C:D2:38:2E`

**This might be wrong.** For production builds, you need:
- The **EAS Build signing key SHA-1** (what EAS uses to sign the AAB)
- The **Google Play App Signing key SHA-1** (Google re-signs the app when distributing from Play Store)

**To get the correct SHA-1 fingerprints:**

**EAS Build credentials:**
```bash
cd Lusapp && eas credentials --platform android
```
This will show the keystore SHA-1 used to sign your builds.

**Google Play App Signing key:**
1. Go to Google Play Console → Your app → Setup → App signing
2. Find "App signing key certificate" → copy the SHA-1 fingerprint
3. Also check "Upload key certificate" → copy that SHA-1 too

**Both SHA-1s must be registered in Firebase Console:**
1. Go to Firebase Console → Project Settings → Your Android app
2. Add ALL SHA-1 fingerprints (upload key + app signing key)
3. Download the updated `google-services.json`
4. Replace the file in the project and rebuild

### 2. webClientId Value
The `GoogleSignin.configure()` uses `GOOGLE_WEB_CLIENT_ID` from environment variables. 

**Verify this is the Web client ID (client_type 3), NOT the Android client ID.**

The correct webClientId should be: `899499968631-7b9mavttokuj4kcur9lppi1tvavsi84l.apps.googleusercontent.com` (or whatever Web type client is in your Google Cloud Console).

**To check what value is actually being used at runtime:**
Add a `console.log('webClientId:', GOOGLE_WEB_CLIENT_ID)` before `GoogleSignin.configure()` and check the logs.

### 3. Google Cloud Console OAuth Consent Screen
Make sure:
- The OAuth consent screen is configured (not in "Testing" mode with restricted test users, OR your test email is in the list)
- The Android app is registered with the correct package name and SHA-1

### 4. Multiple SHA-1 Scenario (Most Likely Issue)
When you upload an AAB to Google Play:
1. You sign it with your **upload key** (managed by EAS Build)
2. Google Play re-signs it with their **app signing key**

The app on a user's device uses Google Play's signing key. If Firebase only has your upload key's SHA-1, Google Sign-In will fail with DEVELOPER_ERROR.

**Fix:**
- Get the App Signing key SHA-1 from Google Play Console
- Add it to Firebase Console under your Android app
- Download the new `google-services.json`
- Replace in project and rebuild

---

## Quick Fix Checklist

1. [ ] Run `eas credentials --platform android` and note the SHA-1
2. [ ] Go to Google Play Console → Setup → App signing → note the App signing key SHA-1
3. [ ] Go to Firebase Console → Project Settings → Android app → add BOTH SHA-1s
4. [ ] Download new `google-services.json` from Firebase Console
5. [ ] Replace `Lusapp/google-services.json` with the new file
6. [ ] Verify `GOOGLE_WEB_CLIENT_ID` env variable is the Web client (type 3), not Android client
7. [ ] Rebuild: `cd Lusapp && eas build --platform android --profile production`
8. [ ] Upload new AAB to Google Play and test

---

## Relevant Files in the Project

| File | Purpose |
|------|---------|
| `Lusapp/google-services.json` | Firebase Android config with OAuth clients and SHA-1 |
| `Lusapp/app.json` | Expo config with android section and plugins |
| `Lusapp/.env` | Environment variables including Google client IDs |
| `Lusapp/src/screens/OnboardingScreen.js` | Google Sign-In UI and handler (lines 76-224) |
| `Lusapp/src/services/socialAuth.js` | Alternative Google auth using expo-auth-session (not currently used on Android native) |
| `Lusapp/src/context/AuthContext.js` | `signupWithGoogle()` function that calls backend API |
| `Lusapp/eas.json` | EAS Build profiles |

---

## Backend Social Auth Endpoint

The backend at `https://lusapp-backend-1.onrender.com` has a `/api/auth/social` endpoint that receives the Google `id_token` and creates/syncs the user. This endpoint works correctly (verified with iOS). The issue is purely on the Android client side — the native Google Sign-In SDK is failing before any network request is made.
