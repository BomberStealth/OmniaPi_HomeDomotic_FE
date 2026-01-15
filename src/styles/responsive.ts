// ============================================
// OMNIAPI - RESPONSIVE DESIGN TOKENS
// ============================================

export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
  xxl: 1440,
};

export const spacing = {
  xs: 'clamp(4px, 1vw, 8px)',
  sm: 'clamp(8px, 2vw, 12px)',
  md: 'clamp(12px, 3vw, 16px)',
  lg: 'clamp(16px, 4vw, 24px)',
  xl: 'clamp(20px, 5vw, 32px)',
};

export const fontSize = {
  xs: 'clamp(10px, 2.5vw, 12px)',
  sm: 'clamp(12px, 3vw, 14px)',
  md: 'clamp(14px, 3.5vw, 16px)',
  lg: 'clamp(16px, 4vw, 20px)',
  xl: 'clamp(20px, 5vw, 28px)',
  xxl: 'clamp(24px, 6vw, 36px)',
};

export const radius = {
  sm: 'clamp(6px, 1.5vw, 10px)',
  md: 'clamp(10px, 2.5vw, 16px)',
  lg: 'clamp(14px, 3.5vw, 24px)',
  xl: 'clamp(18px, 4.5vw, 32px)',
};

export const iconSize = {
  sm: 'clamp(16px, 4vw, 20px)',
  md: 'clamp(20px, 5vw, 28px)',
  lg: 'clamp(28px, 7vw, 40px)',
  xl: 'clamp(40px, 10vw, 64px)',
};

export const getIconSizeNum = (size: 'sm' | 'md' | 'lg' | 'xl'): number => {
  const map = { sm: 18, md: 24, lg: 32, xl: 48 };
  return map[size];
};
