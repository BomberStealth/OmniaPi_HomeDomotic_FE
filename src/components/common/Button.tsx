import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

// ============================================
// BUTTON COMPONENT (GLASS EFFECT)
// ============================================

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/50 dark:shadow-primary/50 light:shadow-primary/20',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white shadow-lg shadow-secondary/50 dark:shadow-secondary/50 light:shadow-secondary/20',
    glass: 'glass hover:bg-opacity-20 dark:text-copy light:text-copy-light',
    danger: 'bg-error hover:bg-error-dark text-white shadow-lg shadow-error/50 dark:shadow-error/50 light:shadow-error/20'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
