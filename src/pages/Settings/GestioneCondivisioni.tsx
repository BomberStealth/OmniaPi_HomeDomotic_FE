import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Toggle } from '@/components/common/Toggle';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { condivisioniApi } from '@/services/api';
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
  accesso_completo: boolean;
  ruolo_visualizzato: 'installatore_secondario' | 'co_proprietario' | 'ospite';
  stato: 'pendente' | 'accettato' | 'rifiutato';
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null;
  invitato_da: number;
  creato_il: string;
  accettato_il: string | null;
  utente_nome?: string;
  utente_cognome?: string;
  utente_tipo_account?: string;
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
  const [inviteAccessoCompleto, setInviteAccessoCompleto] = useState(false);
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
      const response = await condivisioniApi.getCondivisioni(impiantoCorrente.id);
      setCondivisioni(response.data || []);
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
      await condivisioniApi.invita(impiantoCorrente.id, {
        email: inviteEmail.trim(),
        accesso_completo: inviteAccessoCompleto
      });
      toast.success('Invito inviato!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteAccessoCompleto(false);
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
      await condivisioniApi.rimuovi(id);
      toast.success('Accesso rimosso');
      loadCondivisioni();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore');
    } finally {
      setDeleting(null);
    }
  };

  // Filtra condivisioni per ruolo visualizzato
  const getCondivisioniByRuolo = (ruolo: string) => {
    return condivisioni.filter(c => c.ruolo_visualizzato === ruolo && c.stato === 'accettato');
  };

  const getInvitiPendentiByAccessoCompleto = (accessoCompleto: boolean) => {
    return condivisioni.filter(c => c.accesso_completo === accessoCompleto && c.stato === 'pendente');
  };

  // Ruolo badge color
  const getRuoloStyle = (ruolo: string) => {
    switch (ruolo) {
      case 'installatore_secondario':
        return { bg: `${colors.warning}20`, color: colors.warning, border: `${colors.warning}50`, icon: RiToolsLine };
      case 'co_proprietario':
        return { bg: `${colors.accent}20`, color: colors.accent, border: `${colors.accent}50`, icon: RiUserStarLine };
      default:
        return { bg: `${colors.textMuted}20`, color: colors.textSecondary, border: `${colors.textMuted}50`, icon: RiShieldUserLine };
    }
  };


  // Componente sezione utenti per ruolo visualizzato
  const UserSection = ({
    ruolo,
    title,
    description,
    icon: Icon,
    iconBg,
    invitiPendenti = []
  }: {
    ruolo: 'installatore_secondario' | 'co_proprietario' | 'ospite';
    title: string;
    description: string;
    icon: React.ElementType;
    iconBg: string;
    invitiPendenti?: Condivisione[];
  }) => {
    const utentiAccettati = getCondivisioniByRuolo(ruolo);
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
            {/* Sezione Installatori Secondari */}
            <UserSection
              ruolo="installatore_secondario"
              title="Installatori Secondari"
              description="Account installatore con accesso completo"
              icon={RiToolsLine}
              iconBg={`${colors.warning}15`}
              invitiPendenti={getInvitiPendentiByAccessoCompleto(true).filter(c => c.utente_tipo_account === 'installatore')}
            />

            {/* Sezione Co-Proprietari */}
            <UserSection
              ruolo="co_proprietario"
              title="Co-Proprietari"
              description="Account proprietario con accesso completo"
              icon={RiUserStarLine}
              iconBg={`${colors.accent}15`}
              invitiPendenti={getInvitiPendentiByAccessoCompleto(true).filter(c => c.utente_tipo_account === 'proprietario')}
            />

            {/* Sezione Ospiti */}
            <UserSection
              ruolo="ospite"
              title="Ospiti"
              description="Accesso limitato alle stanze selezionate"
              icon={RiShieldUserLine}
              iconBg={`${colors.textMuted}15`}
              invitiPendenti={getInvitiPendentiByAccessoCompleto(false)}
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
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 101,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '400px',
                  background: colors.bgCardLit,
                  borderRadius: '20px',
                  padding: '20px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: colors.cardShadowLit,
                  pointerEvents: 'auto'
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

                {/* Accesso Completo Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: colors.bgCard,
                  border: `1px solid ${inviteAccessoCompleto ? colors.accent : colors.border}`
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: 0 }}>
                      Accesso completo
                    </p>
                    <p style={{ fontSize: '11px', color: colors.textMuted, margin: '4px 0 0 0' }}>
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
                  borderRadius: '10px',
                  background: `${colors.info}10`,
                  border: `1px solid ${colors.info}30`
                }}>
                  <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                    Il ruolo visualizzato dipenderà dal tipo di account dell'invitato:
                  </p>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: colors.textMuted }}>
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
            </div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default GestioneCondivisioni;
