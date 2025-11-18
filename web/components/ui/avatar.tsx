'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    if (src) {
      console.log('Avatar src:', src);
    } else {
      console.log('Avatar src is null/undefined, showing fallback');
    }
  }, [src]);

  // Get initials from fallback text (e.g., "John Doe" -> "JD")
  const getInitials = (text: string) => {
    const words = text.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center bg-primary text-white font-semibold text-sm">
          {fallback ? getInitials(fallback) : '?'}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load:', src, e);
            setImageError(true);
          }}
          onLoad={() => {
            console.log('Avatar image loaded successfully:', src);
          }}
        />
      )}
    </div>
  );
}
