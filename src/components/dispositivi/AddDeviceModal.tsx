import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCloseLine,
  RiLightbulbFlashLine,
  RiFlashlightLine,
  RiLoader4Line,
  RiWifiLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiSearchLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';
import { omniapiApi } from '@/services/omniapiApi';
import { gatewayApi, ScannedNode } from '@/services/gatewayApi';

// ============================================
// ADD DEVICE MODAL
// Full flow: Scan → Select → Commission → Register
// Same scan+commission logic as setup wizard
// ============================================

const SCAN_COUNTDOWN = 45;
const POLL_INTERVAL = 3000;
const POLL_MAX_DURATION = 30000;
const COMMISSION_POLL_INTERVAL = 4000;

type ModalPhase = 'scanning' | 'selecting' | 'commissioning' | 'success' | 'error';

interface SelectedNode {
  mac: string;
  name: string;
  deviceType: 'omniapi_node' | 'omniapi_led';
  rssi?: number;
}

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  impiantoId: number;
  onDeviceAdded: () => void;
  existingMacs: string[];
}

/** Map firmware device_type number to DB device_type string
 *  From omniapi_protocol.h:
 *    0x01 = DEVICE_TYPE_RELAY
 *    0x02 = DEVICE_TYPE_LED_STRIP
 *    0x10 = DEVICE_TYPE_SENSOR
 */
const mapDeviceType = (dt: string | number): 'omniapi_node' | 'omniapi_led' => {
  const n = typeof dt === 'string' ? parseInt(dt, 10) : dt;
  return (n === 2) ? 'omniapi_led' : 'omniapi_node';
};

const normalizeMac = (mac: string) => mac.toUpperCase().replace(/-/g, ':');

export const AddDeviceModal = ({
  isOpen,
  onClose,
  impiantoId,
  onDeviceAdded,
  existingMacs
}: AddDeviceModalProps) => {
  const { colors } = useThemeColors();

  // Phase state
  const [phase, setPhase] = useState<ModalPhase>('scanning');
  const [countdown, setCountdown] = useState(SCAN_COUNTDOWN);
  const [isPolling, setIsPolling] = useState(false);

  // Scan results
  const [scannedNodes, setScannedNodes] = useState<ScannedNode[]>([]);

  // Selection
  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);

  // Commission progress
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [commissionFailures, setCommissionFailures] = useState<string[]>([]);

  // Refs for cleanup
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commissionAbortRef = useRef(false);

  // Cleanup all timers
  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // ============================================
  // SCAN LOGIC
  // ============================================

  const startPolling = useCallback(() => {
    if (!mountedRef.current) return;
    setIsPolling(true);
    const pollStart = Date.now();

    const doPoll = async () => {
      try {
        const res = await gatewayApi.getNodeScanResults();
        if (!mountedRef.current) return;

        const uncommissioned = res.nodes.filter(n =>
          !n.commissioned && !existingMacs.includes(normalizeMac(n.mac))
        );
        setScannedNodes(uncommissioned);

        if (uncommissioned.length > 0) {
          cleanup();
          setIsPolling(false);
          setPhase('selecting');
          return;
        }
      } catch { /* continue polling */ }

      if (Date.now() - pollStart >= POLL_MAX_DURATION) {
        cleanup();
        if (mountedRef.current) {
          setIsPolling(false);
          setPhase('selecting'); // Show empty state
        }
      }
    };

    doPoll();
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);
  }, [cleanup, existingMacs]);

  const startScan = useCallback(async () => {
    cleanup();
    setScannedNodes([]);
    setSelectedNodes([]);
    setPhase('scanning');
    setCountdown(SCAN_COUNTDOWN);
    setIsPolling(false);
    setError('');

    try {
      const res = await gatewayApi.startNodeScan();
      if (!res.success) {
        if (mountedRef.current) {
          setError(res.message || 'Scansione non avviata. Il gateway potrebbe essere occupato.');
          setPhase('error');
        }
        return;
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || '';
        setError(msg
          ? `Scansione non avviata: ${msg}`
          : 'Scansione non avviata. Il gateway potrebbe essere occupato.'
        );
        setPhase('error');
      }
      return;
    }

    // Countdown - gateway stops itself after ~33s
    let remaining = SCAN_COUNTDOWN;
    timerRef.current = setInterval(() => {
      remaining--;
      if (!mountedRef.current) return;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        startPolling();
      }
    }, 1000);
  }, [cleanup, startPolling]);

  // Auto-start scan when modal opens
  useEffect(() => {
    if (isOpen) {
      startScan();
    } else {
      // Reset on close
      cleanup();
      setPhase('scanning');
      setScannedNodes([]);
      setSelectedNodes([]);
      setProgress(0);
      setStatusMessage('');
      setError('');
      setAddedCount(0);
      setCommissionFailures([]);
      commissionAbortRef.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // SELECTION LOGIC
  // ============================================

  const isNodeSelected = (mac: string) => selectedNodes.some(n => n.mac === mac);

  const toggleNode = (node: ScannedNode) => {
    const mac = normalizeMac(node.mac);
    if (isNodeSelected(mac)) {
      setSelectedNodes(prev => prev.filter(n => n.mac !== mac));
    } else {
      const dt = mapDeviceType(node.device_type);
      const defaultName = dt === 'omniapi_led'
        ? `LED Strip ${mac.slice(-5)}`
        : `Interruttore ${mac.slice(-5)}`;
      setSelectedNodes(prev => [...prev, {
        mac,
        name: defaultName,
        deviceType: dt,
        rssi: node.rssi,
      }]);
    }
  };

  const updateNodeName = (mac: string, name: string) => {
    setSelectedNodes(prev => prev.map(n => n.mac === mac ? { ...n, name } : n));
  };

  // ============================================
  // COMMISSION + REGISTER LOGIC
  // ============================================

  const startCommission = async () => {
    if (selectedNodes.length === 0) return;

    setPhase('commissioning');
    setProgress(0);
    setStatusMessage('Invio comandi commissioning...');
    setCommissionFailures([]);
    commissionAbortRef.current = false;

    try {
      // Step 1: Send commission commands (0-10%)
      setProgress(5);
      await Promise.all(
        selectedNodes.map(node =>
          gatewayApi.commissionNode(node.mac, node.name).catch(err => {
            console.error(`Commission send failed for ${node.mac}:`, err);
          })
        )
      );
      setProgress(10);

      if (commissionAbortRef.current) return;

      // Step 2: Poll for commissioned nodes (10-80%)
      const targetMacs = selectedNodes.map(n => normalizeMac(n.mac));
      const TIMEOUT = 45000 + (selectedNodes.length * 5000);
      const startTime = Date.now();
      const commissionedMacs = new Set<string>();

      setStatusMessage(`Commissioning nodi... (0/${selectedNodes.length})`);

      while (Date.now() - startTime < TIMEOUT && !commissionAbortRef.current) {
        await new Promise(r => setTimeout(r, COMMISSION_POLL_INTERVAL));

        try {
          const res = await omniapiApi.getNodes();
          const onlineMacs = new Set(res.nodes.map(n => normalizeMac(n.mac)));

          for (const mac of targetMacs) {
            if (onlineMacs.has(mac) && !commissionedMacs.has(mac)) {
              commissionedMacs.add(mac);
              console.log(`[AddDevice] Node ${mac} found on production mesh`);
            }
          }

          const ratio = commissionedMacs.size / targetMacs.length;
          setProgress(Math.round(10 + ratio * 70));
          setStatusMessage(
            `Commissioning nodi... (${commissionedMacs.size}/${selectedNodes.length})`
          );

          if (commissionedMacs.size === targetMacs.length) break;
        } catch (pollErr) {
          console.warn('[AddDevice] Poll error:', pollErr);
        }
      }

      if (commissionAbortRef.current) return;

      // Evaluate results
      const commissionedNodes = selectedNodes.filter(n =>
        commissionedMacs.has(normalizeMac(n.mac))
      );
      const failedNodes = selectedNodes.filter(n =>
        !commissionedMacs.has(normalizeMac(n.mac))
      );

      if (commissionedNodes.length === 0) {
        throw new Error('Nessun nodo commissionato. Verifica che il gateway sia acceso e i nodi raggiungibili.');
      }

      // Step 3: Register in DB (80-100%)
      setStatusMessage('Registrazione dispositivi...');
      setProgress(80);

      const registeredNodes: SelectedNode[] = [];
      const regFailures: string[] = [];
      const regSlice = 20 / commissionedNodes.length;

      for (let i = 0; i < commissionedNodes.length; i++) {
        const node = commissionedNodes[i];
        try {
          await omniapiApi.registerNode(
            impiantoId,
            node.mac,
            node.name,
            undefined,
            node.deviceType
          );
          registeredNodes.push(node);
          console.log(`[AddDevice] Node ${node.mac} registered in DB`);
        } catch (regErr: any) {
          const reason = regErr.response?.data?.error || regErr.message || 'Errore registrazione';
          console.error(`[AddDevice] Register failed for ${node.mac}: ${reason}`);
          regFailures.push(`${node.name} (${reason})`);
        }
        setProgress(80 + Math.round((i + 1) * regSlice));
      }

      // Combine commission failures + registration failures
      const allFailures = [
        ...failedNodes.map(n => n.name),
        ...regFailures,
      ];

      if (registeredNodes.length === 0) {
        throw new Error('Nessun dispositivo registrato. ' + (regFailures.length > 0 ? regFailures.join(', ') : ''));
      }

      setProgress(100);
      setAddedCount(registeredNodes.length);
      setCommissionFailures(allFailures);
      setPhase('success');

    } catch (err: any) {
      console.error('[AddDevice] Error:', err);
      if (!commissionAbortRef.current) {
        setError(err.message || 'Errore durante il commissioning');
        setPhase('error');
      }
    }
  };

  // ============================================
  // CLOSE HANDLER
  // ============================================

  const handleClose = () => {
    commissionAbortRef.current = true;
    cleanup();
    onClose();
  };

  const handleSuccessClose = () => {
    onDeviceAdded();
    handleClose();
  };

  if (!isOpen) return null;

  // ============================================
  // RENDER
  // ============================================

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={phase !== 'commissioning' ? handleClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: colors.bgCard,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              {phase === 'scanning' ? 'Ricerca dispositivi' :
               phase === 'selecting' ? 'Dispositivi trovati' :
               phase === 'commissioning' ? 'Aggiunta in corso...' :
               phase === 'success' ? 'Completato' :
               'Errore'}
            </h2>
            {phase !== 'commissioning' && (
              <button
                onClick={handleClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RiCloseLine size={20} style={{ color: colors.textMuted }} />
              </button>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>

            {/* ========== SCANNING PHASE ========== */}
            {phase === 'scanning' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `${colors.accent}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  {isPolling ? (
                    <RiSearchLine size={36} style={{ color: colors.accent }} />
                  ) : (
                    <RiLoader4Line
                      size={36}
                      className="animate-spin"
                      style={{ color: colors.accent }}
                    />
                  )}
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, margin: '0 0 8px' }}>
                  {isPolling ? 'Elaborazione risultati...' : 'Scansione in corso...'}
                </p>
                <p style={{ fontSize: '14px', color: colors.textMuted, margin: '0 0 16px' }}>
                  {isPolling
                    ? 'Ricerca nuovi dispositivi nella rete mesh'
                    : `Il gateway sta cercando dispositivi (${countdown}s)`
                  }
                </p>

                {/* Countdown bar */}
                {!isPolling && (
                  <div style={{
                    width: '100%',
                    height: '4px',
                    borderRadius: '2px',
                    background: `${colors.accent}20`,
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      style={{
                        height: '100%',
                        borderRadius: '2px',
                        background: colors.accent,
                      }}
                      initial={{ width: '100%' }}
                      animate={{ width: `${(countdown / SCAN_COUNTDOWN) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}

                <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '16px' }}>
                  Accendi i dispositivi OmniaPi da aggiungere
                </p>
              </div>
            )}

            {/* ========== SELECTING PHASE ========== */}
            {phase === 'selecting' && (
              <div>
                {scannedNodes.length === 0 ? (
                  /* Empty state */
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <RiWifiLine size={48} style={{ color: colors.textMuted, marginBottom: '12px' }} />
                    <p style={{ fontSize: '15px', color: colors.textSecondary, margin: '0 0 8px' }}>
                      Nessun nuovo dispositivo trovato
                    </p>
                    <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 20px' }}>
                      Accendi i dispositivi e assicurati che siano in modalità pairing
                    </p>
                    <motion.button
                      onClick={startScan}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: colors.accent,
                        border: 'none',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RiRefreshLine size={16} />
                      Riprova scansione
                    </motion.button>
                  </div>
                ) : (
                  /* Node list */
                  <>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}>
                      <span style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {scannedNodes.length} dispositiv{scannedNodes.length === 1 ? 'o' : 'i'} trovat{scannedNodes.length === 1 ? 'o' : 'i'}
                      </span>
                      <motion.button
                        onClick={startScan}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: `1px solid ${colors.border}`,
                          color: colors.textMuted,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RiRefreshLine size={12} />
                        Cerca ancora
                      </motion.button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {scannedNodes.map(node => {
                        const mac = normalizeMac(node.mac);
                        const dt = mapDeviceType(node.device_type);
                        const isLed = dt === 'omniapi_led';
                        const selected = isNodeSelected(mac);
                        const selectedData = selectedNodes.find(n => n.mac === mac);

                        return (
                          <motion.div
                            key={mac}
                            onClick={() => toggleNode(node)}
                            style={{
                              padding: '12px',
                              background: selected ? `${colors.accent}10` : colors.bgSecondary,
                              borderRadius: '14px',
                              border: `2px solid ${selected ? colors.accent : colors.border}`,
                              cursor: 'pointer',
                            }}
                            whileHover={{ borderColor: colors.accent }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {/* Checkbox */}
                              <div style={{
                                width: 22,
                                height: 22,
                                borderRadius: '6px',
                                border: `2px solid ${selected ? colors.accent : colors.border}`,
                                background: selected ? colors.accent : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.15s',
                              }}>
                                {selected && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>

                              {/* Icon */}
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '10px',
                                background: `${colors.accent}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                {isLed ? (
                                  <RiLightbulbFlashLine size={18} style={{ color: colors.accent }} />
                                ) : (
                                  <RiFlashlightLine size={18} style={{ color: colors.accent }} />
                                )}
                              </div>

                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: colors.textPrimary,
                                  margin: 0,
                                }}>
                                  {isLed ? 'LED Strip' : 'Relay Node'}
                                </p>
                                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>
                                  {mac.slice(-8)}
                                  {node.rssi ? ` • ${node.rssi}dBm` : ''}
                                  {node.firmware ? ` • v${node.firmware}` : ''}
                                </p>
                              </div>
                            </div>

                            {/* Name input (when selected) */}
                            {selected && selectedData && (
                              <div style={{ marginTop: '10px', marginLeft: '34px' }}>
                                <input
                                  type="text"
                                  value={selectedData.name}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateNodeName(mac, e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Nome dispositivo"
                                  style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: colors.bgCard,
                                    border: `1px solid ${colors.border}`,
                                    color: colors.textPrimary,
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Add button */}
                    <motion.button
                      onClick={startCommission}
                      disabled={selectedNodes.length === 0}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '14px',
                        background: selectedNodes.length > 0 ? colors.accent : `${colors.accent}30`,
                        border: 'none',
                        color: '#fff',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: selectedNodes.length > 0 ? 'pointer' : 'not-allowed',
                        marginTop: '16px',
                        opacity: selectedNodes.length > 0 ? 1 : 0.5,
                      }}
                      whileHover={selectedNodes.length > 0 ? { scale: 1.01 } : {}}
                      whileTap={selectedNodes.length > 0 ? { scale: 0.99 } : {}}
                    >
                      Aggiungi {selectedNodes.length > 0 ? `(${selectedNodes.length})` : ''}
                    </motion.button>
                  </>
                )}
              </div>
            )}

            {/* ========== COMMISSIONING PHASE ========== */}
            {phase === 'commissioning' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <RiLoader4Line
                  size={40}
                  className="animate-spin"
                  style={{ color: colors.accent, marginBottom: '20px' }}
                />
                <p style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, margin: '0 0 8px' }}>
                  {statusMessage}
                </p>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: `${colors.accent}20`,
                  overflow: 'hidden',
                  marginTop: '16px',
                }}>
                  <motion.div
                    style={{
                      height: '100%',
                      borderRadius: '3px',
                      background: colors.accent,
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginTop: '8px' }}>
                  {progress}%
                </p>
              </div>
            )}

            {/* ========== SUCCESS PHASE ========== */}
            {phase === 'success' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#22c55e20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <RiCheckboxCircleLine size={32} style={{ color: '#22c55e' }} />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, margin: '0 0 8px' }}>
                  {addedCount} dispositiv{addedCount === 1 ? 'o' : 'i'} aggiunt{addedCount === 1 ? 'o' : 'i'}
                </p>

                {commissionFailures.length > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#f59e0b15',
                    borderRadius: '12px',
                    border: '1px solid #f59e0b30',
                    marginTop: '12px',
                    textAlign: 'left',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', margin: '0 0 4px' }}>
                      Non commissionati:
                    </p>
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                      {commissionFailures.join(', ')}
                    </p>
                  </div>
                )}

                <motion.button
                  onClick={handleSuccessClose}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    background: colors.accent,
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '20px',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Chiudi
                </motion.button>
              </div>
            )}

            {/* ========== ERROR PHASE ========== */}
            {phase === 'error' && (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#ef444420',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <RiAlertLine size={32} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, margin: '0 0 8px' }}>
                  Errore
                </p>
                <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 20px' }}>
                  {error}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <motion.button
                    onClick={handleClose}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Chiudi
                  </motion.button>
                  <motion.button
                    onClick={startScan}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '12px',
                      background: colors.accent,
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Riprova scansione
                  </motion.button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
