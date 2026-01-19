import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RiAddLine } from 'react-icons/ri';
import {
  RiLightbulbLine,
  RiLoader4Line,
  RiLock2Line,
  RiTempHotLine,
  RiDropLine,
  RiPaletteLine,
  RiDeleteBinLine,
  RiSettings3Line,
  RiCloseLine
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
  ledEffect?: number;
  ledSpeed?: number;
  ledCustomColors?: { r: number; g: number; b: number }[];
  onLedChange?: (color: { r: number; g: number; b: number }, brightness: number) => void;
  onLedEffectChange?: (effect: number) => void;
  onLedSpeedChange?: (speed: number) => void;
  onLedNumLedsChange?: (numLeds: number) => void;
  onLedCustomEffect?: (colors: { r: number; g: number; b: number }[]) => void;

  // Sensor specific
  temperature?: number;
  humidity?: number;

  // Display variants
  variant?: CardVariant;
  showDelete?: boolean;
  onDelete?: () => void;
}

// LED Effects names
const LED_EFFECTS = [
  { id: 0, name: 'Statico' },
  { id: 1, name: 'Rainbow' },
  { id: 2, name: 'Respiro' },
  { id: 3, name: 'Chase' },
  { id: 4, name: 'Sparkle' },
  { id: 5, name: 'Fuoco' },
  { id: 6, name: 'Custom' },
];

// Custom colors localStorage key
const CUSTOM_EFFECT_COLORS_KEY = 'omniapi-led-custom-effect-colors';

// ============================================
// LED ICON WITH EFFECTS
// ============================================
const LedEffectIcon = ({
  effect,
  color,
  size,
  isOn
}: {
  effect: number;
  color: { r: number; g: number; b: number };
  size: number;
  isOn: boolean;
}) => {
  const rgbColor = `rgb(${color.r}, ${color.g}, ${color.b})`;

  // Inject keyframes into document if not already present
  useMemo(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'led-effect-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes led-rainbow {
          0% { color: #ff0000; }
          17% { color: #ff8800; }
          33% { color: #ffff00; }
          50% { color: #00ff00; }
          67% { color: #0088ff; }
          83% { color: #8800ff; }
          100% { color: #ff0000; }
        }
        @keyframes led-breathing {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes led-chase {
          0% { filter: brightness(0.6) hue-rotate(0deg); }
          50% { filter: brightness(1.2) hue-rotate(30deg); }
          100% { filter: brightness(0.6) hue-rotate(0deg); }
        }
        @keyframes led-sparkle {
          0%, 100% { opacity: 1; filter: brightness(1); }
          25% { opacity: 0.5; filter: brightness(1.5); }
          50% { opacity: 1; filter: brightness(0.8); }
          75% { opacity: 0.7; filter: brightness(1.3); }
        }
        @keyframes led-fire {
          0% { color: #ff4500; filter: brightness(1); }
          25% { color: #ff6600; filter: brightness(1.2); }
          50% { color: #ffaa00; filter: brightness(0.9); }
          75% { color: #ff5500; filter: brightness(1.1); }
          100% { color: #ff4500; filter: brightness(1); }
        }
        /* Slider thumb styles */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.8);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!isOn) {
    // OFF state - gray icon
    return <RiPaletteLine size={size} style={{ color: 'rgba(150, 150, 150, 0.6)' }} />;
  }

  // ON state - effect-based styling
  const getEffectStyle = (): React.CSSProperties => {
    switch (effect) {
      case 0: // Static - use actual RGB color
        return {
          color: rgbColor,
          filter: `drop-shadow(0 0 6px ${rgbColor})`,
        };
      case 1: // Rainbow
        return {
          animation: 'led-rainbow 2s linear infinite',
          filter: 'drop-shadow(0 0 6px currentColor)',
        };
      case 2: // Breathing
        return {
          color: rgbColor,
          animation: 'led-breathing 2s ease-in-out infinite',
          filter: `drop-shadow(0 0 8px ${rgbColor})`,
        };
      case 3: // Chase
        return {
          color: rgbColor,
          animation: 'led-chase 1s ease-in-out infinite',
          filter: `drop-shadow(0 0 6px ${rgbColor})`,
        };
      case 4: // Sparkle
        return {
          color: rgbColor,
          animation: 'led-sparkle 0.5s ease-in-out infinite',
          filter: `drop-shadow(0 0 8px ${rgbColor})`,
        };
      case 5: // Fire
        return {
          animation: 'led-fire 0.8s ease-in-out infinite',
          filter: 'drop-shadow(0 0 8px #ff6600)',
        };
      default:
        return { color: rgbColor };
    }
  };

  return (
    <RiPaletteLine
      size={size}
      style={getEffectStyle()}
    />
  );
};

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
// Custom slider with proper drag handling
// Throttled: sends API every 250ms during drag, final on release
// Rainbow effect: minimum brightness 7% (~18 in 0-255)
// ============================================
const RAINBOW_MIN_BRIGHTNESS = 18; // 7% of 255

const BrightnessSlider = ({
  value,
  onChange,
  color,
  effect,
  colors
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  effect: number;
  colors: any;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const lastSentRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const minValue = effect === 1 ? RAINBOW_MIN_BRIGHTNESS : 1;
  const sliderColor = effect === 0 ? color : '#ffffff';

  // Sync with external value when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  // Throttled send (250ms)
  const throttledSend = useCallback((newValue: number) => {
    const now = Date.now();
    if (now - lastSentRef.current >= 250) {
      onChange(newValue);
      lastSentRef.current = now;
    }
  }, [onChange]);

  // Calculate value from position
  const calculateValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return localValue;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = x / rect.width;
    let newValue = Math.round(minValue + percent * (255 - minValue));
    newValue = Math.max(minValue, Math.min(255, newValue));
    return newValue;
  }, [minValue, localValue]);

  // Mouse/Touch handlers
  const handleStart = useCallback((clientX: number) => {
    isDraggingRef.current = true;
    const newValue = calculateValue(clientX);
    setLocalValue(newValue);
    throttledSend(newValue);
  }, [calculateValue, throttledSend]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const newValue = calculateValue(clientX);
    setLocalValue(newValue);
    throttledSend(newValue);
  }, [calculateValue, throttledSend]);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onChange(localValue); // Send final value
    lastSentRef.current = 0;
  }, [localValue, onChange]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX);

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };
    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [handleStart, handleMove, handleEnd]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleStart(e.touches[0].clientX);
  }, [handleStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Calculate thumb position
  const thumbPosition = ((localValue - minValue) / (255 - minValue)) * 100;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500 }}>
          Luminosità{effect === 1 ? ' (min 7%)' : ''}
        </span>
        <span style={{ fontSize: '11px', color: colors.textPrimary, fontWeight: 600 }}>
          {Math.round((localValue / 255) * 100)}%
        </span>
      </div>
      <div
        ref={sliderRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Track */}
        <div style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, rgba(50,50,50,0.8), ${sliderColor})`,
          position: 'relative',
        }}>
          {/* Thumb */}
          <div style={{
            position: 'absolute',
            left: `${thumbPosition}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            border: '2px solid rgba(255,255,255,0.8)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// COLOR PICKER (with custom color wheel)
// - Preset colors with throttle (250ms)
// - Custom color picker with HSL wheel
// - Custom color saved to localStorage
// ============================================
const CUSTOM_COLOR_KEY = 'omniapi-led-custom-color';

// HSL to RGB conversion
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255)
  };
};

// RGB to HSL conversion
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const ColorPicker = ({
  color,
  onChange,
  colors
}: {
  color: { r: number; g: number; b: number };
  onChange: (c: { r: number; g: number; b: number }) => void;
  colors: any;
}) => {
  const [showWheel, setShowWheel] = useState(false);
  const [localColor, setLocalColor] = useState(color);
  const lastSentRef = useRef<number>(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Load custom color from localStorage
  const [customColor, setCustomColor] = useState<{ r: number; g: number; b: number } | null>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_COLOR_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

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

  const allColors = customColor ? [customColor, ...presetColors] : presetColors;

  // Throttled color send (250ms)
  const throttledSend = useCallback((newColor: { r: number; g: number; b: number }) => {
    const now = Date.now();
    if (now - lastSentRef.current >= 250) {
      onChange(newColor);
      lastSentRef.current = now;
    }
  }, [onChange]);

  // Handle preset color click with throttle
  const handlePresetClick = useCallback((c: { r: number; g: number; b: number }) => {
    setLocalColor(c);
    throttledSend(c);
  }, [throttledSend]);

  // Calculate color from wheel position
  const calculateColorFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return localColor;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    const radius = Math.min(centerX, centerY);

    // Calculate angle and distance
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const distance = Math.min(Math.sqrt(x * x + y * y), radius);
    const saturation = (distance / radius) * 100;

    return hslToRgb(angle, saturation, 50);
  }, [localColor]);

  // Wheel drag handlers
  const handleWheelStart = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    const newColor = calculateColorFromPosition(clientX, clientY);
    setLocalColor(newColor);
    throttledSend(newColor);
  }, [calculateColorFromPosition, throttledSend]);

  const handleWheelMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const newColor = calculateColorFromPosition(clientX, clientY);
    setLocalColor(newColor);
    throttledSend(newColor);
  }, [calculateColorFromPosition, throttledSend]);

  const handleWheelEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    // Save to localStorage and send final
    setCustomColor(localColor);
    localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(localColor));
    onChange(localColor);
    lastSentRef.current = 0;
  }, [localColor, onChange]);

  // Mouse events for wheel
  const onWheelMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleWheelStart(e.clientX, e.clientY);

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      handleWheelMove(e.clientX, e.clientY);
    };
    const onUp = () => {
      handleWheelEnd();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [handleWheelStart, handleWheelMove, handleWheelEnd]);

  // Touch events for wheel
  const onWheelTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleWheelStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleWheelStart]);

  const onWheelTouchMove = useCallback((e: React.TouchEvent) => {
    handleWheelMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleWheelMove]);

  // Calculate cursor position on wheel
  const hsl = rgbToHsl(localColor.r, localColor.g, localColor.b);
  const cursorAngle = (hsl.h - 90) * (Math.PI / 180);
  const cursorDistance = (hsl.s / 100) * 50; // 50 is half the wheel size

  return (
    <div>
      <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
        Colore
      </span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {allColors.map((c, i) => {
          const isSelected = c.r === color.r && c.g === color.g && c.b === color.b;
          const isCustom = i === 0 && customColor !== null;
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); handlePresetClick(c); }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: `rgb(${c.r}, ${c.g}, ${c.b})`,
                border: isSelected ? '2px solid white' : isCustom ? '1px dashed rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                boxShadow: isSelected ? `0 0 8px rgb(${c.r}, ${c.g}, ${c.b})` : 'none',
                transition: 'all 0.15s ease',
              }}
            />
          );
        })}
        {/* Custom color wheel button */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowWheel(!showWheel); setLocalColor(color); }}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: showWheel
              ? 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
              : 'rgba(255,255,255,0.1)',
            border: showWheel ? '2px solid white' : '1px dashed rgba(255,255,255,0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.textMuted,
            transition: 'all 0.15s ease',
          }}
          title="Scegli colore personalizzato"
        >
          {!showWheel && <RiAddLine size={16} />}
        </button>
      </div>

      {/* Custom Color Wheel */}
      {showWheel && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {/* Color Wheel */}
          <div
            ref={wheelRef}
            onMouseDown={onWheelMouseDown}
            onTouchStart={onWheelTouchStart}
            onTouchMove={onWheelTouchMove}
            onTouchEnd={handleWheelEnd}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              position: 'relative',
              cursor: 'crosshair',
              touchAction: 'none',
              userSelect: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {/* Saturation overlay (white center) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }} />
            {/* Cursor */}
            <div style={{
              position: 'absolute',
              left: `calc(50% + ${Math.cos(cursorAngle) * cursorDistance}px)`,
              top: `calc(50% + ${Math.sin(cursorAngle) * cursorDistance}px)`,
              transform: 'translate(-50%, -50%)',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: `rgb(${localColor.r}, ${localColor.g}, ${localColor.b})`,
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Preview and confirm */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `rgb(${localColor.r}, ${localColor.g}, ${localColor.b})`,
              border: '2px solid white',
              boxShadow: `0 0 12px rgb(${localColor.r}, ${localColor.g}, ${localColor.b})`,
            }} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCustomColor(localColor);
                localStorage.setItem(CUSTOM_COLOR_KEY, JSON.stringify(localColor));
                onChange(localColor);
                setShowWheel(false);
              }}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                background: colors.accent,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              OK
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowWheel(false); }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(255,255,255,0.1)',
                color: colors.textMuted,
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// EFFECT SELECTOR (for LED)
// Custom effect (id=6) is disabled until firmware supports it
// ============================================
const EffectSelector = ({
  value,
  onChange,
  colors
}: {
  value: number;
  onChange: (v: number) => void;
  colors: any;
}) => (
  <div>
    <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
      Effetto
    </span>
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {LED_EFFECTS.map((effect) => {
        const isSelected = effect.id === value;
        const isDisabled = false; // Custom effect now enabled (firmware v1.1.0+)
        return (
          <button
            key={effect.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) {
                onChange(effect.id);
              }
            }}
            disabled={isDisabled}
            title={isDisabled ? 'Coming soon - richiede aggiornamento firmware' : undefined}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '10px',
              fontWeight: 600,
              background: isDisabled
                ? 'rgba(100,100,100,0.3)'
                : isSelected ? colors.accent : 'rgba(255,255,255,0.1)',
              color: isDisabled
                ? 'rgba(150,150,150,0.6)'
                : isSelected ? '#fff' : colors.textMuted,
              border: isDisabled
                ? '1px dashed rgba(150,150,150,0.4)'
                : isSelected ? `1px solid ${colors.accent}` : '1px solid rgba(255,255,255,0.15)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isDisabled ? 0.6 : 1,
            }}
          >
            {effect.name}{isDisabled ? ' 🔜' : ''}
          </button>
        );
      })}
    </div>
  </div>
);

// ============================================
// CUSTOM EFFECT PICKER (3 colors)
// ============================================
const CustomEffectPicker = ({
  onApply,
  colors
}: {
  onApply: (colors: { r: number; g: number; b: number }[]) => void;
  colors: any;
}) => {
  // Load saved colors from localStorage
  const [customColors, setCustomColors] = useState<{ r: number; g: number; b: number }[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_EFFECT_COLORS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch {}
    // Default colors: Red, Green, Blue
    return [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 }
    ];
  });

  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Update single color
  const updateColor = useCallback((index: number, newColor: { r: number; g: number; b: number }) => {
    setCustomColors(prev => {
      const updated = [...prev];
      updated[index] = newColor;
      return updated;
    });
  }, []);

  // Calculate color from wheel position
  const calculateColorFromPosition = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return { r: 255, g: 0, b: 0 };
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    const radius = Math.min(centerX, centerY);

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    const distance = Math.min(Math.sqrt(x * x + y * y), radius);
    const saturation = (distance / radius) * 100;

    return hslToRgb(angle, saturation, 50);
  }, []);

  // Wheel handlers
  const handleWheelStart = useCallback((clientX: number, clientY: number) => {
    if (activeColorIndex === null) return;
    isDraggingRef.current = true;
    const newColor = calculateColorFromPosition(clientX, clientY);
    updateColor(activeColorIndex, newColor);
  }, [activeColorIndex, calculateColorFromPosition, updateColor]);

  const handleWheelMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || activeColorIndex === null) return;
    const newColor = calculateColorFromPosition(clientX, clientY);
    updateColor(activeColorIndex, newColor);
  }, [activeColorIndex, calculateColorFromPosition, updateColor]);

  const handleWheelEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onWheelMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleWheelStart(e.clientX, e.clientY);

    const onMove = (e: MouseEvent) => {
      e.preventDefault();
      handleWheelMove(e.clientX, e.clientY);
    };
    const onUp = () => {
      handleWheelEnd();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [handleWheelStart, handleWheelMove, handleWheelEnd]);

  const onWheelTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    handleWheelStart(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleWheelStart]);

  const onWheelTouchMove = useCallback((e: React.TouchEvent) => {
    handleWheelMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleWheelMove]);

  // Apply and save
  const handleApply = useCallback(() => {
    localStorage.setItem(CUSTOM_EFFECT_COLORS_KEY, JSON.stringify(customColors));
    onApply(customColors);
  }, [customColors, onApply]);

  // Get cursor position for active color
  const getHsl = (c: { r: number; g: number; b: number }) => rgbToHsl(c.r, c.g, c.b);

  return (
    <div style={{ marginTop: '12px' }}>
      <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
        Colori Custom Rainbow
      </span>

      {/* 3 Color buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
        {customColors.map((c, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); setActiveColorIndex(activeColorIndex === i ? null : i); }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `rgb(${c.r}, ${c.g}, ${c.b})`,
              border: activeColorIndex === i ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: activeColorIndex === i ? `0 0 12px rgb(${c.r}, ${c.g}, ${c.b})` : 'none',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            <span style={{
              position: 'absolute',
              bottom: '-16px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '9px',
              color: colors.textMuted,
              whiteSpace: 'nowrap',
            }}>
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Color wheel (show when a color is selected) */}
      {activeColorIndex !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
          <div
            ref={wheelRef}
            onMouseDown={onWheelMouseDown}
            onTouchStart={onWheelTouchStart}
            onTouchMove={onWheelTouchMove}
            onTouchEnd={handleWheelEnd}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
              position: 'relative',
              cursor: 'crosshair',
              touchAction: 'none',
              userSelect: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'radial-gradient(circle, white 0%, transparent 70%)',
            }} />
            {/* Cursor */}
            {(() => {
              const hsl = getHsl(customColors[activeColorIndex]);
              const angle = (hsl.h - 90) * (Math.PI / 180);
              const dist = (hsl.s / 100) * 40;
              return (
                <div style={{
                  position: 'absolute',
                  left: `calc(50% + ${Math.cos(angle) * dist}px)`,
                  top: `calc(50% + ${Math.sin(angle) * dist}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: `rgb(${customColors[activeColorIndex].r}, ${customColors[activeColorIndex].g}, ${customColors[activeColorIndex].b})`,
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  pointerEvents: 'none',
                }} />
              );
            })()}
          </div>
        </div>
      )}

      {/* Apply button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); handleApply(); }}
          style={{
            padding: '8px 24px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
            background: colors.accent,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${colors.accent}50`,
          }}
        >
          Applica Custom Rainbow
        </button>
      </div>
    </div>
  );
};

// ============================================
// SPEED SLIDER (for LED effects)
// ============================================
const SpeedSlider = ({
  value,
  onChange,
  colors
}: {
  value: number;
  onChange: (v: number) => void;
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
        Velocità
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
        background: `linear-gradient(to right, rgba(50,50,50,0.8), ${colors.accent})`,
        cursor: 'pointer',
        outline: 'none',
      }}
    />
  </div>
);

// ============================================
// NUM LEDS INPUT (for LED configuration)
// ============================================
const NumLedsInput = ({
  onChange,
  colors
}: {
  onChange: (v: number) => void;
  colors: any;
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleApply = () => {
    // If empty, do nothing (no error)
    if (!value.trim()) {
      return;
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 300) {
      setError('1-300');
      return;
    }
    setError('');
    onChange(num);
    setValue('');
  };

  return (
    <div>
      <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 500, display: 'block', marginBottom: '8px' }}>
        Numero LED (1-300)
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="number"
          min="1"
          max="300"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
          placeholder="es. 30"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            background: 'rgba(255,255,255,0.1)',
            color: colors.textPrimary,
            border: error ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
            outline: 'none',
          }}
        />
        <button
          onClick={(e) => { e.stopPropagation(); handleApply(); }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            background: colors.accent,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Applica
        </button>
      </div>
      {error && <span style={{ fontSize: '10px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

// ============================================
// LED CONTROLS MODAL
// ============================================
const LedControlsModal = ({
  isOpen,
  onClose,
  nome,
  ledColor,
  ledBrightness,
  ledEffect,
  ledSpeed,
  onBrightnessChange,
  onColorChange,
  onEffectChange,
  onSpeedChange,
  onNumLedsChange,
  onCustomEffect,
  colors,
  rgbString
}: {
  isOpen: boolean;
  onClose: () => void;
  nome: string;
  ledColor: { r: number; g: number; b: number };
  ledBrightness: number;
  ledEffect: number;
  ledSpeed: number;
  onBrightnessChange: (v: number) => void;
  onColorChange: (c: { r: number; g: number; b: number }) => void;
  onEffectChange?: (v: number) => void;
  onSpeedChange?: (v: number) => void;
  onNumLedsChange?: (v: number) => void;
  onCustomEffect?: (colors: { r: number; g: number; b: number }[]) => void;
  colors: any;
  rgbString: string;
}) => {
  // NOTE: Custom effect (id=6) is disabled in EffectSelector until firmware supports it
  // The showCustomPicker and related logic are kept for when firmware is ready
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Show picker when effect is 6 (disabled for now, but ready for future)
  useEffect(() => {
    if (ledEffect === 6) {
      setShowCustomPicker(true);
    }
  }, [ledEffect]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCustomPicker(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Wrapper for effect change
  const handleEffectChange = (effect: number) => {
    if (effect === 6) {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
    onEffectChange?.(effect);
  };

  // Wrapper for custom effect apply
  const handleCustomEffectApply = (customColors: { r: number; g: number; b: number }[]) => {
    onCustomEffect?.(customColors);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.bgCard,
              borderRadius: '24px',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${rgbString}30`,
              width: '100%',
              maxWidth: '340px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Icon box - same as card icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(30, 30, 30, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 12px ${rgbString}40`,
                  border: '1px solid rgba(100, 100, 100, 0.2)',
                }}>
                  <LedEffectIcon
                    effect={ledEffect}
                    color={ledColor}
                    size={22}
                    isOn={true}
                  />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    margin: 0,
                  }}>
                    {nome}
                  </h3>
                  <p style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    margin: '2px 0 0 0',
                  }}>
                    Controlli LED
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textMuted,
                }}
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            {/* Controls */}
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {/* Brightness */}
              <BrightnessSlider
                value={ledBrightness}
                onChange={onBrightnessChange}
                color={rgbString}
                effect={ledEffect}
                colors={colors}
              />

              {/* Color */}
              <ColorPicker
                color={ledColor}
                onChange={onColorChange}
                colors={colors}
              />

              {/* Effect */}
              {onEffectChange && (
                <EffectSelector
                  value={ledEffect}
                  onChange={handleEffectChange}
                  colors={colors}
                />
              )}

              {/* Custom Effect Picker - uses local state to stay open */}
              {showCustomPicker && onCustomEffect && (
                <CustomEffectPicker
                  onApply={handleCustomEffectApply}
                  colors={colors}
                />
              )}

              {/* Speed (only when effect is not Static) */}
              {onSpeedChange && ledEffect !== 0 && (
                <SpeedSlider
                  value={ledSpeed}
                  onChange={onSpeedChange}
                  colors={colors}
                />
              )}

              {/* Num LEDs */}
              {onNumLedsChange && (
                <NumLedsInput
                  onChange={onNumLedsChange}
                  colors={colors}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
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
  ledEffect = 0,
  ledSpeed = 128,
  onLedChange,
  onLedEffectChange,
  onLedSpeedChange,
  onLedNumLedsChange,
  onLedCustomEffect,
  temperature,
  humidity,
  variant = 'compact',
  showDelete = false,
  onDelete,
}: UnifiedDeviceCardProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const [showModal, setShowModal] = useState(false);

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

  // Accent color: ALWAYS use theme color for toggle/border
  // LED RGB color is ONLY for icon and brightness slider (when static)
  const activeColor = colors.accent; // Always theme color for card elements

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
                  ? 'rgba(30, 30, 30, 0.6)'  // Dark bg to show LED color
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
              <LedEffectIcon
                effect={ledEffect}
                color={ledColor}
                size={iconSize}
                isOn={isOn}
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

      {/* LED Controls: Settings button + Modal (only in full/compact variants) */}
      {isLed && isOn && !bloccato && variant !== 'mini' && (
        <>
          {/* Settings button - small icon in corner */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: `${rgbString}30`,
              border: `1px solid ${rgbString}50`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textPrimary,
              opacity: 0.8,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          >
            <RiSettings3Line size={14} />
          </button>

          {/* LED Controls Modal */}
          <LedControlsModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            nome={nome}
            ledColor={ledColor}
            ledBrightness={ledBrightness}
            ledEffect={ledEffect}
            ledSpeed={ledSpeed}
            onBrightnessChange={handleBrightnessChange}
            onColorChange={handleColorChange}
            onEffectChange={onLedEffectChange}
            onSpeedChange={onLedSpeedChange}
            onNumLedsChange={onLedNumLedsChange}
            onCustomEffect={onLedCustomEffect}
            colors={colors}
            rgbString={rgbString}
          />
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
