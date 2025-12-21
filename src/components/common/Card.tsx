import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================
// CARD COMPONENT (GLASS EFFECT)
// ============================================

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'glass-dark' | 'solid' | 'glass-solid';
  padding?: boolean;
  hover?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card = ({
  children,
  className = '',
  variant = 'glass',
  padding = true,
  hover = false,
  onClick
}: CardProps) => {
  const variantClasses = {
    glass: 'glass',
    'glass-dark': 'glass-dark',
    solid: 'glass-solid',
    'glass-solid': 'glass-solid'
  };

  const paddingClass = padding ? 'p-6' : '';
  const hoverClass = hover ? 'hover:scale-[1.02] cursor-pointer' : '';

  const Component = hover ? motion.div : 'div';
  const motionProps = hover
    ? {
        whileHover: { scale: 1.02 },
        transition: { duration: 0.2 }
      }
    : {};

  return (
    <Component
      className={`rounded-2xl ${variantClasses[variant]} ${paddingClass} ${hoverClass} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
};
