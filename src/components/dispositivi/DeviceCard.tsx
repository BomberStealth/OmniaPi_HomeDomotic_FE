import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine,
  RiLoader4Line,
  RiLock2Line,
  RiTempHotLine,
  RiDropLine,
  RiPaletteLine
} from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';

// ============================================
// DEVICE CARD - Dark Luxury Style
// Supporta: Relay, LED Strip, Sensor, Dimmer
// ============================================

export type DeviceType = 'relay' | 'led' | 'sensor' | 'dimmer' | 'tasmota' | 'omniapi_node' | 'omniapi_led';

interface DeviceCardProps {
  nome: string;
  isOn: boolean;
  isLoading?: boolean;
  bloccato?: boolean;
  onClick: () => void;
  // Extended props for different device types
  deviceType?: DeviceType | string;
  // LED props
  ledColor?: { r: number; g: number; b: number };
  ledBrightness?: number;
  ledEffect?: number;
  onLedChange?: (color: { r: number; g: number; b: number }, brightness: number) => void;
  // Sensor props
  temperature?: number;
  humidity?: number;
  // Dimmer props
  dimmerLevel?: number;
  onDimmerChange?: (level: number) => void;
  // Expandable
  expandable?: boolean;
}

// ============================================
// RELAY CARD (default - toggle ON/OFF)
// ============================================
const RelayCard = ({
  nome, isOn, isLoading, bloccato, onClick, colors
}: {
  nome: string; isOn: boolean; isLoading?: boolean; bloccato?: boolean; onClick: () => void; colors: any
}) => {
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
              <RiLock2Line size={20} style={{ color: 'rgba(150, 150, 150, 0.7)' }} />
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

          {/* Toggle */}
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
            {!isOn && (
              <>
                <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: colors.textMuted }} />
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '2px', height: '2px', borderRadius: '50%', background: `${colors.textMuted}60` }} />
              </>
            )}
            <motion.div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isOn ? 'linear-gradient(145deg, #ffffff, #f0f0f0)' : 'linear-gradient(145deg, #e0e0e0, #c8c8c8)',
                boxShadow: isOn ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)' : '0 1px 3px rgba(0,0,0,0.3)',
              }}
              animate={{ x: isOn ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: 600, color: bloccato ? 'rgba(150, 150, 150, 0.8)' : colors.textPrimary }}>
          {nome || 'Dispositivo'}
        </h3>
        <p style={{ fontSize: '11px', fontWeight: 500, color: bloccato ? 'rgba(239, 68, 68, 0.7)' : colors.textMuted, marginTop: '2px' }}>
          {bloccato ? 'Bloccato' : isOn ? 'Acceso' : 'Spento'}
        </p>
      </div>
    </motion.button>
  );
};

// ============================================
// LED STRIP CARD (color preview + controls)
// ============================================
const LedCard = ({
  nome, isOn, isLoading, bloccato, onClick, colors,
  ledColor = { r: 255, g: 255, b: 255 },
  ledBrightness = 100,
  onLedChange,
  expandable = true
}: {
  nome: string; isOn: boolean; isLoading?: boolean; bloccato?: boolean; onClick: () => void; colors: any;
  ledColor?: { r: number; g: number; b: number }; ledBrightness?: number;
  onLedChange?: (color: { r: number; g: number; b: number }, brightness: number) => void;
  expandable?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isDisabled = bloccato || isLoading;
  const rgbString = `rgb(${ledColor.r}, ${ledColor.g}, ${ledColor.b})`;
  const brightnessPercent = Math.round((ledBrightness / 255) * 100);

  return (
    <motion.div
      className="text-left relative overflow-hidden w-full"
      style={{
        background: bloccato
          ? colors.bgCardLit
          : isOn
            ? `linear-gradient(165deg, ${rgbString}15, ${colors.bgCard})`
            : colors.bgCardLit,
        border: `1px solid ${bloccato ? 'rgba(100, 100, 100, 0.3)' : isOn ? rgbString : colors.border}`,
        borderRadius: '24px',
        boxShadow: bloccato
          ? 'none'
          : isOn
            ? `0 6px 28px ${rgbString}30, ${colors.cardShadow}`
            : colors.cardShadowLit,
        opacity: bloccato ? 0.6 : 1,
      }}
    >
      {/* Top edge with LED color */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: isOn
            ? `linear-gradient(90deg, transparent, ${rgbString}, transparent)`
            : `linear-gradient(90deg, transparent, ${colors.accentLight}33, transparent)`,
        }}
      />

      {/* Glow effect */}
      {isOn && (
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            filter: 'blur(40px)',
            opacity: 0.4,
            background: `radial-gradient(circle, ${rgbString}, transparent)`,
          }}
        />
      )}

      {/* Main button area */}
      <motion.button
        onClick={bloccato ? undefined : onClick}
        disabled={isDisabled}
        className="p-3 w-full text-left relative"
        style={{ cursor: bloccato ? 'not-allowed' : 'pointer', background: 'transparent', border: 'none' }}
        whileTap={bloccato ? undefined : { scale: 0.98 }}
      >
        <div className="flex items-center justify-between mb-2">
          {/* Color preview box */}
          <div
            style={{
              padding: '8px',
              background: isOn ? rgbString : `${colors.textMuted}15`,
              borderRadius: '16px',
              boxShadow: isOn ? `0 2px 12px ${rgbString}50` : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <RiLoader4Line size={20} className="animate-spin" style={{ color: '#fff' }} />
            ) : (
              <RiPaletteLine size={20} style={{ color: isOn ? '#fff' : colors.textMuted }} />
            )}
          </div>

          {/* Toggle */}
          <div
            style={{
              width: '44px',
              height: '24px',
              padding: '3px',
              borderRadius: '9999px',
              background: isOn ? `linear-gradient(90deg, ${rgbString}, ${rgbString})` : colors.toggleTrack,
              boxShadow: isOn ? `0 0 12px ${rgbString}50` : `inset 0 2px 4px rgba(0,0,0,0.3)`,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <motion.div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              animate={{ x: isOn ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{nome || 'LED Strip'}</h3>
        <p style={{ fontSize: '11px', fontWeight: 500, color: colors.textMuted, marginTop: '2px' }}>
          {bloccato ? 'Bloccato' : isOn ? `${brightnessPercent}% luminosità` : 'Spento'}
        </p>
      </motion.button>

      {/* Expanded controls */}
      {expandable && isOn && !bloccato && (
        <motion.div
          initial={false}
          animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          style={{ overflow: 'hidden', borderTop: expanded ? `1px solid ${colors.border}` : 'none' }}
        >
          <div className="p-3 pt-2">
            {/* Brightness slider */}
            <div className="mb-2">
              <label style={{ fontSize: '10px', color: colors.textMuted }}>Luminosità</label>
              <input
                type="range"
                min="0"
                max="255"
                value={ledBrightness}
                onChange={(e) => onLedChange?.(ledColor, parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #333, ${rgbString})` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Expand button */}
      {expandable && isOn && !bloccato && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={{
            width: '100%',
            padding: '4px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${colors.border}`,
            color: colors.textMuted,
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          {expanded ? '▲ Chiudi' : '▼ Controlli'}
        </button>
      )}
    </motion.div>
  );
};

// ============================================
// SENSOR CARD (read-only values)
// ============================================
const SensorCard = ({
  nome, colors, temperature, humidity
}: {
  nome: string; colors: any; temperature?: number; humidity?: number;
}) => {
  return (
    <div
      className="p-3 text-left relative overflow-hidden w-full"
      style={{
        background: colors.bgCardLit,
        border: `1px solid ${colors.border}`,
        borderRadius: '24px',
        boxShadow: colors.cardShadowLit,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '25%',
          right: '25%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${colors.accentLight}33, transparent)`,
        }}
      />

      <div className="flex items-center gap-3 mb-2">
        <div
          style={{
            padding: '8px',
            background: `${colors.accent}15`,
            borderRadius: '16px',
          }}
        >
          <RiTempHotLine size={20} style={{ color: colors.accent }} />
        </div>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{nome || 'Sensore'}</h3>
      </div>

      <div className="flex gap-4">
        {temperature !== undefined && (
          <div className="flex items-center gap-1">
            <RiTempHotLine size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{temperature.toFixed(1)}°C</span>
          </div>
        )}
        {humidity !== undefined && (
          <div className="flex items-center gap-1">
            <RiDropLine size={14} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{humidity.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// MAIN DEVICE CARD COMPONENT
// ============================================
const DeviceCardComponent = (props: DeviceCardProps) => {
  const { colors } = useThemeColors();
  const { deviceType = 'relay' } = props;

  // Determine which card to render based on device type
  const normalizedType = deviceType.toLowerCase();

  if (normalizedType === 'omniapi_led' || normalizedType === 'led') {
    return (
      <LedCard
        nome={props.nome}
        isOn={props.isOn}
        isLoading={props.isLoading}
        bloccato={props.bloccato}
        onClick={props.onClick}
        colors={colors}
        ledColor={props.ledColor}
        ledBrightness={props.ledBrightness}
        onLedChange={props.onLedChange}
        expandable={props.expandable}
      />
    );
  }

  if (normalizedType === 'sensor') {
    return (
      <SensorCard
        nome={props.nome}
        colors={colors}
        temperature={props.temperature}
        humidity={props.humidity}
      />
    );
  }

  // Default: Relay/Tasmota/OmniaPi Node
  return (
    <RelayCard
      nome={props.nome}
      isOn={props.isOn}
      isLoading={props.isLoading}
      bloccato={props.bloccato}
      onClick={props.onClick}
      colors={colors}
    />
  );
};

// React.memo per evitare re-render quando props non cambiano
export const DeviceCard = memo(DeviceCardComponent);
