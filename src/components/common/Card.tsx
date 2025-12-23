import { ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// CARD COMPONENT - Dark Luxury Style
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

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'active' | 'glass' | 'glass-dark' | 'solid' | 'glass-solid';
  padding?: boolean;
  hover?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = true,
  hover = false,
  onClick
}: CardProps) => {
  const { colors: themeColors } = useThemeColor();
  const isActive = variant === 'active';
  const paddingClass = padding ? 'p-4' : '';

  const colors = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    const accentLightRgb = hexToRgb(themeColors.accentLight);
    return {
      accent: themeColors.accent,
      accentLight: themeColors.accentLight,
      border: `rgba(${accentRgb}, 0.15)`,
      borderActive: `rgba(${accentRgb}, 0.5)`,
      borderHover: `rgba(${accentRgb}, 0.35)`,
      activeBg: `rgba(${accentRgb}, 0.12)`,
      activeShadow: `0 6px 28px rgba(${accentRgb}, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)`,
      highlightActive: `linear-gradient(90deg, transparent, rgba(${accentLightRgb}, 0.5), transparent)`,
      highlightDefault: `linear-gradient(90deg, transparent, rgba(${accentLightRgb}, 0.3), transparent)`,
    };
  }, [themeColors]);

  // Stili dinamici basati sul tema
  const cardStyle: React.CSSProperties = {
    background: isActive
      ? `linear-gradient(165deg, ${colors.activeBg}, #1e1c18)`
      : 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
    border: `1px solid ${isActive ? colors.borderActive : colors.border}`,
    borderRadius: '28px', // radius['2xl']
    boxShadow: isActive
      ? colors.activeShadow
      : '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  // Top edge highlight dinamico
  const highlightStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: isActive ? colors.highlightActive : colors.highlightDefault,
    pointerEvents: 'none',
  };

  if (hover || onClick) {
    return (
      <motion.div
        className={`${paddingClass} ${className}`}
        style={cardStyle}
        onClick={onClick}
        whileHover={{
          borderColor: colors.borderHover,
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
          y: -2,
        }}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.2 }}
      >
        <div style={highlightStyle} />
        {children}
      </motion.div>
    );
  }

  return (
    <div className={`${paddingClass} ${className}`} style={cardStyle}>
      <div style={highlightStyle} />
      {children}
    </div>
  );
};
