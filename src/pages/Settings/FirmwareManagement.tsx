import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useViewTransitionNavigate } from '@/hooks/useViewTransition';
import { UserRole } from '@/types';
import { omniapiApi, RegisteredNode } from '@/services/omniapiApi';
import { gatewayApi, Gateway } from '@/services/gatewayApi';
import { toast } from '@/utils/toast';
import {
  RiArrowLeftLine,
  RiCpuLine,
  RiCheckLine,
  RiRouterLine,
  RiLoader4Line,
  RiLightbulbFlashLine,
  RiFlashlightLine,
  RiAlertLine,
} from 'react-icons/ri';

// ============================================
// FIRMWARE MANAGEMENT PAGE
// Selezione firmware dal server (non upload locale)
// Gateway: MQTT OTA | Nodi: HTTP OTA via mesh
// ============================================

type OtaState = 'idle' | 'sending' | 'success' | 'error';

interface ServerFirmware {
  filename: string;
  size: number;
  uploadedAt: string;
  device_type: string;
}

interface OtaResult {
  old_version?: string;
  new_version?: string;
  message?: string;
  error?: string;
}

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;

export const FirmwareManagement = () => {
  const { colors } = useThemeColors();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const navigate = useViewTransitionNavigate();

  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [nodes, setNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);

  const [gatewayFirmwares, setGatewayFirmwares] = useState<ServerFirmware[]>([]);
  const [nodeFirmwares, setNodeFirmwares] = useState<ServerFirmware[]>([]);
  const [firmwaresLoading, setFirmwaresLoading] = useState(true);

  // OTA state — one operation at a time
  const [activeOta, setActiveOta] = useState<string | null>(null); // null | 'gateway' | mac
  const [otaState, setOtaState] = useState<OtaState>('idle');
  const [otaResult, setOtaResult] = useState<OtaResult | null>(null);

  // Selected firmware per device
  const [gwSelected, setGwSelected] = useState('');
  const [nodeSelected, setNodeSelected] = useState<Record<string, string>>({});

  const canAccess = user?.ruolo === UserRole.ADMIN || user?.ruolo === UserRole.INSTALLATORE;

  const cardStyle = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: colors.cardShadow,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const topHighlight = {
    position: 'absolute' as const,
    top: 0, left: '25%', right: '25%', height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  useEffect(() => {
    if (!impiantoCorrente?.id || !canAccess) return;
    const load = async () => {
      setLoading(true);
      setFirmwaresLoading(true);
      try {
        const [gwRes, nodesRes, fwGwRes, fwNodeRes] = await Promise.allSettled([
          gatewayApi.getImpiantoGateway(impiantoCorrente.id),
          omniapiApi.getRegisteredNodes(impiantoCorrente.id),
          omniapiApi.getServerFirmware('gateway'),
          omniapiApi.getServerFirmware('node'),
        ]);

        if (gwRes.status === 'fulfilled') setGateway(gwRes.value.gateway);
        if (nodesRes.status === 'fulfilled') setNodes(nodesRes.value.nodes);

        const gwFiles = fwGwRes.status === 'fulfilled' ? (fwGwRes.value.files || []) : [];
        const nodeFiles = fwNodeRes.status === 'fulfilled' ? (fwNodeRes.value.files || []) : [];
        setGatewayFirmwares(gwFiles);
        setNodeFirmwares(nodeFiles);
        setGwSelected(gwFiles[0]?.filename || '');
      } catch (err) {
        console.error('Errore caricamento dati firmware:', err);
      } finally {
        setLoading(false);
        setFirmwaresLoading(false);
      }
    };
    load();
  }, [impiantoCorrente?.id, canAccess]);

  // Init per-node firmware selection quando arrivano i nodi
  useEffect(() => {
    if (nodes.length > 0 && nodeFirmwares.length > 0) {
      const defaults: Record<string, string> = {};
      nodes.forEach(n => { defaults[n.mac] = nodeFirmwares[0].filename; });
      setNodeSelected(defaults);
    }
  }, [nodes, nodeFirmwares]);

  const checkBusy = async (): Promise<boolean> => {
    try {
      const status = await omniapiApi.getGatewayStatus();
      if (status.busy) { toast.error(`Gateway occupato con: ${status.operation}`); return true; }
      return false;
    } catch { return false; }
  };

  const resetOta = () => {
    setActiveOta(null);
    setOtaState('idle');
    setOtaResult(null);
  };

  // Gateway OTA via MQTT
  const handleGatewayOta = async () => {
    if (!gateway || !gwSelected) return;
    if (await checkBusy()) return;

    setActiveOta('gateway');
    setOtaState('sending');
    setOtaResult(null);

    try {
      const macNoColon = gateway.mac.replace(/[:-]/g, '').toUpperCase();
      const result = await omniapiApi.triggerGatewayOtaMqtt(macNoColon, gwSelected);
      if (result.success) {
        setOtaState('success');
        setOtaResult({ message: `Comando OTA inviato → ${result.version || gwSelected}` });
      } else {
        setOtaState('error');
        setOtaResult({ error: result.error || 'Invio fallito' });
      }
    } catch (err: any) {
      setOtaState('error');
      setOtaResult({ error: err.response?.data?.error || err.message || 'Errore di rete' });
    }
  };

  // Node OTA via gateway mesh (binary push)
  const handleNodeOta = async (mac: string) => {
    const filename = nodeSelected[mac];
    if (!filename) return;
    if (await checkBusy()) return;

    setActiveOta(mac);
    setOtaState('sending');
    setOtaResult(null);

    try {
      const result = await omniapiApi.triggerNodeOtaFromServer(mac, filename);
      if (result.success) {
        setOtaState('success');
        setOtaResult({ message: result.message || 'Firmware inviato al nodo' });
      } else {
        setOtaState('error');
        setOtaResult({ error: result.error || 'Invio fallito' });
      }
    } catch (err: any) {
      setOtaState('error');
      setOtaResult({ error: err.response?.data?.error || err.message || 'Errore di rete' });
    }
  };

  if (!canAccess) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
          Accesso negato. Solo admin e installatori.
        </div>
      </Layout>
    );
  }

  if (!impiantoCorrente) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
          Nessun impianto selezionato.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{
        padding: '16px', paddingBottom: '100px',
        maxWidth: '800px', margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `${colors.accent}15`, border: `1px solid ${colors.border}`,
              color: colors.accent, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <RiArrowLeftLine size={20} />
          </motion.button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
              Gestione Firmware
            </h1>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
              {impiantoCorrente.nome} · OTA gateway e nodi
            </p>
          </div>
        </div>

        {loading || firmwaresLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: colors.textMuted, gap: '8px' }}>
            <RiLoader4Line size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Caricamento...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ── GATEWAY ── */}
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={topHighlight} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${colors.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiRouterLine size={22} color={colors.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>Gateway</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>{gateway?.nome || 'Non associato'}</p>
                </div>
                {gateway && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: gateway.status === 'online' ? '#4ade80' : '#ef4444', boxShadow: gateway.status === 'online' ? '0 0 8px #4ade8080' : 'none' }} />
                )}
              </div>

              {gateway ? (
                <>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <InfoBadge label="Versione attuale" value={gateway.version ? `v${gateway.version}` : '—'} colors={colors} highlight />
                    <InfoBadge label="IP" value={gateway.ip || '—'} colors={colors} />
                    <InfoBadge label="Nodi" value={String(gateway.nodeCount ?? 0)} colors={colors} />
                  </div>

                  {activeOta === 'gateway' && otaState !== 'idle' ? (
                    <OtaStatusBlock state={otaState} result={otaResult} onReset={resetOta} colors={colors} />
                  ) : gatewayFirmwares.length === 0 ? (
                    <EmptyFirmware message="Nessun firmware gateway disponibile sul server. Caricane uno da Monitoraggio Globale." colors={colors} />
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, marginBottom: '6px', fontWeight: 500 }}>
                          Firmware da installare
                        </label>
                        <select
                          value={gwSelected}
                          onChange={e => setGwSelected(e.target.value)}
                          disabled={activeOta !== null}
                          style={{
                            width: '100%', padding: '10px 12px',
                            background: colors.bgCard, border: `1px solid ${colors.border}`,
                            borderRadius: '10px', color: colors.textPrimary,
                            fontSize: '13px', outline: 'none', cursor: 'pointer',
                          }}
                        >
                          {gatewayFirmwares.map(fw => (
                            <option key={fw.filename} value={fw.filename}>
                              {fw.filename} · {formatBytes(fw.size)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        disabled={activeOta !== null || !gwSelected}
                        onClick={handleGatewayOta}
                        style={{
                          padding: '10px 18px', borderRadius: '10px',
                          background: activeOta !== null ? `${colors.accent}10` : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                          border: 'none', color: activeOta !== null ? colors.textMuted : '#fff',
                          fontWeight: 600, fontSize: '13px',
                          cursor: activeOta !== null ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          opacity: activeOta !== null ? 0.5 : 1, flexShrink: 0,
                        }}
                      >
                        <RiFlashlightLine size={16} />
                        OTA
                      </motion.button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>Nessun gateway associato a questo impianto.</p>
              )}
            </div>

            {/* ── NODI ── */}
            {nodes.length > 0 && (
              <>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, margin: '4px 0 0 0' }}>
                  Nodi ({nodes.length})
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {nodes.map(node => {
                    const isLed = node.device_type === 'omniapi_led';
                    const isThisOta = activeOta === node.mac;

                    return (
                      <div key={node.mac} style={{ ...cardStyle, padding: '16px' }}>
                        <div style={topHighlight} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${colors.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {isLed ? <RiLightbulbFlashLine size={18} color={colors.accent} /> : <RiCpuLine size={18} color={colors.accent} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {node.nome}
                            </p>
                            <p style={{ margin: 0, fontSize: '10px', fontFamily: 'monospace', color: colors.textMuted, letterSpacing: '0.5px' }}>
                              {node.mac}
                            </p>
                          </div>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: node.online ? '#4ade80' : '#ef4444', flexShrink: 0 }} />
                        </div>

                        {/* Version badge */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: `${colors.accent}15`, color: colors.accent, fontWeight: 500 }}>
                            {isLed ? 'LED' : 'Relay'}
                          </span>
                          {(node.firmware_version || node.version) && (
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: `${colors.textMuted}15`, color: colors.textSecondary }}>
                              v{node.firmware_version || node.version}
                            </span>
                          )}
                        </div>

                        {isThisOta && otaState !== 'idle' ? (
                          <OtaStatusBlock state={otaState} result={otaResult} onReset={resetOta} colors={colors} compact />
                        ) : nodeFirmwares.length === 0 ? (
                          <EmptyFirmware message="Nessun firmware nodo sul server." colors={colors} compact />
                        ) : (
                          <>
                            <select
                              value={nodeSelected[node.mac] || ''}
                              onChange={e => setNodeSelected(prev => ({ ...prev, [node.mac]: e.target.value }))}
                              disabled={activeOta !== null}
                              style={{
                                width: '100%', padding: '7px 10px', marginBottom: '8px',
                                background: colors.bgCard, border: `1px solid ${colors.border}`,
                                borderRadius: '8px', color: colors.textPrimary,
                                fontSize: '11px', outline: 'none', cursor: 'pointer',
                              }}
                            >
                              {nodeFirmwares.map(fw => (
                                <option key={fw.filename} value={fw.filename}>
                                  {fw.filename} · {formatBytes(fw.size)}
                                </option>
                              ))}
                            </select>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              disabled={activeOta !== null || !nodeSelected[node.mac]}
                              onClick={() => handleNodeOta(node.mac)}
                              style={{
                                width: '100%', padding: '8px',
                                borderRadius: '10px',
                                background: activeOta !== null ? `${colors.accent}08` : `${colors.accent}15`,
                                border: `1px solid ${activeOta !== null ? colors.border : `${colors.accent}30`}`,
                                color: activeOta !== null ? colors.textMuted : colors.accent,
                                fontWeight: 600, fontSize: '12px',
                                cursor: activeOta !== null ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                opacity: activeOta !== null ? 0.4 : 1,
                              }}
                            >
                              <RiFlashlightLine size={14} />
                              Aggiorna
                            </motion.button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {nodes.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '24px', color: colors.textMuted, fontSize: '13px' }}>
                Nessun nodo registrato in questo impianto.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

// ── Subcomponents ──────────────────────────────────────────────────────────────

function InfoBadge({ label, value, colors, highlight }: { label: string; value: string; colors: any; highlight?: boolean }) {
  return (
    <div style={{ padding: '6px 12px', borderRadius: '10px', background: `${colors.accent}10`, border: `1px solid ${colors.border}` }}>
      <span style={{ fontSize: '10px', color: colors.textMuted, display: 'block' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: highlight ? colors.accent : colors.textPrimary }}>{value}</span>
    </div>
  );
}

function EmptyFirmware({ message, colors, compact }: { message: string; colors: any; compact?: boolean }) {
  return (
    <div style={{
      padding: compact ? '8px' : '12px',
      borderRadius: compact ? '8px' : '10px',
      background: `${colors.textMuted}08`,
      border: `1px dashed ${colors.border}`,
      display: 'flex', alignItems: 'center', gap: '8px',
    }}>
      <RiAlertLine size={14} color={colors.textMuted} />
      <span style={{ fontSize: compact ? '11px' : '12px', color: colors.textMuted }}>{message}</span>
    </div>
  );
}

function OtaStatusBlock({
  state, result, onReset, colors, compact,
}: {
  state: OtaState; result: { old_version?: string; new_version?: string; message?: string; error?: string } | null;
  onReset: () => void; colors: any; compact?: boolean;
}) {
  if (state === 'success') {
    return (
      <div style={{ padding: compact ? '8px' : '12px', borderRadius: compact ? '10px' : '12px', background: '#4ade8015', border: '1px solid #4ade8030', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <RiCheckLine size={compact ? 14 : 16} color="#4ade80" />
          <span style={{ fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#4ade80' }}>OTA avviato</span>
        </div>
        {result?.message && <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>{result.message}</p>}
        {result?.old_version && result?.new_version && (
          <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>{result.old_version} → {result.new_version}</p>
        )}
        <button onClick={onReset} style={{ marginTop: '6px', padding: '4px 12px', borderRadius: '8px', background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: '11px', cursor: 'pointer' }}>
          Chiudi
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ padding: compact ? '8px' : '12px', borderRadius: compact ? '10px' : '12px', background: '#ef444415', border: '1px solid #ef444430', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#ef4444' }}>Errore</p>
        <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>{result?.error || 'Invio fallito'}</p>
        <button onClick={onReset} style={{ marginTop: '6px', padding: '4px 12px', borderRadius: '8px', background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: '11px', cursor: 'pointer' }}>
          Riprova
        </button>
      </div>
    );
  }

  // sending
  return (
    <div style={{ padding: compact ? '8px' : '12px', borderRadius: compact ? '10px' : '12px', background: `${colors.accent}08`, border: `1px solid ${colors.border}`, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
        <RiLoader4Line size={compact ? 14 : 16} color={colors.accent} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: compact ? '11px' : '13px', color: colors.textSecondary }}>Invio in corso...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
