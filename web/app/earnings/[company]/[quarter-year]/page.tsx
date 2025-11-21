import { getEarningsCallBySlug } from '../../actions';
import { getSignedUrlForR2Media } from '@/lib/r2';
import { getTranscriptFromR2 } from '../../components/transcript-actions';
import { EarningsCallPageClient } from './EarningsCallPageClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getPostHogClient } from '@/lib/posthog-server';
import Script from 'next/script';

// Helper to parse quarter-year slug (e.g., "q3-2025" -> { quarter: "Q3", year: 2025 })
function parseQuarterYear(slug: string): { quarter: string; year: number } | null {
  const match = slug.match(/^q(\d)-(\d{4})$/i);
  if (!match) return null;
  return {
    quarter: `Q${match[1]}`,
    year: parseInt(match[2], 10),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ company: string; 'quarter-year': string }>;
}): Promise<Metadata> {
  const { company, 'quarter-year': quarterYear } = await params;

  const parsed = parseQuarterYear(quarterYear);
  if (!parsed) {
    return {
      title: 'Earnings Call Not Found | MarketHawk',
    };
  }

  const { quarter, year } = parsed;
  const result = await getEarningsCallBySlug(company, quarter, year);

  if (!result.success || !result.data) {
    return {
      title: 'Earnings Call Not Found | MarketHawk',
    };
  }

  const call = result.data;
  const insights = call.insights || {};
  const companyName = call.companyName || insights.company_name || call.symbol;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com'}/earnings/${company}/${quarterYear}`;

  return {
    title: `${companyName} ${quarter} ${year} Earnings Call | MarketHawk`,
    description: insights.summary
      ? insights.summary.slice(0, 155) + '...'
      : `Listen to ${companyName}'s ${quarter} ${year} earnings call with AI-generated insights, transcript, and financial metrics.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${companyName} ${quarter} ${year} Earnings Call`,
      description: insights.summary?.slice(0, 155) || `AI-powered earnings call analysis for ${companyName}`,
      url: canonicalUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${companyName} ${quarter} ${year} Earnings Call`,
      description: insights.summary?.slice(0, 155) || `AI-powered earnings call analysis for ${companyName}`,
    },
  };
}

export default async function EarningsCallPage({
  params,
}: {
  params: Promise<{ company: string; 'quarter-year': string }>;
}) {
  const { company, 'quarter-year': quarterYear } = await params;

  // Parse quarter and year from slug
  const parsed = parseQuarterYear(quarterYear);
  if (!parsed) {
    notFound();
  }

  const { quarter, year } = parsed;

  // Use company slug for lookup (e.g., "playboy")
  const result = await getEarningsCallBySlug(company, quarter, year);

  if (!result.success || !result.data) {
    notFound();
  }

  const call = result.data;
  const metadata = call.metadata || {};
  const transcripts = call.transcripts || {};
  const insights = call.insights || {};

  // Debug: Log mediaUrl
  console.log('[DEBUG] call.mediaUrl:', call.mediaUrl);
  console.log('[DEBUG] call.youtubeId:', call.youtubeId);

  // Track earnings call page view with PostHog
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const posthog = getPostHogClient();
  const distinctId = session?.user?.email || session?.user?.id || 'anonymous';

  posthog.capture({
    distinctId,
    event: 'earnings_call_viewed',
    properties: {
      company_name: call.companyName || insights.company_name,
      symbol: call.symbol,
      quarter: call.quarter,
      year: call.year,
      management_tone: insights.sentiment?.management_tone,
      has_video: !!call.mediaUrl,
      is_authenticated: !!session?.user,
    },
  });
  await posthog.shutdown();

  // Fetch transcript paragraphs from R2
  let transcriptData = null;
  let speakers = [];

  if (transcripts.paragraphs_url) {
    const r2Path = transcripts.paragraphs_url.replace(/^r2:\/\/[^/]+\//, '');
    const transcriptResult = await getTranscriptFromR2(r2Path);

    if (transcriptResult.success) {
      transcriptData = transcriptResult.data;
    }
  }

  // Get speakers from insights
  if (insights.speakers) {
    speakers = insights.speakers;
  }

  // Get audio/video URL from R2
  let mediaSignedUrl: string | null = null;
  let r2Key: string | null = null;

  console.log('[DEBUG] Processing mediaUrl for R2...');
  if (call.mediaUrl && call.mediaUrl.startsWith('r2://')) {
    const urlParts = call.mediaUrl.replace('r2://', '').split('/');
    r2Key = urlParts.slice(1).join('/');
    console.log('[DEBUG] Extracted r2Key:', r2Key);

    try {
      mediaSignedUrl = await getSignedUrlForR2Media(r2Key);
      console.log('[DEBUG] Generated signed URL:', mediaSignedUrl ? 'YES' : 'NO');
    } catch (error) {
      console.error('[DEBUG] Failed to get signed URL:', error);
    }
  } else {
    console.log('[DEBUG] mediaUrl does not start with r2://, value:', call.mediaUrl);
  }

  const companyName = call.companyName || insights.company_name || metadata.company_name || 'Unknown Company';
  const processedAt = metadata.processed_at
    ? new Date(metadata.processed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown date';

  // Extract insights data
  const summary = insights.summary || '';
  const sentiment = insights.sentiment || {};
  const chapters = insights.chapters || [];
  const highlights = insights.highlights || [];
  const financialMetrics = insights.financial_metrics || [];

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `${companyName} ${call.quarter} ${call.year} Earnings Call`,
    description: summary || `AI-powered earnings call analysis for ${companyName} ${call.quarter} ${call.year}`,
    uploadDate: call.createdAt?.toISOString(),
    thumbnailUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com'}/og-image.jpg`,
    contentUrl: mediaSignedUrl || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'MarketHawk',
      logo: {
        '@type': 'ImageObject',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com'}/logo.png`,
      },
    },
    author: {
      '@type': 'Organization',
      name: companyName,
    },
    about: {
      '@type': 'Corporation',
      name: companyName,
      tickerSymbol: call.symbol,
    },
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <EarningsCallPageClient
        company={company}
        companyName={companyName}
        call={call}
        summary={summary}
        sentiment={sentiment}
        chapters={chapters}
        highlights={highlights}
        financialMetrics={financialMetrics}
        mediaSignedUrl={mediaSignedUrl}
        transcriptData={transcriptData}
        speakers={speakers}
        processedAt={processedAt}
      />
    </>
  );
}
