import { getEarningsCallBySlug } from '../../actions';
import { getSignedUrlForR2Media } from '@/lib/r2';
import { getTranscriptFromR2 } from '../../components/transcript-actions';
import { TranscriptViewer } from '../../components/TranscriptViewer';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Earnings Call | MarketHawk',
};

// Helper to parse quarter-year slug (e.g., "q3-2025" -> { quarter: "Q3", year: 2025 })
function parseQuarterYear(slug: string): { quarter: string; year: number } | null {
  const match = slug.match(/^q(\d)-(\d{4})$/i);
  if (!match) return null;
  return {
    quarter: `Q${match[1]}`,
    year: parseInt(match[2], 10),
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

  if (call.mediaUrl && call.mediaUrl.startsWith('r2://')) {
    const urlParts = call.mediaUrl.replace('r2://', '').split('/');
    r2Key = urlParts.slice(1).join('/');

    try {
      mediaSignedUrl = await getSignedUrlForR2Media(r2Key);
    } catch (error) {
      console.error('Failed to get signed URL:', error);
    }
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/earnings"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to all earnings calls
        </Link>
        <h1 className="text-4xl font-bold mb-2">{companyName}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600">
          <span className="text-2xl font-medium">
            {call.symbol} | {call.quarter} {call.year}
          </span>
        </div>
      </div>

      {/* Summary & Sentiment */}
      {(summary || sentiment.management_tone) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Executive Summary</h2>

          {/* Sentiment */}
          {sentiment.management_tone && (
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Management Tone:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sentiment.management_tone === 'bullish'
                  ? 'bg-green-100 text-green-800'
                  : sentiment.management_tone === 'bearish'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {sentiment.management_tone.charAt(0).toUpperCase() + sentiment.management_tone.slice(1)}
              </span>

              {sentiment.confidence_level && (
                <>
                  <span className="text-sm font-medium text-gray-700">Confidence:</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {sentiment.confidence_level.charAt(0).toUpperCase() + sentiment.confidence_level.slice(1)}
                  </span>
                </>
              )}
            </div>
          )}

          {summary && (
            <p className="text-gray-900 leading-relaxed whitespace-pre-line">{summary}</p>
          )}

          {/* Key Themes */}
          {sentiment.key_themes && sentiment.key_themes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Themes:</h3>
              <div className="flex flex-wrap gap-2">
                {sentiment.key_themes.map((theme: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-gray-700">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Video/Audio Player */}
          {mediaSignedUrl && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recording</h2>
              <video
                controls
                className="w-full rounded"
                preload="metadata"
                src={mediaSignedUrl}
              >
                Your browser does not support the video element.
              </video>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Key Highlights</h2>
              <div className="space-y-4">
                {highlights.map((highlight: any, index: number) => (
                  <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      {highlight.category && (
                        <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                          {highlight.category}
                        </span>
                      )}
                      {highlight.speaker && (
                        <span className="text-xs text-gray-600">
                          — {highlight.speaker}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900">{highlight.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcriptData && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Full Transcript</h2>
              <TranscriptViewer transcript={transcriptData} speakers={speakers} />
            </div>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Table of Contents */}
          {chapters.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
              <nav className="space-y-2">
                {chapters.map((chapter: any, index: number) => (
                  <a
                    key={index}
                    href={`#chapter-${index}`}
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {chapter.title}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Financial Metrics */}
          {financialMetrics.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
              <div className="space-y-3">
                {financialMetrics.map((metric: any, index: number) => (
                  <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <p className="text-xs font-medium text-gray-600 mb-1">{metric.metric}</p>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    {metric.change && (
                      <p className={`text-xs ${
                        metric.change.startsWith('+') || metric.change.includes('up')
                          ? 'text-green-600'
                          : metric.change.startsWith('-') || metric.change.includes('down')
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {metric.change}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Company</dt>
                <dd className="mt-1 text-sm text-gray-900">{companyName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Symbol</dt>
                <dd className="mt-1 text-sm text-gray-900">{call.symbol}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Period</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {call.quarter} {call.year}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Processed</dt>
                <dd className="mt-1 text-sm text-gray-900">{processedAt}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
