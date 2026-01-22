import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Toggle } from '@/components/common/Toggle';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import {
  RiArrowLeftLine,
  RiLoader4Line,
  RiUserAddLine,
  RiDeleteBinLine,
  RiToolsLine,
  RiUserLine,
  RiMailLine,
  RiTimeLine,
  RiCloseLine,
  RiCheckLine,
  RiShieldLine,
  RiHome4Line,
  RiCloseCircleLine
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { condivisioniApi } from '@/services/api';
import { toast } from '@/utils/toast';
import { useInvitiPendenti } from '@/hooks/useInvitiPendenti';
import { useAuthStore } from '@/store/authStore';

// ============================================
// PERMESSI IMPIANTO PAGE
// Gestione condivisioni e permessi utenti
// ============================================

interface Condivisione {
  id: number;
  impianto_id: number;
  utente_id: number | null;
  email_invitato: string;
  accesso_completo: boolean;
  ruolo_visualizzato: 'installatore_secondario' | 'co_proprietario' | 'ospite';
  stato: 'pendente' | 'accettato' | 'rifiutato';
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null;
  invitato_da: number;
  creato_il: string;
  accettato_il: string | null;
  // Campi join
  utente_nome?: string;
  utente_cognome?: string;
}

const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
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
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const PermessiImpianto = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente, refresh: refreshImpianti } = useImpiantoContext();
  const navigate = useNavigate();
  const { inviti, accettaInvito, rifiutaInvito } = useInvitiPendenti();
  const { user: _user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [processingInvito, setProcessingInvito] = useState<number | null>(null);
  const [condivisioni, setCondivisioni] = useState<Condivisione[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteAccessoCompleto, setInviteAccessoCompleto] = useState(false);
  const [inviting, setInviting] = useState(false);

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

  // Carica condivisioni
  const loadCondivisioni = useCallback(async () => {
    if (!impiantoCorrente?.id) return;

    try {
      setLoading(true);
      const response = await condivisioniApi.getCondivisioni(impiantoCorrente.id);
      if (response.success) {
        setCondivisioni(response.data);
      }
    } catch (error) {
      console.error('Errore caricamento condivisioni:', error);
      toast.error('Errore nel caricamento');
    } finally {
      setLoading(false);
    }
  }, [impiantoCorrente?.id]);

  useEffect(() => {
    loadCondivisioni();
  }, [loadCondivisioni]);

  // Invita utente
  const handleInvite = async () => {
    if (!inviteEmail.trim() || !impiantoCorrente?.id) {
      toast.error('Inserisci un\'email valida');
      return;
    }

    try {
      setInviting(true);
      const response = await condivisioniApi.invita(impiantoCorrente.id, {
        email: inviteEmail.trim(),
        accesso_completo: inviteAccessoCompleto,
      });

      if (response.success) {
        toast.success('Invito inviato!');
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteAccessoCompleto(false);
        loadCondivisioni();
      }
    } catch (error: any) {
      console.error('Errore invio invito:', error);
      toast.error(error.response?.data?.message || 'Errore nell\'invio');
    } finally {
      setInviting(false);
    }
  };

  // Rimuovi condivisione
  const handleRemove = async (id: number) => {
    try {
      setDeleting(id);
      const response = await condivisioniApi.rimuovi(id);
      if (response.success) {
        toast.success('Accesso rimosso');
        setCondivisioni(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Errore rimozione:', error);
      toast.error('Errore nella rimozione');
    } finally {
      setDeleting(null);
    }
  };

  // Toggle permesso
  const handleTogglePermesso = async (id: number, campo: string, valore: boolean) => {
    try {
      // Se attivo Controllo, attivo automaticamente anche Stato
      // (non puoi controllare senza vedere lo stato)
      let payload: Record<string, boolean> = { [campo]: valore };

      if (campo === 'puo_controllare_dispositivi' && valore === true) {
        payload = { puo_controllare_dispositivi: true, puo_vedere_stato: true };
      }

      const response = await condivisioniApi.modificaPermessi(id, payload);
      if (response.success) {
        setCondivisioni(prev =>
          prev.map(c => (c.id === id ? { ...c, ...payload } : c))
        );
        toast.success('Permesso aggiornato');
      }
    } catch (error: any) {
      console.error('Errore aggiornamento permesso:', error);
      // Mostra messaggio di errore specifico se disponibile
      const errorMsg = error.response?.data?.error || 'Errore nell\'aggiornamento';
      toast.error(errorMsg);
    }
  };

  // Filtra per ruolo visualizzato
  const installatori = condivisioni.filter(c => c.ruolo_visualizzato === 'installatore_secondario');
  const proprietari = condivisioni.filter(c => c.ruolo_visualizzato === 'co_proprietario');
  const ospiti = condivisioni.filter(c => c.ruolo_visualizzato === 'ospite');

  // Card per un utente condiviso
  const UserCard = ({ cond }: { cond: Condivisione }) => {
    const isDeleting = deleting === cond.id;
    const isPending = cond.stato === 'pendente';
    const isInstallatore = cond.ruolo_visualizzato === 'installatore_secondario';
    const isProprietario = cond.ruolo_visualizzato === 'co_proprietario';

    return (
      <motion.div
        style={{ ...cardStyle, padding: '14px' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={topHighlight} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Avatar */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isInstallatore ? `${colors.warning}20` :
                         isProprietario ? `${colors.success}20` :
                         `${colors.accent}15`,
              border: `1px solid ${isInstallatore ? colors.warning :
                                  isProprietario ? colors.success :
                                  colors.accent}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isInstallatore ? (
              <RiToolsLine size={20} style={{ color: colors.warning }} />
            ) : isProprietario ? (
              <RiHome4Line size={20} style={{ color: colors.success }} />
            ) : (
              <RiUserLine size={20} style={{ color: colors.accent }} />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: modeColors.textPrimary,
                margin: 0,
              }}>
                {cond.utente_nome && cond.utente_cognome
                  ? `${cond.utente_nome} ${cond.utente_cognome}`
                  : cond.email_invitato}
              </h3>
              {isPending && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: colors.warning,
                  background: `${colors.warning}15`,
                  borderRadius: '6px',
                }}>
                  <RiTimeLine size={10} />
                  PENDENTE
                </span>
              )}
            </div>

            {cond.utente_nome && (
              <p style={{
                fontSize: '12px',
                color: modeColors.textMuted,
                margin: '2px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <RiMailLine size={12} />
                {cond.email_invitato}
              </p>
            )}

            <p style={{
              fontSize: '11px',
              color: modeColors.textMuted,
              margin: '4px 0 0 0',
            }}>
              {isPending ? 'Invitato' : 'Accettato'}: {formatDate(isPending ? cond.creato_il : cond.accettato_il!)}
            </p>

            {/* Permessi toggles (solo per ospiti) */}
            {!isInstallatore && cond.stato === 'accettato' && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: modeColors.textSecondary }}>
                    Controllo
                  </span>
                  <Toggle
                    isOn={cond.puo_controllare_dispositivi}
                    onToggle={() => handleTogglePermesso(
                      cond.id,
                      'puo_controllare_dispositivi',
                      !cond.puo_controllare_dispositivi
                    )}
                    size="sm"
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: modeColors.textSecondary }}>
                    Stato
                  </span>
                  <Toggle
                    isOn={cond.puo_vedere_stato}
                    onToggle={() => handleTogglePermesso(
                      cond.id,
                      'puo_vedere_stato',
                      !cond.puo_vedere_stato
                    )}
                    size="sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <motion.button
            onClick={() => handleRemove(cond.id)}
            disabled={isDeleting}
            style={{
              padding: '8px',
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
              <RiLoader4Line size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <RiDeleteBinLine size={16} />
            )}
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // Sezione vuota
  const EmptySection = ({ text }: { text: string }) => (
    <div style={{
      padding: '20px',
      textAlign: 'center',
      color: modeColors.textMuted,
      fontSize: '13px',
    }}>
      {text}
    </div>
  );

  // Sezione inviti ricevuti (componente riusabile)
  const InvitiRicevutiSection = () => {
    if (inviti.length === 0) return null;

    return (
      <div>
        <h2 style={{
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: colors.warning,
          margin: '0 0 10px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <RiMailLine size={14} style={{ color: colors.warning }} />
          Inviti Ricevuti ({inviti.length})
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inviti.map((invito) => {
            const isProcessing = processingInvito === invito.id;
            return (
              <motion.div
                key={invito.id}
                style={{
                  ...cardStyle,
                  padding: '14px',
                  border: `1px solid ${colors.warning}40`,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={topHighlight} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: `${colors.warning}20`,
                      border: `1px solid ${colors.warning}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <RiHome4Line size={20} style={{ color: colors.warning }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: modeColors.textPrimary,
                      margin: 0,
                    }}>
                      {invito.impianto_nome}
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: modeColors.textSecondary,
                      margin: '4px 0 0 0',
                    }}>
                      Invito da {invito.invitato_da_nome} {invito.invitato_da_cognome}
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: modeColors.textMuted,
                      margin: '2px 0 0 0',
                    }}>
                      Come {invito.ruolo_condivisione} · {formatDate(invito.creato_il)}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <motion.button
                        onClick={async () => {
                          setProcessingInvito(invito.id);
                          const success = await accettaInvito(invito.id);
                          if (success) {
                            toast.success('Invito accettato!');
                            refreshImpianti();
                          } else {
                            toast.error('Errore');
                          }
                          setProcessingInvito(null);
                        }}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: `${colors.success}20`,
                          border: `1px solid ${colors.success}40`,
                          color: colors.success,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        whileTap={isProcessing ? undefined : { scale: 0.95 }}
                      >
                        {isProcessing ? (
                          <RiLoader4Line size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <>
                            <RiCheckLine size={14} />
                            Accetta
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          setProcessingInvito(invito.id);
                          const success = await rifiutaInvito(invito.id);
                          if (success) {
                            toast.success('Invito rifiutato');
                          } else {
                            toast.error('Errore');
                          }
                          setProcessingInvito(null);
                        }}
                        disabled={isProcessing}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: `${colors.danger}15`,
                          border: `1px solid ${colors.danger}30`,
                          color: colors.danger,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        whileTap={isProcessing ? undefined : { scale: 0.95 }}
                      >
                        <RiCloseCircleLine size={14} />
                        Rifiuta
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!impiantoCorrente) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
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
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: modeColors.textPrimary,
              margin: 0,
            }}>
              Permessi Impianto
            </h1>
          </div>

          {/* Inviti Ricevuti - sempre visibili */}
          <InvitiRicevutiSection />

          {/* Messaggio nessun impianto */}
          {inviti.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <p style={{ color: modeColors.textMuted }}>
                Seleziona un impianto per gestire i permessi
              </p>
              <motion.button
                onClick={() => navigate('/impianti')}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  background: colors.accent,
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                whileTap={{ scale: 0.95 }}
              >
                Vai agli Impianti
              </motion.button>
            </div>
          )}
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
  }

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
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: modeColors.textPrimary,
              margin: 0,
            }}>
              Permessi Impianto
            </h1>
            <p style={{
              fontSize: '12px',
              color: modeColors.textMuted,
              margin: '4px 0 0 0',
            }}>
              {impiantoCorrente.nome}
            </p>
          </div>
        </div>

        {/* Info Card */}
        <motion.div
          style={{
            ...cardStyle,
            padding: '14px',
            background: `${colors.accent}08`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={topHighlight} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RiShieldLine size={20} style={{ color: colors.accent }} />
            <p style={{
              fontSize: '13px',
              color: modeColors.textSecondary,
              margin: 0,
              lineHeight: 1.4,
            }}>
              Gestisci chi può accedere al tuo impianto e quali permessi ha.
            </p>
          </div>
        </motion.div>

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
                Caricamento...
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Sezione Inviti Ricevuti */}
            <InvitiRicevutiSection />

            {/* Sezione Proprietari (se presenti) */}
            {proprietari.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: modeColors.textMuted,
                  margin: '0 0 10px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <RiHome4Line size={14} style={{ color: colors.success }} />
                  Proprietari ({proprietari.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {proprietari.map(cond => <UserCard key={cond.id} cond={cond} />)}
                </div>
              </div>
            )}

            {/* Sezione Installatori */}
            <div>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: modeColors.textMuted,
                margin: '0 0 10px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <RiToolsLine size={14} style={{ color: colors.warning }} />
                Installatori ({installatori.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {installatori.length > 0 ? (
                  installatori.map(cond => <UserCard key={cond.id} cond={cond} />)
                ) : (
                  <motion.div style={{ ...cardStyle, padding: 0 }}>
                    <div style={topHighlight} />
                    <EmptySection text="Nessun installatore con accesso" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Sezione Ospiti */}
            <div>
              <h2 style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: modeColors.textMuted,
                margin: '0 0 10px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <RiUserLine size={14} style={{ color: colors.accent }} />
                Ospiti ({ospiti.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ospiti.length > 0 ? (
                  ospiti.map(cond => <UserCard key={cond.id} cond={cond} />)
                ) : (
                  <motion.div style={{ ...cardStyle, padding: 0 }}>
                    <div style={topHighlight} />
                    <EmptySection text="Nessun ospite con accesso" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottone Invita */}
            <motion.button
              onClick={() => setShowInviteModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 20px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentLight})`,
                border: 'none',
                color: '#000',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '8px',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RiUserAddLine size={20} />
              Invita Utente
            </motion.button>
          </>
        )}
      </div>

      {/* Modal Invita */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                ...cardStyle,
                width: '100%',
                maxWidth: '400px',
                padding: '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={topHighlight} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: modeColors.textPrimary,
                  margin: 0,
                }}>
                  Invita Utente
                </h2>
                <motion.button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: modeColors.textMuted,
                    cursor: 'pointer',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RiCloseLine size={20} />
                </motion.button>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: modeColors.textSecondary,
                  marginBottom: '8px',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@esempio.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    background: 'rgba(0,0,0,0.2)',
                    color: modeColors.textPrimary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Ruolo */}
              {/* Accesso Completo Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.15)',
                border: `1px solid ${inviteAccessoCompleto ? colors.accent : colors.border}`,
                marginBottom: '16px',
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: modeColors.textPrimary, margin: 0 }}>
                    Accesso completo
                  </p>
                  <p style={{ fontSize: '11px', color: modeColors.textMuted, margin: '4px 0 0 0' }}>
                    {inviteAccessoCompleto
                      ? 'Può gestire tutti i dispositivi e le stanze'
                      : 'Accesso limitato come ospite'}
                  </p>
                </div>
                <Toggle
                  isOn={inviteAccessoCompleto}
                  onToggle={() => setInviteAccessoCompleto(!inviteAccessoCompleto)}
                  size="md"
                />
              </div>

              {/* Info ruolo risultante */}
              <div style={{
                padding: '12px',
                background: `${colors.accent}10`,
                borderRadius: '10px',
                marginBottom: '20px',
              }}>
                <p style={{
                  fontSize: '12px',
                  color: modeColors.textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  Il ruolo visualizzato dipenderà dal tipo di account dell'invitato:
                </p>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: modeColors.textMuted }}>
                  {inviteAccessoCompleto ? (
                    <>
                      <li>Account Installatore → Installatore Secondario</li>
                      <li>Account Proprietario → Co-Proprietario</li>
                    </>
                  ) : (
                    <li>Qualsiasi account → Ospite</li>
                  )}
                </ul>
              </div>

              {/* Bottoni */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <motion.button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    background: 'transparent',
                    color: modeColors.textSecondary,
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Annulla
                </motion.button>
                <motion.button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: inviting || !inviteEmail.trim()
                      ? modeColors.textMuted
                      : `linear-gradient(135deg, ${colors.accent}, ${colors.accentLight})`,
                    color: '#000',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: inviting || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  whileTap={inviting || !inviteEmail.trim() ? undefined : { scale: 0.98 }}
                >
                  {inviting ? (
                    <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <RiCheckLine size={18} />
                      Invita
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
