import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================
// AUTH CARD COMPONENT - Dark Luxury Style
// SENZA tema dinamico - sempre verde
// ============================================

// Colori fissi verdi
const colors = {
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  border: 'rgba(106, 212, 160, 0.15)',
  borderActive: 'rgba(106, 212, 160, 0.5)',
  borderHover: 'rgba(106, 212, 160, 0.35)',
  activeBg: 'rgba(106, 212, 160, 0.12)',
  activeShadow: '0 6px 28px rgba(106, 212, 160, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  highlightActive: 'linear-gradient(90deg, transparent, rgba(160, 232, 196, 0.5), transparent)',
  highlightDefault: 'linear-gradient(90deg, transparent, rgba(160, 232, 196, 0.3), transparent)',
};

interface AuthCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'active';
  padding?: boolean;
  hover?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const AuthCard = ({
  children,
  className = '',
  variant = 'default',
  padding = true,
  hover = false,
  onClick
}: AuthCardProps) => {
  const isActive = variant === 'active';
  const paddingClass = padding ? 'p-4' : '';

  const cardStyle: React.CSSProperties = {
    background: isActive
      ? `linear-gradient(165deg, ${colors.activeBg}, #1e1c18)`
      : 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
    border: `1px solid ${isActive ? colors.borderActive : colors.border}`,
    borderRadius: '28px',
    boxShadow: isActive
      ? colors.activeShadow
      : '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

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
