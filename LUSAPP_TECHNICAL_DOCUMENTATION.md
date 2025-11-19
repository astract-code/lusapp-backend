# Lusapp - Complete Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Infrastructure & Hosting](#infrastructure--hosting)
3. [Database Architecture](#database-architecture)
4. [Frontend Mobile App](#frontend-mobile-app)
5. [Backend API](#backend-api)
6. [Authentication System](#authentication-system)
7. [Admin Panel](#admin-panel)
8. [Third-Party Services](#third-party-services)
9. [Development Environment](#development-environment)
10. [Deployment & Publishing](#deployment--publishing)
11. [File Structure](#file-structure)
12. [Environment Variables](#environment-variables)

---

## System Overview

Lusapp is a React Native mobile application for endurance athletes to discover races, connect with community, and manage race participation. The system uses a hybrid architecture with:

- **Frontend**: React Native (Expo SDK 54) mobile app for iOS/Android
- **Backend**: Node.js/Express REST API
- **Database**: PostgreSQL (hosted on Render.com)
- **Auth**: Firebase Authentication with PostgreSQL sync
- **Storage**: Cloudinary for images (avatars, group banners)
- **Hosting**: Render.com for production backend/database

### Key Architecture Decisions

1. **Production Infrastructure is PERMANENT on Render.com** - Never migrate or change
2. **Hybrid Auth** - Firebase for authentication, PostgreSQL for user data
3. **Sport Taxonomy** - Structured categories (Running, Triathlon, Cycling, Fitness, Swimming, Custom) with subtypes
4. **Admin Moderation** - All user-submitted races require admin approval
5. **No Mock Data** - Always use real data from production database

---

## Infrastructure & Hosting

### Production Backend (CRITICAL - DO NOT CHANGE)

**URL**: `https://lusapp-backend-1.onrender.com`

- Hosting: Render.com Web Service
- Region: Oregon, USA
- Deployment: Automatic from GitHub repository
- Auto-scaling: Enabled
- Environment: Production Node.js

**Why Render.com is PERMANENT:**
- Mobile apps in App Store/TestFlight point to this URL
- Database is hosted on Render PostgreSQL
- Changing would break all production users
- This Replit workspace is ONLY for development/testing

### Production Database (CRITICAL - DO NOT CHANGE)

**Connection String**: `postgresql://lusapp_user:***@dpg-d3ie4b49c44c73and2rg-a.oregon-postgres.render.com/lusapp`

- Hosting: Render PostgreSQL
- Region: Oregon (same as backend)
- SSL: REQUIRED (`ssl: { rejectUnauthorized: false }`)
- Storage: All production user data, races, posts, groups, messages
- Backups: Managed by Render.com

**Database Configuration in Code:**
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});
```

### Development Environment

**Replit Workspace**: Current environment
- Purpose: Code development, testing, feature iteration
- Database: Neon PostgreSQL (accessed via DATABASE_URL)
- Backend: Local Express server on port 5000
- Frontend: Expo dev server with tunnel

**Never deploy Replit workspace to production** - Use GitHub → Render.com deployment pipeline

---

## Database Architecture

### PostgreSQL Schema

The database uses the following core tables:

#### 1. `races` Table
Stores all race events (marathons, triathlons, etc.)

```sql
CREATE TABLE races (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100),  -- Legacy field, nullable
  sport_category VARCHAR(50),  -- Running, Triathlon, Cycling, Fitness, Swimming, Custom
  sport_subtype VARCHAR(100),  -- Marathon, 5K, Ironman, etc.
  city VARCHAR(255),
  country VARCHAR(255),
  continent VARCHAR(100),
  date DATE NOT NULL,
  distance VARCHAR(100),
  description TEXT,
  participants INTEGER DEFAULT 0,
  start_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  registered_users JSONB DEFAULT '[]',
  approval_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  created_by_user_id VARCHAR(255),  -- Firebase UID if user-created
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP
);
```

**Sport Taxonomy Structure:**
- **Running**: 5K, 10K, Half Marathon, Marathon, Ultra Marathon, Trail Running, Cross Country, Custom Distance
- **Triathlon**: Sprint, Olympic, Half Ironman, Ironman, Aquathlon, Duathlon, Custom Distance
- **Cycling**: Criterium, Gran Fondo, Mountain Biking, Road Race, Custom Distance
- **Fitness**: Spartan Race, HYROX, Obstacle Course, CrossFit, Bootcamp, Custom Distance
- **Swimming**: Open Water Swim, Pool Competition, Custom Distance
- **Custom**: Custom Event

#### 2. `users` Table
User profiles synced with Firebase Authentication

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  favorite_sports TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Hybrid Auth Model:**
- Firebase handles authentication (login, email verification, password reset)
- PostgreSQL stores user profile data
- Linked by `firebase_uid` field

#### 3. `posts` Table
Social feed posts with automatic race participation sharing

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content TEXT,
  image_url TEXT,
  race_id INTEGER REFERENCES races(id),  -- Auto-populated when user registers for race
  created_at TIMESTAMP DEFAULT NOW(),
  likes_count INTEGER DEFAULT 0
);
```

#### 4. `groups` Table
Sport-specific community groups

```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sport_category VARCHAR(50),
  banner_url TEXT,
  is_public BOOLEAN DEFAULT true,
  password_hash TEXT,  -- For password-protected groups
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. `group_members` Table
Group membership with role-based access

```sql
CREATE TABLE group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',  -- owner, moderator, member
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
```

#### 6. `group_messages` Table
Real-time group chat messages

```sql
CREATE TABLE group_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. `group_gear_lists` Table
Collaborative gear/packing lists for races

```sql
CREATE TABLE group_gear_lists (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'collaborative',  -- personal, collaborative
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. `group_gear_items` Table
Individual gear items within lists

```sql
CREATE TABLE group_gear_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES group_gear_lists(id),
  item_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'needed',  -- needed, claimed, completed
  added_by INTEGER REFERENCES users(id),
  claimed_by INTEGER REFERENCES users(id),
  completed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Gear List Logic:**
- **Personal Lists**: Only owner can mark complete, any member can add items
- **Collaborative Lists**: Any member can add, claim, and complete items
- Status flow: needed → claimed → completed (collaborative) OR needed → completed (personal)

#### 9. `conversations` & `messages` Tables
Direct messaging between users

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id),
  user2_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Geography Data

**Countries**: 197 countries across 6 continents
- Africa: 54 countries
- Asia: 48 countries
- Europe: 44 countries
- North America: 23 countries
- South America: 12 countries
- Oceania: 14 countries

**Implementation**: See `Lusapp/src/constants/theme.js` for `COUNTRY_TO_CONTINENT` mapping and `COUNTRIES` array.

---

## Frontend Mobile App

### Technology Stack

**Core Framework:**
- React Native 0.81.4
- Expo SDK ~54.0.12
- JavaScript (no TypeScript)

**Navigation:**
- `@react-navigation/native` v7
- `@react-navigation/bottom-tabs` - Main navigation (Feed, Calendar, Discover, Profile, Groups)
- `@react-navigation/native-stack` - Nested screens within each tab

**State Management:**
- Zustand v5.0.8 - Global state (theme, user preferences)
- React Context - Authentication state
- AsyncStorage - Persistent local storage

**UI Components:**
- `expo-linear-gradient` - Gradient backgrounds/buttons
- `react-native-calendars` - Calendar view for races
- Custom design system with semantic color tokens

**Storage:**
- `@react-native-async-storage/async-storage` - Local persistence

### App Architecture

#### Navigation Structure

```
GuestNavigator (not authenticated)
  └─ LoginScreen
  └─ SignUpScreen
  └─ ForgotPasswordScreen

UnverifiedNavigator (authenticated but email not verified)
  └─ EmailVerificationScreen

VerifiedNavigator (authenticated and verified)
  └─ BottomTabNavigator
      ├─ FeedStack
      │   ├─ FeedScreen (pull-to-refresh enabled)
      │   └─ CreatePostScreen
      ├─ CalendarStack
      │   ├─ CalendarScreen (pull-to-refresh enabled)
      │   └─ RaceDetailScreen
      ├─ DiscoverStack
      │   ├─ DiscoverScreen (pull-to-refresh enabled)
      │   └─ RaceDetailScreen
      ├─ GroupsStack
      │   ├─ GroupsScreen (pull-to-refresh enabled)
      │   ├─ GroupDetailScreen (with smart back button)
      │   ├─ GroupChatTab
      │   ├─ GroupMembersTab
      │   └─ GroupGearTab
      └─ ProfileStack
          ├─ ProfileScreen (pull-to-refresh enabled)
          ├─ EditProfileScreen
          └─ SettingsScreen
```

#### Authentication Flow (AuthContext)

**File**: `Lusapp/src/contexts/AuthContext.js`

1. Firebase Authentication manages login/signup/logout
2. On successful auth, sync user to PostgreSQL via `/api/auth/sync`
3. Store Firebase ID token in AsyncStorage
4. Use token for all authenticated API requests

**Key Functions:**
```javascript
// Login
const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserToBackend(userCredential.user);
};

// Sync to backend
const syncUserToBackend = async (firebaseUser) => {
  const token = await firebaseUser.getIdToken();
  await fetch(`${API_URL}/api/auth/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

#### Theme System

**File**: `Lusapp/src/constants/theme.js`

Supports Light, Dark, and Auto (system) modes with semantic color tokens:

```javascript
const COLORS = {
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#2D5F3F',      // Dark green
    primaryLight: '#3D7F4F',
    accent: '#4A4A4A',       // Grey
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#4CAF50',      // Light green
    primaryLight: '#6FBF73',
    accent: '#B0B0B0',       // Light grey
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    error: '#F44336',
    success: '#66BB6A',
  }
};
```

**Gradient Palette** (used throughout UI):
```javascript
const GRADIENTS = {
  primary: ['#2D5F3F', '#3D7F4F'],
  dark: ['#1A1A1A', '#2A2A2A'],
  subtle: ['#F5F5F5', '#FFFFFF'],
};
```

#### Smart Distance Display

**Implementation**: Races show standard distances for sport types, with fallback to custom distance field.

**Logic** (in race display components):
```javascript
const getStandardDistance = (category, subtype) => {
  const distances = {
    'Marathon': '42.2 km',
    '5K': '5 km',
    '10K': '10 km',
    'Half Marathon': '21.1 km',
    'Ironman': '140.6 miles',
    'Half Ironman': '70.3 miles',
    'Sprint': '750m swim, 20km bike, 5km run',
    'Olympic': '1.5km swim, 40km bike, 10km run',
  };
  return distances[subtype] || null;
};

// Display logic
const displayDistance = getStandardDistance(race.sport_category, race.sport_subtype) 
  || race.distance 
  || 'Distance TBD';
```

#### Pull-to-Refresh Implementation

**All main screens support pull-to-refresh:**

```javascript
// Example from FeedScreen.js
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await loadPosts(); // Reload data from server
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
    />
  }>
  {/* Content */}
</ScrollView>
```

**Screens with pull-to-refresh:**
- FeedScreen
- CalendarScreen
- DiscoverScreen
- ProfileScreen
- GroupsScreen
- GroupDetailScreen (all tabs)

#### Cross-Stack Navigation

**Issue**: When user navigates from Feed tab to GroupDetailScreen (in Groups tab), back button broke.

**Solution**: Smart back button that checks navigation state:

```javascript
// In GroupDetailScreen.js
const handleBackPress = () => {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    // Jumped from another tab, go to Groups home
    navigation.navigate('Groups');
  }
};
```

### API Integration

**Base URL**: Configured via environment variable `EXPO_PUBLIC_API_URL`
- Development: `http://localhost:5000` (or Replit URL)
- Production: `https://lusapp-backend-1.onrender.com`

**Authentication Header**:
```javascript
const token = await auth.currentUser.getIdToken();
const response = await fetch(`${API_URL}/api/endpoint`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Key API Endpoints Used by Mobile App:**
- `GET /api/races` - All approved races
- `GET /api/races/:id` - Single race details
- `POST /api/races/user-create` - User submits race (requires approval)
- `GET /api/posts` - Social feed
- `POST /api/posts` - Create post
- `POST /api/auth/sync` - Sync Firebase user to PostgreSQL
- `GET /api/groups` - All groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id/messages` - Group chat
- `POST /api/groups/:id/messages` - Send message
- `GET /api/groups/:id/gear-lists` - Gear lists
- `POST /api/groups/:id/gear-lists` - Create gear list

### Build Configuration

**File**: `Lusapp/app.json`

```json
{
  "expo": {
    "name": "Lusapp",
    "slug": "lusapp",
    "version": "1.0.0",
    "scheme": "lusapp",
    "ios": {
      "bundleIdentifier": "com.lusapp.mobile",
      "buildNumber": "21",
      "supportsTablet": true
    },
    "android": {
      "package": "com.lusapp.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2D5F3F"
      }
    }
  }
}
```

**EAS Build Configuration**: `Lusapp/eas.json`

```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

## Backend API

### Technology Stack

**Runtime**: Node.js
**Framework**: Express.js v4
**Database Client**: `pg` (node-postgres)
**Authentication**: Firebase Admin SDK + HTTP Basic Auth (admin endpoints)

**Key Dependencies:**
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.0",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2",
  "firebase-admin": "^11.9.0",
  "express-basic-auth": "^1.2.1",
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "multer": "^1.4.5-lts.1",
  "csv-parser": "^3.0.0",
  "cloudinary": "^1.40.0"
}
```

### Server Configuration

**File**: `server/index.js`

**Port**: 5000 (hardcoded - frontend expects this)

**CORS Configuration**:
```javascript
app.use(cors()); // Allow all origins for mobile app

// Admin endpoints: CORS disabled for CSRF protection
const noCors = (req, res, next) => {
  res.removeHeader('Access-Control-Allow-Origin');
  next();
};
```

**Database Connection**:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  }
});
```

**Trust Proxy** (production only):
```javascript
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}
```

### Authentication Middleware

#### 1. Firebase Token Verification

**Middleware**: `verifyFirebaseToken`

```javascript
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      firebase_uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Used on**: All user-facing endpoints (`/api/posts`, `/api/races/user-create`, etc.)

#### 2. Admin Basic Auth

**Middleware**: `adminAuth`

```javascript
const adminAuth = basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'Lusapp Admin'
});
```

**Used on**: All admin endpoints (`/api/races`, `/api/races/:id`, `/admin`)

#### 3. CSRF Protection

**Middleware**: `csrfProtection`

Prevents cross-site request forgery on admin endpoints by validating:
1. `Origin` header matches server origin
2. OR `Referer` header starts with `/admin`

```javascript
const csrfProtection = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.get('Origin');
    const referer = req.get('Referer');
    const expectedOrigin = `${req.protocol}://${req.get('Host')}`;
    
    if (!origin && !referer) {
      return res.status(403).json({ error: 'Forbidden: Missing origin/referer' });
    }
    // Validation logic...
  }
  next();
};
```

**Used on**: All state-changing admin endpoints (POST, PUT, DELETE)

### API Endpoints

#### Public Endpoints (No Auth)

**GET /api/races**
- Returns all approved races
- Filters: `approval_status = 'approved'`
- Used by: Mobile app Discover screen

**GET /api/races/:id**
- Returns single race details
- No approval filter (shows any race if you have the ID)

**GET /static/race-template.csv**
- Downloads CSV template for bulk race upload

#### User Endpoints (Firebase Auth Required)

**POST /api/auth/sync**
- Syncs Firebase user to PostgreSQL
- Creates or updates user record
- Returns database user ID

```javascript
app.post('/api/auth/sync', verifyFirebaseToken, async (req, res) => {
  const { firebase_uid, email } = req.user;
  
  const result = await pool.query(
    `INSERT INTO users (firebase_uid, email, display_name) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (firebase_uid) 
     DO UPDATE SET email = $2 
     RETURNING *`,
    [firebase_uid, email, email.split('@')[0]]
  );
  
  res.json(result.rows[0]);
});
```

**POST /api/races/user-create**
- Users can submit races
- Sets `approval_status = 'pending'`
- Sets `created_by_user_id = firebase_uid`
- Requires admin approval before visible

**POST /api/posts**
- Create social feed post
- Auto-links to race if `race_id` provided

**GET /api/posts**
- Get all posts with user and race data
- JOIN queries: `users`, `races`

**DELETE /api/auth/delete-account**
- Deletes user from Firebase AND PostgreSQL
- Cascades to posts, group memberships, etc.

**Group Endpoints** (all require Firebase auth):
- `GET /api/groups` - All groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Group details
- `POST /api/groups/:id/join` - Join group
- `GET /api/groups/:id/messages` - Chat messages
- `POST /api/groups/:id/messages` - Send message
- `GET /api/groups/:id/gear-lists` - Gear lists
- `POST /api/groups/:id/gear-lists` - Create list
- `POST /api/groups/:id/gear-lists/:listId/items` - Add gear item
- `PUT /api/groups/:id/gear-lists/:listId/items/:itemId` - Update item status

#### Admin Endpoints (Basic Auth + CSRF Protection)

**Middleware Stack**: `noCors, csrfProtection, adminAuth`

**GET /api/races/pending**
- Returns races with `approval_status = 'pending'`

**POST /api/races**
- Admin creates race
- Sets `approval_status = 'approved'` automatically

**PUT /api/races/:id**
- Admin updates any race
- No approval status change

**DELETE /api/races/:id**
- Admin deletes race

**POST /api/races/:id/approve**
- Changes `approval_status` to 'approved'
- Sets `reviewed_by`, `reviewed_at`

**POST /api/races/:id/reject**
- Changes `approval_status` to 'rejected'
- Accepts optional `reason` in body

**POST /api/races/csv-upload**
- Bulk race import via CSV
- Uses `multer` for file upload
- Parses CSV with `csv-parser`
- Duplicate detection by name + date

**CSV Format**:
```csv
name,sport,city,country,continent,date,distance,description,participants
Tokyo Marathon,Running,Tokyo,Japan,Asia,2026-02-22,42.2km,World Marathon Majors,38000
```

**GET /api/races/csv-download**
- Downloads all races as CSV

### Database Initialization

**File**: `server/init-db.sql`

Automatically runs on server start to ensure schema exists:

```javascript
const initializeDatabase = async () => {
  const initSQL = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
  await pool.query(initSQL);
};

initializeDatabase();
```

**Schema includes**:
- All table definitions
- Indexes for performance
- Foreign key constraints
- Default values

---

## Authentication System

### Firebase Authentication

**Service**: Firebase Auth (Google Cloud)
**SDK**: Firebase JavaScript SDK v9

**Configuration** (in mobile app):
```javascript
// Lusapp/src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**Backend Configuration**:
```javascript
// server/index.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
```

### Authentication Methods Supported

1. **Email/Password** (currently implemented)
2. **Google Sign-In** (Firebase supports, not yet implemented)
3. **Apple Sign-In** (REQUIRED by App Store if Google is added)

### Authentication Flow

**1. Sign Up:**
```javascript
// Mobile app
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const signUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  await syncUserToBackend(userCredential.user);
};
```

**2. Email Verification:**
- User receives email from Firebase
- Clicks link to verify
- App checks `user.emailVerified` status
- Shows UnverifiedNavigator until verified

**3. Login:**
```javascript
const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  if (!userCredential.user.emailVerified) {
    // Show email verification screen
  }
  await syncUserToBackend(userCredential.user);
};
```

**4. Password Reset:**
```javascript
const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
  // User receives email with reset link
};
```

**5. Session Persistence:**
```javascript
// On app launch
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await syncUserToBackend(user);
    setCurrentUser(user);
  }
});
```

### Token Management

**ID Token Lifetime**: 1 hour

**Token Refresh**:
```javascript
const getToken = async () => {
  const token = await auth.currentUser.getIdToken(true); // Force refresh
  return token;
};
```

**API Request Example**:
```javascript
const fetchProtectedData = async () => {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${API_URL}/api/endpoint`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Account Deletion

**Full cascade deletion** from both Firebase and PostgreSQL:

```javascript
// Backend: /api/auth/delete-account
app.delete('/api/auth/delete-account', verifyFirebaseToken, async (req, res) => {
  const { firebase_uid } = req.user;
  
  // Delete from PostgreSQL (cascades to posts, memberships, etc.)
  await pool.query('DELETE FROM users WHERE firebase_uid = $1', [firebase_uid]);
  
  // Delete from Firebase
  await admin.auth().deleteUser(firebase_uid);
  
  res.json({ message: 'Account deleted' });
});
```

---

## Admin Panel

### Access

**URL**: `https://lusapp-backend-1.onrender.com/admin` (production)
**URL**: `http://localhost:5000/admin` (development)

**Authentication**: HTTP Basic Auth
- Username: `admin`
- Password: `ADMIN_PASSWORD` environment variable

### Features

**File**: `server/public/index.html` (single-page HTML app)

**Tabs:**

1. **Pending Races** - Moderate user-submitted races
   - View pending races
   - Edit race details inline
   - Approve or reject with reason
   
2. **Add Race** - Manually create race
   - Sport category dropdown (matches mobile app exactly)
   - Country dropdown (197 countries, alphabetically sorted)
   - Continent dropdown
   - Date picker
   - All races created here are auto-approved

3. **All Races** - View/edit all races
   - Inline editing for approved races
   - Delete races
   - Edit any field including approval status

4. **CSV Upload** - Bulk import
   - Download CSV template
   - Upload CSV file
   - Duplicate detection by name + date
   - Preview before import

### Sport Taxonomy (MUST MATCH MOBILE APP)

**JavaScript constant in admin page**:
```javascript
const SPORT_TAXONOMY = {
  Running: {
    icon: '🏃',
    subtypes: ['5K', '10K', 'Half Marathon', 'Marathon', 'Ultra Marathon', 'Trail Running', 'Cross Country', 'Custom Distance']
  },
  Triathlon: {
    icon: '🏊',
    subtypes: ['Sprint', 'Olympic', 'Half Ironman', 'Ironman', 'Aquathlon', 'Duathlon', 'Custom Distance']
  },
  Cycling: {
    icon: '🚴',
    subtypes: ['Criterium', 'Gran Fondo', 'Mountain Biking', 'Road Race', 'Custom Distance']
  },
  Fitness: {
    icon: '💪',
    subtypes: ['Spartan Race', 'HYROX', 'Obstacle Course', 'CrossFit', 'Bootcamp', 'Custom Distance']
  },
  Swimming: {
    icon: '🏊',
    subtypes: ['Open Water Swim', 'Pool Competition', 'Custom Distance']
  },
  Custom: {
    icon: '⭐',
    subtypes: ['Custom Event']
  }
};
```

**CRITICAL**: If you change sport taxonomy, you MUST:
1. Update `SPORT_TAXONOMY` in `server/public/index.html`
2. Update `SPORT_TAXONOMY` in `Lusapp/src/constants/sportTaxonomy.js`
3. Update database records to new category names

### Country Dropdown Implementation

**Countries Array** (197 countries):
```javascript
const COUNTRIES = ['Afghanistan', 'Albania', 'Algeria', ...]; // Full list in code
```

**Form Field**:
```html
<select id="country">
  <option value="">Select Country</option>
  <!-- Populated by initializeCountryDropdown() -->
</select>

<script>
function initializeCountryDropdown() {
  const countrySelect = document.getElementById('country');
  COUNTRIES.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}
</script>
```

### Security Features

**1. CSRF Protection**
- Validates `Origin` or `Referer` header
- Blocks requests not from admin page

**2. XSS Protection**
- All user input is HTML-escaped before display
- Uses `escapeHtml()` function

```javascript
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**3. HTTP-Only Cookies**
- Basic Auth credentials sent with every request
- Browser manages authentication

**4. No CORS on Admin Endpoints**
- Admin endpoints explicitly disable CORS
- Only accessible from same origin

---

## Third-Party Services

### 1. Firebase (Google Cloud)

**Purpose**: User authentication

**Services Used:**
- Firebase Authentication
- Firebase Admin SDK (backend token verification)

**Cost**: Free tier (up to 10k monthly active users)

**Environment Variables:**
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_MEASUREMENT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

**Setup:**
1. Create Firebase project at console.firebase.google.com
2. Enable Email/Password authentication
3. Download service account key for Admin SDK
4. Add web app configuration for client SDK

### 2. Cloudinary

**Purpose**: Image hosting (avatars, group banners)

**Why Cloudinary:**
- Expo local asset serving is temporary
- Need permanent cloud storage for user-uploaded images
- CDN distribution for fast loading

**Integration**:
```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload example
const uploadImage = async (imageFile) => {
  const result = await cloudinary.uploader.upload(imageFile.path, {
    folder: 'lusapp/avatars'
  });
  return result.secure_url;
};
```

**Environment Variables:**
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**Cost**: Free tier (25 credits/month, ~25GB storage)

### 3. Render.com

**Purpose**: Production hosting (backend + database)

**Services:**
- Web Service (Node.js backend)
- PostgreSQL database

**Deployment:**
- Connected to GitHub repository
- Auto-deploys on push to main branch
- Environment variables configured in Render dashboard

**Cost**: 
- Web Service: $7/month (512MB RAM)
- PostgreSQL: $7/month (1GB storage)

**CRITICAL**: Never change or migrate Render infrastructure - mobile apps depend on it

### 4. Expo (Expo.dev)

**Purpose**: React Native build service

**Services:**
- EAS Build (cloud iOS/Android builds)
- EAS Submit (App Store/Play Store submission)

**Build Command**:
```bash
cd Lusapp
eas build --platform ios
```

**Submit Command**:
```bash
eas submit --platform ios --latest
```

**Cost**: Free for 1 iOS/Android build per month, paid plans for more

---

## Development Environment

### Replit Setup

**Workspace**: This Replit project

**Workflows:**
1. **Backend API** - `node server/index.js`
   - Runs on port 5000
   - Hot-reloads on file changes
   
2. **Expo Dev** - `cd Lusapp && npx expo start --tunnel --non-interactive`
   - Expo dev server
   - Tunnel mode for testing on physical devices
   - QR code for Expo Go app

**Environment Variables** (configured in Replit Secrets):
- All Firebase credentials
- All Cloudinary credentials
- DATABASE_URL (Neon PostgreSQL for development)
- ADMIN_PASSWORD
- SESSION_SECRET

### Local Development (Outside Replit)

**Prerequisites:**
- Node.js 18+
- PostgreSQL database
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

**Setup:**

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   cd Lusapp && npm install
   ```

3. Create `.env` file:
   ```
   DATABASE_URL=postgresql://...
   ADMIN_PASSWORD=your_password
   SESSION_SECRET=random_string
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

4. Create `Lusapp/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:5000
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   ```

5. Initialize database:
   ```bash
   psql $DATABASE_URL < server/init-db.sql
   ```

6. Start backend:
   ```bash
   node server/index.js
   ```

7. Start mobile app:
   ```bash
   cd Lusapp
   npx expo start
   ```

### Testing

**Backend**: Use curl or Postman to test API endpoints

**Mobile App**: 
- Expo Go (development)
- TestFlight (iOS beta testing)
- Internal testing track (Android)

**Admin Panel**: Open browser to `http://localhost:5000/admin`

---

## Deployment & Publishing

### Backend Deployment (Render.com)

**Automatic Deployment:**
1. Push code to GitHub main branch
2. Render detects changes
3. Builds and deploys automatically
4. Uses `package.json` start script: `node server/index.js`

**Environment Variables**: Set in Render dashboard (same as development)

**Health Check**: Render pings root URL (`/`) to verify server is running

### Mobile App Publishing

**iOS TestFlight:**

1. Ensure app.json version and build number are incremented:
   ```json
   {
     "expo": {
       "version": "1.0.0",
       "ios": {
         "buildNumber": "22"  // Increment this
       }
     }
   }
   ```

2. Build app:
   ```bash
   cd Lusapp
   eas build --platform ios
   ```

3. Wait for build to complete (20-30 minutes)

4. Submit to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```

5. TestFlight processes build (can take hours)

6. Add external testers in App Store Connect

**Android APK:**

1. Build:
   ```bash
   cd Lusapp
   eas build --platform android --profile production
   ```

2. Download APK from Expo dashboard

3. Distribute via Google Play Internal Testing or direct download

### App Store Submission (Production)

**Prerequisites:**
- Apple Developer account ($99/year)
- App Store Connect app created
- Privacy policy URL
- App screenshots (all required sizes)
- App description

**Steps:**
1. Build production iOS app
2. Submit via EAS Submit
3. Fill out App Store Connect metadata
4. Submit for review
5. Wait for Apple approval (1-7 days)

---

## File Structure

```
workspace/
├── server/                          # Backend API
│   ├── index.js                     # Main Express server
│   ├── init-db.sql                  # Database schema initialization
│   └── public/
│       └── index.html               # Admin panel (single-page app)
│
├── Lusapp/                          # Mobile app (React Native + Expo)
│   ├── app.json                     # Expo configuration
│   ├── eas.json                     # EAS Build configuration
│   ├── package.json                 # Dependencies
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js          # Firebase client config
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.js       # Authentication state management
│   │   │
│   │   ├── constants/
│   │   │   ├── theme.js             # Color system, countries, continents
│   │   │   └── sportTaxonomy.js     # Sport categories and subtypes
│   │   │
│   │   ├── navigation/
│   │   │   └── AppNavigator.js      # Main navigation (Guest/Unverified/Verified)
│   │   │
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.js
│   │   │   │   ├── SignUpScreen.js
│   │   │   │   ├── ForgotPasswordScreen.js
│   │   │   │   └── EmailVerificationScreen.js
│   │   │   │
│   │   │   ├── feed/
│   │   │   │   ├── FeedScreen.js
│   │   │   │   └── CreatePostScreen.js
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   └── CalendarScreen.js
│   │   │   │
│   │   │   ├── discover/
│   │   │   │   ├── DiscoverScreen.js
│   │   │   │   └── RaceDetailScreen.js
│   │   │   │
│   │   │   ├── groups/
│   │   │   │   ├── GroupsScreen.js
│   │   │   │   ├── CreateGroupScreen.js
│   │   │   │   ├── GroupDetailScreen.js
│   │   │   │   ├── GroupChatTab.js
│   │   │   │   ├── GroupMembersTab.js
│   │   │   │   └── GroupGearTab.js
│   │   │   │
│   │   │   └── profile/
│   │   │       ├── ProfileScreen.js
│   │   │       ├── EditProfileScreen.js
│   │   │       └── SettingsScreen.js
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── RaceCard.js
│   │   │   ├── PostCard.js
│   │   │   ├── GradientButton.js
│   │   │   └── LoadingSpinner.js
│   │   │
│   │   └── utils/
│   │       ├── dateUtils.js
│   │       └── validationUtils.js
│   │
│   └── assets/                      # Images, icons, fonts
│       ├── icon.png
│       ├── adaptive-icon.png
│       └── splash.png
│
├── node_modules/                    # Backend dependencies
├── package.json                     # Backend dependencies
└── replit.md                        # Project documentation (keep updated!)
```

---

## Environment Variables

### Backend (Production - Render.com)

**Required:**
```
DATABASE_URL=postgresql://lusapp_user:***@dpg-d3ie4b49c44c73and2rg-a.oregon-postgres.render.com/lusapp
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=random_32_char_string
NODE_ENV=production

FIREBASE_PROJECT_ID=lusapp-1aea1
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-***@lusapp-1aea1.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Note**: `FIREBASE_PRIVATE_KEY` must include escaped newlines (`\n`)

### Backend (Development - Replit)

Same as production, but:
```
DATABASE_URL=<Neon PostgreSQL connection string>
NODE_ENV=development
```

### Mobile App (Production)

**File**: `Lusapp/.env` (not committed to Git)

```
EXPO_PUBLIC_API_URL=https://lusapp-backend-1.onrender.com
EXPO_PUBLIC_FIREBASE_API_KEY=AIza***
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=lusapp-1aea1.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=lusapp-1aea1
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=lusapp-1aea1.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123***
EXPO_PUBLIC_FIREBASE_APP_ID=1:123***:web:abc***
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-***
```

**Important**: All Expo environment variables MUST start with `EXPO_PUBLIC_` prefix

### Mobile App (Development)

Same as production, but:
```
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Or use Replit URL for remote testing

---

## Key Code Patterns

### Error Handling

**Backend**:
```javascript
app.get('/api/endpoint', async (req, res) => {
  try {
    // Database query or logic
    const result = await pool.query('SELECT * FROM table');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});
```

**Frontend**:
```javascript
const fetchData = async () => {
  try {
    const response = await fetch(`${API_URL}/api/endpoint`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    Alert.alert('Error', 'Failed to load data');
  }
};
```

### Database Queries

**Parameterized Queries** (prevents SQL injection):
```javascript
// CORRECT
const result = await pool.query(
  'SELECT * FROM races WHERE id = $1',
  [raceId]
);

// WRONG - SQL injection risk!
const result = await pool.query(
  `SELECT * FROM races WHERE id = ${raceId}`
);
```

**Transactions** (for multi-step operations):
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  const race = await client.query('INSERT INTO races (...) RETURNING *', [...]);
  await client.query('INSERT INTO posts (...)', [...]);
  
  await client.query('COMMIT');
  res.json(race.rows[0]);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### React Native Styling

**Inline Styles** (most common in this project):
```javascript
<View style={{
  backgroundColor: colors.surface,
  padding: 20,
  borderRadius: 12,
  marginBottom: 15
}}>
  <Text style={{ color: colors.text, fontSize: 16 }}>
    Content
  </Text>
</View>
```

**LinearGradient** (for branded look):
```javascript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#2D5F3F', '#3D7F4F']}
  style={{
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  }}>
  <Text style={{ color: '#FFF', fontWeight: '600' }}>
    Button Text
  </Text>
</LinearGradient>
```

### Async/Await Patterns

**Firebase Auth**:
```javascript
const handleLogin = async () => {
  try {
    setLoading(true);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (!userCredential.user.emailVerified) {
      Alert.alert('Email Not Verified', 'Please verify your email first');
      await auth.signOut();
      return;
    }
    
    await syncUserToBackend(userCredential.user);
    navigation.navigate('Main');
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Common Issues & Solutions

### Issue: "Cannot edit races in admin panel"

**Cause**: Old sport category names in database don't match new taxonomy

**Solution**: Update database records:
```sql
UPDATE races SET sport_category = 'Running' WHERE sport_category = 'Road Running';
UPDATE races SET sport_category = 'Fitness' WHERE sport_category = 'Obstacle';
UPDATE races SET sport_category = 'Triathlon' WHERE sport_category IN ('Full Distance', 'Half Distance', 'Olympic Distance', 'Non-Standard');
```

### Issue: "Database constraint violation on race update"

**Cause**: `sport` column has NOT NULL constraint but admin form doesn't send it

**Solution**: Remove constraint:
```sql
ALTER TABLE races ALTER COLUMN sport DROP NOT NULL;
```

### Issue: "Firebase authentication fails"

**Cause**: Wrong environment variables or expired credentials

**Solution**: 
1. Check Firebase console for project status
2. Verify all `FIREBASE_*` environment variables are correct
3. Ensure `FIREBASE_PRIVATE_KEY` has escaped newlines (`\n`)
4. Backend: Check logs for "Firebase Admin initialized successfully"

### Issue: "Mobile app can't connect to backend"

**Cause**: Wrong API URL or CORS issue

**Solution**:
1. Verify `EXPO_PUBLIC_API_URL` in mobile app `.env`
2. Check backend CORS is enabled: `app.use(cors())`
3. Test backend directly with curl
4. Ensure backend is running on port 5000

### Issue: "Images not loading in mobile app"

**Cause**: Using local file paths instead of Cloudinary URLs

**Solution**: Always upload images to Cloudinary and store URLs in database

### Issue: "Build fails on EAS"

**Common causes**:
1. Missing dependencies in `package.json`
2. Incorrect `app.json` configuration
3. Environment variables not set in Expo dashboard

**Solution**:
1. Run `npm install` to update package-lock.json
2. Verify `app.json` syntax
3. Check EAS build logs for specific errors

---

## Data Migration Notes

If you ever need to migrate data or change infrastructure (ONLY IN DEVELOPMENT):

### Exporting Data

```bash
# Export all tables to CSV
psql $DATABASE_URL -c "\COPY races TO 'races.csv' CSV HEADER"
psql $DATABASE_URL -c "\COPY users TO 'users.csv' CSV HEADER"
psql $DATABASE_URL -c "\COPY posts TO 'posts.csv' CSV HEADER"
# etc.
```

### Importing Data

```bash
# Import from CSV
psql $DATABASE_URL -c "\COPY races FROM 'races.csv' CSV HEADER"
```

### Schema Changes

**NEVER manually write SQL migrations**. Instead:

1. Update `server/init-db.sql` with new schema
2. Restart backend (auto-runs init script)
3. Or manually run: `psql $DATABASE_URL < server/init-db.sql`

---

## Performance Optimization

### Database Indexes

**Already implemented**:
```sql
CREATE INDEX idx_races_date ON races(date);
CREATE INDEX idx_races_category ON races(sport_category);
CREATE INDEX idx_races_approval ON races(approval_status);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### Query Optimization

**Use JOIN instead of multiple queries**:
```javascript
// GOOD - Single query with JOIN
const posts = await pool.query(`
  SELECT posts.*, users.display_name, users.avatar_url, races.name as race_name
  FROM posts
  LEFT JOIN users ON posts.user_id = users.id
  LEFT JOIN races ON posts.race_id = races.id
  ORDER BY posts.created_at DESC
`);

// BAD - N+1 query problem
const posts = await pool.query('SELECT * FROM posts');
for (const post of posts.rows) {
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [post.user_id]);
  post.user = user.rows[0];
}
```

### Mobile App Optimizations

**Image Optimization**:
- Use Cloudinary transformations: `https://res.cloudinary.com/.../w_300,h_300,c_fill/image.jpg`
- Cache images with `react-native-fast-image` (not yet implemented)

**List Rendering**:
- Use `FlatList` for long lists instead of `ScrollView`
- Implement `keyExtractor` and `getItemLayout` for better performance

---

## Security Best Practices

### Backend Security

1. **Never trust client input** - Always validate and sanitize
2. **Use parameterized queries** - Prevents SQL injection
3. **Escape HTML output** - Prevents XSS attacks
4. **Enable CORS only for mobile app** - Disable for admin endpoints
5. **Verify Firebase tokens** - Don't trust `Authorization` header blindly
6. **Use HTTPS in production** - Render.com handles this automatically
7. **Rate limiting** - Consider implementing for production

### Mobile App Security

1. **Store sensitive data securely** - Use `expo-secure-store` for tokens
2. **Validate server responses** - Don't trust API responses blindly
3. **Use HTTPS only** - Never use `http://` in production
4. **Don't log sensitive data** - Remove console.logs in production
5. **Implement certificate pinning** - For extra security (advanced)

### Environment Variable Security

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Rotate API keys regularly** - Especially after exposing
3. **Use different keys for dev/prod** - Isolate environments
4. **Restrict API key permissions** - Firebase, Cloudinary dashboards

---

## Testing Checklist

### Before Production Deploy

**Backend:**
- [ ] All environment variables set in Render
- [ ] Database connection works
- [ ] Firebase Admin SDK initializes
- [ ] Admin panel accessible with Basic Auth
- [ ] CORS enabled for mobile app
- [ ] All endpoints return expected responses

**Mobile App:**
- [ ] Build succeeds on EAS
- [ ] API URL points to production backend
- [ ] Firebase config matches production project
- [ ] All screens load without errors
- [ ] Authentication flow works (login, signup, logout)
- [ ] Race discovery works
- [ ] Social feed works
- [ ] Groups work
- [ ] Profile editing works

**Database:**
- [ ] All tables exist
- [ ] Indexes created
- [ ] Foreign keys working
- [ ] Sample data loaded (races, users)

---

## Monitoring & Logging

### Backend Logs

**Production (Render.com)**: View logs in Render dashboard

**Development**: Console output shows:
- Firebase initialization status
- Database schema initialization
- API request logs (method, path, user)
- Error stack traces

**Key log messages**:
```
✅ Firebase Admin initialized successfully
✓ Database schema initialized successfully
Server running on port 5000
📝 [ADMIN RACE UPDATE] Updating race 52 by admin
```

### Mobile App Debugging

**React Native Debugger**:
1. Press `j` in Expo dev server
2. Opens Chrome DevTools
3. View console logs, network requests, React component tree

**Expo Logs**:
- Appear in terminal running `expo start`
- Use `console.log()`, `console.error()`, `console.warn()`

---

## Future Enhancements

### Planned Features

1. **Push Notifications**
   - Race reminders (1 week before, 1 day before)
   - New group messages
   - Friend activity (someone registered for a race)

2. **Social Features**
   - Follow other users
   - Like/comment on posts
   - Share race results

3. **Analytics**
   - Track user engagement
   - Popular races
   - Active groups

4. **Advanced Search**
   - Filter by sport, location, date range
   - Search by race name
   - Save search preferences

5. **Offline Support**
   - Cache races for offline viewing
   - Queue actions when offline (like/register)
   - Sync when connection restored

### Technical Debt

1. **Migrate to TypeScript**
   - Better type safety
   - Improved IDE support
   - Catch errors at compile time

2. **Add automated tests**
   - Unit tests (Jest)
   - Integration tests (Supertest for API)
   - E2E tests (Detox for mobile)

3. **Implement rate limiting**
   - Prevent API abuse
   - Use `express-rate-limit`

4. **Add caching**
   - Redis for frequently accessed data
   - Reduce database load

5. **Improve error handling**
   - Standardized error responses
   - Error tracking (Sentry)
   - Better user-facing error messages

---

## Glossary

**EAS**: Expo Application Services - Cloud build and submission service
**Firebase UID**: Unique identifier for Firebase authenticated user
**CSRF**: Cross-Site Request Forgery - Attack prevented by validating request origin
**XSS**: Cross-Site Scripting - Attack prevented by escaping HTML
**JWT**: JSON Web Token - Firebase ID tokens are JWTs
**Neon**: Serverless PostgreSQL provider (used in Replit)
**Render**: Cloud hosting platform (production backend)
**Cloudinary**: Image hosting and CDN service
**Expo Go**: Mobile app for testing Expo projects without building
**TestFlight**: Apple's beta testing platform
**AsyncStorage**: React Native's local storage API (like localStorage in web)
**Pull-to-refresh**: Gesture to reload screen content by pulling down
**Hybrid Auth**: Authentication system using both Firebase and PostgreSQL

---

## Contact & Support

**For Development Help:**
- Expo Documentation: https://docs.expo.dev
- React Native Documentation: https://reactnative.dev
- Firebase Documentation: https://firebase.google.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs

**For Production Issues:**
- Render Support: https://render.com/support
- Firebase Support: https://firebase.google.com/support
- Cloudinary Support: https://cloudinary.com/contact

---

## Version History

**Current Version**: 1.0.0 (Build 21)

**Recent Changes:**
- Sport taxonomy updated: "Obstacle" → "Fitness", added "Custom" category
- Country field changed to dropdown (197 countries)
- Fixed race editing in admin panel
- Added pull-to-refresh to all main screens
- Implemented smart back buttons for cross-tab navigation
- Fixed groups "empty" confusion - improved messaging

**Build 22** (next release):
- Updated sport categories (Fitness, Custom)
- Country dropdown in admin site
- Database fixes for race editing

---

## License & Legal

**Code License**: Proprietary (not open source)
**Privacy Policy**: Required for App Store - must be hosted publicly
**Terms of Service**: Required for user-generated content

**Third-Party Licenses:**
- React Native: MIT License
- Expo: MIT License
- Firebase: Google Terms of Service
- All npm packages: Check individual licenses

---

**End of Documentation**

This document should be updated whenever significant changes are made to architecture, infrastructure, or key features. Keep it in sync with actual codebase implementation.

For AI coding agents: This document provides complete context for understanding and modifying Lusapp. Always verify current database schema and environment variables before making changes. Never modify production infrastructure (Render.com backend/database).
