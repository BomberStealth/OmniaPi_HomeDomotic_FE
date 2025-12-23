import { ButtonHTMLAttributes, ReactNode, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';

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
  ...props
}: ButtonProps) => {
  const { colors: themeColors } = useThemeColor();

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '14px' },
    lg: { padding: '16px 32px', fontSize: '16px' },
  };

  const getVariantStyles = useMemo(() => (): React.CSSProperties => {
    const accentRgb = hexToRgb(themeColors.accent);
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(165deg, ${themeColors.accentDark}, ${themeColors.accent})`,
          color: '#0a0a0c',
          border: 'none',
          boxShadow: `0 4px 16px rgba(${accentRgb}, 0.3)`,
        };
      case 'secondary':
        return {
          background: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
          color: themeColors.accentLight,
          border: `1px solid ${themeColors.accent}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        };
      case 'ghost':
        return {
          background: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
          color: '#ffffff',
          border: `1px solid rgba(${accentRgb}, 0.15)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
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
          background: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
          color: 'rgba(255, 255, 255, 0.75)',
          border: `1px solid rgba(${accentRgb}, 0.15)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        };
      default:
        return {};
    }
  }, [variant, themeColors]);

  const accentRgb = hexToRgb(themeColors.accent);

  const baseStyles: React.CSSProperties = {
    borderRadius: '20px', // radius.lg
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
