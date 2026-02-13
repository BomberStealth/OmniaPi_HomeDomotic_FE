import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import { gatewayApi, ScannedNode } from '@/services/gatewayApi';
import { SelectedNode } from '@/pages/Wizard/SetupWizard';
import {
  RiDeviceLine,
  RiSearchLine,
  RiLoader4Line,
  RiWifiLine,
  RiCheckLine,
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
} from 'react-icons/ri';

// ============================================
// STEP 3: SCAN NODI via MQTT
// Flusso reale del gateway (fw 1.7.x):
//   0s:  riceve start scan, switch a discovery mesh
//   ~4s: discovery mesh attiva
//   ~10s: nodi trovati
//   ~25s: timeout, torna in production mesh
//   ~33s: MQTT resumed, pubblica risultati
//
// Frontend: countdown 45s → poll ogni 3s per 30s max
// NON chiama stopNodeScan (il gateway si ferma da solo)
// ============================================

const SCAN_COUNTDOWN = 45;
const POLL_INTERVAL = 3000;
const POLL_MAX_DURATION = 30000;

type ScanPhase = 'idle' | 'scanning' | 'polling' | 'done';

interface StepDispositiviProps {
  selectedNodes: SelectedNode[];
  onUpdateNodes: (nodes: SelectedNode[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const StepDispositivi = ({
  selectedNodes,
  onUpdateNodes,
  onNext,
  onSkip,
  onBack,
}: StepDispositiviProps) => {
  const { modeColors, isDarkMode, colors } = useThemeColor();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [countdown, setCountdown] = useState(SCAN_COUNTDOWN);
  const [scannedNodes, setScannedNodes] = useState<ScannedNode[]>([]);
  const [error, setError] = useState('');
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    if (!mountedRef.current) return;
    setPhase('polling');
    pollStartRef.current = Date.now();

    const doPoll = async () => {
      try {
        const res = await gatewayApi.getNodeScanResults();
        if (!mountedRef.current) return;
        const uncommissioned = res.nodes.filter(n => !n.commissioned);
        setScannedNodes(uncommissioned);
        if (uncommissioned.length > 0) {
          cleanup();
          setPhase('done');
          return;
        }
      } catch { /* continua polling */ }

      // Timeout polling dopo POLL_MAX_DURATION
      if (Date.now() - pollStartRef.current >= POLL_MAX_DURATION) {
        cleanup();
        if (mountedRef.current) setPhase('done');
      }
    };

    doPoll();
    pollRef.current = setInterval(doPoll, POLL_INTERVAL);
  }, [cleanup]);

  const startScan = useCallback(async () => {
    cleanup();
    setError('');
    setScannedNodes([]);
    setPhase('scanning');
    setCountdown(SCAN_COUNTDOWN);

    try {
      await gatewayApi.startNodeScan();
    } catch {
      if (mountedRef.current) {
        setError('Errore avvio scansione nodi');
        setPhase('idle');
      }
      return;
    }

    // Countdown passivo - NON chiama stopNodeScan
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

  const handleLeave = (cb: () => void) => {
    cleanup();
    cb();
  };

  const isSelected = (mac: string) => selectedNodes.some(n => n.mac === mac);

  const toggleSelect = (node: ScannedNode) => {
    if (isSelected(node.mac)) {
      onUpdateNodes(selectedNodes.filter(n => n.mac !== node.mac));
    } else {
      const defaultName = node.device_type === 'omniapi_led'
        ? `LED Strip ${node.mac.slice(-5)}`
        : `Nodo ${node.mac.slice(-5)}`;
      onUpdateNodes([...selectedNodes, { mac: node.mac, name: defaultName, type: node.device_type }]);
    }
  };

  const updateNodeName = (mac: string, name: string) => {
    onUpdateNodes(selectedNodes.map(n => n.mac === mac ? { ...n, name } : n));
    setEditingMac(null);
    setEditName('');
  };

  const removeNode = (mac: string) => {
    onUpdateNodes(selectedNodes.filter(n => n.mac !== mac));
  };

  const rssiToColor = (rssi: number): string => {
    if (rssi >= -50) return '#22c55e';
    if (rssi >= -60) return '#eab308';
    if (rssi >= -70) return '#f97316';
    return '#ef4444';
  };

  const rssiLabel = (rssi: number): string => {
    if (rssi >= -50) return 'Ottimo';
    if (rssi >= -60) return 'Buono';
    if (rssi >= -70) return 'Discreto';
    return 'Debole';
  };

  const availableNodes = scannedNodes.filter(n => !isSelected(n.mac));
  const isWorking = phase === 'scanning' || phase === 'polling';

  const phaseLabel = (): string => {
    switch (phase) {
      case 'idle': return 'Premi "Cerca dispositivi" per avviare la scansione';
      case 'scanning': return `Scansione in corso... ${countdown}s`;
      case 'polling': return 'Recupero risultati dal gateway...';
      case 'done': return scannedNodes.length > 0
        ? `Trovati ${scannedNodes.length} dispositivi`
        : 'Nessun dispositivo trovato';
    }
  };

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: spacing.md }}
      >
        <div className="flex items-center" style={{ gap: spacing.sm }}>
          <div
            style={{
              padding: spacing.sm,
              borderRadius: radius.md,
              background: 'rgba(234, 179, 8, 0.2)',
            }}
          >
            <RiDeviceLine size={24} className="text-warning" />
          </div>
          <div>
            <h2
              style={{
                fontSize: fontSize.lg,
                fontWeight: 'bold',
                color: modeColors.textPrimary,
              }}
            >
              Cerca Dispositivi
            </h2>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
              {phaseLabel()}
            </p>
          </div>
        </div>
        {isWorking && (
          <RiLoader4Line
            size={20}
            className="animate-spin"
            style={{ color: colors.accent }}
          />
        )}
      </div>

      {/* Progress bar during scanning */}
      {phase === 'scanning' && (
        <div style={{ marginBottom: spacing.md }}>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: colors.accent,
                width: `${((SCAN_COUNTDOWN - countdown) / SCAN_COUNTDOWN) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
          <p style={{ fontSize: '10px', color: modeColors.textMuted, marginTop: 4, textAlign: 'center' }}>
            Il gateway cerca nodi e torna sulla rete principale...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#ef4444', fontSize: fontSize.xs, marginBottom: spacing.sm }}>
          {error}
        </p>
      )}

      {/* Start / Retry button */}
      {(phase === 'idle' || phase === 'done') && (
        <div style={{ textAlign: 'center', marginBottom: spacing.md }}>
          <Button variant="primary" onClick={startScan}>
            <RiSearchLine size={16} style={{ marginRight: 6 }} />
            {phase === 'idle' ? 'Cerca dispositivi' : 'Ripeti scansione'}
          </Button>
        </div>
      )}

      {/* Selected nodes */}
      {selectedNodes.length > 0 && (
        <div style={{ marginBottom: spacing.md }}>
          <p
            style={{
              fontSize: fontSize.xs,
              color: modeColors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Nodi selezionati ({selectedNodes.length}):
          </p>
          {selectedNodes.map((node) => (
            <div
              key={node.mac}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: spacing.sm,
                borderRadius: radius.md,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                marginBottom: spacing.xs,
                gap: spacing.sm,
              }}
            >
              <RiCheckLine size={16} className="text-success flex-shrink-0" />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingMac === node.mac ? (
                  <div className="flex items-center" style={{ gap: spacing.xs }}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editName.trim()) updateNodeName(node.mac, editName.trim());
                        if (e.key === 'Escape') { setEditingMac(null); setEditName(''); }
                      }}
                      autoFocus
                      style={{
                        flex: 1,
                        height: 30,
                        padding: '0 8px',
                        borderRadius: radius.sm,
                        background: isDarkMode ? modeColors.bgSecondary : '#f0f0f0',
                        border: `1px solid ${modeColors.border}`,
                        color: modeColors.textPrimary,
                        fontSize: fontSize.xs,
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (editName.trim()) updateNodeName(node.mac, editName.trim()); }}
                    >
                      OK
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex items-center"
                    style={{ gap: spacing.xs, cursor: 'pointer' }}
                    onClick={() => { setEditingMac(node.mac); setEditName(node.name); }}
                  >
                    <span
                      style={{
                        fontSize: fontSize.sm,
                        color: modeColors.textPrimary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {node.name}
                    </span>
                    <RiEditLine size={12} style={{ color: modeColors.textMuted, flexShrink: 0 }} />
                  </div>
                )}
                <span
                  className="font-mono"
                  style={{ fontSize: '10px', color: modeColors.textMuted, display: 'block' }}
                >
                  {node.mac}
                </span>
              </div>
              <button
                onClick={() => removeNode(node.mac)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <RiDeleteBinLine size={16} style={{ color: '#ef4444' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available (scanned but not yet selected) */}
      {phase === 'done' && (
        <div style={{ marginBottom: spacing.sm }}>
          <p
            style={{
              fontSize: fontSize.xs,
              color: modeColors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Nodi trovati ({availableNodes.length}):
          </p>

          {scannedNodes.length === 0 && (
            <div style={{ textAlign: 'center', padding: spacing.lg, color: modeColors.textMuted }}>
              <RiSearchLine size={32} style={{ marginBottom: spacing.xs, opacity: 0.5 }} />
              <p style={{ fontSize: fontSize.sm }}>Nessun dispositivo trovato</p>
              <p style={{ fontSize: fontSize.xs }}>
                Assicurati che i nodi siano accesi e riprova
              </p>
            </div>
          )}

          {availableNodes.map((node) => (
            <div
              key={node.mac}
              onClick={() => toggleSelect(node)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: spacing.sm,
                borderRadius: radius.md,
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${modeColors.border}`,
                marginBottom: spacing.xs,
                gap: spacing.sm,
                cursor: 'pointer',
              }}
            >
              <RiAddLine size={16} style={{ color: colors.accent, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: fontSize.sm,
                    color: modeColors.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  {node.device_type === 'omniapi_led' ? 'LED Strip' : 'Nodo OmniaPi'}
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: '10px', color: modeColors.textMuted, display: 'block' }}
                >
                  {node.mac}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <RiWifiLine size={14} style={{ color: rssiToColor(node.rssi) }} />
                <span style={{ fontSize: '10px', color: rssiToColor(node.rssi) }}>
                  {rssiLabel(node.rssi)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div
        className="flex flex-wrap justify-between"
        style={{ gap: spacing.sm, paddingTop: spacing.sm }}
      >
        <Button variant="glass" onClick={() => handleLeave(onBack)} disabled={isWorking}>
          Indietro
        </Button>
        <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
          <Button variant="glass" onClick={() => handleLeave(onSkip)} disabled={isWorking}>
            Salta
          </Button>
          {selectedNodes.length > 0 && (
            <Button variant="primary" onClick={() => handleLeave(onNext)} disabled={isWorking}>
              Avanti ({selectedNodes.length})
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
