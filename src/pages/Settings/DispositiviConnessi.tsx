import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiArrowLeftLine, RiSmartphoneLine, RiComputerLine, RiMacLine, RiLoader4Line, RiCheckLine, RiDeleteBinLine, RiLogoutBoxRLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';

// ============================================
// DISPOSITIVI CONNESSI PAGE
// Mostra le sessioni attive dell'utente
// ============================================

interface Session {
  id: number;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  createdAt: string;
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
  danger: '#ef4444',
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

// Helper per formattare la data
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Adesso';
  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;

  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const DispositiviConnessi = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const colors = {
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    bgCard: modeColors.bgCard,
  };

  const cardStyle = {
    background: colors.bgCard,
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

  // Carica sessioni dal backend
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Errore caricamento sessioni:', error);
      toast.error('Errore nel caricamento delle sessioni');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Termina una sessione specifica
  const handleDeleteSession = async (sessionId: number) => {
    try {
      setDeleting(sessionId);
      const response = await api.delete(`/api/sessions/${sessionId}`);
      if (response.data.success) {
        toast.success('Sessione terminata');
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Errore terminazione sessione:', error);
      toast.error('Errore nella terminazione della sessione');
    } finally {
      setDeleting(null);
    }
  };

  // Termina tutte le sessioni tranne quella corrente
  const handleDeleteAllSessions = async () => {
    try {
      setDeletingAll(true);
      const response = await api.delete('/api/sessions/all');
      if (response.data.success) {
        toast.success(response.data.message || 'Tutte le sessioni terminate');
        // Ricarica per mostrare solo la sessione corrente
        await loadSessions();
      }
    } catch (error) {
      console.error('Errore terminazione sessioni:', error);
      toast.error('Errore nella terminazione delle sessioni');
    } finally {
      setDeletingAll(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes('iphone') || d.includes('android') || d.includes('mobile') || d.includes('phone')) {
      return RiSmartphoneLine;
    }
    if (d.includes('mac') || d.includes('ipad')) {
      return RiMacLine;
    }
    return RiComputerLine;
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);

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
            whileTap={{ scale: 0.95 }}
          >
            <RiArrowLeftLine size={20} />
          </motion.button>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: modeColors.textPrimary,
              margin: 0,
            }}>
              Dispositivi Connessi
            </h1>
            <p style={{
              fontSize: '12px',
              color: modeColors.textMuted,
              margin: '4px 0 0 0',
            }}>
              Gestisci le sessioni attive ({sessions.length})
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
              <RiLoader4Line size={32} style={{ color: colors.accent, animation: 'spin 1s linear infinite' }} />
              <p style={{ color: modeColors.textMuted, fontSize: '14px' }}>
                Caricamento sessioni...
              </p>
            </div>
          </motion.div>
        ) : sessions.length === 0 ? (
          <motion.div
            style={{ ...cardStyle, padding: '40px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={topHighlight} />
            <p style={{ color: modeColors.textMuted, fontSize: '14px', textAlign: 'center' }}>
              Nessuna sessione attiva trovata.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sessions.map((session, index) => {
              const DeviceIcon = getDeviceIcon(session.device);
              const isDeleting = deleting === session.id;

              return (
                <motion.div
                  key={session.id}
                  style={{ ...cardStyle, padding: '16px' }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div style={topHighlight} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '14px',
                        background: session.isCurrent ? `${colors.success}20` : `${colors.accent}15`,
                        flexShrink: 0,
                      }}
                    >
                      <DeviceIcon
                        size={24}
                        style={{ color: session.isCurrent ? colors.success : colors.accent }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: modeColors.textPrimary,
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
                            QUESTO
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: modeColors.textSecondary,
                        margin: '4px 0 0 0',
                      }}>
                        {session.browser}
                      </p>
                      <p style={{
                        fontSize: '11px',
                        color: modeColors.textMuted,
                        margin: '2px 0 0 0',
                      }}>
                        Ultimo accesso: {formatDate(session.lastActive)}
                      </p>
                    </div>

                    {/* Bottone disconnetti (solo per sessioni non correnti) */}
                    {!session.isCurrent && (
                      <motion.button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={isDeleting}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          background: `${colors.danger}15`,
                          border: `1px solid ${colors.danger}30`,
                          color: colors.danger,
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                          opacity: isDeleting ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                        whileTap={isDeleting ? undefined : { scale: 0.95 }}
                      >
                        {isDeleting ? (
                          <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <RiDeleteBinLine size={18} />
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Bottone Disconnetti tutte (se ci sono altre sessioni) */}
            {otherSessions.length > 0 && (
              <motion.button
                onClick={handleDeleteAllSessions}
                disabled={deletingAll}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: `${colors.danger}15`,
                  border: `1px solid ${colors.danger}30`,
                  color: colors.danger,
                  cursor: deletingAll ? 'not-allowed' : 'pointer',
                  opacity: deletingAll ? 0.6 : 1,
                  fontSize: '14px',
                  fontWeight: 600,
                  marginTop: '8px',
                }}
                whileTap={deletingAll ? undefined : { scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {deletingAll ? (
                  <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RiLogoutBoxRLine size={18} />
                )}
                Disconnetti tutte le altre sessioni
              </motion.button>
            )}
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
            color: modeColors.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}>
            Qui puoi vedere tutti i dispositivi connessi al tuo account.
            Se noti attività sospette, disconnetti la sessione e cambia subito la password.
          </p>
        </motion.div>
      </div>

      {/* Stile per animazione spin */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
};
