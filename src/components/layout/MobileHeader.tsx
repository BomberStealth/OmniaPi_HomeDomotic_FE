import { useMemo } from 'react';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// MOBILE HEADER - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const MobileHeader = () => {
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-40"
      style={{
        background: colors.bgCardLit,
        borderBottom: `1px solid ${colors.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: colors.cardShadow,
      }}
    >
      {/* Top edge highlight - esatto dal preview */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
        }}
      />
      <div className="px-4 py-3">
        <ImpiantoSelector variant="mobile" />
      </div>
    </div>
  );
};
