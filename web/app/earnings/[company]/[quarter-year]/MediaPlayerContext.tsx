'use client';

import { createContext, useContext, useRef, ReactNode } from 'react';

interface MediaPlayerContextType {
  seekTo: (seconds: number) => void;
  registerPlayer: (ref: HTMLMediaElement) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | null>(null);

export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<HTMLMediaElement | null>(null);

  const registerPlayer = (ref: HTMLMediaElement) => {
    playerRef.current = ref;
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = seconds;
      playerRef.current.play();
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <MediaPlayerContext.Provider value={{ seekTo, registerPlayer }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error('useMediaPlayer must be used within MediaPlayerProvider');
  }
  return context;
}
