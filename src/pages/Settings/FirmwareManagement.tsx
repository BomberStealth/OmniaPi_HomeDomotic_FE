import { useState, useEffect, useRef } from 'react';
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
  RiUploadCloud2Line,
  RiCheckLine,
  RiRouterLine,
  RiLoader4Line,
  RiLightbulbFlashLine,
} from 'react-icons/ri';

// ============================================
// FIRMWARE MANAGEMENT PAGE
// Pagina separata per aggiornamento OTA
// Gateway card + griglia nodi responsive
// Solo admin + installatore
// ============================================

type OtaState = 'idle' | 'uploading' | 'rebooting' | 'success' | 'error';

interface OtaResult {
  old_version?: string;
  new_version?: string;
  message?: string;
  error?: string;
}

export const FirmwareManagement = () => {
  const { colors } = useThemeColors();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const navigate = useViewTransitionNavigate();

  // Gateway data
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [nodes, setNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);

  // OTA state - one at a time
  const [activeOta, setActiveOta] = useState<string | null>(null); // null | 'gateway' | mac
  const [otaState, setOtaState] = useState<OtaState>('idle');
  const [otaProgress, setOtaProgress] = useState(0);
  const [otaResult, setOtaResult] = useState<OtaResult | null>(null);

  // File refs
  const gwFileRef = useRef<HTMLInputElement>(null);
  const nodeFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Permission check
  const canAccess = user?.ruolo === UserRole.ADMIN || user?.ruolo === UserRole.INSTALLATORE;

  // Card styles
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
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  // Load data
  useEffect(() => {
    if (!impiantoCorrente?.id || !canAccess) return;
    const load = async () => {
      setLoading(true);
      try {
        const [gwRes, nodesRes] = await Promise.allSettled([
          gatewayApi.getImpiantoGateway(impiantoCorrente.id),
          omniapiApi.getRegisteredNodes(impiantoCorrente.id),
        ]);
        if (gwRes.status === 'fulfilled') setGateway(gwRes.value.gateway);
        if (nodesRes.status === 'fulfilled') setNodes(nodesRes.value.nodes);
      } catch (err) {
        console.error('Errore caricamento dati firmware:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [impiantoCorrente?.id, canAccess]);

  // Simulate progress during upload
  useEffect(() => {
    if (otaState !== 'uploading' && otaState !== 'rebooting') {
      return;
    }
    const interval = setInterval(() => {
      setOtaProgress(prev => {
        if (otaState === 'uploading' && prev < 60) return prev + 2;
        if (otaState === 'rebooting' && prev < 95) return prev + 1;
        return prev;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [otaState]);

  // Check if gateway is busy before any action
  const checkBusy = async (): Promise<boolean> => {
    try {
      const status = await omniapiApi.getGatewayStatus();
      if (status.busy) {
        toast.error(`Gateway occupato con: ${status.operation}`);
        return true;
      }
      return false;
    } catch {
      return false; // If check fails, let the backend handle it
    }
  };

  // Gateway OTA handler
  const handleGatewayOta = async (file: File) => {
    if (await checkBusy()) return;

    setActiveOta('gateway');
    setOtaState('uploading');
    setOtaProgress(5);
    setOtaResult(null);

    try {
      setOtaState('uploading');
      const result = await omniapiApi.uploadGatewayFirmware(file);
      if (result.success) {
        setOtaProgress(100);
        setOtaState('success');
        setOtaResult({
          old_version: result.old_version,
          new_version: result.new_version,
        });
        // Refresh gateway data
        try {
          const gwRes = await gatewayApi.getImpiantoGateway(impiantoCorrente!.id);
          if (gwRes.gateway) setGateway(gwRes.gateway);
        } catch {}
      } else {
        setOtaState('error');
        setOtaResult({ error: result.error || 'Aggiornamento fallito' });
      }
    } catch (err: any) {
      setOtaState('error');
      setOtaResult({ error: err.response?.data?.error || err.message || 'Errore di rete' });
    }
  };

  // Node OTA handler
  const handleNodeOta = async (mac: string, file: File) => {
    if (await checkBusy()) return;

    setActiveOta(mac);
    setOtaState('uploading');
    setOtaProgress(5);
    setOtaResult(null);

    try {
      const result = await omniapiApi.uploadNodeFirmware(mac, file);
      if (result.success) {
        setOtaProgress(100);
        setOtaState('success');
        setOtaResult({ message: result.message || 'Firmware inviato' });
      } else {
        setOtaState('error');
        setOtaResult({ error: result.error || 'Aggiornamento fallito' });
      }
    } catch (err: any) {
      setOtaState('error');
      setOtaResult({ error: err.response?.data?.error || err.message || 'Errore di rete' });
    }
  };

  // Reset OTA state
  const resetOta = () => {
    setActiveOta(null);
    setOtaState('idle');
    setOtaProgress(0);
    setOtaResult(null);
  };

  // Access denied
  if (!canAccess) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
          Accesso negato. Solo admin e installatori possono accedere.
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
        padding: '16px',
        paddingBottom: '100px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/impianto/settings')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: `${colors.accent}15`,
              border: `1px solid ${colors.border}`,
              color: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RiArrowLeftLine size={20} />
          </motion.button>
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Gestione Firmware
            </h1>
            <p style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: 0,
            }}>
              Aggiornamento OTA gateway e nodi
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            color: colors.textMuted,
            gap: '8px',
          }}>
            <RiLoader4Line size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Caricamento...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ==================== GATEWAY CARD ==================== */}
            <div style={{ ...cardStyle, padding: '20px' }}>
              <div style={topHighlight} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: `${colors.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <RiRouterLine size={22} color={colors.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
                    Gateway
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted }}>
                    {gateway?.nome || 'Non associato'}
                  </p>
                </div>
                {gateway && (
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: gateway.status === 'online' ? '#4ade80' : '#ef4444',
                    boxShadow: gateway.status === 'online' ? '0 0 8px #4ade8080' : 'none',
                  }} />
                )}
              </div>

              {gateway ? (
                <>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    marginBottom: '16px',
                  }}>
                    <InfoBadge label="Versione" value={gateway.version || '—'} colors={colors} />
                    <InfoBadge label="IP" value={gateway.ip || '—'} colors={colors} />
                    <InfoBadge label="Nodi" value={String(gateway.nodeCount ?? 0)} colors={colors} />
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={gwFileRef}
                    type="file"
                    accept=".bin"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleGatewayOta(file);
                      e.target.value = '';
                    }}
                  />

                  {/* OTA Progress / Button */}
                  {activeOta === 'gateway' && otaState !== 'idle' ? (
                    <OtaStatusBlock
                      state={otaState}
                      progress={otaProgress}
                      result={otaResult}
                      onReset={resetOta}
                      colors={colors}
                    />
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={activeOta !== null}
                      onClick={() => gwFileRef.current?.click()}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: activeOta !== null
                          ? `${colors.accent}10`
                          : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                        border: 'none',
                        color: activeOta !== null ? colors.textMuted : '#fff',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: activeOta !== null ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: activeOta !== null ? 0.5 : 1,
                      }}
                    >
                      <RiUploadCloud2Line size={18} />
                      Aggiorna firmware
                    </motion.button>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0 }}>
                  Nessun gateway associato a questo impianto.
                </p>
              )}
            </div>

            {/* ==================== NODES GRID ==================== */}
            {nodes.length > 0 && (
              <>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.textPrimary,
                  margin: '4px 0 0 0',
                }}>
                  Nodi ({nodes.length})
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                }}>
                  {nodes.map((node) => {
                    const isLed = node.device_type === 'omniapi_led';
                    const isThisOta = activeOta === node.mac;

                    return (
                      <div key={node.mac} style={{ ...cardStyle, padding: '16px' }}>
                        <div style={topHighlight} />

                        {/* Header row: icon + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: `${colors.accent}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {isLed ? (
                              <RiLightbulbFlashLine size={18} color={colors.accent} />
                            ) : (
                              <RiCpuLine size={18} color={colors.accent} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: 600,
                              color: colors.textPrimary,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {node.nome}
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '10px',
                              fontFamily: 'monospace',
                              color: colors.textMuted,
                              letterSpacing: '0.5px',
                            }}>
                              {node.mac}
                            </p>
                          </div>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: node.online ? '#4ade80' : '#ef4444',
                            flexShrink: 0,
                          }} />
                        </div>

                        {/* Info row */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: `${colors.accent}15`,
                            color: colors.accent,
                            fontWeight: 500,
                          }}>
                            {isLed ? 'LED' : 'Relay'}
                          </span>
                          {(node.firmware_version || node.version) && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: `${colors.textMuted}15`,
                              color: colors.textSecondary,
                            }}>
                              {node.firmware_version || node.version}
                            </span>
                          )}
                        </div>

                        {/* Hidden file input for this node */}
                        <input
                          ref={(el) => { nodeFileRefs.current[node.mac] = el; }}
                          type="file"
                          accept=".bin"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleNodeOta(node.mac, file);
                            e.target.value = '';
                          }}
                        />

                        {/* OTA Progress / Button */}
                        {isThisOta && otaState !== 'idle' ? (
                          <OtaStatusBlock
                            state={otaState}
                            progress={otaProgress}
                            result={otaResult}
                            onReset={resetOta}
                            colors={colors}
                            compact
                          />
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            disabled={activeOta !== null}
                            onClick={() => nodeFileRefs.current[node.mac]?.click()}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '10px',
                              background: activeOta !== null
                                ? `${colors.accent}08`
                                : `${colors.accent}15`,
                              border: `1px solid ${activeOta !== null ? colors.border : `${colors.accent}30`}`,
                              color: activeOta !== null ? colors.textMuted : colors.accent,
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: activeOta !== null ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              opacity: activeOta !== null ? 0.4 : 1,
                            }}
                          >
                            <RiUploadCloud2Line size={14} />
                            Aggiorna
                          </motion.button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {nodes.length === 0 && !loading && (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                color: colors.textMuted,
                fontSize: '13px',
              }}>
                Nessun nodo registrato in questo impianto.
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

// ============================================
// SUBCOMPONENTS (inline, no file separati)
// ============================================

function InfoBadge({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div style={{
      padding: '6px 12px',
      borderRadius: '10px',
      background: `${colors.accent}10`,
      border: `1px solid ${colors.border}`,
    }}>
      <span style={{ fontSize: '10px', color: colors.textMuted, display: 'block' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{value}</span>
    </div>
  );
}

function OtaStatusBlock({
  state,
  progress,
  result,
  onReset,
  colors,
  compact,
}: {
  state: OtaState;
  progress: number;
  result: OtaResult | null;
  onReset: () => void;
  colors: any;
  compact?: boolean;
}) {
  if (state === 'success') {
    return (
      <div style={{
        padding: compact ? '8px' : '12px',
        borderRadius: compact ? '10px' : '12px',
        background: '#4ade8015',
        border: '1px solid #4ade8030',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <RiCheckLine size={compact ? 14 : 16} color="#4ade80" />
          <span style={{ fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#4ade80' }}>
            Aggiornamento completato
          </span>
        </div>
        {result?.old_version && result?.new_version && (
          <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>
            {result.old_version} → {result.new_version}
          </p>
        )}
        {result?.message && (
          <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>
            {result.message}
          </p>
        )}
        <button
          onClick={onReset}
          style={{
            marginTop: '6px',
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Chiudi
        </button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{
        padding: compact ? '8px' : '12px',
        borderRadius: compact ? '10px' : '12px',
        background: '#ef444415',
        border: '1px solid #ef444430',
        textAlign: 'center',
      }}>
        <p style={{ margin: 0, fontSize: compact ? '12px' : '13px', fontWeight: 600, color: '#ef4444' }}>
          Errore
        </p>
        <p style={{ margin: '4px 0', fontSize: '11px', color: colors.textSecondary }}>
          {result?.error || 'Aggiornamento fallito'}
        </p>
        <button
          onClick={onReset}
          style={{
            marginTop: '6px',
            padding: '4px 12px',
            borderRadius: '8px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Riprova
        </button>
      </div>
    );
  }

  // Uploading / Rebooting
  return (
    <div style={{
      padding: compact ? '8px' : '12px',
      borderRadius: compact ? '10px' : '12px',
      background: `${colors.accent}08`,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        justifyContent: 'center',
      }}>
        <RiLoader4Line
          size={compact ? 14 : 16}
          color={colors.accent}
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <span style={{ fontSize: compact ? '11px' : '13px', color: colors.textSecondary }}>
          {state === 'rebooting' ? 'Riavvio in corso...' : 'Invio firmware...'}
        </span>
      </div>
      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: compact ? '4px' : '6px',
        borderRadius: '3px',
        background: `${colors.accent}15`,
        overflow: 'hidden',
      }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
