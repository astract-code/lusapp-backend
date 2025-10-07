# Lusapp - Athletic Race Discovery & Social Platform

## Overview

Lusapp is a React Native mobile application built with Expo that serves as a comprehensive platform for athletes to discover races, track their participation, and connect with other athletes. The app combines race discovery, calendar management, social feeds, and user profiles into a cohesive experience focused on endurance sports like triathlons, marathons, cycling, and trail running.

The application is designed to work seamlessly on iOS (primary target) with Android support, deployable through Expo Go for development and testing. It features a modern, sporty UI with gradient designs, smooth animations, and both light/dark mode support.

## Recent Changes

**October 7, 2025 - Latest:**
- **HIERARCHICAL SPORT FILTERING IMPLEMENTED:**
  - Replaced flat sport filter with two-level tree-based approach: Category → Distance/Type
  - Sport categories: Running, Triathlon, Cycling, Obstacle, Swimming
  - Running subtypes: 5K, 10K, Half Marathon, Marathon, Ultra Marathon, Trail Running, Cross Country, Custom Distance
  - Triathlon subtypes: Sprint, Olympic, Half Ironman, Ironman, Aquathlon, Duathlon, Custom Distance
  - Cycling subtypes: Criterium, Gran Fondo, Mountain Biking, Road Race, Custom Distance
  - Obstacle subtypes: Spartan Race, HYROX, Obstacle Course, Custom Distance
  - Database: Added sport_category and sport_subtype columns (backward compatible with existing sport column)
  - DiscoverScreen: Cascading filter UI - select category first, then distance/type options appear
  - Add Race modal: Updated to use hierarchical selection
  - Backward compatibility: normalizeLegacySport() maps old flat sport strings to category/subtype
  - All mock races updated with category and subtype data

**October 6, 2025 - Latest:**
- **REAL AUTHENTICATION IMPLEMENTED:**
  - Replaced mock authentication with production-ready PostgreSQL + JWT system
  - Backend: bcrypt password hashing (12 rounds), JWT tokens (7-day expiry), protected routes
  - Database: Users table with email, password_hash, profile fields (location, bio, favoriteSport)
  - API endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me (token validation)
  - Mobile: AuthContext calls real API, validates tokens on startup, handles errors gracefully
  - Security: SESSION_SECRET required at startup, SSL configured for Render.com, no hardcoded secrets
  - Database initialization: init-db.sql script + npm run db:setup command for easy deployment
  - Deployment ready: Complete DEPLOYMENT.md guide for Render.com + Expo EAS Build
  - Architecture: Clean separation of frontend/backend, ready for iOS publishing via Expo EAS

- **ENHANCED USER REGISTRATION:**
  - Added comprehensive user profile fields to signup form: location, bio, and favorite sport
  - Registration now captures full user information during account creation
  - Bio field uses multiline text input with 80px minimum height
  - Location and favorite sport fields include helpful placeholder examples
  - All fields properly integrate with existing dark mode theme system
  - User data structure now consistent across app with sensible defaults for optional fields

**October 6, 2025 - Earlier:**
- **MODERN UI REDESIGN COMPLETE:**
  - Created comprehensive theme system with enhanced colors, shadows, spacing, and typography constants
  - Implemented dark mode with ThemeContext (Light/Dark/Auto options) using AsyncStorage persistence
  - Added theme toggle selector in Settings screen with emoji icons (☀️ Light, 🌙 Dark, ⚙️ Auto)
  - Built modern reusable components: Button (with press animations) and Card (with elevation levels)
  - Updated Settings screen with new modern design using Cards, improved spacing, and icons
  - Smooth animations using React Native Animated API (spring-based button press effects)
  - Theme system includes: SHADOWS (sm to xl), TYPOGRAPHY (font sizes, weights, line heights), SPACING (xs to xxl), BORDER_RADIUS
  - App now supports automatic theme switching based on device settings

**October 6, 2025 - Earlier:**
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
- **Country selection uses horizontal scrollable chips matching Sport/Continent pattern**
- **Both Add Race form and country filter use same standardized COUNTRIES constant**
- **Expanded sports catalog to 20+ types: 5K, 10K, Half Marathon, Marathon, Ultra Marathon, Triathlon, Ironman, Trail Running, Spartan Race, HYROX, Obstacle Course, Cycling, Bike Race, Criterium, Gran Fondo, Mountain Biking, Duathlon, Aquathlon, Open Water Swim, Cross Country**
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
- Modern theme system with ThemeContext supporting Light/Dark/Auto modes
- Enhanced color palette: primary (#FF6B35), secondary (#004E89), with semantic color tokens (background, card, surface, text, textSecondary, border, success, error)
- Dark mode with proper contrast ratios and user-selectable preferences (persisted in AsyncStorage)
- Comprehensive design tokens:
  - SHADOWS: 5 elevation levels (sm, md, lg, xl, xxl) with proper depth
  - TYPOGRAPHY: Font sizes (xs to xxl), weights (normal to bold), line heights
  - SPACING: Consistent spacing scale (xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32)
  - BORDER_RADIUS: Rounded corners (sm: 8, md: 12, lg: 16, xl: 24)
- Modern reusable components: Button (5 variants with animations), Card (4 elevation levels)
- Smooth spring-based animations using React Native Animated API
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