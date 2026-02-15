import { ReactNode, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { AdminModeBorder } from './AdminModeBorder';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAdminModeStore } from '@/store/adminModeStore';
import { useOmniapiStore } from '@/store/omniapiStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { socketService } from '@/services/socket';
import { spacing } from '@/styles/responsive';

// ============================================
// MAIN LAYOUT - Responsive Flexbox Layout
// Mobile/Tablet: Header top, Navbar bottom
// Desktop: Sidebar left
// ============================================

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
  const { colors: themeColors, modeColors, isDarkMode } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const isAdminMode = useAdminModeStore((state) => state.isAdminMode);
  const gateway = useOmniapiStore((state) => state.gateway);
  const navigate = useNavigate();

  // WebSocket connection state
  const [wsConnected, setWsConnected] = useState(socketService.isConnected());
  useEffect(() => {
    const unsub = socketService.onConnectionStateChange(setWsConnected);
    return unsub;
  }, []);

  useWebSocket(impiantoCorrente?.id ?? null, {
    onCondivisioneRemoved: () => navigate('/impianti', { replace: true }),
  });

  // Gateway offline = gateway exists but online === false
  const gatewayOffline = gateway !== null && gateway.online === false;

  const { bgGradient, ambientGlow } = useMemo(() => {
    const accentRgb = hexToRgb(themeColors.accent);
    if (isDarkMode) {
      return {
        bgGradient: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${accentRgb}, 0.08) 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)`,
        ambientGlow: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(${accentRgb}, 0.06) 0%, transparent 70%)`,
      };
    } else {
      return {
        bgGradient: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(${accentRgb}, 0.05) 0%, transparent 60%), linear-gradient(to bottom, ${modeColors.bg} 0%, ${modeColors.bgSecondary} 100%)`,
        ambientGlow: `radial-gradient(ellipse 100% 40% at 50% 0%, rgba(${accentRgb}, 0.04) 0%, transparent 70%)`,
      };
    }
  }, [themeColors.accent, isDarkMode, modeColors]);

  return (
    <>
      {/* Admin Mode Border - effetto bordo pulsante */}
      <AdminModeBorder />

      <div
        className="flex flex-col md:flex-row overflow-hidden"
        style={{
          height: '100dvh', // Dynamic viewport height per mobile
          background: bgGradient,
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
          paddingTop: isAdminMode ? '40px' : 0, // Space for admin banner
        }}
      >
      {/* Ambient glow overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: ambientGlow }}
      />

      {/* Status banners - fixed top, above all content */}
      {gatewayOffline && (
        <div style={{
          position: 'fixed',
          top: isAdminMode ? '40px' : 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(220, 38, 38, 0.95)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          Gateway non raggiungibile. I comandi non funzioneranno.
        </div>
      )}
      {!wsConnected && (
        <div style={{
          position: 'fixed',
          top: isAdminMode ? (gatewayOffline ? '76px' : '40px') : (gatewayOffline ? '36px' : 0),
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(234, 138, 0, 0.95)',
          color: '#fff',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          Connessione al server persa. Riconnessione in corso...
        </div>
      )}

      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex md:flex-shrink-0 relative z-10">
        <Sidebar />
      </aside>

      {/* Main area - flex column per header/content/navbar */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative z-10">
        {/* Header - Mobile/Tablet only, NON fixed */}
        <MobileHeader />

        {/* Content - scrollabile */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            padding: spacing.lg,
            paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', // Space for fixed BottomNav on mobile
          }}
        >
          <div className="max-w-5xl mx-auto w-full md:pb-0">
            {children}
          </div>
        </main>

        {/* Bottom Navbar - Mobile/Tablet only, FIXED */}
        <BottomNav />
      </div>
    </div>
    </>
  );
};
