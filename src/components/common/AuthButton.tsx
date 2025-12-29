import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================
// AUTH BUTTON COMPONENT - Dark Luxury Style
// SENZA tema dinamico - sempre verde
// ============================================

// Colori fissi verdi
const colors = {
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  accentDark: '#4aa870',
};

interface AuthButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const AuthButton = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) => {
  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '14px' },
    lg: { padding: '16px 32px', fontSize: '16px' },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: `linear-gradient(165deg, ${colors.accentDark}, ${colors.accent})`,
          color: '#0a0a0c',
          border: 'none',
          boxShadow: '0 4px 16px rgba(106, 212, 160, 0.3)',
        };
      case 'secondary':
        return {
          background: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
          color: colors.accentLight,
          border: `1px solid ${colors.accent}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        };
      case 'ghost':
        return {
          background: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
          color: '#ffffff',
          border: '1px solid rgba(106, 212, 160, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
        };
      default:
        return {};
    }
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: '20px',
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
          ? '0 6px 24px rgba(106, 212, 160, 0.5)'
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
