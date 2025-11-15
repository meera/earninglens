#!/bin/bash

# Migration script to move Better Auth tables to markethawkeye schema
# Usage: ./scripts/migrate-auth-to-markethawkeye.sh <database_url>
#
# Examples:
#   Local:  ./scripts/migrate-auth-to-markethawkeye.sh "$DATABASE_URL"
#   Neon:   ./scripts/migrate-auth-to-markethawkeye.sh "postgresql://..."

set -e  # Exit on error

if [ -z "$1" ]; then
  echo "Error: Database URL required"
  echo "Usage: $0 <database_url>"
  echo ""
  echo "Examples:"
  echo "  Local: $0 \"\$DATABASE_URL\""
  echo "  Neon:  $0 \"postgresql://user:pass@ep-twilight-leaf-a4dgbd70.us-east-2.aws.neon.tech/neondb\""
  exit 1
fi

DATABASE_URL="$1"

echo "🔍 Checking current Better Auth tables..."
psql "$DATABASE_URL" -c "\dt public.*" | grep -E "(user|session|account|verification|organization|member|invitation)" || echo "No tables in public schema"

echo ""
read -p "⚠️  This will DROP tables from public schema and recreate in markethawkeye. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Migration cancelled."
  exit 0
fi

echo ""
echo "📦 Step 1: Dropping Better Auth tables from public schema..."
psql "$DATABASE_URL" << 'SQL'
DROP TABLE IF EXISTS public.invitation CASCADE;
DROP TABLE IF EXISTS public.member CASCADE;
DROP TABLE IF EXISTS public.organization CASCADE;
DROP TABLE IF EXISTS public.session CASCADE;
DROP TABLE IF EXISTS public.account CASCADE;
DROP TABLE IF EXISTS public.verification CASCADE;
DROP TABLE IF EXISTS public.user CASCADE;
SQL

echo "✅ Dropped public tables"

echo ""
echo "📦 Step 2: Creating Better Auth tables in markethawkeye schema..."
psql "$DATABASE_URL" << 'SQL'
-- Create markethawkeye schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS markethawkeye;

-- User table
CREATE TABLE markethawkeye.user (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image VARCHAR(512),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session table
CREATE TABLE markethawkeye.session (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.user(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(512),
  "activeOrganizationId" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Account table
CREATE TABLE markethawkeye.account (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.user(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table
CREATE TABLE markethawkeye.verification (
  id VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization table
CREATE TABLE markethawkeye.organization (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  logo VARCHAR(512),
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member table
CREATE TABLE markethawkeye.member (
  id VARCHAR(255) PRIMARY KEY,
  "organizationId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.organization(id) ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.user(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Invitation table
CREATE TABLE markethawkeye.invitation (
  id VARCHAR(255) PRIMARY KEY,
  "organizationId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.organization(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  status VARCHAR(50) DEFAULT 'pending',
  "expiresAt" TIMESTAMP NOT NULL,
  "inviterId" VARCHAR(255) NOT NULL REFERENCES markethawkeye.user(id),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add foreign key for activeOrganizationId
ALTER TABLE markethawkeye.session
  ADD CONSTRAINT fk_session_activeOrganizationId
  FOREIGN KEY ("activeOrganizationId")
  REFERENCES markethawkeye.organization(id)
  ON DELETE SET NULL;
SQL

echo "✅ Created tables in markethawkeye schema"

echo ""
echo "📦 Step 3: Verifying migration..."
psql "$DATABASE_URL" -c "\dt markethawkeye.*" | grep -E "(user|session|account|verification|organization|member|invitation)"

echo ""
echo "✅ Migration complete! Better Auth tables are now in markethawkeye schema."
