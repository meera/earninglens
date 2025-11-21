'use client';

import { useMediaPlayer } from './MediaPlayerContext';

interface Chapter {
  title: string;
  timestamp: number;
  summary?: string;
}

export function TableOfContents({ chapters }: { chapters: Chapter[] }) {
  const { seekTo } = useMediaPlayer();

  if (chapters.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Table of Contents</h2>
      <nav className="space-y-2">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => seekTo(chapter.timestamp)}
            className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {chapter.title}
          </button>
        ))}
      </nav>
    </div>
  );
}
