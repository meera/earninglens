'use server';

import { auth } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { organization as organizationTable, member as memberTable } from '@/lib/db/auth-schema';
import { eq, and } from 'drizzle-orm';

/**
 * Generate organization ID from name
 * Pattern: org_{slug}_{random4}
 * Example: org_acme_investment_a1b2
 */
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

/**
 * Create a new organization
 * User becomes the owner automatically
 */
export async function createOrganization(name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Validate name
  if (!name || name.trim().length < 1 || name.length > 100) {
    return {
      error: 'Invalid name',
      message: 'Organization name must be between 1 and 100 characters',
    };
  }

  try {
    const orgId = generateOrgId(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create organization via Better Auth
    const org = await authClient.organization.create({
      id: orgId,
      name: name.trim(),
      slug,
      metadata: {
        subscriptionTier: 'free',
        subscriptionSeats: 10,
        createdBy: session.user.id,
      },
    });

    return {
      success: true,
      organization: org,
    };
  } catch (error) {
    console.error('Failed to create organization:', error);
    return {
      error: 'Failed to create organization',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Invite member to organization
 * Checks seat limits before sending invitation
 */
export async function inviteMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Check if user is owner or admin
  const currentMember = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return {
      error: 'Unauthorized',
      message: 'Only owners and admins can invite members',
    };
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      error: 'Invalid email',
      message: 'Please provide a valid email address',
    };
  }

  // Check seat limit
  try {
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, organizationId),
    });

    const members = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, organizationId),
    });

    const subscriptionTier = org?.metadata?.subscriptionTier || 'free';
    const subscriptionSeats = org?.metadata?.subscriptionSeats || 10;

    // Enforce seat limits for Team subscriptions
    if (subscriptionTier === 'team' && members.length >= subscriptionSeats) {
      return {
        error: 'Seat limit reached',
        message: `Your Team plan supports up to ${subscriptionSeats} members. Upgrade to add more seats.`,
        upgradeRequired: true,
      };
    }

    // Send invitation
    await authClient.organization.inviteMember({
      organizationId,
      email,
      role,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to invite member:', error);
    return {
      error: 'Failed to send invitation',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove member from organization
 * If owner leaves, billing transfers to oldest admin
 */
export async function removeMember(organizationId: string, userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is owner or admin
  const currentMember = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  const memberToRemove = await auth.api.getOrganizationMember({
    organizationId,
    userId,
  });

  if (!currentMember || !['owner', 'admin'].includes(currentMember.role)) {
    return {
      error: 'Unauthorized',
      message: 'Only owners and admins can remove members',
    };
  }

  // Owners can only be removed by themselves
  if (memberToRemove?.role === 'owner' && session.user.id !== userId) {
    return {
      error: 'Unauthorized',
      message: 'Owners can only remove themselves',
    };
  }

  try {
    // Better Auth handles billing transfer automatically via beforeRemoveMember hook
    await authClient.organization.removeMember({
      organizationId,
      userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to remove member:', error);
    return {
      error: 'Failed to remove member',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  newRole: 'owner' | 'admin' | 'member'
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Only owners can update roles
  const currentMember = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  if (!currentMember || currentMember.role !== 'owner') {
    return {
      error: 'Unauthorized',
      message: 'Only owners can update member roles',
    };
  }

  try {
    await authClient.organization.updateMemberRole({
      organizationId,
      userId,
      role: newRole,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update member role:', error);
    return {
      error: 'Failed to update member role',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get organization details with members
 */
export async function getOrganization(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, organizationId),
    });

    if (!org) {
      return { error: 'Organization not found' };
    }

    const members = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, organizationId),
      with: {
        user: true,
      },
    });

    return {
      success: true,
      organization: org,
      members,
    };
  } catch (error) {
    console.error('Failed to get organization:', error);
    return {
      error: 'Failed to retrieve organization',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all organizations for current user
 */
export async function listOrganizations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  try {
    const memberships = await db.query.member.findMany({
      where: (member, { eq }) => eq(member.userId, session.user.id),
      with: {
        organization: true,
      },
    });

    return {
      success: true,
      organizations: memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      })),
    };
  } catch (error) {
    console.error('Failed to list organizations:', error);
    return {
      error: 'Failed to retrieve organizations',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Set active organization for session
 */
export async function setActiveOrganization(organizationId: string | null) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // If organizationId provided, verify user is a member
  if (organizationId) {
    const member = await auth.api.getOrganizationMember({
      organizationId,
      userId: session.user.id,
    });

    if (!member) {
      return {
        error: 'Unauthorized',
        message: 'You are not a member of this organization',
      };
    }
  }

  try {
    await authClient.session.update({
      activeOrganizationId: organizationId,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to set active organization:', error);
    return {
      error: 'Failed to update session',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete organization (owner only)
 */
export async function deleteOrganization(organizationId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: 'Not authenticated' };
  }

  // Only owners can delete
  const member = await auth.api.getOrganizationMember({
    organizationId,
    userId: session.user.id,
  });

  if (!member || member.role !== 'owner') {
    return {
      error: 'Unauthorized',
      message: 'Only owners can delete organizations',
    };
  }

  try {
    // Cancel subscription first if exists
    const org = await db.query.organization.findFirst({
      where: (org, { eq }) => eq(org.id, organizationId),
    });

    if (org?.metadata?.subscriptionTier !== 'free') {
      await authClient.subscription.cancel({
        referenceId: organizationId,
      });
    }

    // Delete organization (cascades to members, invitations)
    await db.delete(organizationTable).where(eq(organizationTable.id, organizationId));

    return { success: true };
  } catch (error) {
    console.error('Failed to delete organization:', error);
    return {
      error: 'Failed to delete organization',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
