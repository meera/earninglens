/**
 * Better Auth Database Schema
 *
 * All Better Auth tables are in the 'markethawkeye' schema
 * to keep them organized with the rest of the MarketHawk data.
 *
 * Tables created:
 * - user
 * - session
 * - account
 * - verification
 * - organization (from organization plugin)
 * - member (from organization plugin)
 * - invitation (from invitation plugin)
 */

import { varchar, timestamp, boolean, text, jsonb, pgSchema, integer, date } from 'drizzle-orm/pg-core';

// Use the markethawkeye schema (same as other MarketHawk tables)
const markethawkSchema = pgSchema('markethawkeye');

export const user = markethawkSchema.table('user', {
  id: varchar('id', { length: 255 }).primaryKey(),  // usr_john_gmail_com (custom via hook)
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: varchar('image', { length: 512 }),

  // Subscription fields managed by Better Auth Stripe plugin
  // (Better Auth will handle these automatically)

  // Daily View Tracking
  dailyViewCount: integer('dailyViewCount').default(0),
  lastViewDate: date('lastViewDate'),  // Track which day the count is for

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = markethawkSchema.table('session', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ipAddress', { length: 45 }),
  userAgent: varchar('userAgent', { length: 512 }),

  // Added by organization plugin
  activeOrganizationId: varchar('activeOrganizationId', { length: 255 }),

  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const account = markethawkSchema.table('account', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('userId', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: varchar('accountId', { length: 255 }).notNull(),
  providerId: varchar('providerId', { length: 50 }).notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = markethawkSchema.table('verification', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Organization plugin tables
export const organization = markethawkSchema.table('organization', {
  id: varchar('id', { length: 255 }).primaryKey(),  // org_acme_investment_a1b2
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  logo: varchar('logo', { length: 512 }),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const member = markethawkSchema.table('member', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organizationId', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  userId: varchar('userId', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull().default('member'),  // owner, admin, member
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const invitation = markethawkSchema.table('invitation', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organizationId', { length: 255 }).notNull().references(() => organization.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('member'),
  status: varchar('status', { length: 50 }).default('pending'),  // pending, accepted, expired
  expiresAt: timestamp('expiresAt').notNull(),
  inviterId: varchar('inviterId', { length: 255 }).notNull().references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Export types for TypeScript
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
