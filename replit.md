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