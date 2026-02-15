import { memo, useMemo } from 'react';
import {
  RiRouterLine,
  RiWifiLine,
  RiWifiOffLine,
  RiCpuLine
} from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// GATEWAY CARD
// Card dedicata per visualizzare il Gateway OmniaPi
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export interface GatewayCardProps {
  nome?: string;
  mac: string;
  ip?: string;
  version?: string;
  status: 'online' | 'offline' | 'setup' | 'pending';
  nodeCount?: number;
  lastSeen?: string;
}

export const GatewayCard = memo(({
  nome,
  mac,
  ip,
  version,
  status,
  nodeCount = 0,
  lastSeen
}: GatewayCardProps) => {
  const { colors: themeColors, modeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);

  const isOnline = status === 'online';

  // Stile card
  const cardStyle = useMemo(() => ({
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadow,
    padding: '16px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }), [colors]);

  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  // Formatta last seen
  const formatLastSeen = (dateStr?: string) => {
    if (!dateStr) return 'Mai';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Adesso';
    if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
    return date.toLocaleDateString('it-IT');
  };

  return (
    <div style={cardStyle}>
      <div style={topHighlight} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: isOnline ? `${colors.success}15` : `${colors.error}15`,
          border: `1px solid ${isOnline ? `${colors.success}30` : `${colors.error}30`}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <RiRouterLine size={24} style={{ color: isOnline ? colors.success : colors.error }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: Nome + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {nome || 'Gateway OmniaPi'}
            </h3>
            {/* Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '8px',
              background: isOnline ? `${colors.success}15` : `${colors.error}15`,
              flexShrink: 0,
            }}>
              {isOnline ? (
                <RiWifiLine size={12} style={{ color: colors.success }} />
              ) : (
                <RiWifiOffLine size={12} style={{ color: colors.error }} />
              )}
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isOnline ? colors.success : colors.error,
              }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '6px',
            marginTop: '10px',
          }}>
            {/* IP */}
            <div style={{
              padding: '6px 8px',
              borderRadius: '10px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                IP
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ip || '-'}
              </p>
            </div>

            {/* Versione */}
            <div style={{
              padding: '6px 8px',
              borderRadius: '10px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Firmware
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {version || '-'}
              </p>
            </div>

            {/* MAC */}
            <div style={{
              padding: '6px 8px',
              borderRadius: '10px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                MAC
              </p>
              <p style={{ fontSize: 'clamp(10px, 2.8vw, 12px)', fontWeight: 500, color: colors.textSecondary, margin: '2px 0 0 0', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mac}
              </p>
            </div>

            {/* Nodi connessi */}
            <div style={{
              padding: '6px 8px',
              borderRadius: '10px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Nodi
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <RiCpuLine size={14} style={{ color: colors.accent, flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.accent }}>
                  {nodeCount}
                </span>
                <span style={{ fontSize: '12px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  connessi
                </span>
              </div>
            </div>
          </div>

          {/* Last Seen */}
          {lastSeen && (
            <p style={{
              fontSize: '11px',
              color: colors.textMuted,
              margin: '10px 0 0 0',
              textAlign: 'right',
            }}>
              Ultimo contatto: {formatLastSeen(lastSeen)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

GatewayCard.displayName = 'GatewayCard';

export default GatewayCard;
