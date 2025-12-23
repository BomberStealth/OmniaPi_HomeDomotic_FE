// ============================================
// DARK LUXURY THEME - Valori esatti da StylePreview.tsx
// Usare SOLO questi valori in TUTTA l'app
// ============================================

export const theme = {
  // Background
  bg: '#0a0a09',
  bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(106, 212, 160, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)',
  ambientGlow: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(106, 212, 160, 0.06) 0%, transparent 70%)',

  // Card backgrounds
  bgCard: '#1e1c18',
  bgCardHover: '#262420',
  bgCardSolid: '#1a1816',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',

  // Accent colors (Emerald)
  accent: '#6ad4a0',
  accentLight: '#a0e8c4',
  accentGlow: '#b8f0d4',
  accentDark: '#4aa870',

  // Borders
  border: 'rgba(106, 212, 160, 0.15)',
  borderHover: 'rgba(106, 212, 160, 0.35)',
  borderActive: 'rgba(160, 232, 196, 0.5)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',

  // Shadows
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',

  // Toggle
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',

  // Border radius
  radius: {
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '28px',
    full: '9999px',
  },

  // Typography
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
};

// Helper per stili card base
export const cardStyle = {
  background: theme.bgCardLit,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius['2xl'],
  boxShadow: theme.cardShadowLit,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

// Helper per stili card attiva
export const cardActiveStyle = {
  background: `linear-gradient(165deg, ${theme.accent}12, ${theme.bgCard})`,
  border: `1px solid ${theme.accent}`,
  borderRadius: theme.radius['2xl'],
  boxShadow: `0 6px 28px ${theme.accent}20, ${theme.cardShadow}`,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

// Helper per top edge highlight
export const topHighlightStyle = {
  position: 'absolute' as const,
  top: 0,
  left: '25%',
  right: '25%',
  height: '1px',
  background: `linear-gradient(90deg, transparent, ${theme.accentLight}4D, transparent)`,
  pointerEvents: 'none' as const,
};
