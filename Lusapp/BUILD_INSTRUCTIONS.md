# 🚀 Deploy Lusapp to TestFlight

## Quick Start (All-in-One Command)

```bash
cd Lusapp
eas build --platform ios --profile production --auto-submit
```

This single command will:
1. Build your iOS app (.ipa file)
2. Automatically submit it to App Store Connect for TestFlight
3. Take about 10-15 minutes

## Step-by-Step Instructions

### 1. Login to EAS (First Time Only)
```bash
eas login
```
Enter your Expo account credentials.

### 2. Configure Apple Developer Account
When you run the build command, EAS will prompt you to:
- Log in to your Apple Developer account
- Select your Apple Developer Team
- Automatically generate certificates and provisioning profiles

### 3. Build and Submit
```bash
eas build --platform ios --profile production --auto-submit
```

**You'll be asked:**
- "What would you like your bundle identifier to be?" → Press Enter (uses `com.lusapp.mobile`)
- "Log in to your Apple account" → Enter your Apple ID and password
- "Select your Apple Team" → Choose your team (if you have multiple)
- "Generate a new Apple Distribution Certificate?" → Yes
- "Generate a new Apple Provisioning Profile?" → Yes

### 4. Monitor Build Progress
Track your build at: https://expo.dev/accounts/[your-account]/projects/lusapp/builds

Or check status:
```bash
eas build:list
```

### 5. Wait for Apple Processing
After the build completes and uploads:
- Check your email (from Apple)
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Navigate to: Apps → Lusapp → TestFlight
- Your build will appear in 2-10 minutes after processing

### 6. Add Testers

**Option A - Internal Testing (Immediate)**
- In TestFlight tab → Internal Testing
- Add up to 100 users from your Apple Developer team
- Testers get access immediately

**Option B - External Testing (Public Beta)**
1. TestFlight tab → External Testing → Create Group
2. Click "Enable Public Link"
3. Fill out Beta App Description and Feedback Email
4. Submit for Apple Review (24-48 hours for first build)
5. Share public link with testers

### 7. Testers Install on iPhone
1. Download TestFlight app from App Store
2. Open your invite link or enter email
3. Install Lusapp beta
4. Test the app!

## Alternative: Build Without Auto-Submit

If you want to build first and submit later:

```bash
# Build only
eas build --platform ios --profile production

# After build completes, submit separately
eas submit -p ios --latest
```

## Troubleshooting

**Build stuck in queue?**
- Expo free tier has slower builds. Consider upgrading to Production plan ($29/month)

**"Missing credentials" error?**
```bash
eas credentials
```

**Need to update the build?**
1. Make your code changes
2. Run the build command again
3. New build will appear in TestFlight automatically

## Useful Commands

```bash
# Check who you're logged in as
eas whoami

# View all builds
eas build:list

# View submission status
eas submit:list

# Build with a message
eas build --platform ios --message "Added groups feature"
```

## OTA Updates (No Rebuild Needed)

For JavaScript-only changes (no native code):

```bash
# Configure updates (first time only)
eas update:configure

# Push update to existing TestFlight builds
eas update --branch production --message "Bug fixes"
```

Users will get updates after force-closing the app 2-3 times.

## Production Release to App Store

After TestFlight testing is complete:
1. Log into App Store Connect
2. Go to Apps → Lusapp → App Store tab
3. Add version info, screenshots, description
4. Select your TestFlight build
5. Submit for Review

## Notes

- Your bundle identifier is: `com.lusapp.mobile`
- Build number increments automatically
- First external TestFlight requires Apple review (~24-48 hours)
- Internal testing is instant (no review needed)
