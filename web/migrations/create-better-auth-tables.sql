-- Better Auth Tables Migration
-- Run this manually to create Better Auth tables
-- Database: markethawkeye schema

-- User table
CREATE TABLE IF NOT EXISTS "user" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "image" VARCHAR(512),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMP NOT NULL,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "ipAddress" VARCHAR(45),
  "userAgent" VARCHAR(512),
  "activeOrganizationId" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Account table (for OAuth providers)
CREATE TABLE IF NOT EXISTS "account" (
  "id" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "provider" VARCHAR(50) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Verification table (for email verification, password reset)
CREATE TABLE IF NOT EXISTS "verification" (
  "id" VARCHAR(255) PRIMARY KEY,
  "identifier" VARCHAR(255) NOT NULL,
  "value" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Organization table
CREATE TABLE IF NOT EXISTS "organization" (
  "id" VARCHAR(255) PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) UNIQUE,
  "logo" VARCHAR(512),
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Member table (organization members)
CREATE TABLE IF NOT EXISTS "member" (
  "id" VARCHAR(255) PRIMARY KEY,
  "organizationId" VARCHAR(255) NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" VARCHAR(255) NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" VARCHAR(50) NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("organizationId", "userId")
);

-- Invitation table (organization invitations)
CREATE TABLE IF NOT EXISTS "invitation" (
  "id" VARCHAR(255) PRIMARY KEY,
  "organizationId" VARCHAR(255) NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'member',
  "status" VARCHAR(50) DEFAULT 'pending',
  "expiresAt" TIMESTAMP NOT NULL,
  "inviterId" VARCHAR(255) NOT NULL REFERENCES "user"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_token" ON "session"("token");
CREATE INDEX IF NOT EXISTS "idx_account_userId" ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_member_organizationId" ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_member_userId" ON "member"("userId");
CREATE INDEX IF NOT EXISTS "idx_invitation_organizationId" ON "invitation"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_invitation_email" ON "invitation"("email");

-- Add foreign key for activeOrganizationId after organization table is created
ALTER TABLE "session"
  ADD CONSTRAINT "fk_session_activeOrganizationId"
  FOREIGN KEY ("activeOrganizationId")
  REFERENCES "organization"("id")
  ON DELETE SET NULL;

COMMENT ON TABLE "user" IS 'Better Auth - Users table';
COMMENT ON TABLE "session" IS 'Better Auth - Sessions table';
COMMENT ON TABLE "account" IS 'Better Auth - OAuth accounts table';
COMMENT ON TABLE "verification" IS 'Better Auth - Email verification and password reset tokens';
COMMENT ON TABLE "organization" IS 'Better Auth Organization Plugin - Organizations/teams';
COMMENT ON TABLE "member" IS 'Better Auth Organization Plugin - Organization members with roles';
COMMENT ON TABLE "invitation" IS 'Better Auth Organization Plugin - Organization invitations';
