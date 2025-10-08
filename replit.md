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
- Bottom tab navigation with Feed, Calendar, Discover, Profile sections.
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
- `OnboardingScreen`, `FeedScreen`, `CalendarScreen`, `DiscoverScreen`, `ProfileScreen`, `RaceDetailScreen`, `UserProfileScreen`.

### Data Architecture

**Database Backend:**
- PostgreSQL database for persistent storage.
- Express.js REST API server (port 5000) for race data.
- Protected admin routes using HTTP Basic Authentication.

**Database Schema:**
- **races table:** id, name, sport_category, sport_subtype, city, country, continent, date, distance, description, participants, created_at.
- **users table:** id, email, password_hash, profile fields (location, bio, avatar, favoriteSport, joined_races, completed_races, follower/following arrays).
- **posts table:** id, user_id, type, race_id, timestamp, liked_by (array of user IDs), comments.

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