import { useMemo } from 'react';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useNavigate } from 'react-router-dom';
import { RiArrowDownSLine, RiBuilding2Line, RiLoader4Line, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { useState } from 'react';
import { impiantiApi } from '@/services/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// IMPIANTO SELECTOR - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  bgCard: '#1e1c18',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  error: '#ef4444',
};

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

export const ImpiantoSelector = ({ variant = 'mobile' }: ImpiantoSelectorProps) => {
  const navigate = useNavigate();
  const { impiantoCorrente, setImpiantoCorrente, impianti, loading, refresh } = useImpiantoContext();
  const [isOpen, setIsOpen] = useState(false);
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

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
      await impiantiApi.delete(impiantoId);
      toast.success('Impianto eliminato con successo!');
      await refresh();
      setIsOpen(false);
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

  // Nessun impianto - mostra solo "Crea nuovo"
  if (!impiantoCorrente || impianti.length === 0) {
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
            ? 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)'
            : 'rgba(255, 255, 255, 0.05)',
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
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
            ? 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)'
            : 'rgba(255, 255, 255, 0.05)',
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
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
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

              {/* Separatore + Crea Nuovo */}
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
                  whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <RiAddLine size={16} style={{ color: colors.accent }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: colors.accent }}>
                    Crea nuovo impianto
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
