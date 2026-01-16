import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiLightbulbLine,
  RiLoader4Line,
  RiLock2Line,
  RiTempHotLine,
  RiDropLine,
  RiPaletteLine,
  RiDeleteBinLine,
  RiArrowDownSLine
} from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// UNIFIED DEVICE CARD
// Un solo componente per tutti i tipi di dispositivo
// Layout FISSO - elementi non si muovono
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// ============================================
// TYPES
// ============================================

export type DeviceType = 'omniapi_node' | 'omniapi_led' | 'tasmota' | 'shelly' | 'sensor' | 'relay' | 'led';
export type CardVariant = 'full' | 'compact' | 'mini';

export interface UnifiedDeviceCardProps {
  // Required
  nome: string;
  isOn: boolean;
  onToggle: () => void;

  // Optional common
  deviceType?: DeviceType | string;
  isLoading?: boolean;
  bloccato?: boolean;

  // LED specific
  ledColor?: { r: number; g: number; b: number };
  ledBrightness?: number;
  onLedChange?: (color: { r: number; g: number; b: number }, brightness: number) => void;

  // Sensor specific
  temperature?: number;
  humidity?: number;

  // Display variants
  variant?: CardVariant;
  showDelete?: boolean;
  onDelete?: () => void;
}

// ============================================
// TOGGLE COMPONENT (shared)
// ============================================
const Toggle = ({
  isOn,
  accentColor,
  size = 'normal'
}: {
  isOn: boolean;
  accentColor: string;
  size?: 'normal' | 'small';
}) => {
  const dimensions = size === 'small'
    ? { width: 36, height: 20, thumb: 14, travel: 14 }
    : { width: 44, height: 24, thumb: 18, travel: 20 };

  return (
    <div
      style={{
        width: `${dimensions.width}px`,
        minWidth: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        padding: '3px',
        borderRadius: '9999px',
        background: isOn
          ? `linear-gradient(90deg, ${accentColor}, ${accentColor})`
          : 'rgba(60, 60, 60, 0.6)',
        boxShadow: isOn
          ? `0 0 12px ${accentColor}50`
          : 'inset 0 2px 4px rgba(0,0,0,0.3)',
        position: 'relative',
        flexShrink: 0,
        transition: 'all 0.3s ease',
      }}
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
    </div>
  );
};

// ============================================
// BRIGHTNESS SLIDER (for LED)
// ============================================
const BrightnessSlider = ({
  value,
  onChange,
  color,
  colors
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  colors: any;
}) => (
  <div className="w-full">
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px'
    }}>
      <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500 }}>
        Luminosità
      </span>
      <span style={{ fontSize: '11px', color: colors.textPrimary, fontWeight: 600 }}>
        {Math.round((value / 255) * 100)}%
      </span>
    </div>
    <input
      type="range"
      min="1"
      max="255"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        appearance: 'none',
        background: `linear-gradient(to right, rgba(50,50,50,0.8), ${color})`,
        cursor: 'pointer',
        outline: 'none',
      }}
    />
  </div>
);

// ============================================
// COLOR PICKER (simplified for LED)
// ============================================
const ColorPicker = ({
  color,
  onChange,
  colors
}: {
  color: { r: number; g: number; b: number };
  onChange: (c: { r: number; g: number; b: number }) => void;
  colors: any;
}) => {
  const presetColors = [
    { r: 255, g: 255, b: 255 }, // White
    { r: 255, g: 200, b: 150 }, // Warm white
    { r: 255, g: 100, b: 100 }, // Red
    { r: 100, g: 255, b: 100 }, // Green
    { r: 100, g: 100, b: 255 }, // Blue
    { r: 255, g: 200, b: 50 },  // Yellow
    { r: 255, g: 100, b: 200 }, // Pink
    { r: 100, g: 255, b: 255 }, // Cyan
  ];

  return (
    <div>
      <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
        Colore
      </span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {presetColors.map((c, i) => {
          const isSelected = c.r === color.r && c.g === color.g && c.b === color.b;
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChange(c); }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `rgb(${c.r}, ${c.g}, ${c.b})`,
                border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                boxShadow: isSelected ? `0 0 8px rgb(${c.r}, ${c.g}, ${c.b})` : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const UnifiedDeviceCardComponent = ({
  nome,
  isOn,
  onToggle,
  deviceType = 'relay',
  isLoading = false,
  bloccato = false,
  ledColor = { r: 255, g: 255, b: 255 },
  ledBrightness = 255,
  onLedChange,
  temperature,
  humidity,
  variant = 'compact',
  showDelete = false,
  onDelete,
}: UnifiedDeviceCardProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const [expanded, setExpanded] = useState(false);

  // Normalize device type
  const normalizedType = useMemo(() => {
    const t = (deviceType || 'relay').toLowerCase();
    if (t === 'omniapi_led' || t === 'led' || t === 'led_strip') return 'led';
    if (t === 'sensor') return 'sensor';
    return 'relay'; // Default for omniapi_node, tasmota, shelly, etc.
  }, [deviceType]);

  const isLed = normalizedType === 'led';
  const isSensor = normalizedType === 'sensor';
  const isDisabled = bloccato || isLoading;

  // Dynamic colors based on theme
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors, modeColors]);

  // LED color string
  const rgbString = useMemo(() =>
    `rgb(${ledColor.r}, ${ledColor.g}, ${ledColor.b})`,
    [ledColor]
  );

  // Accent color based on device type and state
  const activeColor = useMemo(() => {
    if (isLed && isOn) return rgbString;
    return colors.accent;
  }, [isLed, isOn, rgbString, colors.accent]);

  // Handle LED changes
  const handleBrightnessChange = useCallback((brightness: number) => {
    onLedChange?.(ledColor, brightness);
  }, [ledColor, onLedChange]);

  const handleColorChange = useCallback((color: { r: number; g: number; b: number }) => {
    onLedChange?.(color, ledBrightness);
  }, [ledBrightness, onLedChange]);

  // Card dimensions based on variant
  const cardPadding = variant === 'mini' ? '8px' : variant === 'compact' ? '12px' : '16px';
  const iconSize = variant === 'mini' ? 16 : variant === 'compact' ? 18 : 20;
  const nameSize = variant === 'mini' ? '12px' : variant === 'compact' ? '13px' : '14px';
  const statusSize = variant === 'mini' ? '9px' : variant === 'compact' ? '10px' : '11px';

  // ============================================
  // SENSOR CARD (read-only)
  // ============================================
  if (isSensor) {
    return (
      <div
        style={{
          padding: cardPadding,
          background: colors.bgCardLit,
          border: `1px solid ${colors.border}`,
          borderRadius: variant === 'mini' ? '16px' : '20px',
          boxShadow: colors.cardShadowLit,
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {/* Top highlight */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${colors.accentLight}33, transparent)`,
        }} />

        {/* Fixed layout: Icon + Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            padding: '8px',
            background: `${colors.accent}15`,
            borderRadius: '12px',
            flexShrink: 0,
          }}>
            <RiTempHotLine size={iconSize} style={{ color: colors.accent }} />
          </div>
          <span style={{
            fontSize: nameSize,
            fontWeight: 600,
            color: colors.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {nome || 'Sensore'}
          </span>
        </div>

        {/* Sensor values */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {temperature !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RiTempHotLine size={14} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                {temperature.toFixed(1)}°C
              </span>
            </div>
          )}
          {humidity !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RiDropLine size={14} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                {humidity.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RELAY / LED CARD (toggle-able)
  // ============================================
  return (
    <motion.div
      style={{
        background: bloccato
          ? colors.bgCardLit
          : isOn
            ? `linear-gradient(165deg, ${activeColor}12, ${colors.bgCard})`
            : colors.bgCardLit,
        border: `1px solid ${bloccato ? 'rgba(100, 100, 100, 0.3)' : isOn ? activeColor : colors.border}`,
        borderRadius: variant === 'mini' ? '16px' : '20px',
        boxShadow: bloccato
          ? 'none'
          : isOn
            ? `0 4px 20px ${activeColor}20, ${colors.cardShadow}`
            : colors.cardShadowLit,
        opacity: bloccato ? 0.6 : 1,
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Top edge highlight */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: isLed ? '15%' : '25%',
        right: isLed ? '15%' : '25%',
        height: isLed && isOn ? '2px' : '1px',
        background: isOn
          ? `linear-gradient(90deg, transparent, ${activeColor}, transparent)`
          : `linear-gradient(90deg, transparent, ${colors.accentLight}33, transparent)`,
      }} />

      {/* Glow effect when ON */}
      {isOn && !bloccato && (
        <div style={{
          position: 'absolute',
          top: '-32px',
          right: '-32px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          filter: 'blur(32px)',
          opacity: 0.3,
          background: `radial-gradient(circle, ${activeColor}, transparent)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Main clickable area */}
      <motion.button
        onClick={bloccato ? undefined : onToggle}
        disabled={isDisabled}
        style={{
          width: '100%',
          padding: cardPadding,
          background: 'transparent',
          border: 'none',
          cursor: bloccato ? 'not-allowed' : 'pointer',
          textAlign: 'left',
        }}
        whileHover={bloccato ? undefined : { scale: 1.01 }}
        whileTap={bloccato ? undefined : { scale: 0.98 }}
      >
        {/* FIXED LAYOUT: Icon left, Toggle right - ALWAYS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: variant === 'mini' ? '4px' : '8px',
        }}>
          {/* Icon box - fixed position left */}
          <div style={{
            padding: variant === 'mini' ? '6px' : '8px',
            background: bloccato
              ? 'rgba(100, 100, 100, 0.15)'
              : isOn
                ? isLed
                  ? rgbString
                  : `linear-gradient(145deg, ${colors.accent}30, ${colors.accent}15)`
                : `${colors.textMuted}10`,
            borderRadius: variant === 'mini' ? '10px' : '14px',
            boxShadow: isOn && !bloccato
              ? `0 2px 8px ${activeColor}40`
              : 'none',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isLoading ? (
              <RiLoader4Line
                size={iconSize}
                className="animate-spin"
                style={{ color: isLed && isOn ? '#fff' : colors.accent }}
              />
            ) : bloccato ? (
              <RiLock2Line size={iconSize} style={{ color: 'rgba(150, 150, 150, 0.7)' }} />
            ) : isLed ? (
              <RiPaletteLine
                size={iconSize}
                style={{ color: isOn ? '#fff' : colors.textMuted }}
              />
            ) : (
              <RiLightbulbLine
                size={iconSize}
                style={{
                  color: isOn ? colors.accentLight : colors.textMuted,
                  filter: isOn ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                }}
              />
            )}
          </div>

          {/* Toggle - fixed position right */}
          <Toggle
            isOn={isOn}
            accentColor={activeColor}
            size={variant === 'mini' ? 'small' : 'normal'}
          />
        </div>

        {/* Name - truncated if too long */}
        <h3 style={{
          fontSize: nameSize,
          fontWeight: 600,
          color: bloccato ? 'rgba(150, 150, 150, 0.8)' : colors.textPrimary,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}>
          {nome || 'Dispositivo'}
        </h3>

        {/* Status - always same position */}
        <p style={{
          fontSize: statusSize,
          fontWeight: 500,
          color: bloccato ? 'rgba(239, 68, 68, 0.7)' : colors.textMuted,
          margin: '2px 0 0 0',
        }}>
          {bloccato
            ? 'Bloccato'
            : isLed && isOn
              ? `${Math.round((ledBrightness / 255) * 100)}% luminosità`
              : isOn ? 'Acceso' : 'Spento'}
        </p>
      </motion.button>

      {/* Expandable controls for LED (only in full/compact variants) */}
      {isLed && isOn && !bloccato && variant !== 'mini' && (
        <>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  overflow: 'hidden',
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <BrightnessSlider
                    value={ledBrightness}
                    onChange={handleBrightnessChange}
                    color={rgbString}
                    colors={colors}
                  />
                  <ColorPicker
                    color={ledColor}
                    onChange={handleColorChange}
                    colors={colors}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand button */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              width: '100%',
              padding: '6px',
              background: 'transparent',
              border: 'none',
              borderTop: `1px solid ${colors.border}`,
              color: colors.textMuted,
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <RiArrowDownSLine size={14} />
            </motion.div>
            {expanded ? 'Chiudi' : 'Controlli'}
          </button>
        </>
      )}

      {/* Delete button (only when showDelete is true) */}
      {showDelete && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.error || '#ef4444',
            opacity: 0.7,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        >
          <RiDeleteBinLine size={14} />
        </button>
      )}
    </motion.div>
  );
};

// React.memo per performance
export const UnifiedDeviceCard = memo(UnifiedDeviceCardComponent);
