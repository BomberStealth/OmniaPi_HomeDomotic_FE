import { useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RiHome4Line,
  RiLightbulbLine,
  RiSparklingLine,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiDoorOpenLine,
  RiNotification3Line,
  RiDownloadLine,
} from 'react-icons/ri';
import { useAuthStore } from '@/store/authStore';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { APP_VERSION, APP_NAME } from '@/config/version';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useNotificheStore } from '@/store/notificheStore';
import { useUserRole } from '@/components/auth';

// ============================================
// SIDEBAR NAVIGATION - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { logout } = useAuthStore();
  const { colors: themeColors, colorTheme, modeColors, isDarkMode } = useThemeColor();
  const { canInstall, promptInstall } = usePWAInstall();
  const { impiantoCorrente } = useImpiantoContext();
  const { unreadCount, fetchUnreadCount, initWebSocketListener } = useNotificheStore();

  // Fetch iniziale + init listener centralizzato
  useEffect(() => {
    if (impiantoCorrente?.id) {
      fetchUnreadCount(impiantoCorrente.id);
    }
    // Listener centralizzato nello store (chiamato una sola volta)
    initWebSocketListener();
  }, [impiantoCorrente?.id, fetchUnreadCount, initWebSocketListener]);

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors, modeColors]);

  const { canAccessPath } = useUserRole();

  // Menu items filtrati per ruolo
  const allMenuItems = [
    { path: '/dashboard', icon: RiHome4Line, label: t('nav.dashboard') },
    { path: '/stanze', icon: RiDoorOpenLine, label: 'Stanze' },
    { path: '/dispositivi', icon: RiLightbulbLine, label: t('nav.dispositivi') },
    { path: '/scene', icon: RiSparklingLine, label: t('nav.scene') },
    { path: '/notifications', icon: RiNotification3Line, label: 'Notifiche' },
    { path: '/settings', icon: RiSettings4Line, label: t('nav.settings') }
  ];

  // Filtra in base ai permessi del ruolo
  const menuItems = allMenuItems.filter(item => canAccessPath(item.path));

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside
      className="w-64 h-screen p-4 flex flex-col relative overflow-hidden"
      style={{
        background: colors.bgCardLit,
        borderRight: `1px solid ${colors.border}`,
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
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <div className="mb-8 px-2">
        <h1
          key={`logo-${colorTheme}`}
          className="text-2xl font-bold"
          style={{
            background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent}, ${colors.accentDark})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: `0 0 40px ${colors.accent}30`,
          }}
        >
          {APP_NAME}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '12px' }}>
          {t('app.title')}{' '}
          <span style={{ color: colors.accent, fontWeight: 600 }}>{APP_VERSION}</span>
        </p>
      </div>

      {/* Impianto Selector */}
      <div className="mb-6">
        <ImpiantoSelector variant="desktop" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const isNotifiche = item.path === '/notifications';
          return (
            <Link key={item.path} to={item.path}>
              <div
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  borderRadius: '20px',
                  background: active
                    ? `linear-gradient(165deg, ${colors.accentDark}, ${colors.accent})`
                    : 'transparent',
                  color: active ? (isDarkMode ? '#0a0a0c' : '#ffffff') : colors.textSecondary,
                  boxShadow: active ? `0 4px 16px ${colors.accent}30` : 'none',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <item.icon
                  size={20}
                  className="flex-shrink-0"
                  style={{
                    filter: active ? 'none' : 'none',
                  }}
                />
                <span style={{ fontSize: '14px', flex: 1 }}>{item.label}</span>
                {/* Badge notifiche non lette */}
                {isNotifiche && unreadCount > 0 && (
                  <span
                    style={{
                      minWidth: '20px',
                      height: '20px',
                      padding: '0 6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: active ? colors.accent : '#fff',
                      backgroundColor: active ? (isDarkMode ? '#0a0a0c' : '#ffffff') : colors.accent,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Install PWA Button - solo se canInstall */}
      {canInstall && (
        <button
          onClick={promptInstall}
          className="flex items-center gap-3 px-4 py-3 w-full transition-all hover:scale-[0.98] relative overflow-hidden mb-2"
          style={{
            borderRadius: '20px',
            color: colors.accent,
            background: `rgba(${hexToRgb(colors.accent)}, 0.15)`,
            border: `1px solid ${colors.accent}33`,
            cursor: 'pointer',
          }}
        >
          {/* Effetto pulse sottile */}
          <span
            className="absolute inset-0 rounded-xl animate-pulse"
            style={{
              backgroundColor: colors.accent,
              opacity: 0.1,
            }}
          />
          <RiDownloadLine size={20} className="flex-shrink-0 relative z-10" />
          <span style={{ fontWeight: 600, fontSize: '14px' }} className="relative z-10">
            Installa App
          </span>
        </button>
      )}

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 w-full transition-all hover:scale-[0.98]"
        style={{
          borderRadius: '20px',
          color: colors.textSecondary,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = colors.textSecondary;
        }}
      >
        <RiLogoutBoxLine size={20} className="flex-shrink-0" />
        <span style={{ fontWeight: 500, fontSize: '14px' }}>{t('auth.logout')}</span>
      </button>
    </aside>
  );
};
