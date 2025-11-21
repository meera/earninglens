'use client';

import { useState, useRef, useEffect } from 'react';
import { useMediaPlayer } from './MediaPlayerContext';

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

export function EarningsCallViewer({
  mediaUrl,
  transcript,
  speakers = []
}: {
  mediaUrl: string | null;
  transcript: TranscriptData | null;
  speakers?: Speaker[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { registerPlayer } = useMediaPlayer();

  // Register the media player with context
  useEffect(() => {
    if (videoRef.current) {
      registerPlayer(videoRef.current);
    }
  }, [mediaUrl, registerPlayer]);

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

  // Seek to timestamp
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Filter paragraphs based on search
  const filteredParagraphs = transcript?.paragraphs.filter(p =>
    searchTerm === '' ||
    p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (speakerMap[p.speaker] || p.speaker).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Detect if media is audio or video based on file extension
  const isAudio = mediaUrl?.match(/\.(mp3|m4a|wav|aac)(\?|$)/i);

  return (
    <div className="space-y-8">
      {/* Video/Audio Player */}
      {mediaUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4 z-20">
          <h2 className="text-xl font-semibold mb-4">Recording</h2>
          {isAudio ? (
            <audio
              ref={videoRef as any}
              controls
              className="w-full"
              preload="metadata"
              src={mediaUrl}
            >
              Your browser does not support the audio element.
            </audio>
          ) : (
            <video
              ref={videoRef}
              controls
              className="w-full rounded"
              preload="metadata"
              src={mediaUrl}
            >
              Your browser does not support the video element.
            </video>
          )}
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Full Transcript</h2>

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
          <div className="space-y-4 mt-4">
            {filteredParagraphs.map((paragraph, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => seekTo(paragraph.start)}
                    className="text-xs font-mono text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    title="Click to seek to this timestamp"
                  >
                    {formatTime(paragraph.start)}
                  </button>
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
              <p className="text-gray-500">No results found for &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
