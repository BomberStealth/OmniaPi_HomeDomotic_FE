import { ReactNode, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useRealTimeSync } from '@/hooks/useRealTimeSync';

// ============================================
// MAIN LAYOUT - Dark Luxury Style
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

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { colors: themeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();

  // Real-time sync - carica dati e ascolta WebSocket
  useRealTimeSync(impiantoCorrente?.id ?? null);

  // Background dinamico basato sul tema
  const { bgGradient, ambientGlow } = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    return {
      bgGradient: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${accentRgb}, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)`,
      ambientGlow: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(${accentRgb}, 0.06) 0%, transparent 70%)`,
    };
  }, [themeColors.accent]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: bgGradient,
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Ambient glow overlay - esatto dal preview */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: ambientGlow }}
      />

      {/* Mobile Header - Mobile only */}
      <MobileHeader />

      {/* Sidebar - Desktop only */}
      <div className="hidden md:block flex-shrink-0 relative z-10">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Spacer for fixed mobile header */}
        <div className="h-16 flex-shrink-0 md:hidden" />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};
