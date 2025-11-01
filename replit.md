# Lusapp - Athletic Race Discovery & Social Platform

## Overview

Lusapp is a React Native mobile application built with Expo for athletes to discover endurance races, track participation, and connect with a community. It offers race discovery, calendar management, social feeds, and user profiles, targeting iOS primarily with Android support. The app features a modern UI with gradient designs, animations, and both light/dark mode support, and is ready for App Store and Google Play Store submission with full compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React Native (0.81.4) and Expo SDK (~54.0) for cross-platform development. Navigation is handled by React Navigation v7 (bottom tabs + native stack) with deep linking. State management utilizes Zustand v5.0.8 for global state and React Context for authentication, with AsyncStorage for persistent local data. A comprehensive design system supports theming (Light/Dark/Auto), semantic color tokens, and reusable components with spring-based animations.

### Data Architecture

The application uses a PostgreSQL database for persistent storage, accessed via an Express.js REST API server (port 5000). The database schema includes tables for `races`, `users`, `posts`, `conversations`, `messages`, `groups`, `group_members`, `group_messages`, `group_gear_lists`, and `group_gear_items`. Data models define structures for `User`, `Race`, and `Post`. A hybrid approach is used for data loading, with mock data in development and API in production.

### Authentication System

Firebase Authentication handles user authentication (email/password, verification, password reset) using the Firebase JS SDK. It employs a 3-tier flow (Guest, Unverified, Verified Navigators). A hybrid auth architecture syncs Firebase users with PostgreSQL via a `/api/auth/sync` endpoint, linking users by `firebase_uid`. Firebase ID tokens are used for API authentication, with client-side JWT verification. User sessions are managed via AuthContext and Firebase `onAuthStateChanged`, with persistence via AsyncStorage.

### Backend API System

An Express.js REST API provides endpoints for race CRUD operations, user authentication, and account deletion. It includes a CSV upload feature (`/api/races/csv-upload`) for bulk race import with duplicate detection. An admin web interface (`/admin`) allows manual race entry and CSV uploads, secured with HTTP Basic Authentication.

### Groups & Community Features

A new Groups system allows athletes to create and join sport-specific groups (public or password-protected). Functionality includes group management, a membership system with roles (Owner, Moderator, Member), real-time group chat, and gear lists for race preparation. 

**Gear Lists System:**
- **Personal Lists:** Private lists visible only to the owner (and group moderators for oversight). Any group member can add items (friends can help remind you), but only the owner can mark items as completed. Status flow: needed → completed (no claimed state). Perfect for tracking individual race gear needs where you want help from friends but control your own checklist.
- **Collaborative Lists:** Shared lists where all group members can contribute. Any member can add items, claim them, and complete them. Status flow: needed → claimed → completed. Ideal for team logistics where members coordinate who brings what.
- **Share Functionality:** Users can export and share gear lists via WhatsApp, WeChat, or other messaging apps. The share feature generates formatted text with checkboxes ([ ] needed, [~] claimed, [✓] completed) for easy sharing with non-app users.

All group data is stored in PostgreSQL with role-based access control ensuring privacy and security.

## External Dependencies

### Third-Party Libraries

- **Navigation & Routing:** `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `react-native-screens`, `react-native-safe-area-context`.
- **UI & Styling:** `expo-linear-gradient`, `react-native-calendars`, `expo-status-bar`.
- **State & Storage:** `zustand`, `@react-native-async-storage/async-storage`.
- **Backend:** `express`, `pg`, `cors`, `body-parser`, `multer`, `csv-parser`, `express-basic-auth`, `bcrypt`, `jsonwebtoken`.

### Expo Services

The project leverages Expo SDK v54.0.12 for its managed workflow and cross-platform API access. Local asset serving is used for icons and images, while Cloudinary provides permanent cloud storage for user avatars and group banners.