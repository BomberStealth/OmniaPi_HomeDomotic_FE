import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RiNotification3Line, RiDownloadLine } from 'react-icons/ri';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// ============================================
// MOBILE HEADER - Dark Luxury Style
// Con supporto tema dinamico e notifiche real-time
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const MobileHeader = () => {
  const { colors: themeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const { canInstall, promptInstall } = usePWAInstall();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);

  // Fetch unread count iniziale
  const fetchUnreadCount = useCallback(async () => {
    if (!impiantoCorrente?.id) return;
    try {
      const { data } = await api.get(`/api/notifications/history?impiantoId=${impiantoCorrente.id}&limit=1`);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [impiantoCorrente?.id]);

  // Fetch iniziale e join room WebSocket
  useEffect(() => {
    fetchUnreadCount();

    if (impiantoCorrente?.id) {
      // Join impianto room per ricevere notifiche
      socketService.joinImpianto(impiantoCorrente.id);
    }

    return () => {
      if (impiantoCorrente?.id) {
        socketService.leaveImpianto(impiantoCorrente.id);
      }
    };
  }, [fetchUnreadCount, impiantoCorrente?.id]);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNotification = () => {
      // Incrementa il contatore quando arriva una nuova notifica
      setUnreadCount(prev => prev + 1);
    };

    socketService.onNotification(handleNotification);

    return () => {
      socketService.offNotification();
    };
  }, []);

  return (
    <div
      className="md:hidden fixed top-0 left-0 right-0 z-40"
      style={{
        background: colors.bgCardLit,
        borderBottom: `1px solid ${colors.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow: colors.cardShadow,
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
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex-1">
          <ImpiantoSelector variant="mobile" />
        </div>

        {/* Pulsante Installa PWA con effetto pulse - solo se canInstall */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="relative p-2 ml-2"
            style={{
              background: `rgba(${hexToRgb(colors.accent)}, 0.15)`,
              borderRadius: '12px',
            }}
          >
            {/* Effetto Pulse animato */}
            <span
              className="absolute inset-0 rounded-xl animate-ping"
              style={{
                backgroundColor: colors.accent,
                opacity: 0.25,
                animationDuration: '2s'
              }}
            />
            <span
              className="absolute inset-0 rounded-xl animate-pulse"
              style={{
                backgroundColor: colors.accent,
                opacity: 0.15,
                animationDuration: '1.5s'
              }}
            />
            <RiDownloadLine size={20} style={{ color: colors.accent }} className="relative z-10" />
          </button>
        )}

        <Link
          to="/notifications"
          className="relative p-2 ml-2"
          style={{
            background: `rgba(${hexToRgb(colors.accent)}, 0.1)`,
            borderRadius: '12px',
          }}
        >
          <RiNotification3Line size={22} color={colors.accentLight} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                minWidth: '16px',
                height: '16px',
                padding: '0 4px',
                fontSize: '10px',
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
