import { getEarningsCalls } from './actions';
import Link from 'next/link';

export const metadata = {
  title: 'Earnings Calls | MarketHawk',
  description: 'Browse processed earnings call audio files',
};

export default async function EarningsCallsPage() {
  const result = await getEarningsCalls(100, 0);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Earnings Calls</h1>
        <p className="text-red-600">Failed to load earnings calls</p>
      </div>
    );
  }

  const calls = result.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Earnings Calls</h1>
      <p className="text-gray-600 mb-8">
        {calls.length} processed earnings call{calls.length !== 1 ? 's' : ''}
      </p>

      {calls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No earnings calls found</p>
          <p className="text-gray-400 mt-2">Run the batch processor to add earnings calls</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {calls.map((call) => {
            const metadata = call.metadata || {};
            const companyName = metadata.company_name || 'Unknown Company';
            const pipelineType = metadata.pipeline_type || 'unknown';
            const batchName = metadata.batch_name || 'unknown';
            const processedAt = metadata.processed_at
              ? new Date(metadata.processed_at).toLocaleDateString()
              : 'Unknown date';

            return (
              <Link
                key={call.id}
                href={`/earnings/${call.id}`}
                className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {companyName}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="font-medium">{call.symbol}</span>
                      <span>
                        {call.quarter} {call.year}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>Pipeline: {pipelineType}</span>
                      <span className="text-gray-400">•</span>
                      <span>Batch: {batchName}</span>
                    </div>
                    {call.youtubeId && (
                      <div className="mt-2">
                        <a
                          href={`https://www.youtube.com/watch?v=${call.youtubeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View on YouTube →
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Processed</p>
                    <p className="text-sm text-gray-700">{processedAt}</p>
                  </div>
                </div>

                {call.audioUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-green-600">Audio available</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
