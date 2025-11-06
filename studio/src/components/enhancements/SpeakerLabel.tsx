import {Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors} from '../../types/brand';

interface SpeakerLabelProps {
  name: string;
  title: string;
  photoUrl?: string;
  brandColors: BrandColors;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showPhoto?: boolean;
}

export const SpeakerLabel: React.FC<SpeakerLabelProps> = ({
  name,
  title,
  photoUrl,
  brandColors,
  position = 'bottom-left',
  showPhoto = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Slide in animation
  const slideX = interpolate(frame, [0, 20], [position.includes('left') ? -300 : 300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade in
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit animation (last 15 frames)
  const exitX = interpolate(
    frame,
    [fps * 4.5, fps * 5],
    [0, position.includes('left') ? -300 : 300],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const exitOpacity = interpolate(
    frame,
    [fps * 4.5, fps * 5],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const finalX = frame < fps * 4.5 ? slideX : exitX;
  const finalOpacity = Math.min(opacity, exitOpacity);

  // Position style
  const getPositionStyle = (): React.CSSProperties => {
    const margin = 40;

    switch (position) {
      case 'top-right':
        return {top: margin, right: margin};
      case 'top-left':
        return {top: margin, left: margin};
      case 'bottom-right':
        return {bottom: margin, right: margin};
      case 'bottom-left':
      default:
        return {bottom: margin, left: margin};
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...getPositionStyle(),
        transform: `translateX(${finalX}px)`,
        opacity: finalOpacity,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: `linear-gradient(135deg, ${brandColors.background}e6, ${brandColors.backgroundGradient?.[1] || brandColors.background}e6)`,
          border: `2px solid ${brandColors.primary}`,
          borderRadius: 12,
          padding: '16px 24px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 20px ${brandColors.primary}40`,
        }}
      >
        {/* Photo (if provided and enabled) */}
        {showPhoto && photoUrl && (
          <Img
            src={photoUrl}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              border: `2px solid ${brandColors.primary}`,
            }}
          />
        )}

        {/* Text content */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: brandColors.text,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: brandColors.textSecondary,
            }}
          >
            {title}
          </div>
        </div>

        {/* Brand accent line */}
        <div
          style={{
            width: 4,
            height: 56,
            background: brandColors.primary,
            borderRadius: 2,
            boxShadow: `0 0 10px ${brandColors.primary}`,
          }}
        />
      </div>
    </div>
  );
};
