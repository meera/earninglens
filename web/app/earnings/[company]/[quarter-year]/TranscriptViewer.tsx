'use client';

import { useState } from 'react';

interface Paragraph {
  speaker: string;
  start: number;
  text: string;
}

interface TranscriptData {
  language: string;
  paragraphs: Paragraph[];
}

interface Speaker {
  speaker_id: string;
  speaker_name: string;
  role: string | null;
}

export function TranscriptViewer({
  transcript,
  speakers = []
}: {
  transcript: TranscriptData;
  speakers?: Speaker[];
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Create speaker name mapping
  const speakerMap = speakers.reduce((acc, speaker) => {
    acc[speaker.speaker_id] = speaker.speaker_name || speaker.speaker_id;
    return acc;
  }, {} as Record<string, string>);

  // Format timestamp (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter paragraphs based on search
  const filteredParagraphs = transcript.paragraphs.filter(p =>
    searchTerm === '' ||
    p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (speakerMap[p.speaker] || p.speaker).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="sticky top-0 bg-white z-10 pb-4">
        <input
          type="text"
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredParagraphs.length} of {transcript.paragraphs.length} segments
          </p>
        )}
      </div>

      {/* Transcript segments */}
      <div className="space-y-4">
        {filteredParagraphs.map((paragraph, index) => (
          <div
            key={index}
            className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {formatTime(paragraph.start)}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {speakerMap[paragraph.speaker] || paragraph.speaker}
              </span>
            </div>
            <p className="text-gray-900 leading-relaxed">
              {paragraph.text}
            </p>
          </div>
        ))}
      </div>

      {filteredParagraphs.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-gray-500">No results found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}
