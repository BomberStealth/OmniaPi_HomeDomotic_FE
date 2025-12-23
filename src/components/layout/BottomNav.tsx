import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  DoorOpen,
  Lightbulb,
  Sparkles,
  Settings
} from 'lucide-react';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// BOTTOM NAVIGATION - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
};

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
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  }), [themeColors]);

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/stanze', icon: DoorOpen, label: 'Stanze' },
    { path: '/dispositivi', icon: Lightbulb, label: 'Dispositivi' },
    { path: '/scene', icon: Sparkles, label: 'Scene' },
    { path: '/settings', icon: Settings, label: 'Altro' }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4">
      <div
        className="flex items-center justify-around py-3 px-4 mx-auto max-w-md relative overflow-hidden"
        style={{
          background: colors.bgCardLit,
          border: `1px solid ${colors.border}`,
          borderRadius: '28px', // radius['2xl']
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
              className="p-2.5 transition-all flex flex-col items-center gap-1"
              style={{
                background: active ? `${colors.accent}15` : 'transparent',
                borderRadius: '20px', // radius.lg
                boxShadow: active ? `0 0 12px ${colors.accent}30` : 'none',
              }}
            >
              <item.icon
                size={22}
                style={{
                  color: active ? colors.accentLight : colors.textMuted,
                  filter: active ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                style={{
                  fontSize: '10px',
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
