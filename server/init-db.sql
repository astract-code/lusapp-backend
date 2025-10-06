-- Lusapp Database Initialization Script
-- Run this after creating your PostgreSQL database on Render.com

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  continent VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  distance VARCHAR(50),
  description TEXT,
  participants INTEGER DEFAULT 0,
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);
CREATE INDEX IF NOT EXISTS idx_races_sport ON races(sport);
