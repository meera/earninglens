import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors} from '../../types/brand';

interface MetricDisplayProps {
  metric: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  brandColors: BrandColors;
  position?: 'center' | 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
  animationStyle?: 'fade' | 'slide-up' | 'bounce' | 'scale';
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  metric,
  value,
  change,
  changeType,
  brandColors,
  position = 'center',
  animationStyle = 'scale',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entry animation
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {
      damping: animationStyle === 'bounce' ? 8 : 12,
      stiffness: animationStyle === 'bounce' ? 100 : 80,
    },
  });

  const slideY = spring({
    frame,
    fps,
    from: 100,
    to: 0,
    config: {damping: 12},
  });

  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Exit animation (last 15 frames)
  const exitOpacity = interpolate(
    frame,
    [fps * 4.5, fps * 5],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const finalOpacity = Math.min(opacity, exitOpacity);

  // Determine color based on change type
  const changeColor =
    changeType === 'positive'
      ? brandColors.primary
      : changeType === 'negative'
      ? brandColors.accent
      : brandColors.textSecondary;

  const changeIcon =
    changeType === 'positive'
      ? '↑'
      : changeType === 'negative'
      ? '↓'
      : '→';

  // Position calculations
  const getPositionStyle = () => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      padding: 40,
    };

    switch (position) {
      case 'top-right':
        return {...baseStyle, justifyContent: 'flex-end', alignItems: 'flex-start'};
      case 'top-left':
        return {...baseStyle, justifyContent: 'flex-start', alignItems: 'flex-start'};
      case 'bottom-right':
        return {...baseStyle, justifyContent: 'flex-end', alignItems: 'flex-end'};
      case 'bottom-left':
        return {...baseStyle, justifyContent: 'flex-start', alignItems: 'flex-end'};
      case 'center':
      default:
        return {...baseStyle, justifyContent: 'center', alignItems: 'center'};
    }
  };

  const getTransform = () => {
    if (animationStyle === 'slide-up') {
      return `translateY(${slideY}px)`;
    } else if (animationStyle === 'scale' || animationStyle === 'bounce') {
      return `scale(${scale})`;
    }
    return 'none';
  };

  return (
    <AbsoluteFill style={getPositionStyle()}>
      <div
        style={{
          transform: getTransform(),
          opacity: finalOpacity,
          background: `linear-gradient(135deg, ${brandColors.background}, ${
            brandColors.backgroundGradient?.[1] || brandColors.background
          })`,
          border: `3px solid ${brandColors.primary}`,
          borderRadius: 20,
          padding: '40px 60px',
          boxShadow: `0 0 60px ${brandColors.primary}60, 0 10px 30px rgba(0, 0, 0, 0.5)`,
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Metric Label */}
        <div
          style={{
            fontSize: 28,
            color: brandColors.textSecondary,
            marginBottom: 12,
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {metric}
        </div>

        {/* Metric Value */}
        <div
          style={{
            fontSize: 72,
            color: brandColors.text,
            fontWeight: 700,
            marginBottom: 12,
            lineHeight: 1,
          }}
        >
          {value}
        </div>

        {/* Change Indicator */}
        <div
          style={{
            fontSize: 36,
            color: changeColor,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{fontSize: 42}}>{changeIcon}</span>
          {change}
        </div>
      </div>
    </AbsoluteFill>
  );
};
