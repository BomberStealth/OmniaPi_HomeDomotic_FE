import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  RiHome4Line,
  RiDoorOpenLine,
  RiLightbulbLine,
  RiSparklingLine,
  RiSettings4Line
} from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, radius, fontSize, getIconSizeNum } from '@/styles/responsive';

// ============================================
// BOTTOM NAVIGATION - Dark Luxury Style
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

export const BottomNav = () => {
  const location = useLocation();
  const { colors: themeColors, modeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors, modeColors]);

  const menuItems = [
    { path: '/dashboard', icon: RiHome4Line, label: 'Home' },
    { path: '/stanze', icon: RiDoorOpenLine, label: 'Stanze' },
    { path: '/dispositivi', icon: RiLightbulbLine, label: 'Dispositivi' },
    { path: '/scene', icon: RiSparklingLine, label: 'Scene' },
    { path: '/settings', icon: RiSettings4Line, label: 'Altro' }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      className="flex-shrink-0 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className="flex items-center justify-around relative overflow-hidden"
        style={{
          padding: `${spacing.xs} ${spacing.md}`,
          background: colors.bgCardLit,
          borderTop: `1px solid ${colors.border}`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5), 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Top edge glow - esatto dal preview */}
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

        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="transition-all flex flex-col items-center gap-0.5"
              style={{
                padding: spacing.xs,
                background: active ? `${colors.accent}15` : 'transparent',
                borderRadius: radius.lg,
                boxShadow: active ? `0 0 12px ${colors.accent}30` : 'none',
              }}
            >
              <item.icon
                size={getIconSizeNum('sm')}
                style={{
                  color: active ? colors.accentLight : colors.textMuted,
                  filter: active ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                }}
              />
              <span
                style={{
                  fontSize: fontSize.xs,
                  fontWeight: 500,
                  color: active ? colors.accentLight : colors.textMuted,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
