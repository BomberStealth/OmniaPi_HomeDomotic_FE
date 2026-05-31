import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import { SelectedNode } from '@/pages/Wizard/SetupWizard';
import { socketService, WS_EVENTS } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import { gatewayApi } from '@/services/gatewayApi';
import {
  RiDeviceLine,
  RiLightbulbFlashLine,
  RiLoader4Line,
  RiDeleteBinLine,
  RiCheckDoubleLine,
  RiRadarLine,
} from 'react-icons/ri';

// firmware device_type values
const DEVICE_TYPE_RELAY = 1;
const DEVICE_TYPE_LED = 2;

interface DiscoveredNode {
  mac: string;
  device_type: number;
  capabilities: number;
  firmware_version: string;
  name: string;
}

interface StepDispositiviProps {
  selectedNodes: SelectedNode[];
  onUpdateNodes: (nodes: SelectedNode[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  gatewayMac: string;
}

export const StepDispositivi = ({
  onUpdateNodes,
  onNext,
  onSkip,
  onBack,
  gatewayMac,
}: StepDispositiviProps) => {
  const { modeColors, isDarkMode, colors } = useThemeColor();
  const token = useAuthStore(state => state.token);
  const [listening, setListening] = useState(false);
  const [discoveredNodes, setDiscoveredNodes] = useState<DiscoveredNode[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const startListening = useCallback(async () => {
    if (!socketService.isConnected() && token) {
      socketService.connect(token);
    }
    setDiscoveredNodes([]);
    setShowConfirm(false);
    setListening(true);
    if (gatewayMac) {
      try {
        await gatewayApi.startNodeScan(gatewayMac);
      } catch {
        // scan command failed — still listen for NODE_DISCOVERED in case gateway was already scanning
      }
    }
  }, [token, gatewayMac]);

  const stopListening = useCallback(() => {
    setListening(false);
    setShowConfirm(false);
  }, []);

  // Subscribe to NODE_DISCOVERED while listening
  useEffect(() => {
    if (!listening) return;

    const unsubscribe = socketService.onEvent((event) => {
      if (event.type !== WS_EVENTS.NODE_DISCOVERED || !event.payload?.mac) return;
      if (!mountedRef.current) return;

      const payload = event.payload;
      const mac = (payload.mac as string).toUpperCase();
      const deviceType = typeof payload.device_type === 'number' ? payload.device_type : DEVICE_TYPE_RELAY;
      const defaultName = deviceType === DEVICE_TYPE_LED
        ? `LED Strip ${mac.slice(-5)}`
        : `Nodo ${mac.slice(-5)}`;

      setDiscoveredNodes(prev => {
        if (prev.some(n => n.mac === mac)) return prev;
        return [...prev, {
          mac,
          device_type: deviceType,
          capabilities: payload.capabilities || 0,
          firmware_version: payload.firmware_version || '',
          name: defaultName,
        }];
      });
    });

    return unsubscribe;
  }, [listening]);

  const updateName = (mac: string, name: string) => {
    setDiscoveredNodes(prev => prev.map(n => n.mac === mac ? { ...n, name } : n));
  };

  const removeNode = (mac: string) => {
    setDiscoveredNodes(prev => prev.filter(n => n.mac !== mac));
  };

  const handleFinito = () => {
    if (discoveredNodes.length === 0) {
      onSkip();
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const selected: SelectedNode[] = discoveredNodes.map(n => ({
      mac: n.mac,
      name: n.name,
      type: n.device_type === DEVICE_TYPE_LED ? 'omniapi_led' : 'omniapi_node',
    }));
    onUpdateNodes(selected);
    onNext();
  };

  const count = discoveredNodes.length;
  const countLabel = count === 1 ? '1 dispositivo trovato' : `${count} dispositivi trovati`;

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        <div style={{ padding: spacing.sm, borderRadius: radius.md, background: 'rgba(234,179,8,0.2)' }}>
          <RiDeviceLine size={24} className="text-warning" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: modeColors.textPrimary }}>
            Cerca Dispositivi
          </h2>
          <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
            {listening
              ? count > 0 ? countLabel : 'In ascolto...'
              : 'Premi il pulsante fisico su ogni nodo'}
          </p>
        </div>
        {listening && (
          <RiLoader4Line size={20} className="animate-spin" style={{ color: colors.accent }} />
        )}
      </div>

      {/* Idle: illustration + instruction */}
      {!listening && (
        <div style={{ textAlign: 'center', padding: `${spacing.lg} 0`, marginBottom: spacing.md }}>
          <RiRadarLine size={48} style={{ color: colors.accent, marginBottom: spacing.sm, opacity: 0.6 }} />
          <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, marginBottom: spacing.xs }}>
            Avvia la ricerca, poi premi il tasto fisico su ogni nodo.
          </p>
          <p style={{ fontSize: fontSize.xs, color: modeColors.textMuted }}>
            Il dispositivo apparirà istantaneamente in questa schermata.
          </p>
        </div>
      )}

      {/* Listening: empty state */}
      {listening && count === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.lg,
            border: `1px dashed ${modeColors.border}`,
            borderRadius: radius.md,
            marginBottom: spacing.md,
          }}
        >
          <p style={{ fontSize: fontSize.sm, color: modeColors.textMuted }}>
            Premi il tasto fisico sul nodo per farlo apparire qui
          </p>
        </div>
      )}

      {/* Discovered nodes */}
      {count > 0 && (
        <div style={{ marginBottom: spacing.md }}>
          {discoveredNodes.map(node => (
            <div
              key={node.mac}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: spacing.sm,
                borderRadius: radius.md,
                background: isDarkMode ? 'rgba(106,212,160,0.07)' : 'rgba(106,212,160,0.10)',
                border: '1px solid rgba(106,212,160,0.25)',
                marginBottom: spacing.xs,
                gap: spacing.sm,
              }}
            >
              {node.device_type === DEVICE_TYPE_LED
                ? <RiLightbulbFlashLine size={20} style={{ color: colors.accent, flexShrink: 0 }} />
                : <RiDeviceLine size={20} style={{ color: colors.accent, flexShrink: 0 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={node.name}
                  onChange={e => updateName(node.mac, e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${modeColors.border}`,
                    color: modeColors.textPrimary,
                    fontSize: fontSize.sm,
                    fontWeight: 500,
                    outline: 'none',
                    padding: '2px 0',
                    marginBottom: 2,
                  }}
                />
                <span className="font-mono" style={{ fontSize: '10px', color: modeColors.textMuted }}>
                  {node.mac}
                  {node.firmware_version ? ` · fw ${node.firmware_version}` : ''}
                </span>
              </div>
              <button
                onClick={() => removeNode(node.mac)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}
              >
                <RiDeleteBinLine size={16} style={{ color: '#ef4444' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inline confirm dialog */}
      {showConfirm && (
        <div
          style={{
            padding: spacing.md,
            borderRadius: radius.md,
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${modeColors.border}`,
            marginBottom: spacing.md,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: fontSize.sm, color: modeColors.textPrimary, marginBottom: spacing.sm }}>
            Sicuro? Hai trovato <strong>{count}</strong> dispositiv{count === 1 ? 'o' : 'i'}.
          </p>
          <div className="flex justify-center" style={{ gap: spacing.sm }}>
            <Button variant="glass" onClick={() => setShowConfirm(false)}>
              No, continua
            </Button>
            <Button variant="primary" onClick={handleConfirm}>
              <RiCheckDoubleLine size={16} style={{ marginRight: 6 }} />
              Sì, procedi
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap justify-between" style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
        <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
          {!listening ? (
            <>
              <Button variant="glass" onClick={onSkip}>Salta</Button>
              <Button variant="primary" onClick={startListening}>Avvia ricerca</Button>
            </>
          ) : (
            <>
              <Button variant="glass" onClick={stopListening}>Annulla</Button>
              <Button variant="primary" onClick={handleFinito}>Finito!</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
