import { MetadataRoute } from 'next';
import { getCompanies } from '@/lib/db/companies';
import { db } from '@/lib/db';
import { earningsCalls, companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Force dynamic rendering - never cache sitemap
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com';

  try {
    // Get all companies for dynamic stock pages
    const allCompanies = await getCompanies({ limit: 10000 });

    // Get all earnings calls with company slugs
    const calls = await db
      .select({
        companySlug: companies.slug,
        quarter: earningsCalls.quarter,
        year: earningsCalls.year,
        updatedAt: earningsCalls.updatedAt,
      })
      .from(earningsCalls)
      .innerJoin(companies, eq(earningsCalls.symbol, companies.ticker))
      .where(eq(earningsCalls.isLatest, true));

    // Generate company page URLs (new /companies/:slug routes)
    const companyUrls = allCompanies.map((company) => ({
      url: `${baseUrl}/companies/${company.slug}`,
      lastModified: company.updated_at || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // Generate earnings call URLs
    const earningsCallUrls = calls.map((call) => {
      const quarterNum = call.quarter.toLowerCase().replace('q', '');
      return {
        url: `${baseUrl}/earnings/${call.companySlug}/q${quarterNum}-${call.year}`,
        lastModified: call.updatedAt || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      };
    });

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/companies`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      ...companyUrls,
      ...earningsCallUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return minimal sitemap on error
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
