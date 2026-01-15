import { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RiNotification3Line, RiDownloadLine } from 'react-icons/ri';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useNotificheStore } from '@/store/notificheStore';
import { socketService } from '@/services/socket';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { spacing, radius, fontSize, getIconSizeNum } from '@/styles/responsive';

// ============================================
// MOBILE HEADER - Dark Luxury Style
// Con supporto tema dinamico e notifiche real-time
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const MobileHeader = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const { unreadCount, fetchUnreadCount, initWebSocketListener } = useNotificheStore();
  const { canInstall, promptInstall } = usePWAInstall();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors, modeColors]);

  // Fetch iniziale e join room WebSocket
  useEffect(() => {
    if (impiantoCorrente?.id) {
      fetchUnreadCount(impiantoCorrente.id);
      socketService.joinImpianto(impiantoCorrente.id);
    }
    // Listener centralizzato nello store
    initWebSocketListener();

    return () => {
      if (impiantoCorrente?.id) {
        socketService.leaveImpianto(impiantoCorrente.id);
      }
    };
  }, [impiantoCorrente?.id, fetchUnreadCount, initWebSocketListener]);

  return (
    <div
      className="md:hidden flex-shrink-0"
      style={{
        background: colors.bgCardLit,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: colors.cardShadow,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Top edge highlight - esatto dal preview */}
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
      <div
        className="flex items-center justify-between"
        style={{ padding: `${spacing.sm} ${spacing.md}` }}
      >
        <div className="flex-1">
          <ImpiantoSelector variant="mobile" />
        </div>

        {/* Pulsante Installa PWA con effetto pulse - solo se canInstall */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="relative ml-2"
            style={{
              padding: spacing.xs,
              background: `rgba(${hexToRgb(colors.accent)}, 0.15)`,
              borderRadius: radius.md,
            }}
          >
            {/* Effetto Pulse animato */}
            <span
              className="absolute inset-0 animate-ping"
              style={{
                backgroundColor: colors.accent,
                opacity: 0.25,
                animationDuration: '2s',
                borderRadius: radius.md,
              }}
            />
            <span
              className="absolute inset-0 animate-pulse"
              style={{
                backgroundColor: colors.accent,
                opacity: 0.15,
                animationDuration: '1.5s',
                borderRadius: radius.md,
              }}
            />
            <RiDownloadLine size={getIconSizeNum('sm')} style={{ color: colors.accent }} className="relative z-10" />
          </button>
        )}

        <Link
          to="/notifications"
          className="relative ml-2"
          style={{
            padding: spacing.xs,
            background: `rgba(${hexToRgb(colors.accent)}, 0.1)`,
            borderRadius: radius.md,
          }}
        >
          <RiNotification3Line size={getIconSizeNum('md')} color={colors.accentLight} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
                fontSize: fontSize.xs,
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: colors.accent,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};
