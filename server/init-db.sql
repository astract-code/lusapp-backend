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
  password_hash VARCHAR(255) NOT NULL,
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

-- Add new columns to races table if upgrading from old schema
ALTER TABLE races ADD COLUMN IF NOT EXISTS sport_category VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS sport_subtype VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS start_time TIME;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_sport ON races(sport);
CREATE INDEX IF NOT EXISTS idx_races_category ON races(sport_category);

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
