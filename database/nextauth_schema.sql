-- This file contains the database schema for NextAuth.js with PostgreSQL
-- Run this in your PostgreSQL database to create the required tables for NextAuth

-- Your existing users table (already created)
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(100),
--   email VARCHAR(100) UNIQUE NOT NULL,
--   password TEXT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- NextAuth.js required tables
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE ("sessionToken")
);

CREATE TABLE IF NOT EXISTS users_nextauth (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  PRIMARY KEY (id),
  UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS IDX_account_userId ON accounts ("userId");
CREATE INDEX IF NOT EXISTS IDX_session_userId ON sessions ("userId");
CREATE INDEX IF NOT EXISTS IDX_users_email ON users_nextauth (email);
