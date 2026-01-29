import { useMemo } from 'react';
import { Button } from '@/components/common/Button';
import type { IconType } from 'react-icons';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// EMPTY STATE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCard: '#1e1c18',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);
  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '28px',
        boxShadow: colors.cardShadow,
        position: 'relative',
        overflow: 'hidden',
        padding: '48px 24px',
      }}
    >
      {/* Top edge highlight */}
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

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '16px',
            background: `${colors.accent}15`,
            borderRadius: '20px',
            marginBottom: '16px',
          }}
        >
          <Icon
            size={48}
            style={{
              color: colors.textMuted,
            }}
          />
        </div>

        <h3
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: colors.textPrimary,
            marginBottom: '8px',
          }}
        >
          {title}
        </h3>

        <p
          style={{
            fontSize: '14px',
            color: colors.textMuted,
            marginBottom: '24px',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {description}
        </p>

        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
