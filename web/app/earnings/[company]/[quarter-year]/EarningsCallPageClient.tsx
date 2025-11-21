'use client';

import { MediaPlayerProvider } from './MediaPlayerContext';
import { TableOfContents } from './TableOfContents';
import { EarningsCallViewer } from './EarningsCallViewer';
import Link from 'next/link';

interface Props {
  company: string;
  companyName: string;
  call: any;
  summary: string;
  sentiment: any;
  chapters: any[];
  highlights: any[];
  financialMetrics: any[];
  mediaSignedUrl: string | null;
  transcriptData: any;
  speakers: any[];
  processedAt: string;
}

export function EarningsCallPageClient({
  company,
  companyName,
  call,
  summary,
  sentiment,
  chapters,
  highlights,
  financialMetrics,
  mediaSignedUrl,
  transcriptData,
  speakers,
  processedAt,
}: Props) {
  return (
    <MediaPlayerProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/companies/${company}`}
            className="text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to {companyName}
          </Link>
          <h1 className="text-4xl font-bold mb-2">{companyName}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <span className="text-2xl font-medium">
              {call.symbol} | {call.quarter} {call.year}
            </span>
          </div>
        </div>

        {/* Sentiment & Key Themes (before video) */}
        {(sentiment.management_tone || (sentiment.key_themes && sentiment.key_themes.length > 0)) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8">
            {/* Sentiment */}
            {sentiment.management_tone && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">Management Tone:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    sentiment.management_tone === 'bullish'
                      ? 'bg-green-100 text-green-800'
                      : sentiment.management_tone === 'bearish'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sentiment.management_tone.charAt(0).toUpperCase() + sentiment.management_tone.slice(1)}
                </span>

                {sentiment.confidence_level && (
                  <>
                    <span className="text-sm font-medium text-gray-900">Confidence:</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {sentiment.confidence_level.charAt(0).toUpperCase() + sentiment.confidence_level.slice(1)}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Key Themes */}
            {sentiment.key_themes && sentiment.key_themes.length > 0 && (
              <div className={sentiment.management_tone ? 'mt-4' : ''}>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Themes:</h3>
                <div className="flex flex-wrap gap-2">
                  {sentiment.key_themes.map((theme: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-gray-800"
                    >
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
            {/* Media Player + Transcript */}
            <EarningsCallViewer mediaUrl={mediaSignedUrl} transcript={transcriptData} speakers={speakers} />

            {/* Executive Summary (after video) */}
            {summary && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Executive Summary</h2>
                <p className="text-gray-900 leading-relaxed whitespace-pre-line">{summary}</p>
              </div>
            )}

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Key Highlights</h2>
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
                          <span className="text-xs text-gray-600">— {highlight.speaker}</span>
                        )}
                      </div>
                      <p className="text-gray-900">{highlight.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Table of Contents */}
            <TableOfContents chapters={chapters} />

            {/* Financial Metrics */}
            {financialMetrics.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Key Metrics</h2>
                <div className="space-y-3">
                  {financialMetrics.map((metric: any, index: number) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">{metric.metric}</p>
                      <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                      {metric.change && (
                        <p
                          className={`text-xs ${
                            metric.change.startsWith('+') || metric.change.includes('up')
                              ? 'text-green-600'
                              : metric.change.startsWith('-') || metric.change.includes('down')
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
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
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Details</h2>
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
    </MediaPlayerProvider>
  );
}
