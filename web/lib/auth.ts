import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins/organization';
import { stripe } from '@better-auth/stripe';
import { db } from './db';
import * as schema from './db/schema';
import { member as memberTable } from './db/auth-schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { sendEmail } from './email';

// Initialize Stripe client
const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get organization subscription details
 */
async function getOrgSubscription(orgId: string) {
  const org = await db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.id, orgId),
  });
  return {
    tier: org?.metadata?.subscriptionTier || 'free',
    seats: org?.metadata?.subscriptionSeats || 10,
  };
}

/**
 * Get organization member count
 */
async function getOrgMemberCount(orgId: string) {
  const members = await db.query.member.findMany({
    where: (member, { eq }) => eq(member.organizationId, orgId),
  });
  return members.length;
}

/**
 * Get member role in organization
 */
async function getMemberRole(userId: string, orgId: string) {
  return await db.query.member.findFirst({
    where: (member, { and, eq }) => and(
      eq(member.userId, userId),
      eq(member.organizationId, orgId)
    ),
  });
}

/**
 * Transfer billing ownership to oldest admin when owner leaves
 */
async function transferBillingToOldestAdmin(orgId: string, leavingOwnerId: string) {
  // Find oldest admin (by createdAt timestamp)
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

  // Get admin user details
  const newOwner = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, admins[0].userId),
  });

  const org = await db.query.organization.findFirst({
    where: (org, { eq }) => eq(org.id, orgId),
  });

  // Send notification email to new owner
  if (newOwner?.email && org) {
    await sendEmail({
      to: newOwner.email,
      subject: `You are now the billing owner of ${org.name}`,
      html: `
        <h1>You are now the billing owner</h1>
        <p>The previous owner of ${org.name} has left the organization.</p>
        <p>As the oldest admin, you've been automatically promoted to owner and will now manage billing for the Team subscription ($99/month).</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/organizations/${orgId}/settings">Manage Billing</a></p>
      `,
    });
  }
}

// ============================================
// BETTER AUTH CONFIGURATION
// ============================================

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  logger: {
    verboseLogging: true,
    disabled: false,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your MarketHawk password',
        html: `
          <h1>Reset your password</h1>
          <p>Click the link below to reset your password:</p>
          <p><a href="${url}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
        `,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your MarketHawk email',
        html: `
          <h1>Welcome to MarketHawk!</h1>
          <p>Hi ${user.name},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the link below:</p>
          <p><a href="${url}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="color: #666; font-size: 14px;">${url}</p>
          <p>This link will expire in 24 hours.</p>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },

  // TODO: Add hooks for custom user ID generation and welcome emails
  // hooks: {
  //   before: createAuthMiddleware(async (ctx) => { ... }),
  //   after: createAuthMiddleware(async (ctx) => { ... }),
  // },

  plugins: [
    organization({
      // Send invitation emails via Resend
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}`;
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on MarketHawk`,
          html: `
            <h1>You've been invited to join ${data.organization.name}</h1>
            <p>${data.inviter.user.name} invited you to collaborate on MarketHawk.</p>
            <p>Accept this invitation to:</p>
            <ul>
              <li>Share watchlists with your team</li>
              <li>Access team subscription benefits</li>
              <li>Collaborate on research</li>
            </ul>
            <p><a href="${inviteLink}">Accept Invitation</a></p>
            <p><em>This invitation expires in 7 days.</em></p>
          `,
        });
      },

      hooks: {
        // Enforce seat limits before adding member
        beforeAddMember: async ({ organization }) => {
          const subscription = await getOrgSubscription(organization.id);
          const memberCount = await getOrgMemberCount(organization.id);

          // Check if org has a Team subscription with seat limits
          if (subscription.tier === 'team' && memberCount >= subscription.seats) {
            throw new Error(`Seat limit reached. Your Team plan supports up to ${subscription.seats} members. Upgrade to add more seats.`);
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

    stripe({
      stripeClient,
      createCustomerOnSignUp: true,  // Auto-create Stripe customer

      // Stripe product configuration
      products: {
        pro: {
          priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
          metadata: {
            plan: 'pro',
            billing_period: 'monthly',
          },
        },
        proYearly: {
          priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
          metadata: {
            plan: 'pro',
            billing_period: 'yearly',
          },
        },
        team: {
          priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
          metadata: {
            plan: 'team',
            billing_period: 'monthly',
          },
        },
        teamYearly: {
          priceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
          metadata: {
            plan: 'team',
            billing_period: 'yearly',
          },
        },
      },

      // Webhook configuration
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

      // Success/cancel URLs
      successUrl: process.env.NEXT_PUBLIC_APP_URL + '/billing?success=true',
      cancelUrl: process.env.NEXT_PUBLIC_APP_URL + '/pricing?canceled=true',

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

  trustedOrigins: [
    'http://localhost:3000',
    'https://markethawkeye.com',
    'https://www.markethawkeye.com',
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
