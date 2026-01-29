import { useMemo } from 'react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// SKELETON LOADER COMPONENT - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = ''
}: SkeletonProps) => {
  const { colors: themeColors, isDarkMode } = useThemeColor();
  const accentRgb = hexToRgb(themeColors.accent);

  const getBorderRadius = () => {
    switch (variant) {
      case 'circular': return '50%';
      case 'text': return '8px';
      case 'rectangular': return '16px';
      case 'card': return '24px';
      default: return '8px';
    }
  };

  const getDefaultHeight = () => {
    switch (variant) {
      case 'text': return '16px';
      case 'card': return '128px';
      default: return undefined;
    }
  };

  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '100%';
  const heightStyle = height
    ? (typeof height === 'number' ? `${height}px` : height)
    : (variant === 'circular' ? widthStyle : getDefaultHeight());

  // Colori skeleton adattivi per dark/light mode
  const skeletonBg = isDarkMode
    ? `linear-gradient(90deg, rgba(42, 39, 34, 0.5) 0%, rgba(${accentRgb}, 0.08) 50%, rgba(42, 39, 34, 0.5) 100%)`
    : `linear-gradient(90deg, rgba(220, 220, 220, 0.5) 0%, rgba(${accentRgb}, 0.08) 50%, rgba(220, 220, 220, 0.5) 100%)`;

  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: widthStyle,
        height: heightStyle,
        background: skeletonBg,
        backgroundSize: '200% 100%',
        borderRadius: getBorderRadius(),
      }}
    />
  );
};

// ============================================
// SKELETON CARD COMPONENT
// ============================================

export const SkeletonCard = () => {
  const { colors: themeColors, modeColors } = useThemeColor();

  const colors = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    return {
      ...modeColors,
      accentLight: themeColors.accentLight,
      border: `rgba(${accentRgb}, 0.15)`,
    };
  }, [themeColors, modeColors]);

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '24px',
        boxShadow: colors.cardShadow,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top edge highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="60%" />
            <Skeleton width="40%" />
          </div>
        </div>
        <Skeleton variant="rectangular" height={80} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton variant="rectangular" height={36} />
          <Skeleton variant="rectangular" height={36} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// SKELETON LIST COMPONENT
// ============================================

export const SkeletonList = ({ count = 3 }: { count?: number }) => {
  const { colors: themeColors, modeColors } = useThemeColor();

  const colors = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    return {
      ...modeColors,
      accentLight: themeColors.accentLight,
      border: `rgba(${accentRgb}, 0.15)`,
    };
  }, [themeColors, modeColors]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            boxShadow: colors.cardShadow,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top edge highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              right: '25%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
            }}
          />

          <Skeleton variant="circular" width={48} height={48} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton width="70%" />
            <Skeleton width="50%" />
          </div>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      ))}
    </div>
  );
};
