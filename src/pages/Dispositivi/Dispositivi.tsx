import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SkeletonList } from '@/components/common/Skeleton';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { omniapiApi, RegisteredNode, OmniapiNode } from '@/services/omniapiApi';
import { useOmniapiStore } from '@/store/omniapiStore';
import { socketService } from '@/services/socket';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine,
  RiAddLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiShutDownLine,
  RiWifiLine,
} from 'react-icons/ri';
import { toast } from 'sonner';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// DISPOSITIVI PAGE - ESP-NOW Only
// Dark Luxury Style con tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bg: '#0a0a09',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  bgCard: '#1e1c18',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Device Toggle Component - Dark Luxury Style
const DeviceToggle = ({
  isOn,
  disabled,
  isLoading,
  onChange,
}: {
  isOn: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (value: boolean) => void;
}) => {
  const { colors: themeColors } = useThemeColor();
  const isDisabled = disabled || isLoading;

  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
  }), [themeColors]);

  return (
    <motion.button
      onClick={() => !isDisabled && onChange(!isOn)}
      disabled={isDisabled}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '16px',
        background: isOn
          ? `linear-gradient(135deg, ${colors.accent}15, ${colors.accentDark}10)`
          : colors.toggleTrack,
        border: `1px solid ${isOn ? `${colors.accent}50` : colors.toggleTrackBorder}`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isOn ? `0 0 16px ${colors.accent}20` : 'none',
        transition: 'all 0.3s ease',
      }}
      whileHover={!isDisabled ? { scale: 1.02, borderColor: colors.accent } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
    >
      {/* Stato testuale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isLoading ? (
          <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.accent }} />
        ) : (
          <RiShutDownLine
            size={18}
            style={{
              color: isOn ? colors.accent : colors.textMuted,
              filter: isOn ? `drop-shadow(0 0 6px ${colors.accent})` : 'none',
            }}
          />
        )}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isOn ? colors.accent : colors.textMuted,
          }}
        >
          {isLoading ? 'Invio...' : isOn ? 'Acceso' : 'Spento'}
        </span>
      </div>

      {/* Toggle Switch */}
      <div
        style={{
          width: '44px',
          height: '24px',
          padding: '3px',
          borderRadius: '9999px',
          background: isOn
            ? `linear-gradient(90deg, ${colors.accentDark}, ${colors.accentLight})`
            : colors.toggleTrack,
          boxShadow: isOn
            ? `0 0 12px ${colors.accent}50, inset 0 1px 2px rgba(0,0,0,0.1)`
            : `inset 0 2px 4px rgba(0,0,0,0.3), inset 0 0 0 1px ${colors.toggleTrackBorder}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Track marks for OFF state */}
        {!isOn && (
          <>
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: colors.textMuted,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: `${colors.textMuted}60`,
              }}
            />
          </>
        )}
        {/* Knob */}
        <motion.div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: isOn
              ? 'linear-gradient(145deg, #ffffff, #f0f0f0)'
              : 'linear-gradient(145deg, #e0e0e0, #c8c8c8)',
            boxShadow: isOn
              ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)'
              : '0 1px 3px rgba(0,0,0,0.3)',
          }}
          animate={{ x: isOn ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
};

export const Dispositivi = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

  // Top edge highlight dinamico
  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  const [loading, setLoading] = useState(false);

  // ESP-NOW state
  const [omniapiNodes, setOmniapiNodes] = useState<RegisteredNode[]>([]);
  const [availableOmniapiNodes, setAvailableOmniapiNodes] = useState<OmniapiNode[]>([]);
  const [omniapiModalOpen, setOmniapiModalOpen] = useState(false);
  const [selectedOmniapiNode, setSelectedOmniapiNode] = useState<OmniapiNode | null>(null);
  const [omniapiNodeName, setOmniapiNodeName] = useState('');
  const [togglingRelay, setTogglingRelay] = useState<string | null>(null);

  const { gateway, sendCommand, fetchGateway } = useOmniapiStore();

  const impiantoId = impiantoCorrente?.id || 0;

  useEffect(() => {
    if (impiantoId) {
      loadNodes();
    }
  }, [impiantoId]);

  // WebSocket listener per aggiornamenti real-time dei nodi
  useEffect(() => {
    // Listener per singolo nodo update
    const handleNodeUpdate = (updatedNode: OmniapiNode) => {
      setOmniapiNodes(prev => prev.map(node =>
        node.mac === updatedNode.mac
          ? { ...node, ...updatedNode }
          : node
      ));
    };

    // Listener per lista nodi update
    const handleNodesUpdate = (nodes: OmniapiNode[]) => {
      setOmniapiNodes(prev => prev.map(node => {
        const liveNode = nodes.find(n => n.mac === node.mac);
        return liveNode ? { ...node, ...liveNode } : node;
      }));
    };

    socketService.onOmniapiNodeUpdate(handleNodeUpdate);
    socketService.onOmniapiNodesUpdate(handleNodesUpdate);

    return () => {
      socketService.offOmniapiNodeUpdate();
      socketService.offOmniapiNodesUpdate();
    };
  }, []);

  const loadNodes = async () => {
    if (!impiantoId) return;
    try {
      setLoading(true);
      const res = await omniapiApi.getRegisteredNodes(impiantoId);
      setOmniapiNodes(res.nodes || []);
    } catch (error) {
      console.error('Errore caricamento nodi:', error);
      setOmniapiNodes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableNodes = async () => {
    if (!impiantoId) return;
    try {
      // Triggera discovery per richiedere i nodi al Gateway
      await omniapiApi.discover();

      // Attendi che i nodi rispondano via MQTT (1.5 secondi)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Carica nodi disponibili
      const res = await omniapiApi.getAvailableNodes(impiantoId);
      setAvailableOmniapiNodes(res.nodes || []);
    } catch (error) {
      console.error('Errore caricamento nodi disponibili:', error);
      setAvailableOmniapiNodes([]);
    }
  };

  const handleAddNode = async () => {
    if (!selectedOmniapiNode || !omniapiNodeName.trim()) {
      toast.error('Seleziona un nodo e inserisci un nome');
      return;
    }
    try {
      await omniapiApi.registerNode(impiantoId, selectedOmniapiNode.mac, omniapiNodeName.trim());
      toast.success('Dispositivo aggiunto!');
      setOmniapiModalOpen(false);
      setSelectedOmniapiNode(null);
      setOmniapiNodeName('');
      loadNodes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore aggiunta dispositivo');
    }
  };

  const handleDeleteNode = async (nodeId: number, nodeName: string) => {
    if (!confirm(`Rimuovere "${nodeName}"?`)) return;
    try {
      await omniapiApi.unregisterNode(nodeId);
      toast.success('Dispositivo rimosso');
      loadNodes();
    } catch (error) {
      toast.error('Errore rimozione dispositivo');
    }
  };

  const handleToggle = async (mac: string, channel: 1 | 2) => {
    const key = `${mac}-${channel}`;
    if (togglingRelay === key) return;
    setTogglingRelay(key);

    // Optimistic update locale
    setOmniapiNodes(prev => prev.map(node => {
      if (node.mac === mac) {
        return {
          ...node,
          relay1: channel === 1 ? !node.relay1 : node.relay1,
          relay2: channel === 2 ? !node.relay2 : node.relay2,
        };
      }
      return node;
    }));

    try {
      const success = await sendCommand(mac, channel, 'toggle');
      if (!success) {
        // Rollback in caso di errore
        setOmniapiNodes(prev => prev.map(node => {
          if (node.mac === mac) {
            return {
              ...node,
              relay1: channel === 1 ? !node.relay1 : node.relay1,
              relay2: channel === 2 ? !node.relay2 : node.relay2,
            };
          }
          return node;
        }));
        toast.error('Errore invio comando');
      }
    } catch {
      // Rollback in caso di eccezione
      setOmniapiNodes(prev => prev.map(node => {
        if (node.mac === mac) {
          return {
            ...node,
            relay1: channel === 1 ? !node.relay1 : node.relay1,
            relay2: channel === 2 ? !node.relay2 : node.relay2,
          };
        }
        return node;
      }));
      toast.error('Errore invio comando');
    } finally {
      setTogglingRelay(null);
    }
  };

  const openAddModal = async () => {
    setOmniapiModalOpen(true);
    await Promise.all([
      fetchGateway(),
      loadAvailableNodes()
    ]);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Dispositivi
            </h1>
            <p style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              {omniapiNodes.length} dispositiv{omniapiNodes.length === 1 ? 'o' : 'i'} configurati
            </p>
          </div>

          {/* Add Button */}
          <motion.button
            onClick={openAddModal}
            disabled={!impiantoId}
            style={{
              padding: '12px',
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
              border: 'none',
              cursor: !impiantoId ? 'not-allowed' : 'pointer',
              opacity: !impiantoId ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${colors.accent}50`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 6px 24px ${colors.accent}60` }}
            whileTap={{ scale: 0.95 }}
            title="Aggiungi Dispositivo"
          >
            <RiAddLine size={20} style={{ color: colors.bg }} />
          </motion.button>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonList count={6} />
        ) : omniapiNodes.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.bgCardLit,
              border: `1px solid ${colors.border}`,
              borderRadius: '28px',
              boxShadow: colors.cardShadowLit,
              padding: '60px 32px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={topHighlight} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              style={{
                display: 'inline-flex',
                padding: '20px',
                background: `${colors.accent}15`,
                borderRadius: '24px',
                marginBottom: '20px',
                border: `1px solid ${colors.accent}30`,
              }}
            >
              <RiLightbulbLine size={48} style={{ color: colors.textMuted }} />
            </motion.div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: '0 0 10px 0',
            }}>
              Nessun dispositivo
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.textMuted,
              margin: 0,
              maxWidth: '280px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Usa il pulsante + in alto a destra per aggiungere dispositivi
            </p>
          </motion.div>
        ) : (
          /* Devices Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {omniapiNodes.map((node, index) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: node.relay1
                    ? `linear-gradient(165deg, ${colors.accent}08, #1e1c18 50%, #1a1816 100%)`
                    : colors.bgCardLit,
                  border: `1px solid ${node.relay1 ? `${colors.accent}40` : colors.border}`,
                  borderRadius: '24px',
                  boxShadow: node.relay1
                    ? `0 0 24px ${colors.accent}15, ${colors.cardShadowLit}`
                    : colors.cardShadowLit,
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={topHighlight} />

                {/* Header: Name + Status + Delete */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Status Icon */}
                    <motion.div
                      animate={node.relay1 ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{
                        padding: '10px',
                        borderRadius: '14px',
                        background: node.relay1
                          ? `${colors.accent}25`
                          : `${colors.textMuted}15`,
                        border: `1px solid ${node.relay1
                          ? `${colors.accent}50`
                          : colors.border
                        }`,
                        flexShrink: 0,
                      }}
                    >
                      <RiLightbulbLine
                        size={20}
                        style={{
                          color: node.relay1 ? colors.accentLight : colors.textMuted,
                          filter: node.relay1 ? `drop-shadow(0 0 6px ${colors.accent})` : 'none',
                        }}
                      />
                    </motion.div>

                    {/* Name + MAC + Status */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {node.nome}
                      </h3>
                      <p style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        margin: '3px 0 0 0',
                        fontFamily: 'monospace',
                      }}>
                        {node.mac}
                      </p>
                      {/* Status Badge */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: node.online ? `${colors.success}20` : `${colors.error}20`,
                          border: `1px solid ${node.online ? `${colors.success}30` : `${colors.error}30`}`,
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: node.online ? colors.success : colors.error,
                            boxShadow: `0 0 6px ${node.online ? colors.success : colors.error}`,
                          }} />
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: node.online ? colors.success : colors.error,
                            textTransform: 'uppercase',
                          }}>
                            {node.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <motion.button
                    onClick={() => handleDeleteNode(node.id, node.nome)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    whileHover={{ background: `${colors.error}20`, borderColor: `${colors.error}50` }}
                    whileTap={{ scale: 0.9 }}
                    title="Elimina"
                  >
                    <RiDeleteBinLine size={14} style={{ color: colors.textMuted }} />
                  </motion.button>
                </div>

                {/* Toggle Button */}
                <DeviceToggle
                  isOn={node.relay1 || false}
                  disabled={!node.online}
                  isLoading={togglingRelay === `${node.mac}-1`}
                  onChange={() => handleToggle(node.mac, 1)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Aggiungi Dispositivo */}
      <Modal
        isOpen={omniapiModalOpen}
        onClose={() => {
          setOmniapiModalOpen(false);
          setSelectedOmniapiNode(null);
          setOmniapiNodeName('');
        }}
        title="Aggiungi Dispositivo"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Gateway Status */}
          <div style={{
            padding: '14px',
            background: gateway?.online ? `${colors.success}10` : `${colors.error}10`,
            border: `1px solid ${gateway?.online ? `${colors.success}30` : `${colors.error}30`}`,
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: gateway?.online ? colors.success : colors.error,
              boxShadow: `0 0 8px ${gateway?.online ? colors.success : colors.error}`,
            }} />
            <span style={{
              fontSize: '13px',
              color: gateway?.online ? colors.success : colors.error,
              fontWeight: 500,
            }}>
              Gateway {gateway?.online ? 'connesso' : 'disconnesso'}
            </span>
          </div>

          {/* Available Nodes */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colors.textMuted,
              marginBottom: '10px',
            }}>
              Nodi Disponibili
            </label>
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {availableOmniapiNodes.length === 0 ? (
                <p style={{
                  textAlign: 'center',
                  color: colors.textMuted,
                  padding: '24px',
                  fontSize: '13px',
                  background: colors.bgCard,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                }}>
                  {gateway?.online
                    ? 'Nessun nodo disponibile. Attendi che i nodi si annuncino...'
                    : 'Connetti il Gateway per vedere i nodi disponibili'
                  }
                </p>
              ) : (
                availableOmniapiNodes.map((node) => (
                  <motion.button
                    key={node.mac}
                    onClick={() => {
                      setSelectedOmniapiNode(node);
                      setOmniapiNodeName('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: selectedOmniapiNode?.mac === node.mac
                        ? `${colors.accent}15`
                        : colors.bgCard,
                      border: `1px solid ${selectedOmniapiNode?.mac === node.mac
                        ? colors.accent
                        : colors.border
                      }`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    whileHover={{ borderColor: colors.borderHover }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RiWifiLine
                      size={20}
                      style={{
                        color: selectedOmniapiNode?.mac === node.mac
                          ? colors.accent
                          : colors.textMuted,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        margin: 0,
                      }}>
                        Nodo ESP-NOW
                      </p>
                      <p style={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: colors.textMuted,
                        margin: '2px 0 0 0',
                      }}>
                        {node.mac}
                      </p>
                    </div>
                    {selectedOmniapiNode?.mac === node.mac && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: colors.accent,
                        boxShadow: `0 0 8px ${colors.accent}`,
                      }} />
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </div>

          {/* Node Name Input */}
          {selectedOmniapiNode && (
            <Input
              label="Nome Dispositivo"
              value={omniapiNodeName}
              onChange={(e) => setOmniapiNodeName(e.target.value)}
              placeholder="es. Luce Camera"
            />
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setOmniapiModalOpen(false);
                setSelectedOmniapiNode(null);
                setOmniapiNodeName('');
              }}
              fullWidth
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleAddNode}
              fullWidth
              disabled={!selectedOmniapiNode || !omniapiNodeName.trim()}
            >
              Aggiungi
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
