import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Toggle } from '@/components/common/Toggle';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from '@/utils/toast';
import { UserRole } from '@/types';
import {
  RiArrowLeftLine,
  RiLoader4Line,
  RiUserAddLine,
  RiDeleteBinLine,
  RiUserLine,
  RiMailLine,
  RiCloseLine,
  RiBuilding2Line,
  RiGroupLine,
  RiShieldUserLine,
  RiToolsLine,
  RiUserStarLine
} from 'react-icons/ri';

// ============================================
// GESTIONE CONDIVISIONI PAGE - v1.4.14
// Pagina dedicata alla gestione delle condivisioni
// 3 sezioni: Installatori, Proprietari, Ospiti
// ============================================

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

interface Condivisione {
  id: number;
  impianto_id: number;
  utente_id: number | null;
  email_invitato: string;
  ruolo_condivisione: 'installatore' | 'ospite' | 'proprietario';
  stato: 'pendente' | 'accettato' | 'rifiutato';
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null;
  invitato_da: number;
  creato_il: string;
  accettato_il: string | null;
  utente_nome?: string;
  utente_cognome?: string;
}

// Variants per animazioni
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

export const GestioneCondivisioni = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Verifica se l'utente può gestire condivisioni (admin, proprietario originale, installatore originale)
  const canManageShares = user?.ruolo === UserRole.ADMIN ||
    impiantoCorrente?.utente_id === user?.id ||
    impiantoCorrente?.installatore_id === user?.id;

  const [loading, setLoading] = useState(true);
  const [condivisioni, setCondivisioni] = useState<Condivisione[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Modal invito
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRuolo, setInviteRuolo] = useState<'installatore' | 'ospite' | 'proprietario'>('ospite');
  const [invitePermessi, setInvitePermessi] = useState({
    puo_controllare_dispositivi: true,
    puo_vedere_stato: true,
  });
  const [sendingInvite, setSendingInvite] = useState(false);

  // Colori dinamici basati sul tema
  const colors = {
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  };

  // Stile base card
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

  // Carica condivisioni
  const loadCondivisioni = useCallback(async () => {
    if (!impiantoCorrente?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get(`/api/impianti/${impiantoCorrente.id}/condivisioni`);
      setCondivisioni(data.data || []);
    } catch (error: any) {
      if (error.response?.status !== 403) {
        console.error('Error loading condivisioni:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [impiantoCorrente?.id]);

  useEffect(() => {
    loadCondivisioni();
  }, [loadCondivisioni]);

  // Se non c'è impianto selezionato
  if (!impiantoCorrente) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
          gap: '16px'
        }}>
          <RiBuilding2Line size={48} style={{ color: colors.textMuted, opacity: 0.5 }} />
          <p style={{ color: colors.textSecondary, textAlign: 'center' }}>
            Seleziona un impianto per accedere alle condivisioni
          </p>
          <motion.button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: `${colors.accent}20`,
              border: `1px solid ${colors.accent}50`,
              color: colors.accent,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Vai alla Dashboard
          </motion.button>
        </div>
      </Layout>
    );
  }

  // Invia invito
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Inserisci un\'email');
      return;
    }

    setSendingInvite(true);
    try {
      await api.post('/api/condivisioni/invita', {
        impiantoId: impiantoCorrente.id,
        email: inviteEmail.trim(),
        ruolo: inviteRuolo,
        permessi: invitePermessi
      });
      toast.success('Invito inviato!');
      setShowInviteModal(false);
      setInviteEmail('');
      loadCondivisioni();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore invio invito');
    } finally {
      setSendingInvite(false);
    }
  };

  // Rimuovi condivisione
  const handleRemoveCondivisione = async (id: number) => {
    if (!confirm('Rimuovere questo utente dall\'impianto?')) return;

    setDeleting(id);
    try {
      await api.delete(`/api/condivisioni/${id}`);
      toast.success('Accesso rimosso');
      loadCondivisioni();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore');
    } finally {
      setDeleting(null);
    }
  };

  // Filtra condivisioni per ruolo
  const getCondivisioniByRuolo = (ruolo: string) => {
    return condivisioni.filter(c => c.ruolo_condivisione === ruolo && c.stato === 'accettato');
  };

  const getInvitiPendentiByRuolo = (ruolo: string) => {
    return condivisioni.filter(c => c.ruolo_condivisione === ruolo && c.stato === 'pendente');
  };

  // Ruolo badge color
  const getRuoloStyle = (ruolo: string) => {
    switch (ruolo) {
      case 'installatore':
        return { bg: `${colors.warning}20`, color: colors.warning, border: `${colors.warning}50`, icon: RiToolsLine };
      case 'proprietario':
        return { bg: `${colors.accent}20`, color: colors.accent, border: `${colors.accent}50`, icon: RiUserStarLine };
      default:
        return { bg: `${colors.textMuted}20`, color: colors.textSecondary, border: `${colors.textMuted}50`, icon: RiShieldUserLine };
    }
  };

  // Componente sezione utenti per ruolo
  const UserSection = ({
    ruolo,
    title,
    description,
    icon: Icon,
    iconBg
  }: {
    ruolo: 'installatore' | 'proprietario' | 'ospite';
    title: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
  }) => {
    const utentiAccettati = getCondivisioniByRuolo(ruolo);
    const invitiPendenti = getInvitiPendentiByRuolo(ruolo);
    const ruoloStyle = getRuoloStyle(ruolo);

    return (
      <motion.div variants={cardVariants} style={{ ...cardStyle, padding: '16px' }}>
        <div style={topHighlight} />

        {/* Header sezione */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: iconBg
          }}>
            <Icon size={20} style={{ color: ruoloStyle.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>
              {description}
            </p>
          </div>
          <span style={{
            padding: '4px 10px',
            borderRadius: '8px',
            background: ruoloStyle.bg,
            color: ruoloStyle.color,
            fontSize: '12px',
            fontWeight: 600
          }}>
            {utentiAccettati.length}
          </span>
        </div>

        {/* Lista utenti accettati */}
        {utentiAccettati.length === 0 && invitiPendenti.length === 0 ? (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: colors.bgCard,
            textAlign: 'center'
          }}>
            <p style={{ color: colors.textMuted, fontSize: '13px', margin: 0 }}>
              Nessun {ruolo} condiviso
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Utenti accettati */}
            {utentiAccettati.map((cond) => (
              <div
                key={cond.id}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${ruoloStyle.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <RiUserLine size={18} style={{ color: ruoloStyle.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {cond.utente_nome ? `${cond.utente_nome} ${cond.utente_cognome || ''}`.trim() : cond.email_invitato}
                  </p>
                  <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0 0' }}>
                    {cond.puo_controllare_dispositivi ? 'Controllo dispositivi' : 'Solo visualizzazione'}
                  </p>
                </div>
                {canManageShares && (
                  <motion.button
                    onClick={() => handleRemoveCondivisione(cond.id)}
                    disabled={deleting === cond.id}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: 'none',
                      cursor: deleting === cond.id ? 'not-allowed' : 'pointer',
                      opacity: deleting === cond.id ? 0.5 : 1
                    }}
                    whileHover={{ background: `${colors.error}20` }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {deleting === cond.id ? (
                      <RiLoader4Line size={16} style={{ color: colors.error, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <RiDeleteBinLine size={16} style={{ color: colors.error }} />
                    )}
                  </motion.button>
                )}
              </div>
            ))}

            {/* Inviti pendenti */}
            {invitiPendenti.map((cond) => (
              <div
                key={cond.id}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: colors.bgCard,
                  border: `1px dashed ${colors.warning}50`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: 0.8
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `${colors.warning}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <RiMailLine size={18} style={{ color: colors.warning }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textPrimary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {cond.email_invitato}
                  </p>
                  <p style={{ fontSize: '11px', color: colors.warning, margin: '2px 0 0 0' }}>
                    In attesa di accettazione
                  </p>
                </div>
                {canManageShares && (
                  <motion.button
                    onClick={() => handleRemoveCondivisione(cond.id)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    whileHover={{ background: `${colors.error}20` }}
                  >
                    <RiCloseLine size={16} style={{ color: colors.textMuted }} />
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Layout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            onClick={() => navigate(-1)}
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RiArrowLeftLine size={20} color={colors.textSecondary} />
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Gestione Condivisioni
            </h1>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: '2px 0 0 0' }}>
              {impiantoCorrente.nome}
            </p>
          </div>

          {/* Tasto Invita - solo se può gestire */}
          {canManageShares && (
            <motion.button
              onClick={() => setShowInviteModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RiUserAddLine size={18} />
              Invita
            </motion.button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <RiLoader4Line size={32} color={colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Sezione Installatori */}
            <UserSection
              ruolo="installatore"
              title="Installatori"
              description="Possono configurare dispositivi e stanze"
              icon={RiToolsLine}
              iconBg={`${colors.warning}15`}
            />

            {/* Sezione Proprietari */}
            <UserSection
              ruolo="proprietario"
              title="Proprietari"
              description="Possono gestire l'impianto e i dispositivi"
              icon={RiUserStarLine}
              iconBg={`${colors.accent}15`}
            />

            {/* Sezione Ospiti */}
            <UserSection
              ruolo="ospite"
              title="Ospiti"
              description="Accesso limitato in base ai permessi"
              icon={RiShieldUserLine}
              iconBg={`${colors.textMuted}15`}
            />
          </>
        )}

        {/* Info box per utenti senza permessi di gestione */}
        {!canManageShares && (
          <motion.div
            variants={cardVariants}
            style={{
              ...cardStyle,
              padding: '16px',
              background: `${colors.info}10`,
              border: `1px solid ${colors.info}30`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiGroupLine size={24} style={{ color: colors.info }} />
              <div>
                <p style={{ fontSize: '14px', color: colors.textPrimary, margin: 0 }}>
                  Accesso in sola lettura
                </p>
                <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 0' }}>
                  Solo il proprietario o l'installatore originale possono gestire le condivisioni
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal Invito */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 100
              }}
              onClick={() => setShowInviteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'calc(100% - 32px)',
                maxWidth: '400px',
                background: colors.bgCardLit,
                borderRadius: '20px',
                padding: '20px',
                zIndex: 101,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.cardShadowLit
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  Invita Utente
                </h3>
                <motion.button
                  onClick={() => setShowInviteModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  whileHover={{ background: `${colors.textMuted}20` }}
                >
                  <RiCloseLine size={20} color={colors.textMuted} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Email */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@esempio.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      color: colors.textPrimary,
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Ruolo */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '6px' }}>
                    Ruolo
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['ospite', 'proprietario', 'installatore'] as const).map((ruolo) => {
                      const ruoloStyle = getRuoloStyle(ruolo);
                      return (
                        <motion.button
                          key={ruolo}
                          onClick={() => setInviteRuolo(ruolo)}
                          style={{
                            flex: 1,
                            padding: '10px 8px',
                            borderRadius: '10px',
                            background: inviteRuolo === ruolo ? ruoloStyle.bg : colors.bgCard,
                            border: `1px solid ${inviteRuolo === ruolo ? ruoloStyle.color : colors.border}`,
                            color: inviteRuolo === ruolo ? ruoloStyle.color : colors.textSecondary,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {ruolo}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Permessi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`
                  }}>
                    <span style={{ fontSize: '13px', color: colors.textPrimary }}>Può controllare dispositivi</span>
                    <Toggle
                      isOn={invitePermessi.puo_controllare_dispositivi}
                      onToggle={() => setInvitePermessi(prev => ({
                        ...prev,
                        puo_controllare_dispositivi: !prev.puo_controllare_dispositivi,
                        puo_vedere_stato: !prev.puo_controllare_dispositivi ? true : prev.puo_vedere_stato
                      }))}
                      size="sm"
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`
                  }}>
                    <span style={{ fontSize: '13px', color: colors.textPrimary }}>Può vedere stato</span>
                    <Toggle
                      isOn={invitePermessi.puo_vedere_stato}
                      onToggle={() => setInvitePermessi(prev => ({ ...prev, puo_vedere_stato: !prev.puo_vedere_stato }))}
                      size="sm"
                      disabled={invitePermessi.puo_controllare_dispositivi}
                    />
                  </div>
                </div>

                {/* Bottone invio */}
                <motion.button
                  onClick={handleSendInvite}
                  disabled={sendingInvite || !inviteEmail.trim()}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: sendingInvite || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                    opacity: sendingInvite || !inviteEmail.trim() ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  whileHover={!sendingInvite && inviteEmail.trim() ? { scale: 1.02 } : {}}
                  whileTap={!sendingInvite && inviteEmail.trim() ? { scale: 0.98 } : {}}
                >
                  {sendingInvite ? (
                    <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <RiUserAddLine size={18} />
                      Invia Invito
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default GestioneCondivisioni;
