import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useImpiantiStore } from '@/store/impiantiStore';
import { useNavigate } from 'react-router-dom';
import { impiantiApi } from '@/services/api';
import { toast } from '@/utils/toast';
import { UserRole } from '@/types';
import { Input } from '@/components/common/Input';
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiBuilding2Line,
  RiMapPinLine,
  RiGroupLine,
  RiNotification3Line,
  RiFileCopyLine,
  RiShareLine,
  RiPencilLine,
  RiCloseLine,
  RiLoader4Line,
  RiSaveLine,
  RiDeleteBinLine,
  RiAlertLine
} from 'react-icons/ri';

// ============================================
// IMPIANTO SETTINGS PAGE - v1.4.15
// Layout:
// - Header con nome + tasto modifica
// - Città/posizione
// - Codice impianto con copia e share (NON rigenerabile)
// - Card Preferenze Notifiche (placeholder)
// - Card Gestione Condivisioni → /impianto/condivisioni
// - Mappa placeholder
// - Zona Pericolosa: Elimina impianto
// ============================================

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
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

export const ImpiantoSettings = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente, setImpiantoCorrente } = useImpiantoContext();
  const { impianti, removeImpianto, fetchImpianti } = useImpiantiStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Verifica se l'utente può modificare l'impianto (admin, proprietario originale, installatore originale)
  const canEditImpianto = user?.ruolo === UserRole.ADMIN ||
    impiantoCorrente?.utente_id === user?.id ||
    impiantoCorrente?.installatore_id === user?.id;

  // Modal modifica impianto
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: ''
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  // Carica dati form quando si apre modal modifica
  useEffect(() => {
    if (showEditModal && impiantoCorrente) {
      setFormData({
        nome: impiantoCorrente.nome || '',
        indirizzo: impiantoCorrente.indirizzo || '',
        citta: impiantoCorrente.citta || '',
        cap: impiantoCorrente.cap || ''
      });
    }
  }, [showEditModal, impiantoCorrente]);

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
            Seleziona un impianto per accedere alle impostazioni
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

  // Copia codice impianto
  const handleCopyCode = () => {
    if (impiantoCorrente.codice_condivisione) {
      navigator.clipboard.writeText(impiantoCorrente.codice_condivisione);
      toast.success('Codice copiato!');
    }
  };

  // Share nativo
  const handleShare = async () => {
    const codice = impiantoCorrente.codice_condivisione;
    if (!codice) {
      toast.error('Codice non disponibile');
      return;
    }

    const shareData = {
      title: 'OmniaPi - Codice Impianto',
      text: `Unisciti al mio impianto "${impiantoCorrente.nome}" su OmniaPi!\n\nCodice: ${codice}`,
    };

    // Verifica se il browser supporta Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error: any) {
        // L'utente ha annullato la condivisione - non mostrare errore
        if (error.name !== 'AbortError') {
          console.error('Errore condivisione:', error);
          // Fallback: copia negli appunti
          handleCopyCode();
        }
      }
    } else {
      // Fallback per browser che non supportano Web Share API
      handleCopyCode();
    }
  };

  // Salva modifiche impianto
  const handleSaveImpianto = async () => {
    if (!formData.nome.trim()) {
      toast.error('Inserisci il nome dell\'impianto');
      return;
    }

    setSaving(true);
    try {
      const response = await impiantiApi.update(impiantoCorrente.id, formData);
      if (response.success) {
        // Aggiorna il contesto con i nuovi dati
        setImpiantoCorrente({
          ...impiantoCorrente,
          ...formData
        });
        toast.success('Modifiche salvate!');
        setShowEditModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  // Elimina impianto
  const handleDelete = async () => {
    if (deleteConfirmText !== 'ELIMINA') {
      toast.error('Scrivi ELIMINA per confermare');
      return;
    }

    setDeleting(true);
    try {
      const impiantoId = impiantoCorrente.id;
      const isLastImpianto = impianti.length <= 1;

      await impiantiApi.delete(impiantoId);
      removeImpianto(impiantoId);

      toast.success('Impianto eliminato con successo');

      if (isLastImpianto) {
        navigate('/', { replace: true });
      } else {
        await fetchImpianti();
        navigate('/impianti', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  // Setting Row Component
  const SettingRow = ({
    icon: Icon,
    iconBg,
    title,
    subtitle,
    onClick,
    rightElement,
    showArrow = true
  }: {
    icon: React.ElementType;
    iconBg: string;
    title: string;
    subtitle: string;
    onClick?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <motion.div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <div style={topHighlight} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: iconBg }}>
            <Icon size={18} style={{ color: colors.accent }} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0 0' }}>
              {subtitle}
            </p>
          </div>
        </div>
        {rightElement || (showArrow && (
          <RiArrowRightSLine size={18} style={{ color: colors.textMuted }} />
        ))}
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Header con back button */}
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
              Impostazioni Impianto
            </h1>
          </div>
        </div>

        {/* Card principale impianto */}
        <motion.div variants={cardVariants} style={{ ...cardStyle, padding: '16px' }}>
          <div style={topHighlight} />

          {/* Nome impianto + tasto modifica */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.accent}30, ${colors.accentDark}20)`,
                border: `1px solid ${colors.accent}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <RiBuilding2Line size={24} style={{ color: colors.accent }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  {impiantoCorrente.nome}
                </h3>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RiMapPinLine size={14} />
                  {impiantoCorrente.citta || 'Posizione non specificata'}
                </p>
              </div>
            </div>

            {/* Tasto modifica (penna) - solo se può modificare */}
            {canEditImpianto && (
              <motion.button
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: `${colors.accent}15`,
                  border: `1px solid ${colors.accent}30`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                whileHover={{ scale: 1.05, background: `${colors.accent}25` }}
                whileTap={{ scale: 0.95 }}
              >
                <RiPencilLine size={18} color={colors.accent} />
              </motion.button>
            )}
          </div>

          {/* Codice Impianto - NON rigenerabile */}
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Codice Impianto
                </p>
                <p style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  margin: '4px 0 0 0',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em'
                }}>
                  {impiantoCorrente.codice_condivisione || 'N/A'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Tasto Copia */}
                <motion.button
                  onClick={handleCopyCode}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: `${colors.accent}15`,
                    border: `1px solid ${colors.accent}30`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Copia codice"
                >
                  <RiFileCopyLine size={18} color={colors.accent} />
                </motion.button>

                {/* Tasto Share */}
                <motion.button
                  onClick={handleShare}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Condividi"
                >
                  <RiShareLine size={18} color="#fff" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sezione Impostazioni */}
        <motion.div variants={cardVariants} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.textMuted,
            margin: '0 4px',
          }}>
            Impostazioni
          </h2>

          <SettingRow
            icon={RiNotification3Line}
            iconBg={`${colors.accent}20`}
            title="Preferenze Notifiche"
            subtitle="In arrivo"
            onClick={() => toast.info('Funzionalità in arrivo')}
          />

          <SettingRow
            icon={RiGroupLine}
            iconBg={`${colors.success}20`}
            title="Gestione Condivisioni"
            subtitle="Gestisci accessi e inviti"
            onClick={() => navigate('/impianto/condivisioni')}
          />
        </motion.div>

        {/* Mappa Placeholder */}
        <motion.div
          variants={cardVariants}
          style={{
            ...cardStyle,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <div style={topHighlight} />
          <span style={{ fontSize: '32px' }}>🗺️</span>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
            Mappa in arrivo
          </p>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
            Visualizza la posizione del tuo impianto
          </p>
        </motion.div>

        {/* Zona Pericolosa - solo se può modificare */}
        {canEditImpianto && (
          <motion.div variants={cardVariants} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.error,
              margin: '0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <RiAlertLine size={14} />
              Zona Pericolosa
            </h2>

            <motion.div
              style={{
                ...cardStyle,
                padding: '16px',
                border: `1px solid ${colors.error}30`,
                background: `${colors.error}08`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                    Elimina Impianto
                  </h3>
                  <p style={{ fontSize: '12px', color: colors.textMuted, margin: '4px 0 0 0' }}>
                    Questa azione è irreversibile
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    background: colors.error,
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RiDeleteBinLine size={16} />
                  Elimina
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal Modifica Impianto - CENTRATO */}
      <AnimatePresence>
        {showEditModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
              }}
              onClick={() => setShowEditModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                background: colors.bgCardLit,
                borderRadius: '20px',
                padding: '20px',
                border: `1px solid ${colors.border}`,
                boxShadow: colors.cardShadowLit
              }}
            >
              {/* Header Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                  Modifica Impianto
                </h3>
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  whileHover={{ background: `${colors.textMuted}20` }}
                >
                  <RiCloseLine size={20} color={colors.textMuted} />
                </motion.button>
              </div>

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Input
                  label="Nome Impianto *"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="es. Casa Principale"
                />

                <Input
                  label="Indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="es. Via Roma 123"
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 2 }}>
                    <Input
                      label="Città"
                      value={formData.citta}
                      onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                      placeholder="es. Milano"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="CAP"
                      value={formData.cap}
                      onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                      placeholder="20100"
                      maxLength={5}
                    />
                  </div>
                </div>

                {/* Bottoni */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <motion.button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    onClick={handleSaveImpianto}
                    disabled={saving || !formData.nome.trim()}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: saving || !formData.nome.trim() ? 'not-allowed' : 'pointer',
                      opacity: saving || !formData.nome.trim() ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    whileHover={!saving && formData.nome.trim() ? { scale: 1.02 } : {}}
                    whileTap={!saving && formData.nome.trim() ? { scale: 0.98 } : {}}
                  >
                    {saving ? (
                      <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <RiSaveLine size={18} />
                        Salva
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Elimina Impianto */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
              }}
              onClick={handleCloseDeleteModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                background: colors.bgCardLit,
                borderRadius: '20px',
                padding: '20px',
                border: `1px solid ${colors.error}30`,
                boxShadow: colors.cardShadowLit
              }}
            >
              {/* Header Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.error, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RiDeleteBinLine size={20} />
                  Elimina Impianto
                </h3>
                <motion.button
                  onClick={handleCloseDeleteModal}
                  style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  whileHover={{ background: `${colors.textMuted}20` }}
                >
                  <RiCloseLine size={20} color={colors.textMuted} />
                </motion.button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                  Sei sicuro di voler eliminare <strong>{impiantoCorrente.nome}</strong>?
                  Questa azione è irreversibile e cancellerà tutti i dispositivi, scene e dati associati.
                </p>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: colors.textMuted, display: 'block', marginBottom: '6px' }}>
                    Scrivi <span style={{ color: colors.error, fontWeight: 700 }}>ELIMINA</span> per confermare:
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="ELIMINA"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button
                    onClick={handleCloseDeleteModal}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirmText !== 'ELIMINA'}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: '12px',
                      background: colors.error,
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: deleting || deleteConfirmText !== 'ELIMINA' ? 'not-allowed' : 'pointer',
                      opacity: deleting || deleteConfirmText !== 'ELIMINA' ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    whileHover={!deleting && deleteConfirmText === 'ELIMINA' ? { scale: 1.02 } : {}}
                    whileTap={!deleting && deleteConfirmText === 'ELIMINA' ? { scale: 0.98 } : {}}
                  >
                    {deleting ? (
                      <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <RiDeleteBinLine size={18} />
                        Elimina
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
};

export default ImpiantoSettings;
