import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiArrowLeftLine, RiSmartphoneLine, RiComputerLine, RiMacLine, RiLoader4Line, RiCheckLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

// ============================================
// DISPOSITIVI CONNESSI PAGE
// Mostra le sessioni attive dell'utente
// ============================================

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  success: '#22c55e',
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

export const DispositiviConnessi = () => {
  const { colors: themeColors } = useThemeColor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  const colors = {
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
  };

  const cardStyle = {
    background: colors.bgCardLit,
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    boxShadow: colors.cardShadowLit,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  useEffect(() => {
    // Simula caricamento sessioni (da implementare con API reale)
    const loadSessions = async () => {
      setLoading(true);
      // Per ora mostriamo la sessione corrente
      await new Promise(resolve => setTimeout(resolve, 500));
      setSessions([
        {
          id: '1',
          device: 'Questo dispositivo',
          browser: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
          location: 'Sessione corrente',
          lastActive: 'Adesso',
          isCurrent: true,
        }
      ]);
      setLoading(false);
    };
    loadSessions();
  }, []);

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
      return RiSmartphoneLine;
    }
    if (device.toLowerCase().includes('mac')) {
      return RiMacLine;
    }
    return RiComputerLine;
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header con Back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => navigate('/settings')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: `${colors.accent}15`,
              border: `1px solid ${colors.accent}30`,
              color: colors.accent,
              cursor: 'pointer',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RiArrowLeftLine size={20} />
          </motion.button>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Dispositivi Connessi
            </h1>
            <p style={{
              fontSize: '12px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              Gestisci le sessioni attive
            </p>
          </div>
        </div>

        {/* Contenuto */}
        {loading ? (
          <motion.div
            style={{ ...cardStyle, padding: '40px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={topHighlight} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <RiLoader4Line size={32} style={{ color: colors.accent }} className="animate-spin" />
              <p style={{ color: colors.textMuted, fontSize: '14px' }}>
                Caricamento sessioni...
              </p>
            </div>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.device);
              return (
                <motion.div
                  key={session.id}
                  style={{ ...cardStyle, padding: '16px' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div style={topHighlight} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: session.isCurrent ? `${colors.success}20` : `${colors.accent}15`,
                      }}
                    >
                      <DeviceIcon
                        size={24}
                        style={{ color: session.isCurrent ? colors.success : colors.accent }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: colors.textPrimary,
                          margin: 0,
                        }}>
                          {session.device}
                        </h3>
                        {session.isCurrent && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: colors.success,
                            background: `${colors.success}15`,
                            borderRadius: '6px',
                          }}>
                            <RiCheckLine size={10} />
                            ATTIVO
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        margin: '4px 0 0 0',
                      }}>
                        {session.browser} - {session.location}
                      </p>
                      <p style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        margin: '2px 0 0 0',
                      }}>
                        Ultimo accesso: {session.lastActive}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <motion.div
          style={{
            ...cardStyle,
            padding: '16px',
            background: `${colors.accent}08`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={topHighlight} />
          <p style={{
            fontSize: '13px',
            color: colors.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}>
            Qui puoi vedere tutti i dispositivi connessi al tuo account.
            Se noti attivita sospette, cambia subito la password.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};
