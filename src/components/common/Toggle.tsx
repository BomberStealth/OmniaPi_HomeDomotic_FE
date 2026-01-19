import { motion } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// TOGGLE COMPONENT - Unified Toggle Switch
// Supporta gradienti dal tema
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export type ToggleSize = 'sm' | 'md' | 'lg';

interface ToggleProps {
  isOn: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  visualOnly?: boolean; // Solo visualizzazione, nessuna interazione (mantiene opacità piena)
  size?: ToggleSize;
  accentColor?: string; // Override del colore accent
}

const sizeConfig = {
  sm: { width: 36, height: 20, thumb: 14, travel: 14, padding: 3 },
  md: { width: 44, height: 24, thumb: 18, travel: 20, padding: 3 },
  lg: { width: 52, height: 28, thumb: 22, travel: 24, padding: 3 },
};

export const Toggle = ({
  isOn,
  onToggle,
  disabled = false,
  visualOnly = false,
  size = 'md',
  accentColor,
}: ToggleProps) => {
  const { colors: themeColors, modeColors, useGradients } = useThemeColor();

  const dimensions = sizeConfig[size];
  const activeColor = accentColor || themeColors.accent;
  const accentRgb = hexToRgb(activeColor);

  // Background quando ON: gradiente se abilitato, altrimenti colore solido
  const onBackground = useGradients && !accentColor
    ? themeColors.gradient
    : activeColor;

  const isInteractive = !disabled && !visualOnly && onToggle;

  return (
    <motion.button
      type="button"
      onClick={isInteractive ? onToggle : undefined}
      disabled={disabled || visualOnly}
      style={{
        width: `${dimensions.width}px`,
        minWidth: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        padding: `${dimensions.padding}px`,
        borderRadius: '9999px',
        background: isOn ? onBackground : modeColors.toggleTrack,
        border: `1px solid ${isOn ? activeColor : modeColors.toggleTrackBorder}`,
        cursor: visualOnly ? 'inherit' : (disabled ? 'not-allowed' : 'pointer'),
        opacity: disabled && !visualOnly ? 0.5 : 1,
        boxShadow: isOn ? `0 0 12px rgba(${accentRgb}, 0.4)` : 'inset 0 2px 4px rgba(0,0,0,0.2)',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        pointerEvents: visualOnly ? 'none' : 'auto',
      }}
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
    >
      <motion.div
        style={{
          width: `${dimensions.thumb}px`,
          height: `${dimensions.thumb}px`,
          borderRadius: '50%',
          background: isOn
            ? 'linear-gradient(145deg, #ffffff, #f0f0f0)'
            : 'linear-gradient(145deg, #e0e0e0, #c8c8c8)',
          boxShadow: isOn
            ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)'
            : '0 1px 3px rgba(0,0,0,0.3)',
        }}
        animate={{ x: isOn ? dimensions.travel : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};

export default Toggle;
