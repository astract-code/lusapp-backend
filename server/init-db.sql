-- Lusapp Database Initialization Script
-- Run this after creating your PostgreSQL database on Render.com

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  sport_category VARCHAR(100),
  sport_subtype VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  continent VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  distance VARCHAR(50),
  description TEXT,
  participants INTEGER DEFAULT 0,
  start_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  firebase_uid VARCHAR(255) UNIQUE,
  location VARCHAR(255) DEFAULT 'Unknown',
  bio TEXT DEFAULT '',
  favorite_sport VARCHAR(100) DEFAULT '',
  avatar VARCHAR(255) DEFAULT '',
  total_races INTEGER DEFAULT 0,
  joined_races TEXT[] DEFAULT '{}',
  completed_races TEXT[] DEFAULT '{}',
  following TEXT[] DEFAULT '{}',
  followers TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns if upgrading from old schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS following TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;

-- Add new columns to races table if upgrading from old schema
ALTER TABLE races ADD COLUMN IF NOT EXISTS sport_category VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS sport_subtype VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE races ADD COLUMN IF NOT EXISTS registered_users TEXT[] DEFAULT '{}';

-- Add approval workflow columns for race moderation
ALTER TABLE races ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE races ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE races ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE races ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_sport ON races(sport);
CREATE INDEX IF NOT EXISTS idx_races_category ON races(sport_category);

-- Create posts table for social feed
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('signup', 'completion', 'general', 'race_created')),
  race_id INTEGER REFERENCES races(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  liked_by TEXT[] DEFAULT '{}',
  comments TEXT DEFAULT '[]'
);

-- Create index for posts performance
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_posts_race ON posts(race_id);

-- Create conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user1_id, user2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for messaging performance
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport_type VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100),
  description TEXT,
  password_hash VARCHAR(255),
  banner_url VARCHAR(500),
  created_by INTEGER NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add race_id column if it doesn't exist (for existing databases)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS race_id INTEGER REFERENCES races(id) ON DELETE CASCADE;

-- Add unique constraint on race_id to prevent duplicate race groups
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_race_id ON groups(race_id) WHERE race_id IS NOT NULL;

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group_message_reads table for read receipts
CREATE TABLE IF NOT EXISTS group_message_reads (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Create group_gear_lists table for race preparation lists
CREATE TABLE IF NOT EXISTS group_gear_lists (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  race_id INTEGER REFERENCES races(id),
  title VARCHAR(255) NOT NULL,
  visibility VARCHAR(20) DEFAULT 'collaborative' CHECK (visibility IN ('collaborative', 'personal')),
  owner_id INTEGER REFERENCES users(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add visibility and owner_id columns if upgrading from old schema
ALTER TABLE group_gear_lists ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'collaborative';
ALTER TABLE group_gear_lists ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- Create group_gear_items table for items in gear lists
CREATE TABLE IF NOT EXISTS group_gear_items (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL REFERENCES group_gear_lists(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  added_by INTEGER NOT NULL REFERENCES users(id),
  claimed_by INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'needed' CHECK (status IN ('needed', 'claimed', 'completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for groups performance
CREATE INDEX IF NOT EXISTS idx_groups_sport ON groups(sport_type);
CREATE INDEX IF NOT EXISTS idx_groups_city ON groups(city);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_search ON groups(LOWER(name));

-- Create indexes for group_members performance
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(group_id, role);

-- Create indexes for group_messages performance
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender ON group_messages(sender_id);

-- Create indexes for group_gear_lists performance
CREATE INDEX IF NOT EXISTS idx_group_gear_lists_group ON group_gear_lists(group_id);
CREATE INDEX IF NOT EXISTS idx_group_gear_lists_race ON group_gear_lists(race_id);

-- Create indexes for group_gear_items performance
CREATE INDEX IF NOT EXISTS idx_group_gear_items_list ON group_gear_items(list_id);
CREATE INDEX IF NOT EXISTS idx_group_gear_items_status ON group_gear_items(status);
