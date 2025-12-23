import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Loader2 } from 'lucide-react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// DEVICE CARD - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCard: '#1e1c18',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

interface DeviceCardProps {
  nome: string;
  isOn: boolean;
  isLoading?: boolean;
  onClick: () => void;
}

export const DeviceCard = ({ nome, isOn, isLoading, onClick }: DeviceCardProps) => {
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);

  return (
    <motion.button
      onClick={onClick}
      disabled={isLoading}
      className="p-4 text-left relative overflow-hidden w-full"
      style={{
        background: isOn
          ? `linear-gradient(165deg, ${colors.accent}12, ${colors.bgCard})`
          : colors.bgCardLit,
        border: `1px solid ${isOn ? colors.accent : colors.border}`,
        borderRadius: '24px', // radius.xl
        boxShadow: isOn
          ? `0 6px 28px ${colors.accent}20, ${colors.cardShadow}`
          : colors.cardShadowLit,
      }}
      whileHover={{
        scale: 1.02,
        borderColor: colors.accent,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
        y: -2,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Top edge highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '1px',
          background: isOn
            ? `linear-gradient(90deg, transparent, ${colors.accentLight}50, transparent)`
            : `linear-gradient(90deg, transparent, ${colors.accentLight}33, transparent)`,
        }}
      />

      {/* Radiant glow when ON */}
      {isOn && (
        <div
          style={{
            position: 'absolute',
            top: '-32px',
            right: '-32px',
            width: '112px',
            height: '112px',
            borderRadius: '50%',
            filter: 'blur(32px)',
            opacity: 0.3,
            background: `radial-gradient(circle, ${colors.accentLight}, transparent)`,
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          {/* Icon box */}
          <div
            style={{
              padding: '8px',
              background: isOn
                ? `linear-gradient(145deg, ${colors.accent}30, ${colors.accent}15)`
                : `${colors.textMuted}10`,
              borderRadius: '16px',
              boxShadow: isOn ? `0 2px 8px ${colors.accent}30` : 'none',
            }}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" style={{ color: colors.accent }} />
            ) : (
              <Lightbulb
                size={20}
                style={{
                  color: isOn ? colors.accentLight : colors.textMuted,
                  filter: isOn ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                }}
              />
            )}
          </div>

          {/* Custom Toggle - ESATTO dal preview */}
          <div
            style={{
              width: '44px',
              height: '24px',
              padding: '3px',
              borderRadius: '9999px',
              background: isOn
                ? `linear-gradient(90deg, ${colors.accentDark}, ${colors.accentLight})`
                : colors.toggleTrack,
              boxShadow: isOn
                ? `0 0 12px ${colors.accent}50, inset 0 1px 2px rgba(0,0,0,0.1)`
                : `inset 0 2px 4px rgba(0,0,0,0.3), inset 0 0 0 1px ${colors.toggleTrackBorder}`,
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
          >
            {/* Track marks for OFF state */}
            {!isOn && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: colors.textMuted,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '2px',
                    height: '2px',
                    borderRadius: '50%',
                    background: `${colors.textMuted}60`,
                  }}
                />
              </>
            )}
            {/* Knob */}
            <motion.div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isOn
                  ? 'linear-gradient(145deg, #ffffff, #f0f0f0)'
                  : 'linear-gradient(145deg, #e0e0e0, #c8c8c8)',
                boxShadow: isOn
                  ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)'
                  : '0 1px 3px rgba(0,0,0,0.3)',
              }}
              animate={{ x: isOn ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

        {/* Device name */}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: colors.textPrimary,
          }}
        >
          {nome || 'Dispositivo'}
        </h3>

        {/* Status */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: colors.textMuted,
            marginTop: '2px',
          }}
        >
          {isOn ? 'Acceso' : 'Spento'}
        </p>
      </div>
    </motion.button>
  );
};
