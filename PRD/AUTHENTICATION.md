# AUTHENTICATION.md

**Last Updated:** 2025-11-14
**Status:** Implementation Ready
**Owner:** MarketHawk Platform Team

---

## Table of Contents

1. [Overview](#overview)
2. [Design Decisions](#design-decisions)
3. [Technology Stack](#technology-stack)
4. [Authentication Methods](#authentication-methods)
5. [User ID Strategy](#user-id-strategy)
6. [Subscription Tiers](#subscription-tiers)
7. [Team Subscription Model](#team-subscription-model)
8. [Server Actions Architecture](#server-actions-architecture)
9. [Database Schema](#database-schema)
10. [Better Auth Configuration](#better-auth-configuration)
11. [Authorization & Access Control](#authorization--access-control)
12. [Stripe Webhook Handling](#stripe-webhook-handling)
13. [Email Templates](#email-templates)
14. [Code Examples](#code-examples)
15. [Testing Strategy](#testing-strategy)
16. [Security Best Practices](#security-best-practices)
17. [Related Documentation](#related-documentation)

---

## Overview

MarketHawk uses **Better Auth** (not NextAuth) with Google OAuth and email/password authentication. The platform supports:

- **Individual subscriptions** (Pro $29/month) for personal use
- **Team subscriptions** (Team $99/month) for organizations with up to 10 members
- **Dual subscriptions** - Users can have BOTH personal Pro AND team memberships
- **Free organizations** - Users can create free orgs with limited features

**Core Principles:**

1. **Frictionless authentication** - Google One Tap for one-click sign-in
2. **Human-readable IDs** - Email-derived user IDs (`usr_john_gmail_com`)
3. **Server Actions only** - NO API routes (Next.js Server Actions pattern)
4. **Better Auth plugins** - Leverage Stripe + Organization plugins (NOT manual integration)
5. **Greenfield approach** - No legacy code, modern patterns from the start

---

## Design Decisions

### Key Decisions (Locked In)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Owner leaves org** | Auto-transfer billing to oldest admin | Seamless continuity, prevents org disruption |
| **Seat limit reached** | Hard block with upgrade prompt | Clean boundary, clear call to action |
| **Dual subscriptions** | Allow personal Pro + Team membership | Maximizes revenue, flexibility for users |
| **Free organizations** | Allowed with limited features | Lower barrier to entry, good for trials |
| **Trial strategy** | No free trial (free tier IS the trial) | 50% video access is sufficient trial |
| **Video enforcement** | Client-side only | Pragmatic, most users won't bypass |
| **Annual pricing** | Not in MVP (monthly only) | Simplify initial launch |

---

## Technology Stack

**Authentication:**
- [Better Auth](https://www.better-auth.com/) (NOT NextAuth)
- Better Auth Stripe Plugin (automatic subscription management)
- Better Auth Organization Plugin (team management)

**Frontend:**
- Next.js 14+ (App Router)
- React Server Components
- Next.js Server Actions (NO API routes)

**Backend:**
- PostgreSQL (local: 192.168.86.250:54322, prod: Neon)
- Drizzle ORM with `pgSchema('markethawkeye')`
- Stripe for payments

**Email:**
- Resend for transactional emails
- Email templates for invitations, billing transfers

---

## Authentication Methods

### 1. Google OAuth (Primary Method)

**Implementation: Google One Tap**

Google One Tap provides the most frictionless authentication experience:

- **One-click sign-in** - No redirect, no forms
- **Auto-sign-in** - Returning users authenticated automatically
- **Contextual prompts** - Appears after 3s scroll or at paywall triggers
- **Non-intrusive** - `cancel_on_tap_outside: false` to reduce annoyance

**User Flow:**

```
1. User visits markethawkeye.com
2. Google One Tap popup appears (bottom right)
3. User clicks "Continue as [Name]"
4. Instantly signed in, no page reload
5. Subsequent visits: auto-sign-in (seamless)
```

**Configuration:**

```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
}
```

**Frontend Component:**

```typescript
// components/auth/GoogleOneTap.tsx
window.google?.accounts.id.initialize({
  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  callback: async (response) => {
    await authClient.signIn.social({
      provider: 'google',
      credential: response.credential,
    });
  },
  cancel_on_tap_outside: false,
});

window.google?.accounts.id.prompt();
```

### 2. Email/Password (Secondary Method)

**Fallback for users without Google accounts**

- Email verification **required** (prevents spam accounts)
- Password reset flow (forgot password emails)
- Welcome email on signup

**Configuration:**

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
}
```

**Sign Up Flow:**

```
1. User enters email + password
2. Verification email sent (with magic link)
3. User clicks link in email
4. Email verified → account activated
5. Welcome email sent
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase, one lowercase, one number
- Enforced by Better Auth built-in validation

---

## User ID Strategy

### Email-Derived User IDs (Primary Pattern)

**Pattern:** `usr_{email_normalized}`

**Benefits:**
- Human-readable and predictable
- No UUID lookup needed for debugging
- Collision-free (email is unique)
- Easy to trace in logs

**Implementation:**

```typescript
function generateUserId(email: string): string {
  return `usr_${email.replace('@', '_').replace(/\./g, '_')}`;
}

// Examples:
generateUserId('john@gmail.com')        // usr_john_gmail_com
generateUserId('sarah.doe@acme.co.uk')  // usr_sarah_doe_acme_co_uk
```

**Database Hook:**

```typescript
hooks: {
  user: {
    create: {
      before: async (user) => {
        const userId = generateUserId(user.email);
        return { data: { ...user, id: userId } };
      },
    },
  },
}
```

### ULID for Time-Sorted IDs

**Pattern:** `{prefix}_{ulid}`

**Use Cases:**
- Video processing jobs: `job_01ARZ3NDEKTSV4RRFFQ69G5FAV`
- Watch history: `watch_01JCXZ2K9N3QRST8VWXY1A2B3C`
- Uploaded videos: `vid_01JCXZ...`

**Benefits:**
- Time-sortable (lexicographically)
- Globally unique (128-bit)
- URL-safe
- Monotonically increasing within same millisecond

**Implementation:**

```typescript
import { ulid } from 'ulid';

const jobId = `job_${ulid()}`;  // job_01ARZ3NDEKTSV4RRFFQ69G5FAV
const watchId = `watch_${ulid()}`;
```

### Random Suffix for Organizations

**Pattern:** `org_{slug}_{random4}`

**Use Cases:**
- Organizations: `org_acme_investment_a1b2`
- Workspaces: `wsp_marketing_team_x7k9`

**Benefits:**
- Human-readable base (slug from name)
- Collision-free (4-char random suffix)
- Easy to recognize in URLs

**Implementation:**

```typescript
function generateOrgId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `org_${slug}_${suffix}`;
}

// Examples:
generateOrgId('Acme Investment Firm')  // org_acme_investment_firm_a1b2
generateOrgId('Marketing Team')        // org_marketing_team_x7k9
```

### ID Prefix Convention

| Prefix | Entity | Pattern | Example |
|--------|--------|---------|---------|
| `usr_` | Users | Email-derived | `usr_john_gmail_com` |
| `org_` | Organizations | Slug + random | `org_acme_investment_a1b2` |
| `job_` | Processing jobs | ULID | `job_01ARZ3NDEKTSV4RRFFQ69G5FAV` |
| `vid_` | Videos | ULID | `vid_01JCXZ2K9N3QRST8VWXY1A2B3C` |
| `watch_` | Watch history | ULID | `watch_01JCXZ...` |
| `inv_` | Invitations | ULID | `inv_01JCXZ...` |

---

## Subscription Tiers

### FREE TIER (Acquisition)

**Target:** Casual users, trial users, content discoverers

**Features:**
- ✅ Browse all 1,000+ earnings call videos
- ✅ Search by company, ticker, quarter
- ✅ Watch **50% of each video** (first half only)
- ✅ View company profiles and basic data
- ✅ Static chart previews (no interaction)
- ✅ Access to earnings calendar

**Limitations:**
- ❌ Cannot watch second half of videos (paused at 50%)
- ❌ Cannot interact with charts (zoom, filter, hover)
- ❌ Cannot download transcripts
- ❌ Cannot access full quarterly reports (summary only)
- ❌ No email alerts for earnings dates
- ❌ No API access

**Enforcement:**
- Client-side video player limit (pragmatic approach)
- Blur overlay on charts with upgrade prompt
- Download buttons trigger paywall modal

**Goal:** Get users hooked on quality, then convert to paid

---

### PRO TIER - $29/month (Individual Monetization)

**Target:** Individual investors, day traders, finance enthusiasts, analysts (personal use)

**Stripe Price ID:** `process.env.STRIPE_PRO_MONTHLY_PRICE_ID`

**Features:**
- ✅ **Unlimited video access** - Watch full earnings calls (no 50% limit)
- ✅ **Interactive charts** - Zoom, filter, hover for insights
- ✅ **Download transcripts** - PDF, JSON, VTT formats
- ✅ **Email alerts** - Notified 1 day before earnings dates
- ✅ **Priority support** - Faster response times

**Subscription Type:** Personal (referenceId: `user.id`)

**Value Proposition:** "Watch 1,000+ full earnings calls for $29/month"

**Upgrade Trigger Points:**
1. Video hits 50% progress → paywall overlay
2. User clicks on chart → "Interactive charts are a Pro feature"
3. User clicks "Download Transcript" → upgrade modal
4. User favorites company → "Get email alerts with Pro"

---

### TEAM TIER - $99/month (B2B Revenue)

**Target:** Investment firms, hedge funds, corporate finance teams, financial advisors

**Stripe Price ID:** `process.env.STRIPE_TEAM_MONTHLY_PRICE_ID`

**Features:**
- ✅ **All Pro features** (unlimited videos, interactive charts, downloads, alerts, support)
- ✅ **Up to 10 team members** - Shared organization account
- ✅ **Shared watchlists** - Collaborate on companies to track
- ✅ **Custom alerts** - Set thresholds for metrics (e.g., "notify when EPS > $2.00")
- ✅ **API access** - Programmatic access to transcripts and financial data
- ✅ **Billing management** - Owner controls subscription, members get access

**Subscription Type:** Organization (referenceId: `organization.id`)

**Seat Limit:** 10 members (hard block on 11th member)

**Value Proposition:** "$9.90/user for team collaboration + API access"

**Billing Model:**
- One subscription per organization
- Organization owner pays ($99/month)
- All members inherit Team benefits
- Owner can transfer billing to another admin

---

### ENTERPRISE TIER - Custom Pricing (High-Touch Sales)

**Target:** Large firms, white-label partners, institutional investors

**Features:**
- ✅ All Team features
- ✅ Unlimited seats
- ✅ Dedicated support
- ✅ Custom integrations (Bloomberg Terminal, internal tools)
- ✅ White-label options
- ✅ SLA guarantees

**Sales Process:**
1. User clicks "Contact Us" on pricing page
2. Form submitted → saved to `enterprise_leads` table
3. Email sent to sales team
4. Qualification call scheduled
5. Custom quote provided (typically $200-2000/month)
6. Manual contract and Stripe invoice

**Not in MVP** - Focus on self-serve Pro and Team tiers first

---

## Team Subscription Model

### How Team Billing Works

**Scenario:**

```
Organization: "Acme Investment Firm" (org_acme_investment_a1b2)

Members:
  ├─ john@acme.com (Owner, pays $99/month)
  ├─ sarah@acme.com (Admin, full access, no billing)
  ├─ mike@acme.com (Member, limited access)
  └─ lisa@acme.com (Member, limited access)

Subscription:
  - Plan: Team ($99/month)
  - Seats: 10
  - Reference ID: org_acme_investment_a1b2
  - Billing owner: john@acme.com
  - Status: Active
```

**All 4 members inherit Team subscription benefits** when they set `activeOrganizationId` to `org_acme_investment_a1b2` in their session.

---

### Dual Subscriptions (Personal + Team)

**Users can have BOTH personal Pro AND team memberships:**

```
User: sarah@acme.com (usr_sarah_acme_com)

Personal Subscription:
  - Plan: Pro ($29/month)
  - Reference ID: usr_sarah_acme_com
  - Use case: Personal investment research

Organization Membership:
  - Organization: "Acme Investment Firm"
  - Role: Admin
  - Subscription: Team ($99/month, paid by owner)
  - Use case: Work-related research

Total cost for sarah: $29/month (Team is paid by org owner)
Total benefit: Pro features + Team features (best of both)
```

**Access Logic:**

```typescript
// User has access if they have EITHER Pro personal OR Team org
const canWatchFullVideos = hasProPersonal || hasTeamOrg;
```

---

### Free Organizations

**Free users can create organizations without paying:**

```
Organization: "Student Investment Club" (org_student_club_x7k9)

Members:
  ├─ student1@university.edu (Owner, free tier)
  ├─ student2@university.edu (Member, free tier)
  └─ student3@university.edu (Member, free tier)

Subscription: None (free tier)

Access:
  - All members have free tier limits (50% video, no interactivity)
  - Can collaborate on watchlists (free feature)
  - No shared Team benefits (no subscription)
```

**When to upgrade:**

- Owner wants all members to have full video access
- Team needs interactive charts
- Organization grows beyond 10 members (requires custom pricing)

---

### Seat Limit Enforcement

**Hard block at 10 members:**

```
Scenario: Team subscription with 10/10 seats filled

Action: Owner tries to invite 11th member

Result:
  ❌ Invitation fails with error:
  "Seat limit reached. Your Team plan supports up to 10 members.
   Upgrade to add more seats."

UI Response:
  - Show error message
  - Display "Upgrade Seats" button
  - Link to billing portal or contact sales
```

**Implementation:**

```typescript
// Better Auth organization hook
hooks: {
  beforeAddMember: async ({ organization }) => {
    const subscription = await getOrgSubscription(organization.id);
    const memberCount = await getOrgMemberCount(organization.id);

    if (subscription?.seats && memberCount >= subscription.seats) {
      throw new Error('Seat limit reached. Upgrade to add more seats.');
    }
  },
}
```

---

### Billing Transfer When Owner Leaves

**Auto-transfer to oldest admin:**

```
Scenario: Owner (john@acme.com) leaves organization

Step 1: Find oldest admin
  - Query all admins in organization
  - Sort by createdAt (ascending)
  - Select first admin → sarah@acme.com

Step 2: Promote admin to owner
  - Update sarah's role: admin → owner
  - Sarah is now billing owner

Step 3: Notify new owner
  - Send email to sarah:
    "You are now the billing owner of Acme Investment Firm.
     The subscription will continue on your payment method."

Step 4: Update Stripe customer
  - Update Stripe subscription customer to sarah's Stripe ID
  - Next invoice will charge sarah's payment method
```

**Implementation:**

```typescript
async function transferBillingToOldestAdmin(orgId: string) {
  const admins = await db.query.member.findMany({
    where: (member, { and, eq }) => and(
      eq(member.organizationId, orgId),
      eq(member.role, 'admin')
    ),
    orderBy: (member, { asc }) => [asc(member.createdAt)],
    limit: 1,
  });

  if (admins.length === 0) {
    throw new Error('No admin available to transfer billing');
  }

  // Promote to owner
  await db
    .update(memberTable)
    .set({ role: 'owner' })
    .where(eq(memberTable.id, admins[0].id));

  // Send notification email
  await sendBillingTransferEmail(admins[0].userId, orgId);
}
```

**Edge Case:** No admins available

- If no admins exist, throw error: "Cannot remove last owner without an admin"
- Owner must promote at least one member to admin before leaving

---

## Server Actions Architecture

**NO API routes** - All backend logic uses Next.js Server Actions with `'use server'` directive.

### Pattern 1: Session Handling

**Every server action must authenticate the user:**

```typescript
'use server';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function myServerAction() {
  // Get session from headers
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Check if authenticated
  if (!session?.user) {
    return { error: "Not authenticated" };
  }

  // Access user data
  const userId = session.user.id;
  const activeOrgId = session.activeOrganizationId;

  // ... your logic here
}
```

### Pattern 2: Database Operations with Drizzle

**Use Drizzle ORM for type-safe database access:**

```typescript
'use server';

import { db } from "@/lib/db";
import { usersTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateUserPreferences(preferences: any) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  try {
    await db
      .update(usersTable)
      .set({ preferences })
      .where(eq(usersTable.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error('Update failed:', error);
    return { error: 'Failed to update preferences' };
  }
}
```

### Pattern 3: Structured Error Handling

**Return structured responses (never throw to client):**

```typescript
'use server';

export async function upgradeToProPersonal() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "Not authenticated" };
  }

  try {
    const result = await authClient.subscription.upgrade({
      plan: "pro",
      referenceId: session.user.id,
    });

    return {
      success: true,
      checkoutUrl: result.checkoutUrl,
      data: result
    };
  } catch (error) {
    console.error('Upgrade failed:', error);
    return {
      error: 'Failed to create checkout session',
      details: error.message
    };
  }
}
```

**Client-side handling:**

```typescript
const result = await upgradeToProPersonal();

if (result.error) {
  toast.error(result.error);
} else {
  window.location.href = result.checkoutUrl;
}
```

### Pattern 4: Authorization Checks

**Verify user permissions before actions:**

```typescript
'use server';

export async function inviteMember(orgId: string, email: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  // Check if user is owner or admin of this organization
  const member = await db.query.member.findFirst({
    where: (member, { and, eq }) => and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, orgId)
    )
  });

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: "Unauthorized. Only owners and admins can invite members." };
  }

  // ... proceed with invitation
}
```

---

## Database Schema

**Namespace:** `markethawkeye` (using `pgSchema('markethawkeye')`)

### Core Tables (Better Auth Managed)

Better Auth automatically creates these tables via `npx @better-auth/cli migrate`:

#### `user` Table

```typescript
export const usersTable = pgTable("user", {
  id: varchar('id').primaryKey(),  // usr_john_gmail_com
  name: varchar('name'),
  email: varchar('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: varchar('image'),

  // Better Auth fields
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Custom extensions
  stripeCustomerId: varchar('stripe_customer_id'),
  personalSubscriptionTier: varchar('personal_subscription_tier').default('free'),  // free, pro
  preferences: jsonb('preferences').default({}),
});
```

**Custom Fields:**
- `personalSubscriptionTier` - Cached from Stripe (free, pro)
- `preferences` - User settings (JSONB for flexibility)

**Example preferences:**

```json
{
  "emailNotifications": true,
  "watchlistAlerts": true,
  "theme": "dark",
  "defaultView": "grid"
}
```

#### `session` Table

```typescript
export const sessionTable = pgTable("session", {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').references(() => usersTable.id),
  token: varchar('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),

  // Organization plugin adds:
  activeOrganizationId: varchar('active_organization_id').references(() => organizationTable.id),

  createdAt: timestamp('created_at').defaultNow(),
});
```

**Key Field:**
- `activeOrganizationId` - Tracks which org user is currently using (for multi-org users)

#### `organization` Table

```typescript
export const organizationTable = pgTable("organization", {
  id: varchar('id').primaryKey(),  // org_acme_investment_a1b2
  name: varchar('name').notNull(),
  slug: varchar('slug').unique(),
  logo: varchar('logo'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),

  // Custom extensions
  stripeSubscriptionId: varchar('stripe_subscription_id'),
  subscriptionTier: varchar('subscription_tier').default('free'),  // free, team
  subscriptionSeats: integer('subscription_seats').default(10),
  metadata: jsonb('metadata').default({}),
});
```

**Custom Fields:**
- `subscriptionTier` - Cached from Stripe (free, team)
- `subscriptionSeats` - Seat limit from Stripe subscription
- `metadata` - Flexible JSONB for future features

#### `member` Table

```typescript
export const memberTable = pgTable("member", {
  id: varchar('id').primaryKey(),  // mem_{ulid}
  organizationId: varchar('organization_id').references(() => organizationTable.id),
  userId: varchar('user_id').references(() => usersTable.id),
  role: varchar('role').notNull().default('member'),  // owner, admin, member

  createdAt: timestamp('created_at').defaultNow(),
});
```

**Roles:**
- `owner` - Billing owner, full permissions, can delete org
- `admin` - Full permissions except billing, can invite members
- `member` - Read-only access, cannot invite or manage

#### `invitation` Table

```typescript
export const invitationTable = pgTable("invitation", {
  id: varchar('id').primaryKey(),  // inv_{ulid}
  organizationId: varchar('organization_id').references(() => organizationTable.id),
  email: varchar('email').notNull(),
  role: varchar('role').default('member'),
  status: varchar('status').default('pending'),  // pending, accepted, expired

  invitedBy: varchar('invited_by').references(() => usersTable.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

### Custom Tables (MarketHawk Specific)

#### `watch_history` Table

Tracks user video watching progress:

```typescript
export const watchHistoryTable = pgTable("watch_history", {
  id: varchar('id').primaryKey(),  // watch_{ulid}
  userId: varchar('user_id').references(() => usersTable.id),
  videoId: varchar('video_id').notNull(),  // Reference to video (e.g., job ID)

  progressPercent: integer('progress_percent').default(0),  // 0-100
  durationWatched: integer('duration_watched').default(0),  // seconds

  lastWatchedAt: timestamp('last_watched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Composite unique constraint: one watch history per user per video
// But user can update progress, so upsert logic
```

**Usage:**

```typescript
// Track when user watches video
await db.insert(watchHistoryTable).values({
  id: `watch_${ulid()}`,
  userId: session.user.id,
  videoId: 'BIP_Q3_2025',
  progressPercent: 45,
  durationWatched: 320,
});

// Check if user has watched before (for personalization)
const history = await db.query.watchHistory.findFirst({
  where: (watch, { and, eq }) => and(
    eq(watch.userId, userId),
    eq(watch.videoId, videoId)
  )
});
```

#### `watchlist` Table (Team Feature)

Shared watchlists for organizations:

```typescript
export const watchlistTable = pgTable("watchlist", {
  id: varchar('id').primaryKey(),  // wl_{ulid}
  name: varchar('name').notNull(),

  // Can belong to user OR organization
  userId: varchar('user_id').references(() => usersTable.id),
  organizationId: varchar('organization_id').references(() => organizationTable.id),

  companies: jsonb('companies').default([]),  // Array of company tickers

  createdBy: varchar('created_by').references(() => usersTable.id),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Example:**

```json
{
  "id": "wl_01JCXZ2K9N3QRST8VWXY1A2B3C",
  "name": "Tech Giants to Watch",
  "organizationId": "org_acme_investment_a1b2",
  "companies": ["AAPL", "MSFT", "NVDA", "GOOGL"],
  "createdBy": "usr_john_acme_com"
}
```

---

### Database Migration

**Run Better Auth migration first:**

```bash
npx @better-auth/cli migrate
```

This creates: `user`, `session`, `organization`, `member`, `invitation`, `account`, `verification` tables.

**Then run custom Drizzle migrations:**

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Better Auth Configuration

### File: `web/lib/auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, stripe } from "better-auth/plugins";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { Resend } from "resend";

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      // Better Auth will use these table names
      user: "user",
      session: "session",
      account: "account",
      verification: "verification",
    },
  }),

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: 'MarketHawk <noreply@markethawkeye.com>',
        to: user.email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${url}">here</a> to reset your password.</p>`,
      });
    },
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Base URL for redirects
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,

  // Database hooks
  hooks: {
    user: {
      create: {
        // Generate email-derived ID before creation
        before: async (user) => {
          const userId = `usr_${user.email.replace('@', '_').replace(/\./g, '_')}`;
          return { data: { ...user, id: userId } };
        },

        // Send welcome email after creation
        after: async (user) => {
          await resend.emails.send({
            from: 'MarketHawk <noreply@markethawkeye.com>',
            to: user.email,
            subject: 'Welcome to MarketHawk',
            html: welcomeEmailTemplate(user),
          });
        },
      },
    },
  },

  plugins: [
    // Organization plugin for team management
    organization({
      async sendInvitationEmail(data) {
        await resend.emails.send({
          from: 'MarketHawk <noreply@markethawkeye.com>',
          to: data.email,
          subject: `Join ${data.organization.name} on MarketHawk`,
          html: invitationEmailTemplate(data),
        });
      },

      hooks: {
        // Enforce seat limits before adding member
        beforeAddMember: async ({ organization }) => {
          const subscription = await getOrgSubscription(organization.id);
          const memberCount = await getOrgMemberCount(organization.id);

          if (subscription?.seats && memberCount >= subscription.seats) {
            throw new Error('Seat limit reached. Upgrade to add more seats.');
          }
        },

        // Auto-transfer billing when owner leaves
        beforeRemoveMember: async ({ member, organization }) => {
          if (member.role === 'owner') {
            await transferBillingToOldestAdmin(organization.id, member.userId);
          }
        },
      },
    }),

    // Stripe plugin for subscriptions
    stripe({
      stripeClient,
      createCustomerOnSignUp: true,  // Auto-create Stripe customer

      products: {
        pro: {
          priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
          metadata: { plan: 'pro', billing_period: 'monthly' },
        },
        proYearly: {
          priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
          metadata: { plan: 'pro', billing_period: 'yearly' },
        },
        team: {
          priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
          metadata: { plan: 'team', billing_period: 'monthly' },
        },
        teamYearly: {
          priceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
          metadata: { plan: 'team', billing_period: 'yearly' },
        },
      },

      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      successUrl: '/billing?success=true',
      cancelUrl: '/pricing?canceled=true',

      // Authorization: who can manage subscriptions
      authorizeReference: async ({ user, referenceId, action }) => {
        // Personal subscriptions: user can only manage their own
        if (referenceId.startsWith('usr_')) {
          return referenceId === user.id;
        }

        // Organization subscriptions: only owners can manage billing
        if (referenceId.startsWith('org_')) {
          const member = await getMemberRole(user.id, referenceId);

          // Billing actions: only owner
          if (['upgrade', 'cancel', 'restore'].includes(action)) {
            return member?.role === 'owner';
          }

          // View subscription: any member
          if (action === 'view') {
            return !!member;
          }
        }

        return false;
      },
    }),
  ],
});

// Helper functions
async function getOrgSubscription(orgId: string) {
  const org = await db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.id, orgId),
  });
  return {
    tier: org?.subscriptionTier,
    seats: org?.subscriptionSeats,
  };
}

async function getOrgMemberCount(orgId: string) {
  const members = await db.query.member.findMany({
    where: (member, { eq }) => eq(member.organizationId, orgId),
  });
  return members.length;
}

async function getMemberRole(userId: string, orgId: string) {
  return await db.query.member.findFirst({
    where: (member, { and, eq }) => and(
      eq(member.userId, userId),
      eq(member.organizationId, orgId)
    ),
  });
}

async function transferBillingToOldestAdmin(orgId: string, leavingOwnerId: string) {
  // Find oldest admin
  const admins = await db.query.member.findMany({
    where: (member, { and, eq }) => and(
      eq(member.organizationId, orgId),
      eq(member.role, 'admin')
    ),
    orderBy: (member, { asc }) => [asc(member.createdAt)],
    limit: 1,
  });

  if (admins.length === 0) {
    throw new Error('Cannot remove last owner without an admin. Promote a member to admin first.');
  }

  // Promote oldest admin to owner
  await db
    .update(memberTable)
    .set({ role: 'owner' })
    .where(eq(memberTable.id, admins[0].id));

  // Send notification email
  await resend.emails.send({
    from: 'MarketHawk <noreply@markethawkeye.com>',
    to: admins[0].email,
    subject: 'You are now the billing owner',
    html: billingTransferEmailTemplate({ admin: admins[0], orgId }),
  });
}

function welcomeEmailTemplate(user: any) {
  return `
    <h1>Welcome to MarketHawk, ${user.name}!</h1>
    <p>Start watching earnings calls from 1,000+ companies.</p>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}">Explore Videos</a>
  `;
}

function invitationEmailTemplate(data: any) {
  return `
    <h1>You've been invited to join ${data.organization.name}</h1>
    <p>${data.invitedBy.name} invited you to collaborate on MarketHawk.</p>
    <a href="${data.invitationUrl}">Accept Invitation</a>
  `;
}

function billingTransferEmailTemplate(data: any) {
  return `
    <h1>You are now the billing owner</h1>
    <p>The previous owner left the organization. As the oldest admin,
       you've been promoted to owner and will now manage billing.</p>
    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/organizations/${data.orgId}/settings">
      Manage Billing
    </a>
  `;
}
```

---

### File: `web/lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { organizationClient, stripeClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
  plugins: [
    organizationClient(),  // Adds organization methods
    stripeClient(),        // Adds subscription methods
  ],
});

// Export hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  organization,
  subscription,
} = authClient;
```

**Usage in components:**

```typescript
import { useSession, signOut } from '@/lib/auth-client';

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) return <Skeleton />;

  if (!session) return <SignInButton />;

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

---

## Authorization & Access Control

### Access Tiers

**3-tier access model:**

1. **Free Tier** - No subscription (default)
2. **Pro Tier** - Personal subscription OR member of Team org
3. **Team Tier** - Member of Team org (inherits from org subscription)

### Access Check Logic

```typescript
// Server-side access check
async function getUserAccess(userId: string) {
  const user = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  // Check personal subscription
  const hasProPersonal = user?.personalSubscriptionTier === 'pro';

  // Check organization subscription (from active session)
  const session = await auth.api.getSession({ headers: await headers() });
  const activeOrgId = session?.activeOrganizationId;

  let hasTeamOrg = false;
  if (activeOrgId) {
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, activeOrgId),
    });
    hasTeamOrg = org?.subscriptionTier === 'team';
  }

  // User has Pro access if they have EITHER Pro personal OR Team org
  const tier = hasTeamOrg ? 'team' : hasProPersonal ? 'pro' : 'free';

  return {
    tier,
    canWatchFullVideos: hasProPersonal || hasTeamOrg,
    canInteractWithCharts: hasProPersonal || hasTeamOrg,
    canDownloadTranscripts: hasProPersonal || hasTeamOrg,
    canAccessAPI: hasTeamOrg,  // Team-only feature
  };
}
```

### Client-Side Hook

```typescript
// hooks/useAccess.ts
'use client';

import { useSession } from '@/lib/auth-client';

export function useAccess() {
  const { data: session } = useSession();

  const hasProPersonal = session?.user?.personalSubscriptionTier === 'pro';
  const hasTeamOrg = session?.activeOrganization?.subscriptionTier === 'team';

  const tier = hasTeamOrg ? 'team' : hasProPersonal ? 'pro' : 'free';

  return {
    tier,
    canWatchFullVideos: hasProPersonal || hasTeamOrg,
    canInteractWithCharts: hasProPersonal || hasTeamOrg,
    canDownloadTranscripts: hasProPersonal || hasTeamOrg,
    canAccessAPI: hasTeamOrg,
    isLoading: !session,
  };
}
```

**Usage:**

```typescript
function VideoPlayer({ videoUrl }) {
  const { canWatchFullVideos } = useAccess();

  return (
    <ReactPlayer
      url={videoUrl}
      onProgress={({ played }) => {
        if (!canWatchFullVideos && played > 0.5) {
          // Pause at 50%
          playerRef.current?.pause();
          showPaywallOverlay();
        }
      }}
    />
  );
}
```

---

## Stripe Webhook Handling

**Better Auth Stripe plugin handles webhooks automatically.**

No manual webhook endpoint needed - Better Auth creates `/api/webhooks/stripe` for you.

### Supported Events

Better Auth automatically processes these events:

- `checkout.session.completed` - New subscription created
- `customer.subscription.updated` - Subscription changed (plan, seats, status)
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Payment successful
- `invoice.payment_failed` - Payment failed

### Webhook Configuration (Stripe Dashboard)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://markethawkeye.com/api/webhooks/stripe`
3. Select events: All subscription and checkout events
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET` in `.env`

### Local Testing (Stripe CLI)

```bash
# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### Custom Webhook Logic (If Needed)

If you need custom logic beyond Better Auth defaults:

```typescript
// lib/stripe-webhook-handler.ts
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Better Auth already updated subscription in DB
  // Add custom logic here (e.g., send Slack notification)

  const referenceId = subscription.metadata.referenceId;

  if (referenceId?.startsWith('org_')) {
    // Organization subscription updated
    await sendSlackNotification({
      message: `Organization ${referenceId} upgraded to ${subscription.items.data[0].plan.nickname}`,
    });
  }
}
```

---

## Email Templates

**Email Provider:** Resend

### Welcome Email (On Signup)

**Trigger:** User creates account

```html
Subject: Welcome to MarketHawk 🎉

Hi {{ user.name }},

Welcome to MarketHawk! Start watching earnings calls from 1,000+ companies.

[Browse Videos] [View Pricing]

Your current plan: Free
- Watch 50% of each video
- Browse all companies
- View static charts

Upgrade to Pro ($29/month) for full access:
- Watch full earnings calls
- Interactive charts
- Download transcripts
- Email alerts

[Upgrade to Pro]

Happy investing!
The MarketHawk Team
```

### Organization Invitation Email

**Trigger:** User is invited to organization

```html
Subject: You've been invited to join {{ organization.name }} on MarketHawk

Hi {{ email }},

{{ inviter.name }} invited you to join {{ organization.name }} on MarketHawk.

Accept this invitation to collaborate with your team:
- Shared watchlists
- Team subscription benefits
- Collaborative research

[Accept Invitation] (expires in 7 days)

Not interested? Just ignore this email.

The MarketHawk Team
```

### Billing Transfer Email

**Trigger:** Organization owner leaves, admin promoted

```html
Subject: You are now the billing owner of {{ organization.name }}

Hi {{ newOwner.name }},

The previous owner of {{ organization.name }} has left the organization.

As the oldest admin, you've been automatically promoted to owner and will now manage billing for the Team subscription ($99/month).

Your next billing date: {{ nextBillingDate }}

[Manage Billing] [Update Payment Method]

Questions? Reply to this email.

The MarketHawk Team
```

### Seat Limit Warning Email

**Trigger:** Organization reaches 9/10 seats

```html
Subject: Your team is almost at capacity (9/10 members)

Hi {{ owner.name }},

Your Team subscription for {{ organization.name }} is almost full (9/10 members).

When you reach 10 members, you won't be able to invite more without upgrading.

[Add More Seats] [View Pricing]

Current plan: Team ($99/month, 10 seats)

The MarketHawk Team
```

---

## Code Examples

### Example 1: Upgrade to Pro (Personal)

```typescript
'use server';

import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

export async function upgradeToProPersonal() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  try {
    // Create checkout session for personal subscription
    const result = await authClient.subscription.upgrade({
      plan: "pro",
      referenceId: session.user.id,  // Personal subscription
    });

    // Returns checkout URL
    return {
      success: true,
      checkoutUrl: result.checkoutUrl
    };
  } catch (error) {
    console.error('Upgrade failed:', error);
    return { error: 'Failed to create checkout session' };
  }
}
```

**Client-side usage:**

```typescript
'use client';

import { upgradeToProPersonal } from '@/app/actions/subscriptionActions';

export function UpgradeButton() {
  const handleUpgrade = async () => {
    const result = await upgradeToProPersonal();

    if (result.error) {
      toast.error(result.error);
    } else {
      window.location.href = result.checkoutUrl;
    }
  };

  return (
    <button onClick={handleUpgrade}>
      Upgrade to Pro - $29/month
    </button>
  );
}
```

---

### Example 2: Create Organization

```typescript
'use server';

import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { headers } from "next/headers";

function generateOrgId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `org_${slug}_${suffix}`;
}

export async function createOrganization(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  try {
    const orgId = generateOrgId(name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const org = await authClient.organization.create({
      id: orgId,
      name,
      slug,
    });

    // User is automatically added as owner
    return { success: true, organization: org };
  } catch (error) {
    console.error('Create org failed:', error);
    return { error: 'Failed to create organization' };
  }
}
```

---

### Example 3: Invite Member with Seat Check

```typescript
'use server';

import { auth } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function inviteMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'member'
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  // Check if user is owner or admin
  const member = await db.query.member.findFirst({
    where: (m, { and, eq }) => and(
      eq(m.userId, session.user.id),
      eq(m.organizationId, organizationId)
    ),
  });

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: "Only owners and admins can invite members" };
  }

  // Check seat limit
  const subscription = await authClient.subscription.list({
    referenceId: organizationId,
  });

  const memberCount = await db.query.member.findMany({
    where: (m, { eq }) => eq(m.organizationId, organizationId),
  }).then(m => m.length);

  if (subscription?.seats && memberCount >= subscription.seats) {
    return {
      error: 'Seat limit reached',
      message: `Your Team plan supports up to ${subscription.seats} members. Upgrade to add more seats.`,
      upgradeRequired: true,
    };
  }

  // Send invitation
  try {
    await authClient.organization.inviteMember({
      organizationId,
      email,
      role,
    });

    return { success: true };
  } catch (error) {
    console.error('Invite failed:', error);
    return { error: 'Failed to send invitation' };
  }
}
```

---

### Example 4: Check Video Access

```typescript
'use server';

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function canWatchFullVideo(videoId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Unauthenticated users: free tier only
  if (!session?.user) {
    return { canWatch: false, tier: 'free' };
  }

  // Check personal subscription
  const user = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, session.user.id),
  });

  const hasProPersonal = user?.personalSubscriptionTier === 'pro';

  // Check organization subscription
  let hasTeamOrg = false;
  if (session.activeOrganizationId) {
    const org = await db.query.organization.findFirst({
      where: (o, { eq }) => eq(o.id, session.activeOrganizationId),
    });
    hasTeamOrg = org?.subscriptionTier === 'team';
  }

  const canWatch = hasProPersonal || hasTeamOrg;
  const tier = hasTeamOrg ? 'team' : hasProPersonal ? 'pro' : 'free';

  return { canWatch, tier };
}
```

**Client-side usage:**

```typescript
'use client';

import { canWatchFullVideo } from '@/app/actions/videoActions';

export function VideoPlayer({ videoId }) {
  const [access, setAccess] = useState(null);

  useEffect(() => {
    canWatchFullVideo(videoId).then(setAccess);
  }, [videoId]);

  if (!access) return <Skeleton />;

  return (
    <ReactPlayer
      url={getVideoUrl(videoId)}
      onProgress={({ played }) => {
        if (!access.canWatch && played > 0.5) {
          playerRef.current?.pause();
          showPaywall();
        }
      }}
    />
  );
}
```

---

## Testing Strategy

### Unit Tests

**Test ID generation:**

```typescript
// __tests__/lib/generateUserId.test.ts
import { generateUserId } from '@/lib/generateUserId';

describe('generateUserId', () => {
  it('converts email to user ID', () => {
    expect(generateUserId('john@gmail.com')).toBe('usr_john_gmail_com');
  });

  it('handles dots in email', () => {
    expect(generateUserId('sarah.doe@acme.co.uk')).toBe('usr_sarah_doe_acme_co_uk');
  });

  it('handles plus signs', () => {
    expect(generateUserId('john+test@gmail.com')).toBe('usr_john+test_gmail_com');
  });
});
```

**Test access control:**

```typescript
// __tests__/hooks/useAccess.test.ts
import { renderHook } from '@testing-library/react';
import { useAccess } from '@/hooks/useAccess';

describe('useAccess', () => {
  it('returns free tier for unauthenticated users', () => {
    const { result } = renderHook(() => useAccess());
    expect(result.current.tier).toBe('free');
    expect(result.current.canWatchFullVideos).toBe(false);
  });

  it('returns pro tier for Pro subscribers', () => {
    // Mock session with Pro subscription
    mockSession({ user: { personalSubscriptionTier: 'pro' } });

    const { result } = renderHook(() => useAccess());
    expect(result.current.tier).toBe('pro');
    expect(result.current.canWatchFullVideos).toBe(true);
  });

  it('returns team tier for Team org members', () => {
    mockSession({
      user: { personalSubscriptionTier: 'free' },
      activeOrganization: { subscriptionTier: 'team' }
    });

    const { result } = renderHook(() => useAccess());
    expect(result.current.tier).toBe('team');
    expect(result.current.canAccessAPI).toBe(true);
  });
});
```

---

### Integration Tests

**Test subscription webhook:**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Listen for webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Terminal 3: Trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated --add customer:metadata.referenceId=org_test_a1b2
```

**Verify:**
- Database updated with subscription status
- User's `personalSubscriptionTier` changed to 'pro'
- Organization's `subscriptionTier` changed to 'team'

---

**Test seat limit:**

```typescript
// __tests__/integration/seatLimit.test.ts
describe('Seat limit enforcement', () => {
  it('blocks 11th member from joining Team org', async () => {
    // Create org with Team subscription (10 seats)
    const org = await createTestOrg({ subscriptionTier: 'team', seats: 10 });

    // Add 10 members
    for (let i = 0; i < 10; i++) {
      await inviteMember(org.id, `user${i}@example.com`, 'member');
    }

    // Try to add 11th member
    const result = await inviteMember(org.id, 'user11@example.com', 'member');

    expect(result.error).toBe('Seat limit reached');
    expect(result.upgradeRequired).toBe(true);
  });
});
```

---

**Test billing transfer:**

```typescript
// __tests__/integration/billingTransfer.test.ts
describe('Billing transfer on owner leave', () => {
  it('promotes oldest admin to owner', async () => {
    const org = await createTestOrg();
    const owner = await createTestUser('owner@example.com', 'owner');
    const admin1 = await createTestUser('admin1@example.com', 'admin');
    const admin2 = await createTestUser('admin2@example.com', 'admin');

    // Admin1 created first (oldest)
    await addMemberToOrg(org.id, admin1.id, 'admin');
    await delay(1000);
    await addMemberToOrg(org.id, admin2.id, 'admin');

    // Owner leaves
    await removeMemberFromOrg(org.id, owner.id);

    // Check admin1 promoted to owner
    const admin1Member = await getMember(admin1.id, org.id);
    expect(admin1Member.role).toBe('owner');

    // Check email sent
    expect(mockEmailService).toHaveBeenCalledWith({
      to: admin1.email,
      subject: 'You are now the billing owner',
    });
  });
});
```

---

### End-to-End Tests (Playwright)

**Test complete signup flow:**

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign up with email/password', async ({ page }) => {
  await page.goto('/');

  // Click sign up
  await page.click('text=Sign Up');

  // Fill form
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('input[name=password]', 'SecurePass123');
  await page.click('button[type=submit]');

  // Check verification email sent
  await expect(page.locator('text=Check your email')).toBeVisible();

  // Simulate clicking verification link
  // (In real test, check email inbox and extract link)
  const verificationToken = await getVerificationToken('test@example.com');
  await page.goto(`/verify-email?token=${verificationToken}`);

  // Check redirected to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

## Security Best Practices

### 1. Session Security

- **HTTP-only cookies** - Prevents XSS attacks (Better Auth default)
- **Secure flag** - HTTPS only in production
- **SameSite=Lax** - CSRF protection
- **Short expiration** - Sessions expire after 7 days of inactivity

### 2. Password Security

- **Bcrypt hashing** - Better Auth default (10 rounds)
- **Minimum 8 characters** - Enforced by Better Auth
- **Password reset tokens** - Expire after 1 hour
- **Rate limiting** - Max 5 attempts per 15 minutes

### 3. Email Verification

- **Required for email/password signups** - Prevents spam accounts
- **Magic link tokens** - One-time use, expire after 24 hours
- **No plain text passwords in emails** - Only secure reset links

### 4. Authorization Checks

**Always verify:**
- User is authenticated (has valid session)
- User owns the resource (e.g., their own subscription)
- User has correct role (e.g., owner for billing actions)

```typescript
// ❌ BAD: No authorization check
export async function deleteOrganization(orgId: string) {
  await db.delete(organizationTable).where(eq(organizationTable.id, orgId));
}

// ✅ GOOD: Verify user is owner
export async function deleteOrganization(orgId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Not authenticated" };

  const member = await getMemberRole(session.user.id, orgId);
  if (member?.role !== 'owner') {
    return { error: "Only owners can delete organizations" };
  }

  await db.delete(organizationTable).where(eq(organizationTable.id, orgId));
}
```

### 5. Input Validation

**Validate all user inputs:**

```typescript
// Use Zod for validation
import { z } from 'zod';

const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export async function createOrganization(input: unknown) {
  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input", details: parsed.error };
  }

  // ... proceed with validated data
}
```

### 6. Rate Limiting

**Prevent abuse:**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 requests per minute
});

export async function inviteMember(orgId: string, email: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Rate limit by user ID
  const { success } = await ratelimit.limit(session.user.id);
  if (!success) {
    return { error: "Too many requests. Try again in 1 minute." };
  }

  // ... proceed with invitation
}
```

### 7. Webhook Signature Verification

**Better Auth handles this automatically**, but if you add custom webhook endpoints:

```typescript
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // ... process event
}
```

### 8. Environment Variables

**Never commit secrets:**

```bash
# .env.local (NOT in git)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_xxx
```

**Use `.env.example` for documentation:**

```bash
# .env.example (committed to git)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DATABASE_URL=
RESEND_API_KEY=
```

---

## Related Documentation

### Core Documentation

- **PRD:** `PRD/README.md` - Complete product requirements
- **Web App Guide:** `PRD/WEB-APP-GUIDE.md` - Next.js, UI patterns
- **User Experience:** `PRD/USER-EXPERIENCE.md` - Free tier, paywalls, personalization
- **Database Schema:** `PRD/DATABASE-SCHEMA.md` - Full schema reference
- **Deployment:** `PRD/DEPLOYMENT.md` - Vercel deployment

### External Documentation

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Better Auth Stripe Plugin](https://www.better-auth.com/docs/plugins/stripe)
- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Stripe Subscriptions API](https://stripe.com/docs/billing/subscriptions/overview)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)

### Sample Code

- **VideotoBe Platform:** `~/videotobe/platform/app-videotobe/` - Production patterns for Better Auth, Server Actions, human-readable IDs

---

**Last Updated:** 2025-11-14
**Status:** Implementation Ready
**Next Steps:** Begin Phase 2 implementation (Database Schema & Better Auth Configuration)
