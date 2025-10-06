# Deployment Guide

## Architecture Overview

- **Frontend**: React Native (Expo) mobile app
- **Backend**: Node.js Express API
- **Database**: PostgreSQL
- **Backend Hosting**: Render.com (free tier)
- **Mobile Publishing**: Expo EAS Build

---

## Backend Deployment (Render.com)

### Prerequisites
- GitHub repository with your code
- Render.com account (free)

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Choose **Free** tier
3. Select your preferred region
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 2: Deploy Backend API

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: **Free**
   - **Region**: Same as database

### Step 3: Set Environment Variables

Add these in Render's Environment Variables section:

```
DATABASE_URL=<paste your Internal Database URL>
NODE_ENV=production
SESSION_SECRET=<generate a secure 32+ character random string>
ADMIN_PASSWORD=<your admin password>
```

**Generate SESSION_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Click **Create Web Service**
2. Wait for deployment to complete (3-5 minutes)
3. Copy your API URL (e.g., `https://your-app.onrender.com`)

### Step 5: Initialize Database

After deployment, you need to set up the database schema:

**Option A: Using Render Shell (Recommended)**
1. Go to your Web Service in Render Dashboard
2. Click **Shell** tab
3. Run: `npm run db:setup`

**Option B: Using psql (Advanced)**
1. Connect to your database using the External Database URL
2. Run the SQL from `server/init-db.sql`

```bash
psql <External Database URL> < server/init-db.sql
```

### Important Notes

- **Cold Starts**: Free tier sleeps after 15 minutes of inactivity (50s wake-up time)
- **Database Expiration**: Free PostgreSQL expires after 30 days
- **Prevent Sleep**: Use a free service like UptimeRobot to ping your API every 10 minutes

---

## Mobile App Configuration (Expo EAS)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

### Step 2: Initialize EAS

```bash
cd Lusapp
eas build:configure
```

### Step 3: Configure Environment Variables

Create `eas.json` (if not exists):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://localhost:5000"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.onrender.com"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-app.onrender.com"
      }
    }
  }
}
```

Replace `https://your-app.onrender.com` with your actual Render.com API URL.

### Step 4: Build for iOS

```bash
# Preview build (for testing with TestFlight)
eas build --platform ios --profile preview

# Production build (for App Store)
eas build --platform ios --profile production
```

### Step 5: Submit to App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple Developer account ($99/year)
- App Store Connect account
- App ID created in App Store Connect

---

## Local Development

### Backend

```bash
# Install dependencies
npm install

# Set environment variables (create .env file)
DATABASE_URL=<your local postgres URL>
SESSION_SECRET=<any secure string>
ADMIN_PASSWORD=<any password>

# Run server
npm start
```

### Mobile App

```bash
cd Lusapp

# Install dependencies
npm install

# Set environment variable (create .env file)
EXPO_PUBLIC_API_URL=http://localhost:5000

# Run on Expo Go
npx expo start --tunnel
```

---

## Testing Authentication

### Create a Test Account

1. Open Expo Go app on your phone
2. Scan the QR code
3. Click **Sign Up**
4. Fill in the form:
   - Name: Your Name
   - Location: Your City
   - Favorite Sport: Marathon
   - Bio: (optional)
   - Email: test@example.com
   - Password: password123 (min 8 characters)
5. Click **Sign Up**

You should be logged in and see the main app!

### Test Login

1. Click Profile → Logout
2. Click **Log In**
3. Enter your email and password
4. Click **Log In**

---

## Security Best Practices

✅ **JWT Secret**: Always use a strong random string for SESSION_SECRET
✅ **HTTPS Only**: Never use HTTP in production
✅ **Password Requirements**: Minimum 8 characters enforced
✅ **Bcrypt Rounds**: Set to 12 (secure for 2025)
✅ **Environment Variables**: Never commit secrets to git
✅ **Token Validation**: Tokens verified on every app startup

---

## Troubleshooting

### "Network request failed" error

- Make sure backend is running on Render.com
- Check that EXPO_PUBLIC_API_URL is set correctly
- Try rebuilding with `eas build --clear-cache`

### "Invalid credentials" error

- Check email and password are correct
- Verify user exists in database

### Backend crashes on Render

- Check logs in Render dashboard
- Verify all environment variables are set
- Make sure DATABASE_URL points to Internal Database URL

### Token expired

- Tokens last 7 days
- Just log in again to get a new token

---

## Cost Summary

- **Render.com Backend**: $0 (free tier)
- **Render.com PostgreSQL**: $0 for 30 days, then $7/month
- **Expo EAS Builds**: Limited free builds, then $29/month
- **Apple Developer**: $99/year (required for iOS)

**Total for Production**: ~$435/year
