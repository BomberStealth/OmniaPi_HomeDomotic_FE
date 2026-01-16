import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine,
  RiLightbulbFlashLine,
  RiLoader4Line,
  RiPaletteLine,
  RiSunLine,
  RiMagicLine,
} from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { LedDevice } from '@/services/omniapiApi';
import { useOmniapiStore } from '@/store/omniapiStore';

// ============================================
// LED STRIP CARD COMPONENT - Dark Luxury Style
// Controllo LED Strip con color picker, brightness, effetti
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 255, b: 0 };
};

// Helper per convertire rgb a hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
};

// Helper per convertire hex tema a rgb string
const hexToRgbString = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Definizione effetti LED
const LED_EFFECTS = [
  { id: 0, name: 'Static', icon: '⬤', description: 'Colore fisso' },
  { id: 1, name: 'Rainbow', icon: '🌈', description: 'Arcobaleno' },
  { id: 2, name: 'Breathing', icon: '💨', description: 'Respiro' },
  { id: 3, name: 'Chase', icon: '🏃', description: 'Inseguimento' },
  { id: 4, name: 'Sparkle', icon: '✨', description: 'Scintillio' },
  { id: 5, name: 'Fire', icon: '🔥', description: 'Fuoco' },
];

interface LedStripCardProps {
  device: LedDevice;
}

export const LedStripCard = ({ device }: LedStripCardProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { sendLedCommand } = useOmniapiStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const colors = useMemo(
    () => ({
      ...modeColors,
      accent: themeColors.accent,
      accentLight: themeColors.accentLight,
      accentDark: themeColors.accentDark,
      border: `rgba(${hexToRgbString(themeColors.accent)}, 0.15)`,
    }),
    [themeColors, modeColors]
  );

  const currentColor = rgbToHex(device.r || 0, device.g || 255, device.b || 0);

  const handlePower = useCallback(
    async (on: boolean) => {
      setIsLoading(true);
      setLoadingAction(on ? 'on' : 'off');
      try {
        await sendLedCommand(device.mac, on ? 'on' : 'off');
      } finally {
        setIsLoading(false);
        setLoadingAction(null);
      }
    },
    [device.mac, sendLedCommand]
  );

  const handleColorChange = useCallback(
    async (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      await sendLedCommand(device.mac, 'set_color', { r, g, b });
    },
    [device.mac, sendLedCommand]
  );

  const handleBrightnessChange = useCallback(
    async (value: number) => {
      await sendLedCommand(device.mac, 'set_brightness', { brightness: value });
    },
    [device.mac, sendLedCommand]
  );

  const handleEffectChange = useCallback(
    async (effectId: number) => {
      setLoadingAction(`effect-${effectId}`);
      try {
        await sendLedCommand(device.mac, 'set_effect', { effect: effectId });
      } finally {
        setLoadingAction(null);
      }
    },
    [device.mac, sendLedCommand]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: device.online ? colors.bgCardLit : colors.bgCard,
        border: `1px solid ${device.online ? colors.border : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '24px',
        padding: '20px',
        boxShadow: device.power
          ? `0 8px 32px ${currentColor}30, 0 0 60px ${currentColor}15`
          : colors.cardShadow,
        position: 'relative',
        overflow: 'hidden',
        opacity: device.online ? 1 : 0.7,
      }}
    >
      {/* Top edge highlight with current color */}
      {device.online && device.power && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${currentColor}, transparent)`,
            boxShadow: `0 0 10px ${currentColor}`,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: device.power
                ? `linear-gradient(135deg, ${currentColor}40, ${currentColor}20)`
                : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: device.power ? `0 0 20px ${currentColor}40` : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {device.power ? (
              <RiLightbulbFlashLine
                size={24}
                style={{ color: currentColor, filter: `drop-shadow(0 0 4px ${currentColor})` }}
              />
            ) : (
              <RiLightbulbLine size={24} style={{ color: colors.textMuted }} />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: '2px',
              }}
            >
              LED Strip
            </div>
            <div
              style={{
                fontSize: '11px',
                color: colors.textMuted,
                fontFamily: 'monospace',
              }}
            >
              {device.mac}
            </div>
          </div>
        </div>

        {/* Online Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: device.online ? `${colors.success}15` : `${colors.error}15`,
            border: `1px solid ${device.online ? `${colors.success}30` : `${colors.error}30`}`,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: device.online ? colors.success : colors.error,
              boxShadow: device.online ? `0 0 8px ${colors.success}` : 'none',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: device.online ? colors.success : colors.error,
            }}
          >
            {device.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Power Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <motion.button
          onClick={() => handlePower(true)}
          disabled={!device.online || isLoading}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '16px',
            background: device.power
              ? `linear-gradient(135deg, ${colors.success}30, ${colors.success}15)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${device.power ? `${colors.success}50` : 'rgba(255,255,255,0.1)'}`,
            cursor: !device.online || isLoading ? 'not-allowed' : 'pointer',
            opacity: !device.online ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: device.power ? `0 0 20px ${colors.success}20` : 'none',
            transition: 'all 0.3s ease',
          }}
          whileHover={device.online && !isLoading ? { scale: 1.02 } : undefined}
          whileTap={device.online && !isLoading ? { scale: 0.98 } : undefined}
        >
          {loadingAction === 'on' ? (
            <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.success }} />
          ) : (
            <RiLightbulbFlashLine
              size={18}
              style={{ color: device.power ? colors.success : colors.textMuted }}
            />
          )}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: device.power ? colors.success : colors.textMuted,
            }}
          >
            ON
          </span>
        </motion.button>

        <motion.button
          onClick={() => handlePower(false)}
          disabled={!device.online || isLoading}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '16px',
            background: !device.power
              ? `linear-gradient(135deg, ${colors.error}30, ${colors.error}15)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${!device.power ? `${colors.error}50` : 'rgba(255,255,255,0.1)'}`,
            cursor: !device.online || isLoading ? 'not-allowed' : 'pointer',
            opacity: !device.online ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: !device.power ? `0 0 20px ${colors.error}20` : 'none',
            transition: 'all 0.3s ease',
          }}
          whileHover={device.online && !isLoading ? { scale: 1.02 } : undefined}
          whileTap={device.online && !isLoading ? { scale: 0.98 } : undefined}
        >
          {loadingAction === 'off' ? (
            <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.error }} />
          ) : (
            <RiLightbulbLine
              size={18}
              style={{ color: !device.power ? colors.error : colors.textMuted }}
            />
          )}
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: !device.power ? colors.error : colors.textMuted,
            }}
          >
            OFF
          </span>
        </motion.button>
      </div>

      {/* Color Picker Section */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <RiPaletteLine size={16} style={{ color: colors.accent }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
            Colore
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={!device.online || !device.power}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              cursor: device.online && device.power ? 'pointer' : 'not-allowed',
              opacity: device.online && device.power ? 1 : 0.5,
              background: 'transparent',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '12px',
              background: currentColor,
              boxShadow: device.power ? `0 0 20px ${currentColor}60` : 'none',
              pointerEvents: 'none',
              transition: 'all 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Brightness Slider */}
      <div
        style={{
          marginBottom: '20px',
          padding: '16px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiSunLine size={16} style={{ color: colors.accent }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
              Luminosita
            </span>
          </div>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: colors.textPrimary,
              fontFamily: 'monospace',
            }}
          >
            {device.brightness || 0}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="255"
          value={device.brightness || 128}
          onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
          disabled={!device.online || !device.power}
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            appearance: 'none',
            cursor: device.online && device.power ? 'pointer' : 'not-allowed',
            opacity: device.online && device.power ? 1 : 0.5,
            background: `linear-gradient(to right, #333 0%, ${currentColor} 100%)`,
          }}
        />
      </div>

      {/* Effects Grid */}
      <div
        style={{
          padding: '16px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <RiMagicLine size={16} style={{ color: colors.accent }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary }}>
            Effetto
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {LED_EFFECTS.map((effect) => (
            <motion.button
              key={effect.id}
              onClick={() => handleEffectChange(effect.id)}
              disabled={!device.online || !device.power}
              style={{
                padding: '10px 8px',
                borderRadius: '12px',
                background:
                  device.effect === effect.id
                    ? `linear-gradient(135deg, ${colors.accent}30, ${colors.accentDark}20)`
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${
                  device.effect === effect.id ? `${colors.accent}50` : 'rgba(255,255,255,0.1)'
                }`,
                cursor: device.online && device.power ? 'pointer' : 'not-allowed',
                opacity: device.online && device.power ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                boxShadow:
                  device.effect === effect.id ? `0 0 15px ${colors.accent}20` : 'none',
                transition: 'all 0.3s ease',
              }}
              whileHover={device.online && device.power ? { scale: 1.05 } : undefined}
              whileTap={device.online && device.power ? { scale: 0.95 } : undefined}
            >
              {loadingAction === `effect-${effect.id}` ? (
                <RiLoader4Line
                  size={16}
                  className="animate-spin"
                  style={{ color: colors.accent }}
                />
              ) : (
                <span style={{ fontSize: '16px' }}>{effect.icon}</span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color:
                    device.effect === effect.id ? colors.accent : colors.textMuted,
                }}
              >
                {effect.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default LedStripCard;
