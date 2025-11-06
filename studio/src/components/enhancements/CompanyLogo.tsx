import {Img, interpolate, useCurrentFrame} from 'remotion';
import {BrandColors} from '../../types/brand';

interface CompanyLogoProps {
  logoUrl: string;
  brandColors: BrandColors;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'small' | 'medium' | 'large';
  opacity?: number;
  persistent?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  logoUrl,
  brandColors,
  position = 'top-left',
  size = 'small',
  opacity: customOpacity,
  persistent = true,
}) => {
  const frame = useCurrentFrame();

  // Size mapping
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const logoSize = sizeMap[size];

  // Position mapping
  const getPositionStyle = (): React.CSSProperties => {
    const margin = 32;

    switch (position) {
      case 'top-right':
        return {top: margin, right: margin};
      case 'bottom-left':
        return {bottom: margin, left: margin};
      case 'bottom-right':
        return {bottom: margin, right: margin};
      case 'top-left':
      default:
        return {top: margin, left: margin};
    }
  };

  // Fade in animation
  const fadeIn = interpolate(frame, [0, 30], [0, customOpacity ?? 0.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        ...getPositionStyle(),
        opacity: fadeIn,
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: logoSize,
          height: logoSize,
          borderRadius: 16,
          background: `${brandColors.primary}20`,
          border: `2px solid ${brandColors.primary}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 20px ${brandColors.primary}30`,
        }}
      >
        <Img
          src={logoUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
};
