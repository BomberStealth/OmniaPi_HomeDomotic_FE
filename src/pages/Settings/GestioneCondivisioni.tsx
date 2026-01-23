import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Toggle } from '@/components/common/Toggle';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useViewTransitionNavigate } from '@/hooks/useViewTransition';
import { condivisioniApi, stanzeApi } from '@/services/api';
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
  RiUserStarLine,
  RiEditLine
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

interface Stanza {
  id: number;
  nome: string;
  icona?: string;
}


export const GestioneCondivisioni = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const navigate = useViewTransitionNavigate();

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
  const [inviteStanzeSelezionate, setInviteStanzeSelezionate] = useState<number[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Stanze disponibili
  const [stanze, setStanze] = useState<Stanza[]>([]);

  // Modal modifica stanze
  const [showEditStanzeModal, setShowEditStanzeModal] = useState(false);
  const [editingCondivisione, setEditingCondivisione] = useState<Condivisione | null>(null);
  const [editStanzeSelezionate, setEditStanzeSelezionate] = useState<number[]>([]);
  const [savingStanze, setSavingStanze] = useState(false);

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

  // IMPORTANTE: dipendenza SOLO su impiantoId, non sulla funzione
  // per evitare re-fetch ad ogni render
  useEffect(() => {
    loadCondivisioni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [impiantoCorrente?.id]);

  // Carica stanze disponibili
  useEffect(() => {
    const loadStanze = async () => {
      if (!impiantoCorrente?.id) return;
      try {
        const data = await stanzeApi.getStanze(impiantoCorrente.id);
        setStanze(data || []);
      } catch (error) {
        console.error('Error loading stanze:', error);
      }
    };
    loadStanze();
  }, [impiantoCorrente?.id]);

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

    // Se non ha accesso completo, deve selezionare almeno una stanza
    if (!inviteAccessoCompleto && inviteStanzeSelezionate.length === 0) {
      toast.error('Seleziona almeno una stanza per l\'accesso ospite');
      return;
    }

    setSendingInvite(true);
    try {
      await condivisioniApi.invita(impiantoCorrente.id, {
        email: inviteEmail.trim(),
        accesso_completo: inviteAccessoCompleto,
        stanze_abilitate: inviteAccessoCompleto ? null : inviteStanzeSelezionate
      });
      toast.success('Invito inviato!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteAccessoCompleto(false);
      setInviteStanzeSelezionate([]);
      loadCondivisioni();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore invio invito');
    } finally {
      setSendingInvite(false);
    }
  };

  // Toggle selezione stanza (invito)
  const toggleStanzaSelection = (stanzaId: number) => {
    setInviteStanzeSelezionate(prev =>
      prev.includes(stanzaId)
        ? prev.filter(id => id !== stanzaId)
        : [...prev, stanzaId]
    );
  };

  // Toggle selezione stanza (modifica)
  const toggleEditStanzaSelection = (stanzaId: number) => {
    setEditStanzeSelezionate(prev =>
      prev.includes(stanzaId)
        ? prev.filter(id => id !== stanzaId)
        : [...prev, stanzaId]
    );
  };

  // Apri modal modifica stanze
  const handleOpenEditStanze = (cond: Condivisione) => {
    setEditingCondivisione(cond);
    // Parsa stanze_abilitate - può essere JSON string o array
    let stanzeAtt: number[] = [];
    if (cond.stanze_abilitate) {
      if (typeof cond.stanze_abilitate === 'string') {
        try {
          stanzeAtt = JSON.parse(cond.stanze_abilitate);
        } catch { stanzeAtt = []; }
      } else if (Array.isArray(cond.stanze_abilitate)) {
        stanzeAtt = cond.stanze_abilitate;
      }
    }
    setEditStanzeSelezionate(stanzeAtt);
    setShowEditStanzeModal(true);
  };

  // Salva modifica stanze
  const handleSaveStanze = async () => {
    if (!editingCondivisione) return;

    if (editStanzeSelezionate.length === 0) {
      toast.error('Seleziona almeno una stanza');
      return;
    }

    setSavingStanze(true);
    try {
      await condivisioniApi.modificaPermessi(editingCondivisione.id, {
        stanze_abilitate: editStanzeSelezionate,
        puo_controllare_dispositivi: true
      });
      toast.success('Stanze aggiornate');
      setShowEditStanzeModal(false);
      setEditingCondivisione(null);
      loadCondivisioni();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore salvataggio');
    } finally {
      setSavingStanze(false);
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
      <div style={{ ...cardStyle, padding: '16px' }}>
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
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Bottone modifica stanze - solo per ospiti */}
                    {!cond.accesso_completo && (
                      <motion.button
                        type="button"
                        onClick={() => handleOpenEditStanze(cond)}
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        whileHover={{ background: `${colors.accent}20` }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <RiEditLine size={16} style={{ color: colors.accent }} />
                      </motion.button>
                    )}
                    {/* Bottone elimina */}
                    <motion.button
                      type="button"
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
                  </div>
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
      </div>
    );
  };

  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          viewTransitionName: 'page-content'
        }}
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
          <div
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
          </div>
        )}
      </div>

      {/* Modal Invito */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            {/* Backdrop - cliccando chiude il modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowInviteModal(false);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 100,
                backdropFilter: 'blur(4px)',
                touchAction: 'none',  // Blocca touch events sul backdrop
                overscrollBehavior: 'contain'
              }}
            />
            {/* Container centrato */}
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 101,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                pointerEvents: 'none'
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '400px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  background: colors.bgCardLit,
                  borderRadius: '20px',
                  padding: '20px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: colors.cardShadowLit,
                  pointerEvents: 'auto',
                  overscrollBehavior: 'contain',  // Previene pull-to-refresh
                  touchAction: 'pan-y'  // Permette solo scroll verticale interno
                }}
              >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  Invita Utente
                </h3>
                <motion.button
                  type="button"
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendInvite();
                      }
                    }}
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

                {/* Selezione Stanze - solo se accesso NON completo */}
                {!inviteAccessoCompleto && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary, display: 'block', marginBottom: '8px' }}>
                      Stanze abilitate
                    </label>
                    {stanze.length === 0 ? (
                      <div style={{
                        padding: '12px',
                        borderRadius: '10px',
                        background: `${colors.warning}10`,
                        border: `1px solid ${colors.warning}30`
                      }}>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                          Nessuna stanza disponibile. Crea prima delle stanze nell'impianto.
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {stanze.map((stanza) => {
                          const isSelected = inviteStanzeSelezionate.includes(stanza.id);
                          return (
                            <motion.button
                              key={stanza.id}
                              type="button"
                              onClick={() => toggleStanzaSelection(stanza.id)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: isSelected ? `${colors.accent}20` : colors.bgCard,
                                border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                                color: isSelected ? colors.accent : colors.textSecondary,
                                fontSize: '13px',
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer'
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {stanza.nome}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                    {inviteStanzeSelezionate.length > 0 && (
                      <p style={{ fontSize: '11px', color: colors.textMuted, margin: '8px 0 0 0' }}>
                        {inviteStanzeSelezionate.length} stanza/e selezionata/e
                      </p>
                    )}
                  </div>
                )}

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
                  type="button"
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

      {/* Modal Modifica Stanze */}
      <AnimatePresence>
        {showEditStanzeModal && editingCondivisione && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowEditStanzeModal(false);
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 1000,
                backdropFilter: 'blur(4px)',
                touchAction: 'none',
                overscrollBehavior: 'contain'
              }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1001,
                padding: '20px',
                pointerEvents: 'none'
              }}
            >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                background: colors.bgCard,
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '400px',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                pointerEvents: 'auto',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: colors.textPrimary, margin: 0, fontSize: '18px' }}>
                  Modifica Stanze
                </h3>
                <motion.button
                  type="button"
                  onClick={() => setShowEditStanzeModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <RiCloseLine size={24} />
                </motion.button>
              </div>

              <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '16px' }}>
                Stanze accessibili per <strong style={{ color: colors.textPrimary }}>{editingCondivisione.email_invitato}</strong>
              </p>

              {/* Selezione stanze */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {stanze.map(stanza => (
                    <motion.button
                      key={stanza.id}
                      type="button"
                      onClick={() => toggleEditStanzaSelection(stanza.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        background: editStanzeSelezionate.includes(stanza.id)
                          ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`
                          : colors.bg,
                        color: editStanzeSelezionate.includes(stanza.id) ? '#fff' : colors.textSecondary,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {stanza.nome}
                    </motion.button>
                  ))}
                </div>
                {stanze.length === 0 && (
                  <p style={{ color: colors.textSecondary, fontSize: '13px', textAlign: 'center' }}>
                    Nessuna stanza disponibile
                  </p>
                )}
              </div>

              {/* Bottoni azioni */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  type="button"
                  onClick={() => setShowEditStanzeModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: colors.bg,
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Annulla
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSaveStanze}
                  disabled={savingStanze || editStanzeSelezionate.length === 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: savingStanze || editStanzeSelezionate.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: savingStanze || editStanzeSelezionate.length === 0 ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  whileHover={!savingStanze && editStanzeSelezionate.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={!savingStanze && editStanzeSelezionate.length > 0 ? { scale: 0.98 } : {}}
                >
                  {savingStanze ? (
                    <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Salva'
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
