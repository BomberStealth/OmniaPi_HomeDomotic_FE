import { useMemo, useState, useEffect, useCallback } from 'react';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useImpiantiStore } from '@/store/impiantiStore';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { RiArrowDownSLine, RiBuilding2Line, RiLoader4Line, RiAddLine, RiDeleteBinLine, RiMailLine, RiCheckLine, RiCloseLine, RiSettings4Line } from 'react-icons/ri';
import { impiantiApi, condivisioniApi } from '@/services/api';
import { toast } from '@/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// IMPIANTO SELECTOR - Dark Luxury Style
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

interface ImpiantoSelectorProps {
  variant?: 'mobile' | 'desktop';
}

// Tipo per invito pendente
interface InvitoPendente {
  id: number;
  impianto_id: number;
  impianto_nome: string;
  impianto_citta: string;
  ruolo_condivisione: string;
  invitato_da_nome: string;
}

export const ImpiantoSelector = ({ variant = 'mobile' }: ImpiantoSelectorProps) => {
  const navigate = useNavigate();
  const { impiantoCorrente, setImpiantoCorrente, impianti, loading, refresh } = useImpiantoContext();
  const { removeImpianto } = useImpiantiStore();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inviti, setInviti] = useState<InvitoPendente[]>([]);
  const [invitiLoading, setInvitiLoading] = useState(false);
  const { colors: themeColors, modeColors, isDarkMode } = useThemeColor();

  // PROPRIETARIO non può creare impianti (solo ADMIN e INSTALLATORE)
  const canCreateImpianto = user?.ruolo !== 'proprietario';

  // Carica inviti pendenti
  const loadInviti = useCallback(async () => {
    try {
      const response = await condivisioniApi.getInvitiPendenti();
      if (response.success) {
        setInviti(response.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento inviti:', error);
    }
  }, []);

  // Carica inviti all'avvio e quando il dropdown si apre
  useEffect(() => {
    loadInviti();
  }, [loadInviti]);

  // Refresh inviti quando il dropdown si apre
  useEffect(() => {
    if (isOpen) {
      loadInviti();
    }
  }, [isOpen, loadInviti]);

  // Accetta invito
  const handleAccettaInvito = async (e: React.MouseEvent, invitoId: number) => {
    e.stopPropagation();
    setInvitiLoading(true);
    try {
      const response = await condivisioniApi.accettaInvito(invitoId);
      if (response.success) {
        toast.success('Invito accettato!');
        // Rimuovi invito dalla lista
        setInviti(prev => prev.filter(i => i.id !== invitoId));
        // Refresh impianti per mostrare il nuovo
        await refresh();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore nell\'accettare l\'invito');
    } finally {
      setInvitiLoading(false);
    }
  };

  // Rifiuta invito
  const handleRifiutaInvito = async (e: React.MouseEvent, invitoId: number) => {
    e.stopPropagation();
    setInvitiLoading(true);
    try {
      const response = await condivisioniApi.rifiutaInvito(invitoId);
      if (response.success) {
        toast.success('Invito rifiutato');
        setInviti(prev => prev.filter(i => i.id !== invitoId));
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore nel rifiutare l\'invito');
    } finally {
      setInvitiLoading(false);
    }
  };

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);

  const handleCreateNew = () => {
    setIsOpen(false);
    navigate('/setup');
  };

  const handleDelete = async (e: React.MouseEvent, impiantoId: number, impiantoNome: string) => {
    e.stopPropagation();

    if (!confirm(`Sei sicuro di voler eliminare l'impianto "${impiantoNome}"? Questa azione è irreversibile.`)) {
      return;
    }

    try {
      // Chiudi dropdown prima per UX migliore
      setIsOpen(false);

      // Elimina dal backend
      await impiantiApi.delete(impiantoId);

      // Aggiorna lo store locale (auto-seleziona il prossimo impianto)
      removeImpianto(impiantoId);

      toast.success('Impianto eliminato con successo!');

      // Se non ci sono più impianti, vai alla home
      if (impianti.length <= 1) {
        navigate('/', { replace: true });
      } else {
        // Forza refresh per sincronizzare con backend
        await refresh();
      }
    } catch (error: any) {
      console.error('Errore eliminazione impianto:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
        }}
      >
        <RiLoader4Line size={16} className="animate-spin" style={{ color: colors.accent }} />
        <span style={{ fontSize: '14px', color: colors.textMuted }}>
          Caricamento...
        </span>
      </div>
    );
  }

  // Nessun impianto - mostra dropdown con inviti se ce ne sono
  if (!impiantoCorrente || impianti.length === 0) {
    // Se ci sono inviti pendenti, mostra un selettore cliccabile
    if (inviti.length > 0) {
      return (
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: variant === 'desktop' ? colors.bgCardLit : 'transparent',
              border: variant === 'desktop' ? `1px solid ${colors.accent}40` : `1px solid ${colors.accent}30`,
              borderRadius: '16px',
              cursor: 'pointer',
            }}
            whileHover={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }}
          >
            <RiMailLine size={18} style={{ color: colors.accent }} />
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: colors.accent, textAlign: 'left' }}>
              {inviti.length} invit{inviti.length === 1 ? 'o' : 'i'} in attesa
            </span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <RiArrowDownSLine size={16} style={{ color: colors.accent }} />
            </motion.div>
          </motion.button>

          {/* Dropdown con inviti */}
          <AnimatePresence>
            {isOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setIsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    zIndex: 50,
                    width: '100%',
                    top: '100%',
                    marginTop: '4px',
                    background: colors.bgCardLit,
                    borderRadius: '16px',
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.cardShadowLit,
                    overflow: 'hidden',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Header inviti */}
                  <div style={{
                    padding: '10px 12px',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderBottom: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.accent }}>
                      Inviti Ricevuti
                    </span>
                  </div>
                  {inviti.map((invito) => (
                    <div
                      key={invito.id}
                      style={{
                        padding: '12px',
                        borderBottom: `1px solid ${colors.border}`,
                        background: isDarkMode ? 'rgba(106, 212, 160, 0.05)' : 'rgba(106, 212, 160, 0.08)',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary, margin: 0 }}>
                          {invito.impianto_nome}
                        </p>
                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0 0' }}>
                          da {invito.invitato_da_nome} • {invito.ruolo_condivisione}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button
                          onClick={(e) => handleAccettaInvito(e, invito.id)}
                          disabled={invitiLoading}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: `${colors.accent}20`,
                            border: `1px solid ${colors.accent}50`,
                            color: colors.accent,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: invitiLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            opacity: invitiLoading ? 0.6 : 1,
                          }}
                          whileHover={!invitiLoading ? { background: `${colors.accent}30` } : {}}
                          whileTap={!invitiLoading ? { scale: 0.98 } : {}}
                        >
                          <RiCheckLine size={14} />
                          Accetta
                        </motion.button>
                        <motion.button
                          onClick={(e) => handleRifiutaInvito(e, invito.id)}
                          disabled={invitiLoading}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: `1px solid ${colors.textMuted}50`,
                            color: colors.textMuted,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: invitiLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            opacity: invitiLoading ? 0.6 : 1,
                          }}
                          whileHover={!invitiLoading ? { background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } : {}}
                          whileTap={!invitiLoading ? { scale: 0.98 } : {}}
                        >
                          <RiCloseLine size={14} />
                          Rifiuta
                        </motion.button>
                      </div>
                    </div>
                  ))}

                  {/* Crea nuovo impianto (solo se può) */}
                  {canCreateImpianto && (
                    <div style={{ borderTop: `1px solid ${colors.border}` }}>
                      <motion.button
                        onClick={handleCreateNew}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        whileHover={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                      >
                        <RiAddLine size={16} style={{ color: colors.accent }} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: colors.accent }}>
                          Crea nuovo impianto
                        </span>
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Nessun invito - Proprietario non può creare - mostra messaggio
    if (!canCreateImpianto) {
      return (
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: variant === 'desktop' ? colors.bgCardLit : 'transparent',
            border: variant === 'desktop' ? `1px solid ${colors.border}` : 'none',
            borderRadius: '16px',
          }}
        >
          <RiBuilding2Line size={18} style={{ color: colors.textMuted }} />
          <span style={{ fontSize: '13px', color: colors.textMuted }}>
            Nessun impianto disponibile
          </span>
        </div>
      );
    }

    // Admin/Installatore può creare
    return (
      <motion.button
        onClick={handleCreateNew}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: variant === 'desktop' ? colors.bgCardLit : 'transparent',
          border: variant === 'desktop' ? `1px solid ${colors.border}` : 'none',
          borderRadius: '16px',
          cursor: 'pointer',
        }}
        whileHover={{
          background: variant === 'desktop'
            ? (isDarkMode ? 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)' : colors.bgSecondary)
            : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
          borderColor: colors.borderHover,
        }}
      >
        <RiAddLine size={18} style={{ color: colors.accent }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.accent }}>
          Crea nuovo impianto
        </span>
      </motion.button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: variant === 'desktop' ? colors.bgCardLit : 'transparent',
            border: variant === 'desktop' ? `1px solid ${colors.border}` : 'none',
            borderRadius: '16px',
            cursor: 'pointer',
          }}
          whileHover={{
            background: variant === 'desktop'
              ? (isDarkMode ? 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)' : colors.bgSecondary)
              : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
          }}
        >
          <RiBuilding2Line size={18} style={{ color: colors.accent }} />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              {impiantoCorrente.nome}
            </p>
            <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
              {impiantoCorrente.citta}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <RiArrowDownSLine size={16} style={{ color: colors.textMuted }} />
          </motion.div>
        </motion.button>
        {/* Settings Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/impianto/settings');
          }}
          style={{
            padding: '10px',
            borderRadius: '12px',
            background: variant === 'desktop' ? colors.bgCardLit : 'transparent',
            border: variant === 'desktop' ? `1px solid ${colors.border}` : `1px solid ${colors.border}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          whileHover={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderColor: colors.accent,
          }}
          whileTap={{ scale: 0.95 }}
          title="Impostazioni impianto"
        >
          <RiSettings4Line size={18} style={{ color: colors.accent }} />
        </motion.button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay per chiudere al click fuori */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 40,
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                zIndex: 50,
                width: '100%',
                top: '100%',
                marginTop: '4px',
                background: colors.bgCardLit,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                boxShadow: colors.cardShadowLit,
                overflow: 'hidden',
                maxHeight: '320px',
                overflowY: 'auto',
              }}
            >
              {/* Sezione Inviti Pendenti */}
              {inviti.length > 0 && (
                <div style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  }}>
                    <RiMailLine size={14} style={{ color: colors.accent }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.accent }}>
                      Inviti ({inviti.length})
                    </span>
                  </div>
                  {inviti.map((invito) => (
                    <div
                      key={invito.id}
                      style={{
                        padding: '10px 12px',
                        borderTop: `1px solid ${colors.border}`,
                        background: isDarkMode ? 'rgba(106, 212, 160, 0.05)' : 'rgba(106, 212, 160, 0.08)',
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: colors.textPrimary, margin: 0 }}>
                          {invito.impianto_nome}
                        </p>
                        <p style={{ fontSize: '11px', color: colors.textMuted, margin: '2px 0 0 0' }}>
                          da {invito.invitato_da_nome} • {invito.ruolo_condivisione}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <motion.button
                          onClick={(e) => handleAccettaInvito(e, invito.id)}
                          disabled={invitiLoading}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: `${colors.accent}20`,
                            border: `1px solid ${colors.accent}50`,
                            color: colors.accent,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: invitiLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            opacity: invitiLoading ? 0.6 : 1,
                          }}
                          whileHover={!invitiLoading ? { background: `${colors.accent}30` } : {}}
                          whileTap={!invitiLoading ? { scale: 0.98 } : {}}
                        >
                          <RiCheckLine size={14} />
                          Accetta
                        </motion.button>
                        <motion.button
                          onClick={(e) => handleRifiutaInvito(e, invito.id)}
                          disabled={invitiLoading}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: `1px solid ${colors.textMuted}50`,
                            color: colors.textMuted,
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: invitiLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            opacity: invitiLoading ? 0.6 : 1,
                          }}
                          whileHover={!invitiLoading ? { background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } : {}}
                          whileTap={!invitiLoading ? { scale: 0.98 } : {}}
                        >
                          <RiCloseLine size={14} />
                          Rifiuta
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista Impianti */}
              {impianti.map((impianto) => (
                <div
                  key={impianto.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    background: impianto.id === impiantoCorrente.id
                      ? `${colors.accent}15`
                      : 'transparent',
                    borderLeft: impianto.id === impiantoCorrente.id
                      ? `2px solid ${colors.accent}`
                      : '2px solid transparent',
                  }}
                >
                  <button
                    onClick={() => {
                      setImpiantoCorrente(impianto);
                      setIsOpen(false);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <RiBuilding2Line
                      size={16}
                      style={{
                        color: impianto.id === impiantoCorrente.id
                          ? colors.accent
                          : colors.textMuted
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: impianto.id === impiantoCorrente.id
                            ? colors.accent
                            : colors.textPrimary,
                          margin: 0,
                        }}
                      >
                        {impianto.nome}
                      </p>
                      <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                        {impianto.citta}
                      </p>
                    </div>
                  </button>
                  <motion.button
                    onClick={(e) => handleDelete(e, impianto.id, impianto.nome)}
                    style={{
                      padding: '8px',
                      marginRight: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    whileHover={{ background: `${colors.error}20` }}
                    title="Elimina impianto"
                  >
                    <RiDeleteBinLine size={14} style={{ color: `${colors.error}aa` }} />
                  </motion.button>
                </div>
              ))}

              {/* Separatore + Crea Nuovo (solo per Admin/Installatore) */}
              {canCreateImpianto && (
                <div style={{ borderTop: `1px solid ${colors.border}` }}>
                  <motion.button
                    onClick={handleCreateNew}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    whileHover={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                  >
                    <RiAddLine size={16} style={{ color: colors.accent }} />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: colors.accent }}>
                      Crea nuovo impianto
                    </span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
