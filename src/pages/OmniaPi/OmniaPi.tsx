import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { NodeCard } from '@/components/omniapi/NodeCard';
import { AddNodeWizard } from '@/components/omniapi/AddNodeWizard';
import { useOmniapiStore } from '@/store/omniapiStore';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { omniapiApi, RegisteredNode } from '@/services/omniapiApi';
import { motion } from 'framer-motion';
import {
  RiRouterLine,
  RiWifiLine,
  RiRefreshLine,
  RiLoader4Line,
  RiSignalWifiErrorLine,
  RiAddLine,
} from 'react-icons/ri';
import { toast } from '@/utils/toast';

// ============================================
// OMNIAPI PAGE - ESP-NOW Gateway & Nodes
// Dark Luxury Style con tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCard: '#1e1c18',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  success: '#22c55e',
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

export const OmniaPi = () => {
  const { colors: themeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const { gateway, nodes, isLoading, fetchGateway, fetchNodes, sendCommand } =
    useOmniapiStore();

  const [registeredNodes, setRegisteredNodes] = useState<RegisteredNode[]>([]);
  const [showWizard, setShowWizard] = useState(false);

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

  // Fetch nodi registrati da DB
  const fetchRegisteredNodes = async () => {
    if (!impiantoCorrente?.id) return;
    try {
      const res = await omniapiApi.getRegisteredNodes(impiantoCorrente.id);
      setRegisteredNodes(res.nodes || []);
    } catch (error) {
      console.error('Errore fetch registeredNodes:', error);
    }
  };

  // Fetch iniziale e polling
  useEffect(() => {
    fetchGateway();
    fetchNodes();
    fetchRegisteredNodes();

    // Polling ogni 5 secondi
    const interval = setInterval(() => {
      fetchGateway();
      fetchNodes();
      fetchRegisteredNodes();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchGateway, fetchNodes, impiantoCorrente?.id]);

  const handleRefresh = () => {
    fetchGateway();
    fetchNodes();
    fetchRegisteredNodes();
    toast.success('Dati aggiornati');
  };

  const handleCommand = async (
    mac: string,
    channel: 1 | 2,
    action: 'toggle'
  ): Promise<boolean> => {
    const success = await sendCommand(mac, channel, action);
    if (success) {
      toast.success(`Relay ${channel} commutato`);
    } else {
      toast.error('Errore invio comando');
    }
    return success;
  };

  const handleDeleteNode = async (nodeId: number, nodeName: string) => {
    if (!confirm(`Rimuovere "${nodeName}" dall'impianto?`)) return;
    try {
      await omniapiApi.unregisterNode(nodeId);
      toast.success('Nodo rimosso');
      fetchRegisteredNodes();
    } catch (error) {
      toast.error('Errore rimozione nodo');
    }
  };

  const handleNodeAdded = () => {
    fetchRegisteredNodes();
    fetchNodes();
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: '4px',
              }}
            >
              OmniaPi Gateway
            </h1>
            <p style={{ fontSize: '14px', color: colors.textMuted }}>
              Gestione nodi ESP-NOW
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button
              onClick={() => setShowWizard(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RiAddLine size={18} />
              Aggiungi Nodo
            </motion.button>

            <motion.button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '16px',
                background: `${colors.accent}15`,
                border: `1px solid ${colors.accent}30`,
                color: colors.accent,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <RiLoader4Line size={18} className="animate-spin" />
              ) : (
                <RiRefreshLine size={18} />
              )}
              Aggiorna
            </motion.button>
          </div>
        </div>

        {/* Gateway Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: colors.cardShadow,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.accentLight}40, transparent)`,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: gateway?.online
                  ? `${colors.success}20`
                  : `${colors.error}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiRouterLine
                size={24}
                style={{
                  color: gateway?.online ? colors.success : colors.error,
                }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Gateway Status
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: gateway?.online ? colors.success : colors.error,
                    boxShadow: gateway?.online
                      ? `0 0 8px ${colors.success}`
                      : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    color: gateway?.online ? colors.success : colors.error,
                    fontWeight: 500,
                  }}
                >
                  {gateway?.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Gateway Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                IP Address
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  fontFamily: 'monospace',
                }}
              >
                {gateway?.ip || '--'}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                Firmware
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.accent,
                }}
              >
                {gateway?.version || '--'}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                Nodi Connessi
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                {gateway?.nodeCount ?? nodes.length}
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '16px',
              }}
            >
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                MQTT
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: gateway?.mqttConnected ? colors.success : colors.error,
                }}
              >
                {gateway?.mqttConnected ? 'Connesso' : 'Disconnesso'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Registered Nodes Section */}
        {registeredNodes.length > 0 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <RiWifiLine size={22} style={{ color: colors.accent }} />
                I Miei Dispositivi
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: colors.textMuted,
                  }}
                >
                  ({registeredNodes.length})
                </span>
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '20px',
                marginBottom: '32px',
              }}
            >
              {registeredNodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onCommand={handleCommand}
                  registeredInfo={{
                    id: node.id,
                    nome: node.nome,
                    stanzaNome: node.stanza_nome,
                    onDelete: () => handleDeleteNode(node.id, node.nome),
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Available Nodes Section (not registered) */}
        <div style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <RiWifiLine size={22} style={{ color: colors.accent }} />
            {registeredNodes.length > 0 ? 'Nodi Disponibili' : 'Nodi ESP-NOW'}
            <span
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: colors.textMuted,
              }}
            >
              ({nodes.length})
            </span>
          </h2>
          {registeredNodes.length > 0 && (
            <p style={{ fontSize: '13px', color: colors.textMuted, marginTop: '4px' }}>
              Nodi online non ancora registrati nell'impianto
            </p>
          )}
        </div>

        {/* Nodes Grid */}
        {isLoading && nodes.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: colors.textMuted,
            }}
          >
            <RiLoader4Line
              size={40}
              className="animate-spin"
              style={{ color: colors.accent, marginBottom: '16px' }}
            />
            <p>Caricamento nodi...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: colors.textMuted,
              background: colors.bgCard,
              borderRadius: '24px',
              border: `1px solid rgba(255,255,255,0.05)`,
            }}
          >
            <RiSignalWifiErrorLine
              size={48}
              style={{ marginBottom: '16px', opacity: 0.5 }}
            />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              {registeredNodes.length > 0
                ? 'Tutti i nodi sono stati registrati'
                : 'Nessun nodo trovato'}
            </p>
            <p style={{ fontSize: '14px' }}>
              {registeredNodes.length > 0
                ? 'Accendi un nuovo nodo per aggiungerlo'
                : 'Attendi la discovery automatica del gateway'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {nodes.map((node) => (
              <NodeCard key={node.mac} node={node} onCommand={handleCommand} />
            ))}
          </div>
        )}
      </div>

      {/* Add Node Wizard Modal */}
      <AddNodeWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onNodeAdded={handleNodeAdded}
      />
    </Layout>
  );
};
