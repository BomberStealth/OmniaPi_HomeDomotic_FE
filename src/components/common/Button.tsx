import { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { radius } from '@/styles/responsive';

// ============================================
// BUTTON COMPONENT - Dark Luxury Style
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

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  style: styleProp,
  ...props
}: ButtonProps) => {
  const { colors: themeColors, modeColors, isDarkMode, useGradients } = useThemeColor();

  const sizeStyles = {
    sm: { padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)', fontSize: 'clamp(11px, 2.8vw, 13px)' },
    md: { padding: 'clamp(10px, 2.5vw, 12px) clamp(18px, 4.5vw, 24px)', fontSize: 'clamp(12px, 3vw, 14px)' },
    lg: { padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 32px)', fontSize: 'clamp(14px, 3.5vw, 16px)' },
  };

  const getVariantStyles = useMemo(() => (): React.CSSProperties => {
    const accentRgb = hexToRgb(themeColors.accent);
    switch (variant) {
      case 'primary':
        return {
          background: useGradients
            ? themeColors.gradient
            : themeColors.accent,
          color: isDarkMode ? '#0a0a0c' : '#ffffff',
          border: 'none',
          boxShadow: `0 4px 16px rgba(${accentRgb}, 0.3)`,
        };
      case 'secondary':
        return {
          background: modeColors.bgCard,
          color: themeColors.accentLight,
          border: `1px solid ${themeColors.accent}`,
          boxShadow: modeColors.cardShadow,
        };
      case 'ghost':
        return {
          background: modeColors.bgCard,
          color: modeColors.textPrimary,
          border: `1px solid rgba(${accentRgb}, 0.15)`,
          boxShadow: modeColors.cardShadow,
        };
      case 'danger':
        return {
          background: 'linear-gradient(165deg, #dc2626, #ef4444)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
        };
      case 'glass':
        return {
          background: modeColors.bgCard,
          color: modeColors.textSecondary,
          border: `1px solid rgba(${accentRgb}, 0.15)`,
          boxShadow: modeColors.cardShadow,
          backdropFilter: 'blur(12px)',
        };
      default:
        return {};
    }
  }, [variant, themeColors, modeColors, isDarkMode, useGradients]);

  const accentRgb = hexToRgb(themeColors.accent);

  const baseStyles: React.CSSProperties = {
    borderRadius: radius.lg,
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...sizeStyles[size],
    ...getVariantStyles(),
    ...styleProp,
  };

  return (
    <motion.button
      style={baseStyles}
      className={className}
      disabled={disabled}
      whileHover={!disabled ? {
        y: -2,
        scale: 1.02,
        boxShadow: variant === 'primary'
          ? `0 6px 24px rgba(${accentRgb}, 0.5)`
          : '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
      } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
