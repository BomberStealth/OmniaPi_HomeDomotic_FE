import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RiWifiLine, RiLoader4Line, RiToggleLine, RiDeleteBinLine } from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { OmniapiNode } from '@/services/omniapiApi';

// ============================================
// NODE CARD COMPONENT - Dark Luxury Style
// Visualizza stato nodo ESP-NOW con controlli relay
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// RSSI Signal Strength indicator
const getRssiInfo = (rssi: number) => {
  if (rssi >= -50) return { label: 'Eccellente', color: '#22c55e', bars: 4 };
  if (rssi >= -60) return { label: 'Buono', color: '#84cc16', bars: 3 };
  if (rssi >= -70) return { label: 'Discreto', color: '#f59e0b', bars: 2 };
  return { label: 'Debole', color: '#ef4444', bars: 1 };
};

interface RelayButtonProps {
  relay: 1 | 2;
  isOn: boolean;
  isLoading: boolean;
  disabled: boolean;
  colors: any;
  onToggle: () => void;
}

const RelayButton = ({ relay, isOn, isLoading, disabled, colors, onToggle }: RelayButtonProps) => (
  <motion.button
    onClick={onToggle}
    disabled={disabled || isLoading}
    style={{
      flex: 1,
      padding: '12px 16px',
      borderRadius: '16px',
      background: isOn
        ? `linear-gradient(135deg, ${colors.accent}20, ${colors.accentDark}15)`
        : colors.toggleTrack,
      border: `1px solid ${isOn ? `${colors.accent}50` : colors.toggleTrackBorder}`,
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: isOn ? `0 0 20px ${colors.accent}20` : 'none',
      transition: 'all 0.3s ease',
    }}
    whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
    whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isLoading ? (
        <RiLoader4Line size={16} className="animate-spin" style={{ color: colors.accent }} />
      ) : (
        <RiToggleLine
          size={16}
          style={{
            color: isOn ? colors.accent : colors.textMuted,
            filter: isOn ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
          }}
        />
      )}
      <span
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: isOn ? colors.accent : colors.textMuted,
        }}
      >
        Relay {relay}
      </span>
    </div>

    {/* Toggle indicator */}
    <div
      style={{
        width: '36px',
        height: '20px',
        padding: '2px',
        borderRadius: '10px',
        background: isOn
          ? `linear-gradient(90deg, ${colors.accentDark}, ${colors.accentLight})`
          : colors.toggleTrack,
        boxShadow: isOn
          ? `0 0 8px ${colors.accent}40`
          : `inset 0 1px 3px rgba(0,0,0,0.3)`,
        position: 'relative',
        transition: 'all 0.3s ease',
      }}
    >
      <div
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: isOn ? '#fff' : 'rgba(255,255,255,0.3)',
          transform: isOn ? 'translateX(16px)' : 'translateX(0)',
          transition: 'all 0.3s ease',
          boxShadow: isOn ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
        }}
      />
    </div>
  </motion.button>
);

interface RegisteredInfo {
  id: number;
  nome: string;
  stanzaNome: string | null;
  onDelete: () => void;
}

interface NodeCardProps {
  node: OmniapiNode;
  onCommand: (mac: string, channel: 1 | 2, action: 'toggle') => Promise<boolean>;
  registeredInfo?: RegisteredInfo;
}

export const NodeCard = ({ node, onCommand, registeredInfo }: NodeCardProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const [loadingRelay, setLoadingRelay] = useState<1 | 2 | null>(null);

  const colors = useMemo(
    () => ({
      ...modeColors,
      accent: themeColors.accent,
      accentLight: themeColors.accentLight,
      accentDark: themeColors.accentDark,
      border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    }),
    [themeColors, modeColors]
  );

  const rssiInfo = getRssiInfo(node.rssi);

  const handleToggle = async (relay: 1 | 2) => {
    setLoadingRelay(relay);
    try {
      await onCommand(node.mac, relay, 'toggle');
    } finally {
      setLoadingRelay(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: node.online ? colors.bgCardLit : colors.bgCard,
        border: `1px solid ${node.online ? colors.border : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '24px',
        padding: '20px',
        boxShadow: node.online ? colors.cardShadow : 'none',
        position: 'relative',
        overflow: 'hidden',
        opacity: node.online ? 1 : 0.7,
      }}
    >
      {/* Top edge highlight */}
      {node.online && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${colors.accentLight}40, transparent)`,
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
        <div>
          {/* Name or MAC Address */}
          {registeredInfo ? (
            <>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: '4px',
                }}
              >
                {registeredInfo.nome}
              </div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                {registeredInfo.stanzaNome || 'Nessuna stanza'}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: node.online ? colors.accent : colors.textMuted,
                  marginBottom: '4px',
                }}
              >
                Nodo ESP-NOW
              </div>
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                Firmware: {node.version || 'N/A'}
              </div>
            </>
          )}
        </div>

        {/* Online Badge and Delete Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: node.online
                ? `${colors.success}15`
                : `${colors.error}15`,
              border: `1px solid ${node.online ? `${colors.success}30` : `${colors.error}30`}`,
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: node.online ? colors.success : colors.error,
                boxShadow: node.online ? `0 0 8px ${colors.success}` : 'none',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: node.online ? colors.success : colors.error,
              }}
            >
              {node.online ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Delete button for registered nodes */}
          {registeredInfo && (
            <button
              onClick={registeredInfo.onDelete}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.error,
                transition: 'all 0.2s ease',
              }}
            >
              <RiDeleteBinLine size={16} />
            </button>
          )}
        </div>
      </div>

      {/* RSSI Signal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px',
        }}
      >
        <RiWifiLine size={18} style={{ color: rssiInfo.color }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: colors.textMuted }}>
            Segnale: {rssiInfo.label}
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: rssiInfo.color }}>
            {node.rssi} dBm
          </div>
        </div>
        {/* Signal bars */}
        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              style={{
                width: '4px',
                height: `${bar * 4 + 4}px`,
                borderRadius: '2px',
                background:
                  bar <= rssiInfo.bars ? rssiInfo.color : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Relay Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <RelayButton
          relay={1}
          isOn={node.relay1}
          isLoading={loadingRelay === 1}
          disabled={!node.online}
          colors={colors}
          onToggle={() => handleToggle(1)}
        />
        <RelayButton
          relay={2}
          isOn={node.relay2}
          isLoading={loadingRelay === 2}
          disabled={!node.online}
          colors={colors}
          onToggle={() => handleToggle(2)}
        />
      </div>
    </motion.div>
  );
};
