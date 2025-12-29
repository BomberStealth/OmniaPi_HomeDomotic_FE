import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RiHome4Line,
  RiLightbulbLine,
  RiSparklingLine,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiDoorOpenLine
} from 'react-icons/ri';
import { useAuthStore } from '@/store/authStore';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { APP_VERSION, APP_NAME } from '@/config/version';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// SIDEBAR NAVIGATION - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
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

export const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { colors: themeColors, colorTheme } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);

  const menuItems = [
    { path: '/dashboard', icon: RiHome4Line, label: t('nav.dashboard') },
    { path: '/stanze', icon: RiDoorOpenLine, label: 'Stanze' },
    { path: '/dispositivi', icon: RiLightbulbLine, label: t('nav.dispositivi') },
    { path: '/scene', icon: RiSparklingLine, label: t('nav.scene') },
    { path: '/settings', icon: RiSettings4Line, label: t('nav.settings') }
  ];

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

      {/* User Info Card */}
      <div
        className="mb-6 p-4"
        style={{
          background: colors.bgCardLit,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          boxShadow: colors.cardShadow,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Card top edge highlight */}
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
        <p
          className="font-medium truncate"
          style={{ color: colors.textPrimary, fontSize: '14px' }}
        >
          {user?.nome} {user?.cognome}
        </p>
        <p className="truncate" style={{ color: colors.textMuted, fontSize: '12px' }}>
          {user?.email}
        </p>
        <span
          className="inline-block mt-2 px-2 py-1"
          style={{
            fontSize: '11px',
            background: `${colors.accent}15`,
            color: colors.accentLight,
            border: `1px solid ${colors.accent}33`,
            borderRadius: '12px',
          }}
        >
          {user?.ruolo}
        </span>
      </div>

      {/* Impianto Selector */}
      <div className="mb-6">
        <ImpiantoSelector variant="desktop" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path}>
              <div
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{
                  borderRadius: '20px',
                  background: active
                    ? `linear-gradient(165deg, ${colors.accentDark}, ${colors.accent})`
                    : 'transparent',
                  color: active ? '#0a0a0c' : colors.textSecondary,
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
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

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
