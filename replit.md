# Lusapp - Athletic Race Discovery & Social Platform

## Overview

Lusapp is a React Native mobile application built with Expo, designed for athletes to discover endurance races (triathlons, marathons, cycling, trail running), track participation, and connect with a community. It offers race discovery, calendar management, social feeds, and user profiles, targeting iOS primarily with Android support. The app features a modern, sporty UI with gradient designs, animations, and both light/dark mode support, and is ready for App Store and Google Play Store submission with full compliance, including privacy policies, terms of service, account deletion, and age verification.

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
- Bottom tab navigation with Feed, Calendar, Discover, Messages, Groups, and Profile sections.
- Stack navigators nested within tabs for detail screens.
- Deep linking support.

**State Management:**
- Zustand v5.0.8 for global app state (races, posts, users).
- React Context for authentication state.
- AsyncStorage for persistent local data storage.

**Design System:**
- Comprehensive theme system (Light/Dark/Auto modes) with ThemeContext and AsyncStorage persistence.
- Enhanced color palette and semantic color tokens.
- Design tokens for shadows, typography, spacing, and border-radius.
- Modern reusable components (Button with animations, Card with elevation).
- Smooth spring-based animations using React Native Animated API.

### Component Architecture

**Core Components:**
- `FilterChip`, `PostCard`, `RaceCard`, `StatCard`, `UserAvatar`.

**Screen Components:**
- `OnboardingScreen`, `FeedScreen`, `CalendarScreen`, `DiscoverScreen`, `ProfileScreen`, `RaceDetailScreen`, `UserProfileScreen`, `MessagesScreen`, `ChatScreen`, `GroupsScreen`, `GroupDetailScreen`, `GroupChatTab`, `GroupMembersTab`, `GroupGearListsTab`, `GearListDetailScreen`.

### Data Architecture

**Database Backend:**
- PostgreSQL database for persistent storage.
- Express.js REST API server (port 5000) for race data.
- Protected admin routes using HTTP Basic Authentication.

**Database Schema:**
- **races table:** id, name, sport_category, sport_subtype, city, country, continent, date, distance, description, participants, created_at.
- **users table:** id, email, password_hash, profile fields (location, bio, avatar, favoriteSport, joined_races, completed_races, follower/following arrays).
- **posts table:** id, user_id, type, race_id, timestamp, liked_by (array of user IDs), comments.
- **conversations table:** id, user1_id, user2_id, last_message_at, created_at (for direct messaging).
- **messages table:** id, conversation_id, sender_id, content, read, created_at (for direct messages).
- **groups table:** id, name, sport_type, city, country, description, password_hash, banner_url, created_by, member_count, created_at, updated_at.
- **group_members table:** id, group_id, user_id, role (owner/moderator/member), joined_at, last_active_at.
- **group_messages table:** id, group_id, sender_id, content, created_at (for group chat).
- **group_gear_lists table:** id, group_id, race_id, title, created_by, created_at (collaborative race prep lists).
- **group_gear_items table:** id, list_id, description, added_by, claimed_by, status (needed/claimed/completed), created_at, updated_at.

**Data Models:**
- **User:** id, name, email, location, bio, stats, joined/completed races, avatar.
- **Race:** id, name, sport_category, sport_subtype, city, country, continent, date, distance, description, participants.
- **Post:** id, userId, type (signup/completion), raceId, timestamp, likedBy, comments.

**State Management Pattern:**
- Zustand store for centralized access.
- Hybrid approach for data loading (mock in dev, API in production).

### Authentication System

**Current Implementation:**
- Production-ready PostgreSQL + JWT system for user authentication.
- bcrypt password hashing (12 rounds), JWT tokens (7-day expiry).
- Email/password signup/login, and Apple sign-in UI flows.
- User session management via AuthContext, with automatic session restoration.
- Account deletion feature via DELETE /api/auth/account endpoint.
- Password visibility toggle (eye icon) on login and signup screens.
- Password confirmation field on signup with matching validation.

### Backend API System

**Express.js REST API:**
- Serves race data to mobile app and web admin.
- Endpoints for race CRUD operations, user authentication, and account deletion.
- POST /api/races/csv-upload for bulk race import with duplicate detection.
- CORS enabled.
- HTTP Basic Authentication on admin routes.

**Admin Web Interface:**
- Accessible at /admin route (requires authentication).
- Manual race entry form with validation.
- CSV file upload with flexible column mapping.

**CSV Import Functionality:**
- Server-side parsing using `csv-parser` and `multer`.
- Direct insertion into PostgreSQL database.
- Smart duplicate race detection based on name + date + sport/distance.

## External Dependencies

### Third-Party Libraries

**Navigation & Routing:**
- `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`.

**UI & Styling:**
- `expo-linear-gradient`, `react-native-calendars`, `expo-status-bar`.

**State & Storage:**
- `zustand`, `@react-native-async-storage/async-storage`.

**Backend Dependencies:**
- `express` (web server), `pg` (PostgreSQL client), `cors` (CORS), `body-parser` (request body parsing), `multer` (file upload), `csv-parser` (server-side CSV parsing), `express-basic-auth` (HTTP Basic Authentication), `bcrypt` (password hashing), `jsonwebtoken` (JWT).

### Expo Services

**Core Expo SDK:**
- Expo v54.0.12 for managed workflow, cross-platform API access, development, and deployment tooling.

**Asset Management:**
- Local asset serving for icons and images.
- Cloudinary integration for permanent cloud storage of user avatars and group banners.

## Groups & Community Features

### Groups System (New Feature)

**Overview:**
- Athletes can create and join sport-specific groups (running, triathlon, cycling groups)
- Password-protected private groups or open public groups
- Group search and discovery by sport type, location, or name

**Group Functionality:**
- **Group Management:** Create groups with sport type, location, description, and optional password protection
- **Membership System:** Three roles - Owner (full control), Moderator (manage members), Member (chat and contribute)
- **Group Chat:** Real-time group messaging with read tracking and message history
- **Member List:** View all group members with their roles, avatars, and profiles
- **Collaborative Gear Lists:** Unique feature allowing groups to create shared race preparation checklists

**Collaborative Gear Lists:**
- Groups can create multiple gear lists (e.g., "Ironman Kona Prep")
- Link lists to specific races for context
- Members can add items (e.g., "Bike", "Helmet", "Wetsuit")
- Items have three statuses:
  - **Needed** - Item required but not yet claimed
  - **Claimed** - Member commits to bringing the item
  - **Completed** - Item is ready and confirmed
- Members can see who added each item and who claimed it
- Permission-based deletion (item creator or group moderators/owner)

**Groups API Endpoints:**
- POST /api/groups/create - Create new group
- GET /api/groups/search - Search and discover groups
- GET /api/groups/my-groups - List user's groups
- GET /api/groups/:id - Get group details
- POST /api/groups/:id/join - Join group (with password if required)
- POST /api/groups/:id/leave - Leave group
- DELETE /api/groups/:id - Delete group (owner only)
- GET /api/groups/:id/members - Get group members
- GET /api/groups/:id/messages - Get group chat messages
- POST /api/groups/:id/messages - Send group message
- GET /api/groups/:id/gear-lists - Get gear lists
- POST /api/groups/:id/gear-lists - Create gear list
- GET /api/groups/:id/gear-lists/:listId/items - Get gear items
- POST /api/groups/:id/gear-lists/:listId/items - Add gear item
- PATCH /api/groups/:id/gear-lists/:listId/items/:itemId - Update item status
- DELETE /api/groups/:id/gear-lists/:listId/items/:itemId - Delete gear item

**Data Persistence:**
- All group data stored in PostgreSQL (permanent)
- Group banners stored in Cloudinary (permanent cloud storage)
- No ephemeral filesystem storage - fully resilient to server restarts

## Known Issues & Technical Debt

### ⚠️ Critical: Hybrid Mock/API Architecture

**Current State:**
The app uses a **mixed architecture** where some features use mock data from Zustand AppStore while others use real PostgreSQL API calls. This creates significant data consistency and synchronization issues.

**Problem Areas:**

1. **User Profiles & Follow System:**
   - UserProfileScreen now fetches from API (fixed)
   - Follow/unfollow functionality still uses Zustand mock store (not persisted to database)
   - Follower/following counts don't sync between mock store and database
   - No backend API endpoints exist for follow/unfollow operations
   - **Impact:** Follow button works as local toggle only - doesn't persist across sessions

2. **Social Feed (Posts):**
   - Posts are stored in mock Zustand store only
   - No API endpoints exist for creating/fetching posts
   - Post likes and comments are ephemeral (lost on app restart)
   - **Impact:** Feed content doesn't persist to database

3. **Race Joining/Completion:**
   - Users can "join" or "complete" races in UI
   - This data is stored in users.joined_races and users.completed_races arrays in database
   - But the UI still reads from mock AppStore data
   - **Impact:** Race participation doesn't sync properly between sessions

4. **Data Source Inconsistencies:**
   - Groups: ✅ Fully API-backed (PostgreSQL)
   - Races: ✅ Fully API-backed (PostgreSQL)
   - Users: ⚠️ Partially API-backed (profiles load from API, but follow/stats use mock)
   - Posts: ❌ Mock data only (not in database)
   - Messages: ✅ Fully API-backed (PostgreSQL)

### Required Before iOS/Android Production Builds

**Must Fix:**

1. **Implement Backend Follow/Unfollow API:**
   - Create POST /api/users/:userId/follow endpoint
   - Create DELETE /api/users/:userId/unfollow endpoint
   - Update follower/following arrays in database
   - Return updated follower counts
   - Update UserProfileScreen to use API instead of local toggle

2. **Implement Posts/Feed API:**
   - Create POST /api/posts endpoint (create post)
   - Create GET /api/posts/feed endpoint (get user's feed)
   - Create POST /api/posts/:postId/like endpoint
   - Create POST /api/posts/:postId/comment endpoint
   - Update FeedScreen to fetch from API instead of AppStore
   - Migrate post creation logic to API calls

3. **Race Participation API:**
   - Create POST /api/races/:raceId/join endpoint
   - Create POST /api/races/:raceId/complete endpoint
   - Update UI to call these endpoints instead of mock store
   - Ensure joined_races/completed_races arrays sync properly

4. **Remove or Consolidate AppStore:**
   - Decide whether to keep Zustand for client-side caching or remove entirely
   - If keeping: Use it only for caching API responses, not as source of truth
   - If removing: Replace all AppStore references with API calls
   - **Recommendation:** Keep Zustand for caching, but make API the source of truth

5. **Data Migration Strategy:**
   - Current test users in database may have empty followers/posts/etc.
   - Plan for seeding production database with realistic test data
   - Ensure all database fields are nullable or have proper defaults

### Database Schema Gaps

**Missing Tables/Features:**
- No table for race registrations (who joined which race)
- No table for race completions (separate from joins)
- No indexes on frequently queried fields (user searches, race filters)
- No soft delete support (deleted data is permanently lost)

### Testing Recommendations

**Before App Store Submission:**
1. Test all API endpoints with production-like data volume
2. Verify all features work without AppStore mock data
3. Test offline behavior and error handling
4. Verify data persists across app restarts
5. Test follow/unfollow flows end-to-end
6. Test post creation, likes, and comments with real users
7. Load test with 100+ races, 50+ users, 500+ posts

### Development Environment Notes

**Critical Configuration:**
- Replit requires tunnel mode: `npx expo start --tunnel` (not LAN)
- API URL configured in `app.json` under `extra.apiUrl` (takes precedence over .env)
- Backend runs on port 5000 (only non-firewalled port in Replit)
- PostgreSQL database is development-only (production requires separate setup)

**API Response Format Consistency:**
- Some endpoints return raw arrays: `[...]`
- Some endpoints return wrapped objects: `{ items: [...] }`
- Some endpoints use different field names: `role` vs `user_role`
- **Recommendation:** Standardize all API responses to `{ data: [...], meta: {} }` format

### Session & State Management Issues

**Current Problems:**
- User session stored in AsyncStorage (survives app restarts)
- But user profile data may be stale (doesn't refetch on app launch)
- No token refresh mechanism (JWT expires after 7 days)
- No logout on token expiry (user sees errors instead)

**Before Production:**
- Implement token refresh endpoint
- Add automatic logout on authentication errors
- Add "pull to refresh" on all screens that load user data
- Cache user data but revalidate on app foreground