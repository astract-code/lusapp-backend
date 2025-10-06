# Lusapp - Athletic Race Discovery & Social Platform

## Overview

Lusapp is a React Native mobile application built with Expo that serves as a comprehensive platform for athletes to discover races, track their participation, and connect with other athletes. The app combines race discovery, calendar management, social feeds, and user profiles into a cohesive experience focused on endurance sports like triathlons, marathons, cycling, and trail running.

The application is designed to work seamlessly on iOS (primary target) with Android support, deployable through Expo Go for development and testing. It features a modern, sporty UI with gradient designs, smooth animations, and both light/dark mode support.

## Recent Changes

**October 6, 2025:**
- Completed full implementation of Lusapp with all core features
- Fixed critical feed interaction bugs: likes and comments now properly track per-user interactions using authenticated user context
- Implemented per-user like tracking with `likedBy` arrays instead of simple like counts
- Optimized FeedScreen with useMemo and FlatList extraData for proper UI re-rendering
- Fixed safe area issues: All screens now properly respect iPhone notch/status bar using SafeAreaView
- Fixed React Native component capitalization errors (text → Text)
- **Implemented PostgreSQL database backend with Express API for persistent race storage**
- **Created authenticated web admin interface for manual race entry and CSV upload**
- **Mobile app uses hybrid data approach: mock data in development, API in production**
- **Added comprehensive Settings screen with 24h/12h time format and miles/km distance unit preferences**
- **Implemented SettingsContext with AsyncStorage persistence and format helper functions**
- **Added follow/unfollow functionality with real-time follower/following count sync across screens**
- **Implemented direct messaging placeholder with message button and alerts (full DM feature coming soon)**
- **ProfileScreen and UserProfileScreen now display follower/following counts**
- **ProfileScreen subscribes to Zustand store for real-time follow count updates**
- **Follow/unfollow properly prevents self-following and hides buttons on own profile**
- **Replaced free-text country input with standardized country picker (45+ countries)**
- **Country selection now uses buttons to prevent duplicates (US vs United States vs USA)**
- **Both Add Race form and country filter use same standardized COUNTRIES constant**
- All screens, components, and navigation fully functional and tested
- Expo server running successfully in tunnel mode, ready for testing in Expo Go

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React Native 0.81.4 with React 19.1.0
- Expo SDK ~54.0 for cross-platform development
- React Navigation v7 for routing (bottom tabs + native stack)
- Expo Linear Gradient for visual styling

**Navigation Structure:**
- Bottom tab navigation with 4 main sections: Feed, Calendar, Discover, Profile
- Stack navigators nested within tabs for detail screens
- Deep linking support for race details and user profiles

**State Management:**
- Zustand v5.0.8 for global app state (races, posts, users)
- React Context for authentication state
- AsyncStorage for persistent local data storage

**Design System:**
- Centralized theme system with light/dark mode support
- Consistent color palette with primary (#FF6B35), secondary (#004E89), and accent colors
- Gradient-based UI elements for sporty aesthetic
- Responsive spacing and typography constants
- Sport-specific icons and categorization

### Component Architecture

**Core Components:**
- `FilterChip` - Reusable filter selection chips for discovery
- `PostCard` - Social feed items with likes, comments, and user interactions
- `RaceCard` - Race display cards with gradient backgrounds and key details
- `StatCard` - User statistics display (total races, favorite sport)
- `UserAvatar` - Consistent user profile image rendering

**Screen Components:**
- `OnboardingScreen` - Authentication entry point (email/Apple sign-in)
- `FeedScreen` - Social activity feed showing race signups and completions
- `CalendarScreen` - Calendar and list view of upcoming races
- `DiscoverScreen` - Race discovery with multi-level filtering
- `ProfileScreen` - Current user profile and race history
- `RaceDetailScreen` - Detailed race information and registration
- `UserProfileScreen` - Other users' public profiles

### Data Architecture

**Database Backend:**
- PostgreSQL database for persistent race storage
- Express.js REST API server (port 5000) serving race data
- Protected admin routes using HTTP Basic Authentication
- Hybrid data loading: uses mock data in development (Expo Go), can switch to API for production

**Database Schema:**
- **races table:** id (serial), name, sport, city, country, continent, date, distance, description, participants, created_at
- **users table:** id (serial), email, name, password_hash, location, bio, avatar, total_races, favorite_sport, joined_races, completed_races, created_at
- **posts table:** id (serial), user_id, type, race_id, timestamp, liked_by, comments

**Data Models:**
- **User:** id, name, email, location, bio, stats, joined/completed races, avatar
- **Race:** id, name, sport, city, country, continent, date, distance, description, participants (fetched from API)
- **Post:** id, userId, type (signup/completion), raceId, timestamp, likedBy (array of user IDs), comments (currently mock data)

**State Management Pattern:**
- Zustand store provides centralized access to races, posts, users
- `fetchRaces()` async action: uses mock data by default, can fetch from API if configured (set `USE_API = true` in AppContext.js)
- Actions for registration, likes, comments, race management
- Real-time UI updates through reactive subscriptions
- Hybrid approach allows development with Expo Go without backend complexity

### Authentication System

**Current Implementation:**
- Mock authentication using AsyncStorage for persistence
- Email/password and Apple sign-in UI flows
- User session management via AuthContext
- Automatic session restoration on app launch

**Design Pattern:**
- Context Provider wrapping app root
- Conditional rendering based on auth state
- Onboarding screen shown for unauthenticated users

### Backend API System

**Express.js REST API:**
- Serves race data to mobile app and web admin
- Endpoints: GET /api/races, GET /api/races/:id, POST /api/races, PUT /api/races/:id, DELETE /api/races/:id
- POST /api/races/csv-upload for bulk race import
- CORS enabled for mobile app access
- HTTP Basic Authentication on admin routes using ADMIN_PASSWORD secret

**Admin Web Interface:**
- Accessible at /admin route (requires authentication)
- Manual race entry form with full validation
- CSV file upload with automatic field mapping
- View all races with delete functionality
- Real-time feedback on operations

**CSV Import Functionality:**
- Server-side CSV parsing using csv-parser
- File upload via multer middleware
- Flexible column mapping supporting multiple naming conventions
- Direct insertion into PostgreSQL database
- Returns import statistics (successful/total rows)

**Supported CSV Fields:**
- name/eventName/Event Name
- sport/sportType/Sport Type  
- city/location
- country, continent, date, distance
- description, participants

## External Dependencies

### Third-Party Libraries

**Navigation & Routing:**
- `@react-navigation/native` v7.1.18 - Core navigation
- `@react-navigation/bottom-tabs` v7.4.8 - Tab navigation
- `@react-navigation/native-stack` v7.3.27 - Stack navigation
- `react-native-screens` v4.16.0 - Native screen optimization
- `react-native-safe-area-context` v5.6.1 - Safe area handling

**UI & Styling:**
- `expo-linear-gradient` v15.0.7 - Gradient backgrounds
- `react-native-calendars` v1.1313.0 - Calendar component
- `expo-status-bar` v3.0.8 - Status bar styling

**State & Storage:**
- `zustand` v5.0.8 - Lightweight state management
- `@react-native-async-storage/async-storage` v2.2.0 - Local persistence

**Data Processing:**
- `papaparse` v5.5.3 - CSV parsing (mobile only, not used after backend implementation)

**Backend Dependencies:**
- `express` - Web server framework
- `pg` - PostgreSQL client
- `cors` - Cross-origin resource sharing
- `body-parser` - Request body parsing
- `multer` - File upload handling
- `csv-parser` - Server-side CSV processing
- `express-basic-auth` - HTTP Basic Authentication

### Expo Services

**Core Expo SDK:**
- Expo v54.0.12 for managed workflow
- Cross-platform API access
- Development and deployment tooling

**Asset Management:**
- Local asset serving for icons and images
- External avatar URLs via pravatar.cc (mock data)