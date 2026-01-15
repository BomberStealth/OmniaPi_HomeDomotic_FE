import { memo } from 'react';
import { motion } from 'framer-motion';
import { RiLightbulbLine, RiLoader4Line, RiLock2Line } from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';

// ============================================
// DEVICE CARD - Dark Luxury Style
// Con React.memo per evitare re-render inutili
// ============================================

interface DeviceCardProps {
  nome: string;
  isOn: boolean;
  isLoading?: boolean;
  bloccato?: boolean;
  onClick: () => void;
}

const DeviceCardComponent = ({ nome, isOn, isLoading, bloccato, onClick }: DeviceCardProps) => {
  const { colors } = useThemeColors();

  // Se bloccato, mostra stato disabilitato
  const isDisabled = bloccato || isLoading;

  return (
    <motion.button
      onClick={bloccato ? undefined : onClick}
      disabled={isDisabled}
      className="p-3 text-left relative overflow-hidden w-full"
      style={{
        background: bloccato
          ? colors.bgCardLit
          : isOn
            ? `linear-gradient(165deg, ${colors.accent}12, ${colors.bgCard})`
            : colors.bgCardLit,
        border: `1px solid ${bloccato ? 'rgba(100, 100, 100, 0.3)' : isOn ? colors.accent : colors.border}`,
        borderRadius: '24px',
        boxShadow: bloccato
          ? 'none'
          : isOn
            ? `0 6px 28px ${colors.accent}20, ${colors.cardShadow}`
            : colors.cardShadowLit,
        opacity: bloccato ? 0.6 : 1,
        cursor: bloccato ? 'not-allowed' : 'pointer',
      }}
      whileHover={bloccato ? undefined : {
        scale: 1.02,
        borderColor: colors.accent,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
        y: -2,
      }}
      whileTap={bloccato ? undefined : { scale: 0.98 }}
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
        <div className="flex items-center justify-between mb-2">
          {/* Icon box */}
          <div
            style={{
              padding: '8px',
              background: bloccato
                ? 'rgba(100, 100, 100, 0.15)'
                : isOn
                  ? `linear-gradient(145deg, ${colors.accent}30, ${colors.accent}15)`
                  : `${colors.textMuted}10`,
              borderRadius: '16px',
              boxShadow: bloccato ? 'none' : isOn ? `0 2px 8px ${colors.accent}30` : 'none',
            }}
          >
            {isLoading ? (
              <RiLoader4Line size={20} className="animate-spin" style={{ color: colors.accent }} />
            ) : bloccato ? (
              <RiLock2Line
                size={20}
                style={{
                  color: 'rgba(150, 150, 150, 0.7)',
                }}
              />
            ) : (
              <RiLightbulbLine
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
              minWidth: '44px',
              maxWidth: '44px',
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
              overflow: 'hidden',
              flexShrink: 0,
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
            color: bloccato ? 'rgba(150, 150, 150, 0.8)' : colors.textPrimary,
          }}
        >
          {nome || 'Dispositivo'}
        </h3>

        {/* Status */}
        <p
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: bloccato ? 'rgba(239, 68, 68, 0.7)' : colors.textMuted,
            marginTop: '2px',
          }}
        >
          {bloccato ? 'Bloccato' : isOn ? 'Acceso' : 'Spento'}
        </p>
      </div>
    </motion.button>
  );
};

// React.memo per evitare re-render quando props non cambiano
export const DeviceCard = memo(DeviceCardComponent);
