'use server';

import { db } from '@/lib/db';
import { earningsCalls } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * Get all earnings calls with pagination
 */
export async function getEarningsCalls(limit: number = 50, offset: number = 0) {
  try {
    const calls = await db
      .select()
      .from(earningsCalls)
      .orderBy(desc(earningsCalls.createdAt))
      .limit(limit)
      .offset(offset);

    return { success: true, data: calls };
  } catch (error) {
    console.error('Error fetching earnings calls:', error);
    return { success: false, error: 'Failed to fetch earnings calls' };
  }
}

/**
 * Get single earnings call by ID
 */
export async function getEarningsCall(id: string) {
  try {
    const call = await db.query.earningsCalls.findFirst({
      where: eq(earningsCalls.id, id),
    });

    if (!call) {
      return { success: false, error: 'Earnings call not found' };
    }

    return { success: true, data: call };
  } catch (error) {
    console.error('Error fetching earnings call:', error);
    return { success: false, error: 'Failed to fetch earnings call' };
  }
}
