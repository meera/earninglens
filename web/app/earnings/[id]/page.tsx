import { getEarningsCall } from '../actions';
import { getSignedUrlForR2Media, getR2PathFromMetadata } from '@/lib/r2';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const metadata = {
  title: 'Earnings Call | MarketHawk',
};

export default async function EarningsCallDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await getEarningsCall(params.id);

  if (!result.success || !result.data) {
    notFound();
  }

  const call = result.data;
  const metadata = call.metadata || {};

  // Get audio URL
  let audioSignedUrl: string | null = null;
  const r2Path = getR2PathFromMetadata(metadata);

  if (r2Path) {
    try {
      audioSignedUrl = await getSignedUrlForR2Media(r2Path);
    } catch (error) {
      console.error('Failed to get signed URL:', error);
    }
  }

  const companyName = metadata.company_name || 'Unknown Company';
  const companySlug = metadata.company_slug || null;
  const pipelineType = metadata.pipeline_type || 'unknown';
  const batchName = metadata.batch_name || 'unknown';
  const jobId = metadata.job_id || 'unknown';
  const processedAt = metadata.processed_at
    ? new Date(metadata.processed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown date';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/earnings"
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to all earnings calls
        </Link>
        <h1 className="text-3xl font-bold mb-2">{companyName}</h1>
        <div className="flex flex-wrap gap-4 text-gray-600">
          <span className="font-medium text-lg">
            {call.symbol} | {call.quarter} {call.year}
          </span>
        </div>
      </div>

      {/* Audio Player */}
      {audioSignedUrl ? (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Audio</h2>
          <audio
            controls
            className="w-full"
            preload="metadata"
            src={audioSignedUrl}
          >
            Your browser does not support the audio element.
          </audio>
          <p className="text-sm text-gray-500 mt-2">
            Audio extracted from earnings call video
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-yellow-800">Audio file not available</p>
          {r2Path && (
            <p className="text-sm text-yellow-600 mt-1">
              R2 Path: {r2Path}
            </p>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Company</dt>
            <dd className="mt-1 text-sm text-gray-900">{companyName}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Symbol</dt>
            <dd className="mt-1 text-sm text-gray-900">{call.symbol}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">CIK</dt>
            <dd className="mt-1 text-sm text-gray-900">{call.cikStr}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Quarter</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {call.quarter} {call.year}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Pipeline Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{pipelineType}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Batch</dt>
            <dd className="mt-1 text-sm text-gray-900">{batchName}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Job ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
              {jobId}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Processed</dt>
            <dd className="mt-1 text-sm text-gray-900">{processedAt}</dd>
          </div>

          {call.youtubeId && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1">
                <a
                  href={`https://www.youtube.com/watch?v=${call.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View on YouTube →
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
