# Lusapp Development Guide

This guide explains where your app data is stored, when to save your work, and how to test efficiently without wasting builds.

---

## 📍 Where is My App Information Stored?

Your app has **three separate storage locations**:

### 1. **Code & App Structure** (GitHub)
**Location:** GitHub repository  
**What's stored here:**
- All your app code (screens, components, navigation)
- App configuration (app.json, package.json)
- Images, icons, and design assets
- Server backend code

**Think of it as:** Your app's blueprint and instructions

**When it's updated:** Only when you push to GitHub (manual)

---

### 2. **User Data & Content** (PostgreSQL Database on Render.com)
**Location:** `https://lusapp-backend-1.onrender.com` (cloud database)  
**What's stored here:**
- User accounts and profiles
- Race listings
- Group chat messages
- Posts and comments
- Uploaded photos (via Cloudinary)

**Think of it as:** Your app's live data that changes as users interact

**When it's updated:** Automatically every time users interact with the app (real-time)

---

### 3. **App Builds** (Expo/Apple/Google Servers)
**Location:** Expo servers → App Store/Google Play  
**What's stored here:**
- Compiled app ready to install on phones
- App Store metadata and screenshots

**Think of it as:** The final packaged product that users download

**When it's updated:** Only when you run an EAS build and submit to stores (manual)

---

## 💾 When Should I Push to GitHub?

Think of GitHub like saving a Word document. You should save (push) when:

### ✅ **DO Push to GitHub:**

1. **After completing a feature**
   - Example: "Finished adding race registration button"
   - Why: You have a working checkpoint to return to

2. **Before making risky changes**
   - Example: About to redesign the entire navigation
   - Why: You can undo if things go wrong

3. **End of each work session**
   - Example: Done working for the day
   - Why: Your work is backed up safely

4. **Before building for TestFlight/Play Store**
   - Example: About to run `eas build`
   - Why: The build will use the GitHub code

5. **When everything works correctly**
   - Example: All tests passed, no errors
   - Why: This becomes a "safe restore point"

### ❌ **DON'T Push to GitHub:**

1. **When code has errors**
   - Wait until you fix the bugs first

2. **In the middle of editing**
   - Finish the thought/feature first

3. **With test/debug code still in**
   - Remove console.logs and test data first

---

## 🚀 Testing: Expo Go vs EAS Build

You're right - **EAS builds are limited** and expensive. Here's how to test efficiently:

### **Strategy: Use Expo Go for 95% of Testing**

```
Expo Go Testing (FREE, INSTANT)
      ↓
Test everything repeatedly
      ↓
Once stable and confident
      ↓
EAS Build (LIMITED, use sparingly)
      ↓
Final verification on TestFlight
```

---

## 🔄 Expo Go vs EAS Build: What Changes?

### **What STAYS THE SAME:**
- All your React Native code
- Navigation and UI
- Most features work identically

### **What CHANGES:**

| Aspect | Expo Go | EAS Build (TestFlight) |
|--------|---------|------------------------|
| **API URL** | May need localhost for dev | Production URL (Render.com) |
| **Images** | Local assets | Cloudinary (cloud) |
| **Permissions** | Pre-granted | User must approve |
| **App Icon/Splash** | Expo default | Your custom branding |
| **Build time** | Instant (scan QR) | 10-15 minutes |
| **Cost** | FREE unlimited | Limited builds/month |
| **Push notifications** | Simulated | Real notifications |

---

## 🛠️ How to Switch Between Expo Go and EAS Build

**Good news:** You don't need to change much! Here's what to do:

### **For Daily Development (Expo Go):**

```bash
# 1. Start your backend server (always needed)
npm start  # or use the workflow in Replit

# 2. Start Expo
cd Lusapp
npx expo start --tunnel

# 3. FIRST TIME ONLY: Log in to Expo when prompted
#    (You only need to do this once)

# 4. Scan QR code with Expo Go app
# Test your changes immediately!
```

**⚠️ Important First-Time Setup:**
- The first time you run Expo, it will ask you to log in
- This is required for the tunnel to work properly
- After logging in once, it remembers you
- Without logging in, connections will timeout

**When testing in Expo Go:**
- Backend API at `https://lusapp-backend-1.onrender.com` works automatically
- All features work except push notifications and custom app icon
- Changes appear instantly when you save code (hot reload)

---

### **For TestFlight Builds (EAS Build):**

**Only build when:**
- ✅ Feature is 100% complete and tested in Expo Go
- ✅ No bugs or errors
- ✅ Ready to show to real users
- ✅ Need to test app icon, splash screen, or permissions

```bash
# iOS (TestFlight)
cd Lusapp
npx eas-cli build --platform ios --profile production --auto-submit

# Android (APK for testing)
cd Lusapp
npx eas-cli build --platform android --profile preview
```

**Time:** 10-15 minutes per build  
**Cost:** Counts against monthly limit  
**Use:** Only for final verification before release

---

## 📝 Recommended Workflow

### **Week 1-4: Development Phase**
```
1. Code changes in Replit
2. Test in Expo Go (FREE, instant)
3. Fix bugs
4. Repeat steps 1-3 many times
5. Push to GitHub at end of day
```

**Builds used:** 0 ✅

---

### **Week 5: Release Preparation**
```
1. Everything works perfectly in Expo Go
2. Push to GitHub
3. Build ONE iOS + ONE Android build
4. Test on TestFlight/APK
5. If bugs found:
   - Go back to Expo Go testing
   - Fix bugs
   - Build again only when perfect
```

**Builds used:** 2 (1 iOS + 1 Android) ✅

---

## 🎯 Current Setup (Already Configured)

Your app is **already set up** to work with both:

### **app.json Configuration:**
```json
{
  "extra": {
    "apiUrl": "https://lusapp-backend-1.onrender.com"
  }
}
```

This means:
- ✅ Expo Go connects to production backend
- ✅ EAS builds connect to production backend
- ✅ **No code changes needed** when switching!

### **Database:**
- Already on Render.com (cloud)
- Same database for Expo Go and EAS builds
- No switching needed

### **Images:**
- Already using Cloudinary (cloud storage)
- Works in both Expo Go and builds
- No switching needed

---

## ⚠️ The ONLY Difference: Testing Permissions

Some features need testing on real builds:

| Feature | Expo Go | Needs Build? |
|---------|---------|--------------|
| Navigation | ✅ Works | No |
| Race browsing | ✅ Works | No |
| User profiles | ✅ Works | No |
| Group chat | ✅ Works | No |
| Photo upload | ⚠️ Simulated | **Yes** (first time) |
| Camera access | ⚠️ Simulated | **Yes** (first time) |
| Push notifications | ❌ Doesn't work | **Yes** |
| App icon/splash | ❌ Shows Expo | **Yes** |

**Strategy:** Test everything in Expo Go first. Build once to verify photos/camera work, then continue in Expo Go.

---

## 💡 Pro Tips to Save Builds

1. **Use Expo Go for 95% of testing**
   - It's free and instant
   - Hot reload = see changes immediately
   - Test all features thoroughly

2. **Only build when:**
   - Feature is 100% complete
   - Tested extensively in Expo Go
   - Ready for user feedback
   - About to submit to stores

3. **Test on multiple devices in Expo Go**
   - iPhone + Android simultaneously
   - No builds needed

4. **Keep a changelog**
   - Document what changed since last build
   - Only build when you have 5+ meaningful changes

5. **Use Android APK first**
   - Faster than iOS builds
   - Easier to distribute for testing
   - Same code, lower risk

---

## 🔧 Quick Reference Commands

### **Daily Development:**
```bash
# Start backend (in Replit, use workflow or):
npm start

# Start Expo Go testing (instant, free)
cd Lusapp && npx expo start --tunnel
```

### **Save Work:**
```bash
# Save to GitHub
git add .
git commit -m "Description of what you changed"
git push
```

### **Build for Release:**
```bash
# Android APK (for testing)
cd Lusapp && npx eas-cli build --platform android --profile preview

# iOS TestFlight (for testing)
cd Lusapp && npx eas-cli build --platform ios --profile production --auto-submit
```

---

## ❓ Common Questions

**Q: If I test in Expo Go, will the build work the same?**  
A: Yes, 99% the same. The only differences are permissions and branding.

**Q: Do I need to change code when switching?**  
A: No! Your app is already configured to work with both.

**Q: How do I know if something needs a build to test?**  
A: If it works in Expo Go, it will work in the build. Only build for final verification.

**Q: Can I test with friends using Expo Go?**  
A: Yes! Send them the QR code or share link. They install Expo Go app and scan.

**Q: What happens to database changes?**  
A: Database is already in the cloud. Changes are instant and permanent for both Expo Go and builds.

---

## 📊 Build Budget Example

**Monthly limit:** 30 builds (example)

**Good usage:**
- Week 1: 0 builds (all Expo Go testing)
- Week 2: 0 builds (all Expo Go testing)
- Week 3: 2 builds (1 iOS + 1 Android for verification)
- Week 4: 2 builds (1 iOS + 1 Android for beta testers)
- **Total: 4 builds used** ✅

**Bad usage:**
- Build after every small change
- Build to "test if it works"
- Build without testing in Expo Go first
- **Result: 30 builds used in week 1** ❌

---

## 🎓 Summary

1. **Code = GitHub** (push when feature complete)
2. **Data = Render.com database** (updates automatically)
3. **Builds = Expo/App Stores** (build sparingly)

**For efficient testing:**
- 🟢 **Expo Go:** Daily testing (FREE, instant)
- 🟡 **EAS Build:** Final verification (limited, slow)

**Your setup is already optimized** - no code changes needed to switch between testing methods!

---

## 🔍 Troubleshooting Expo Go Connection

If you scan the QR code and get "Request timed out":

### ✅ Pre-Flight Checklist:

**1. Check Backend API Status:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

**2. Check Expo Dev Workflow:**
- Look for: "Tunnel connected" ✅
- Look for: "Tunnel ready" ✅
- Look for: "Metro waiting on exp://..." ✅
- **If you see "? Log in":** You need to log in to Expo account (first time only)
  - Stop the workflow
  - Run `cd Lusapp && npx expo start --tunnel` in terminal
  - Log in when prompted
  - Restart the workflow

**3. Verify QR Code:**
- QR code should be visible in workflow logs
- URL should be: `exp://xxxxx-anonymous-8081.exp.direct`

---

### 🚨 Common Issues:

**Issue 1: Expo workflow stuck on login prompt**
```
Symptoms: "Request timed out" when scanning QR code
Fix: Restart the Expo Dev workflow
```

**Issue 2: Backend not running**
```
Symptoms: App loads but can't fetch data
Fix: Check Backend API workflow is RUNNING
```

**Issue 3: Wrong network**
```
Symptoms: Connection works on WiFi but not cellular
Fix: Use tunnel mode (already configured)
```

**Issue 4: Firewall blocking tunnel**
```
Symptoms: QR code appears but connection fails
Fix: Check your network allows ngrok tunnels
```

---

### 🔄 Quick Restart:

If Expo Go isn't connecting:
1. Stop both workflows in Replit
2. Wait 10 seconds
3. Start Backend API workflow
4. Start Expo Dev workflow
5. Wait for "Tunnel ready" message
6. Scan QR code again

---

Need help? Check the console logs or ask questions anytime!
