import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors, Chapter} from '../../types/brand';

interface ChapterProgressProps {
  chapters: Chapter[];
  brandColors: BrandColors;
  position?: 'top' | 'bottom';
  showChapterName?: boolean;
}

export const ChapterProgress: React.FC<ChapterProgressProps> = ({
  chapters,
  brandColors,
  position = 'top',
  showChapterName = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const currentTimeSeconds = frame / fps;
  const totalDurationSeconds = durationInFrames / fps;

  // Find current chapter
  const currentChapter = chapters.reduce((prev, curr) => {
    return curr.timestamp <= currentTimeSeconds ? curr : prev;
  }, chapters[0]);

  const currentChapterIndex = chapters.indexOf(currentChapter);

  // Calculate progress percentage
  const progressPercent = (currentTimeSeconds / totalDurationSeconds) * 100;

  // Fade in animation
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        [position]: 0,
        left: 0,
        right: 0,
        opacity,
        zIndex: 50,
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: 6,
          background: `${brandColors.background}cc`,
          borderBottom: position === 'top' ? `1px solid ${brandColors.primary}20` : undefined,
          borderTop: position === 'bottom' ? `1px solid ${brandColors.primary}20` : undefined,
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${brandColors.primary}, ${brandColors.secondary})`,
            boxShadow: `0 0 10px ${brandColors.primary}`,
            transition: 'width 0.1s linear',
          }}
        />

        {/* Chapter markers */}
        {chapters.map((chapter, index) => {
          const markerPosition = (chapter.timestamp / totalDurationSeconds) * 100;
          const isActive = index === currentChapterIndex;

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${markerPosition}%`,
                top: 0,
                width: 2,
                height: '100%',
                background: isActive ? brandColors.primary : `${brandColors.textSecondary}60`,
                transform: isActive ? 'scaleY(1.5)' : 'scaleY(1)',
                transformOrigin: position === 'top' ? 'top' : 'bottom',
                transition: 'all 0.3s',
              }}
            />
          );
        })}
      </div>

      {/* Chapter name (optional) */}
      {showChapterName && (
        <div
          style={{
            padding: '8px 16px',
            background: `${brandColors.background}f0`,
            borderBottom: position === 'top' ? `1px solid ${brandColors.primary}40` : undefined,
            borderTop: position === 'bottom' ? `1px solid ${brandColors.primary}40` : undefined,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            {/* Chapter indicator */}
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: brandColors.primary,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Chapter {currentChapterIndex + 1}/{chapters.length}
            </div>

            {/* Chapter title */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: brandColors.text,
              }}
            >
              {currentChapter?.title || 'Introduction'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
