import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { omniapiApi, OmniapiNode } from '@/services/omniapiApi';
import { stanzeApi } from '@/services/api';
import { toast } from 'sonner';
import {
  RiCloseLine,
  RiWifiLine,
  RiAddLine,
  RiLoader4Line,
  RiCheckLine,
  RiHomeLine,
} from 'react-icons/ri';

// ============================================
// ADD NODE WIZARD - Registrazione nodi OmniaPi
// ============================================

const baseColors = {
  bgOverlay: 'rgba(0, 0, 0, 0.8)',
  bgCard: '#1e1c18',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  success: '#22c55e',
  error: '#ef4444',
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

interface Stanza {
  id: number;
  nome: string;
}

interface AddNodeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdded: () => void;
}

export const AddNodeWizard = ({ isOpen, onClose, onNodeAdded }: AddNodeWizardProps) => {
  const { colors: themeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();

  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [availableNodes, setAvailableNodes] = useState<OmniapiNode[]>([]);
  const [stanze, setStanze] = useState<Stanza[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<OmniapiNode | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [selectedStanza, setSelectedStanza] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const colors = useMemo(
    () => ({
      ...baseColors,
      accent: themeColors.accent,
      accentLight: themeColors.accentLight,
      accentDark: themeColors.accentDark,
      border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    }),
    [themeColors]
  );

  // Carica nodi disponibili e stanze
  useEffect(() => {
    if (isOpen && impiantoCorrente?.id) {
      loadData();
    }
  }, [isOpen, impiantoCorrente?.id]);

  const loadData = async () => {
    if (!impiantoCorrente?.id) return;
    setLoading(true);
    try {
      // Triggera discovery per richiedere i nodi al Gateway
      await omniapiApi.discover();

      // Attendi che i nodi rispondano via MQTT (1.5 secondi)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Carica nodi e stanze
      const [nodesRes, stanzeRes] = await Promise.all([
        omniapiApi.getAvailableNodes(impiantoCorrente.id),
        stanzeApi.getStanze(impiantoCorrente.id),
      ]);
      setAvailableNodes(nodesRes.nodes || []);
      setStanze(stanzeRes.data || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      toast.error('Errore caricamento dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (node: OmniapiNode) => {
    setSelectedNode(node);
    setNodeName(`Nodo ${node.mac.slice(-5)}`);
    setStep('configure');
  };

  const handleSubmit = async () => {
    if (!selectedNode || !nodeName.trim() || !impiantoCorrente?.id) return;

    setSubmitting(true);
    try {
      await omniapiApi.registerNode(
        impiantoCorrente.id,
        selectedNode.mac,
        nodeName.trim(),
        selectedStanza || undefined
      );
      toast.success('Nodo aggiunto con successo');
      onNodeAdded();
      handleClose();
    } catch (error: any) {
      console.error('Errore registrazione:', error);
      toast.error(error.response?.data?.error || 'Errore registrazione nodo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedNode(null);
    setNodeName('');
    setSelectedStanza(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: colors.bgOverlay,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: `1px solid rgba(255,255,255,0.05)`,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                {step === 'select' ? 'Aggiungi Nodo OmniaPi' : 'Configura Nodo'}
              </h2>
              <p style={{ fontSize: '13px', color: colors.textMuted }}>
                {step === 'select'
                  ? 'Seleziona un nodo disponibile'
                  : selectedNode?.mac}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: colors.textMuted,
              }}
            >
              <RiCloseLine size={20} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px 24px',
            }}
          >
            {step === 'select' ? (
              <>
                {loading ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '40px 20px',
                      color: colors.textMuted,
                    }}
                  >
                    <RiLoader4Line
                      size={32}
                      className="animate-spin"
                      style={{ color: colors.accent, marginBottom: '12px' }}
                    />
                    <p>Ricerca nodi disponibili...</p>
                  </div>
                ) : availableNodes.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '40px 20px',
                      color: colors.textMuted,
                    }}
                  >
                    <RiWifiLine
                      size={48}
                      style={{ marginBottom: '16px', opacity: 0.5 }}
                    />
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                      Nessun nodo disponibile
                    </p>
                    <p style={{ fontSize: '13px', textAlign: 'center' }}>
                      Assicurati che i nodi siano accesi e connessi al Gateway
                    </p>
                    <button
                      onClick={loadData}
                      style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        background: `${colors.accent}20`,
                        border: `1px solid ${colors.accent}40`,
                        color: colors.accent,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Riprova
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availableNodes.map((node) => (
                      <motion.button
                        key={node.mac}
                        onClick={() => handleSelectNode(node)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '16px',
                          background: 'rgba(0,0,0,0.2)',
                          border: `1px solid rgba(255,255,255,0.05)`,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        whileHover={{
                          background: `${colors.accent}10`,
                          borderColor: `${colors.accent}30`,
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `${colors.accent}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <RiWifiLine size={20} style={{ color: colors.accent }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '14px',
                              fontWeight: 600,
                              color: colors.textPrimary,
                            }}
                          >
                            {node.mac}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textMuted }}>
                            v{node.version} · {node.rssi} dBm
                          </div>
                        </div>
                        <RiAddLine size={20} style={{ color: colors.accent }} />
                      </motion.button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Nome dispositivo */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.textSecondary,
                      marginBottom: '8px',
                    }}
                  >
                    Nome dispositivo
                  </label>
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Es: Luce Soggiorno"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid rgba(255,255,255,0.1)`,
                      color: colors.textPrimary,
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Stanza */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.textSecondary,
                      marginBottom: '8px',
                    }}
                  >
                    Stanza (opzionale)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedStanza(null)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        background:
                          selectedStanza === null
                            ? `${colors.accent}20`
                            : 'rgba(0,0,0,0.2)',
                        border: `1px solid ${
                          selectedStanza === null
                            ? `${colors.accent}50`
                            : 'rgba(255,255,255,0.05)'
                        }`,
                        color:
                          selectedStanza === null
                            ? colors.accent
                            : colors.textMuted,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RiHomeLine size={14} />
                      Nessuna
                    </button>
                    {stanze.map((stanza) => (
                      <button
                        key={stanza.id}
                        onClick={() => setSelectedStanza(stanza.id)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '12px',
                          background:
                            selectedStanza === stanza.id
                              ? `${colors.accent}20`
                              : 'rgba(0,0,0,0.2)',
                          border: `1px solid ${
                            selectedStanza === stanza.id
                              ? `${colors.accent}50`
                              : 'rgba(255,255,255,0.05)'
                          }`,
                          color:
                            selectedStanza === stanza.id
                              ? colors.accent
                              : colors.textMuted,
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}
                      >
                        {stanza.nome}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info nodo */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.2)',
                    border: `1px solid rgba(255,255,255,0.05)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      marginBottom: '8px',
                    }}
                  >
                    Info nodo
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted }}>
                        MAC
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          color: colors.textPrimary,
                        }}
                      >
                        {selectedNode?.mac}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted }}>
                        Firmware
                      </div>
                      <div style={{ fontSize: '13px', color: colors.accent }}>
                        v{selectedNode?.version}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted }}>
                        Segnale
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textPrimary }}>
                        {selectedNode?.rssi} dBm
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: colors.textMuted }}>
                        Relay
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textPrimary }}>
                        2 canali
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step === 'configure' && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '20px 24px',
                borderTop: `1px solid rgba(255,255,255,0.05)`,
              }}
            >
              <button
                onClick={() => setStep('select')}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 500,
                }}
              >
                Indietro
              </button>
              <motion.button
                onClick={handleSubmit}
                disabled={!nodeName.trim() || submitting}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '14px',
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                  border: 'none',
                  color: '#fff',
                  cursor: !nodeName.trim() || submitting ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: !nodeName.trim() ? 0.5 : 1,
                }}
                whileHover={!submitting && nodeName.trim() ? { scale: 1.02 } : undefined}
                whileTap={!submitting && nodeName.trim() ? { scale: 0.98 } : undefined}
              >
                {submitting ? (
                  <RiLoader4Line size={18} className="animate-spin" />
                ) : (
                  <RiCheckLine size={18} />
                )}
                Aggiungi Nodo
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
