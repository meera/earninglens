import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors} from '../../types/brand';

interface CallToActionProps {
  message: string;
  url?: string;
  brandColors: BrandColors;
  showSubscribe?: boolean;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  message,
  url,
  brandColors,
  showSubscribe = true,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Slide up animation
  const slideY = spring({
    frame,
    fps,
    from: 100,
    to: 0,
    config: {damping: 12},
  });

  // Fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Button scale animation (pulsing)
  const buttonScale = 1 + Math.sin(frame / 10) * 0.05;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${brandColors.background}e6, ${
          brandColors.backgroundGradient?.[1] || brandColors.background
        }e6)`,
        backdropFilter: 'blur(20px)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
      }}
    >
      {/* Content container */}
      <div
        style={{
          transform: `translateY(${slideY}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
          textAlign: 'center',
        }}
      >
        {/* EarningLens branding */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: brandColors.text,
          }}
        >
          EarningLens
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 36,
            color: brandColors.textSecondary,
            fontWeight: 500,
            maxWidth: 900,
          }}
        >
          {message}
        </div>

        {/* URL (if provided) */}
        {url && (
          <div
            style={{
              fontSize: 32,
              color: brandColors.primary,
              fontWeight: 600,
              padding: '16px 32px',
              border: `2px solid ${brandColors.primary}`,
              borderRadius: 12,
              background: `${brandColors.primary}20`,
              boxShadow: `0 0 30px ${brandColors.primary}40`,
            }}
          >
            {url}
          </div>
        )}

        {/* Subscribe button (optional) */}
        {showSubscribe && (
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* Subscribe button */}
            <div
              style={{
                transform: `scale(${buttonScale})`,
                background: brandColors.primary,
                color: brandColors.background,
                fontSize: 28,
                fontWeight: 700,
                padding: '20px 48px',
                borderRadius: 50,
                boxShadow: `0 8px 30px ${brandColors.primary}60`,
                cursor: 'pointer',
              }}
            >
              SUBSCRIBE
            </div>

            {/* Arrow */}
            <div
              style={{
                fontSize: 48,
                color: brandColors.primary,
                animation: 'bounce 1s infinite',
              }}
            >
              →
            </div>

            {/* Bell icon */}
            <div
              style={{
                fontSize: 36,
                color: brandColors.textSecondary,
              }}
            >
              🔔
            </div>
          </div>
        )}

        {/* Social links or additional CTAs */}
        <div
          style={{
            marginTop: 60,
            display: 'flex',
            gap: 40,
            fontSize: 20,
            color: brandColors.textSecondary,
          }}
        >
          <span>📊 Interactive Charts</span>
          <span>📄 Full Transcripts</span>
          <span>💡 AI Insights</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
