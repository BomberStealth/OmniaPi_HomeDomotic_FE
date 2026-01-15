import { useMemo } from 'react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// HOOK useThemeColors - Colori tema centralizzati
// Elimina duplicazione di hexToRgb e baseColors
// ============================================

// Helper per convertire hex a rgb - UNICA DEFINIZIONE
export const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160'; // fallback emerald
};

// Colori base invarianti - UNICA DEFINIZIONE
export const baseColors = {
  // Background
  bg: '#12110f',
  bgCard: '#1e1c18',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  bgCardSolid: '#1a1816',

  // Text
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  textSecondary: 'rgba(255, 255, 255, 0.75)',

  // Shadows
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',

  // Toggle
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
} as const;

// Hook principale
export const useThemeColors = () => {
  const { colors: themeColors, colorTheme, modeColors, isDarkMode } = useThemeColor();

  // Memoizza i colori derivati per evitare ricalcolo ad ogni render
  const colors = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    const accentLightRgb = hexToRgb(themeColors.accentLight);

    return {
      // Include tutti i colori dal mode (dark/light)
      ...modeColors,

      // Colori accent dal tema
      accent: themeColors.accent,
      accentLight: themeColors.accentLight,
      accentDark: themeColors.accentDark,
      accentGlow: themeColors.accentGlow,

      // Colori RGB per uso in rgba()
      accentRgb,
      accentLightRgb,

      // Bordi derivati
      border: `rgba(${accentRgb}, 0.15)`,
      borderActive: `rgba(${accentRgb}, 0.5)`,
      borderHover: `rgba(${accentRgb}, 0.35)`,

      // Background accent
      activeBg: `rgba(${accentRgb}, 0.12)`,
      activeShadow: `0 6px 28px rgba(${accentRgb}, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)`,

      // Highlights
      highlightActive: `linear-gradient(90deg, transparent, rgba(${accentLightRgb}, 0.5), transparent)`,
      highlightDefault: `linear-gradient(90deg, transparent, rgba(${accentLightRgb}, 0.3), transparent)`,

      // Glow effects
      accentGlowShadow: `0 0 12px ${themeColors.accent}50`,
      accentGlowStrong: `0 4px 16px rgba(${accentRgb}, 0.3)`,
    };
  }, [themeColors, modeColors]);

  return { colors, colorTheme, isDarkMode };
};

export default useThemeColors;
