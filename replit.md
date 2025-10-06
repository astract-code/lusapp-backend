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
- All screens, components, and navigation fully functional and tested
- Expo server running successfully, ready for testing in Expo Go

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

**Mock Data Structure:**
Currently uses local JSON mock data simulating:
- Users with profiles, stats, and race associations
- Races with details, locations, dates, and participant counts
- Posts representing social activities (signups, completions)

**Data Models:**
- **User:** id, name, email, location, bio, stats, joined/completed races, avatar
- **Race:** id, name, sport, location, date, distance, description, participants
- **Post:** id, userId, type (signup/completion), raceId, timestamp, likedBy (array of user IDs), comments

**State Management Pattern:**
- Zustand store provides centralized access to races, posts, users
- Actions for registration, likes, comments, race management
- Real-time UI updates through reactive subscriptions

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

### Data Import System

**CSV Import Functionality:**
- PapaParse library for CSV parsing
- URL-based CSV fetching and import
- Flexible column mapping supporting multiple naming conventions
- Dynamic race data addition to global state

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
- `papaparse` v5.5.3 - CSV parsing

### Expo Services

**Core Expo SDK:**
- Expo v54.0.12 for managed workflow
- Cross-platform API access
- Development and deployment tooling

**Asset Management:**
- Local asset serving for icons and images
- External avatar URLs via pravatar.cc (mock data)

### Future Backend Integration Points

**Designed for Extension:**
- Mock data structure mirrors typical REST/GraphQL API responses
- Store actions prepared for async API calls
- Authentication context ready for real auth providers
- CSV import demonstrates external data integration pattern

**Potential Integrations:**
- Real authentication (Firebase, Auth0, Supabase)
- Database backend (Postgres, MongoDB)
- Social features (notifications, messaging)
- Payment processing for race registrations
- Mapping services for race routes