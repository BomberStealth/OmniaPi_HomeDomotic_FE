import { ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================
// CARD COMPONENT (GLASS EFFECT)
// ============================================

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'glass-dark' | 'solid';
  padding?: boolean;
  hover?: boolean;
}

export const Card = ({
  children,
  className = '',
  variant = 'glass',
  padding = true,
  hover = false
}: CardProps) => {
  const variantClasses = {
    glass: 'glass',
    'glass-dark': 'glass-dark',
    solid: 'glass-solid'
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
      {...motionProps}
    >
      {children}
    </Component>
  );
};
