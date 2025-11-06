import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors} from '../../types/brand';

interface AnimatedTitleProps {
  company: string;
  quarter: string;
  year: number;
  brandColors: BrandColors;
  logo?: string;
  subtitle?: string;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  company,
  quarter,
  year,
  brandColors,
  logo,
  subtitle = 'Earnings Call',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame: frame - 5,
    fps,
    from: 0,
    to: 1,
    config: {damping: 10},
  });

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Company name slide up
  const companySlide = spring({
    frame: frame - 15,
    fps,
    from: 100,
    to: 0,
    config: {damping: 12},
  });

  const companyOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Quarter/Year slide up
  const quarterSlide = spring({
    frame: frame - 25,
    fps,
    from: 100,
    to: 0,
    config: {damping: 12},
  });

  const quarterOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Underline animation
  const underlineWidth = interpolate(frame, [35, 60], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit animation (last 30 frames)
  const exitOpacity = interpolate(
    frame,
    [fps * 4.5, fps * 5],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${brandColors.background} 0%, ${
          brandColors.backgroundGradient?.[1] || brandColors.background
        } 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exitOpacity,
      }}
    >
      {/* Animated background glow */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 50% 50%, ${brandColors.primary}20 0%, transparent 70%)`,
          opacity: interpolate(frame, [0, 60], [0, 1]),
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        {/* Logo */}
        {logo && (
          <div
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            <Img
              src={logo}
              style={{
                width: 140,
                height: 140,
                borderRadius: 20,
                boxShadow: `0 0 40px ${brandColors.primary}60`,
              }}
            />
          </div>
        )}

        {/* Company Name */}
        <div
          style={{
            transform: `translateY(${companySlide}px)`,
            opacity: companyOpacity,
            fontSize: 84,
            fontWeight: 700,
            color: brandColors.text,
            textAlign: 'center',
            letterSpacing: '-1px',
          }}
        >
          {company}
        </div>

        {/* Animated underline */}
        <div
          style={{
            width: '600px',
            height: 6,
            background: brandColors.primary,
            borderRadius: 3,
            clipPath: `inset(0 ${100 - underlineWidth}% 0 0)`,
            boxShadow: `0 0 20px ${brandColors.primary}`,
          }}
        />

        {/* Quarter and Year */}
        <div
          style={{
            transform: `translateY(${quarterSlide}px)`,
            opacity: quarterOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 56,
              color: brandColors.primary,
              fontWeight: 600,
            }}
          >
            {quarter} {year}
          </span>
          <span
            style={{
              fontSize: 48,
              color: brandColors.textSecondary,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* EarningLens branding */}
        <div
          style={{
            marginTop: 40,
            opacity: interpolate(frame, [50, 70], [0, 1]),
            fontSize: 24,
            color: brandColors.textSecondary,
            fontWeight: 500,
          }}
        >
          EarningLens.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
