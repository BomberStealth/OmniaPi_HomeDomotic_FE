import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiHome4Line,
  RiRouterLine,
  RiDeviceLine,
  RiDashboardLine,
  RiLoader4Line,
  RiAlertLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCpuLine,
  RiWifiLine,
  RiMapPinLine,
} from 'react-icons/ri';
import { impiantiApi, api } from '@/services/api';
import { gatewayApi } from '@/services/gatewayApi';
import { omniapiApi } from '@/services/omniapiApi';
import { SelectedNode } from '@/pages/Wizard/SetupWizard';

// ============================================
// STEP 4: RIEPILOGO + COMPLETAMENTO
// Flusso: commissioning PRIMA, impianto DOPO
//   1. Commissioning nodi via MQTT + polling (0-60%)
//   2. Crea impianto (60-70%)
//   3. Associa gateway (70-80%)
//   4. Registra nodi nel DB (80-90%)
//   5. Auto-popola scene (90-100%)
// L'impianto viene creato SOLO se almeno 1 nodo
// è stato commissionato (o se non ci sono nodi).
// ============================================

interface StepCompletoProps {
  impianto: {
    nome: string;
    indirizzo: string;
    citta: string;
    cap: string;
  };
  gateway: {
    mac: string;
    ip: string;
    version: string;
  } | null;
  selectedNodes: SelectedNode[];
  onFinish: () => void;
  onGoToStep?: (step: number) => void;
}

type SetupPhase = 'summary' | 'creating' | 'error' | 'success';
type AnimPhase = 'gathering' | 'exploding' | 'complete';
type NodeCommissionStatus = 'waiting' | 'in_progress' | 'success' | 'failed' | 'timeout';

export const StepCompleto = ({
  impianto,
  gateway,
  selectedNodes,
  onFinish,
  onGoToStep,
}: StepCompletoProps) => {
  const [phase, setPhase] = useState<SetupPhase>('summary');
  const [error, setError] = useState('');
  const [isGatewayError, setIsGatewayError] = useState(false);

  // Progress state
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [commissionFailures, setCommissionFailures] = useState<string[]>([]);

  // Commission state
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeCommissionStatus>>({});
  const [isCommissioning, setIsCommissioning] = useState(false);
  const cancelRef = useRef(false);

  // Animation state
  const [animPhase, setAnimPhase] = useState<AnimPhase>('gathering');
  const [arrivedCount, setArrivedCount] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const { modeColors, colors, isDarkMode } = useThemeColor();
  const TOTAL_PARTICLES = 60;

  const hasCreatedRef = useRef(false);

  // Scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Start animation after success
  useEffect(() => {
    if (phase === 'success') {
      setAnimKey(k => k + 1);
      setArrivedCount(0);
      setAnimPhase('gathering');
    }
  }, [phase]);

  // ============================================
  // PARTICLE ANIMATION
  // ============================================

  const particles = useMemo(() => Array.from({ length: TOTAL_PARTICLES }, (_, i) => {
    const side = Math.floor(Math.random() * 4);
    let startX = 0, startY = 0;

    switch(side) {
      case 0:
        startX = Math.random() * 400 - 200;
        startY = -200 - Math.random() * 50;
        break;
      case 1:
        startX = 200 + Math.random() * 50;
        startY = Math.random() * 400 - 200;
        break;
      case 2:
        startX = Math.random() * 400 - 200;
        startY = 200 + Math.random() * 50;
        break;
      case 3:
        startX = -200 - Math.random() * 50;
        startY = Math.random() * 400 - 200;
        break;
    }

    return {
      id: i,
      startX,
      startY,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 0.5,
      size: 4 + Math.random() * 6,
    };
  }), [animKey]);

  const handleParticleArrived = useCallback(() => {
    setArrivedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= TOTAL_PARTICLES) {
        setTimeout(() => setAnimPhase('exploding'), 200);
        setTimeout(() => setAnimPhase('complete'), 1500);
      }
      return newCount;
    });
  }, []);

  const iconScale = animPhase === 'gathering'
    ? 0.1 + (arrivedCount / TOTAL_PARTICLES) * 0.9
    : animPhase === 'exploding' ? 1.3
    : 1;

  // ============================================
  // SETUP FUNCTIONS
  // ============================================

  const normalizeMac = (mac: string) => mac.toUpperCase().replace(/-/g, ':');

  const startSetup = async () => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;

    setPhase('creating');
    setProgress(0);
    setStatusMessage('Preparazione...');
    setCommissionFailures([]);
    setError('');
    setIsGatewayError(false);

    const hasNodes = selectedNodes.length > 0;

    try {
      let commissionedNodes: SelectedNode[] = [];
      let failures: string[] = [];

      // ========== FASE 1-2: Commissioning SEQUENZIALE nodi ==========
      if (hasNodes) {
        setIsCommissioning(true);
        cancelRef.current = false;

        const targetMacs = selectedNodes.map(n => normalizeMac(n.mac));
        const statusMap: Record<string, NodeCommissionStatus> = {};
        selectedNodes.forEach(n => { statusMap[normalizeMac(n.mac)] = 'waiting'; });
        setNodeStatuses({ ...statusMap });
        setProgress(2);

        for (let i = 0; i < selectedNodes.length; i++) {
          if (cancelRef.current) break;

          const node = selectedNodes[i];
          const mac = normalizeMac(node.mac);

          statusMap[mac] = 'in_progress';
          setNodeStatuses({ ...statusMap });
          setStatusMessage(`Commissioning nodo ${i + 1}/${selectedNodes.length}...`);

          // Send commission with retry on 409
          let commandSent = false;
          for (let attempt = 1; attempt <= 3; attempt++) {
            if (cancelRef.current) break;
            try {
              await gatewayApi.commissionNode(node.mac, node.name);
              commandSent = true;
              break;
            } catch (err: any) {
              const is409 = err?.response?.status === 409;
              if (is409 && attempt < 3) {
                console.warn(`[StepCompleto] Commission ${mac}: gateway occupato, tentativo ${attempt}/3`);
                setStatusMessage(`Gateway occupato, riprovo... (${attempt}/3)`);
                await new Promise(r => setTimeout(r, 5000));
              } else {
                console.error(`[StepCompleto] Commission failed for ${mac} (attempt ${attempt}):`, err);
              }
            }
          }

          if (cancelRef.current) break;

          if (!commandSent) {
            statusMap[mac] = 'failed';
            setNodeStatuses({ ...statusMap });
            continue;
          }

          // Poll commission result with 30s timeout
          const COMMISSION_TIMEOUT = 30000;
          const POLL_INTERVAL = 3000;
          const pollStart = Date.now();
          let nodeResult: NodeCommissionStatus = 'timeout';

          while (Date.now() - pollStart < COMMISSION_TIMEOUT) {
            if (cancelRef.current) break;
            await new Promise(r => setTimeout(r, POLL_INTERVAL));

            try {
              const res = await gatewayApi.getCommissionResult(node.mac);
              if (res.commissioned === true) {
                nodeResult = 'success';
                break;
              } else if (res.commissioned === false) {
                nodeResult = 'failed';
                break;
              }
              // commissioned === null → still waiting
            } catch {}
          }

          if (cancelRef.current) break;

          statusMap[mac] = nodeResult;
          setNodeStatuses({ ...statusMap });
          console.log(`[StepCompleto] Node ${mac}: ${nodeResult}`);

          // Update progress (2% to 55%)
          const ratio = (i + 1) / selectedNodes.length;
          setProgress(Math.round(2 + ratio * 53));
        }

        // If cancelled, abort setup
        if (cancelRef.current) {
          setIsCommissioning(false);
          hasCreatedRef.current = false;
          setPhase('summary');
          return;
        }

        setIsCommissioning(false);

        // Final verification: check which nodes appear on production mesh
        setStatusMessage('Verifica nodi sulla rete...');
        setProgress(58);

        try {
          const nodesRes = await omniapiApi.getNodes();
          const onlineMacs = new Set(
            nodesRes.nodes.map(n => normalizeMac(n.mac))
          );
          // Upgrade timeout/failed nodes if they're actually online
          for (const mac of targetMacs) {
            if ((statusMap[mac] === 'timeout' || statusMap[mac] === 'failed') && onlineMacs.has(mac)) {
              statusMap[mac] = 'success';
            }
          }
          setNodeStatuses({ ...statusMap });
        } catch (verifyErr) {
          console.warn('[StepCompleto] Mesh verification failed:', verifyErr);
        }

        setProgress(60);

        // Determine results
        commissionedNodes = selectedNodes.filter(n =>
          statusMap[normalizeMac(n.mac)] === 'success'
        );
        const failedNodes = selectedNodes.filter(n =>
          statusMap[normalizeMac(n.mac)] !== 'success'
        );
        failures = failedNodes.map(n => {
          const s = statusMap[normalizeMac(n.mac)];
          return `${n.name} (${s === 'timeout' ? 'timeout' : 'fallito'})`;
        });

        console.log(`[StepCompleto] Commissioned: ${commissionedNodes.length}, Failed: ${failedNodes.length}`);

        if (commissionedNodes.length === 0) {
          throw new Error(
            'Nessun nodo commissionato. Verifica che il gateway sia acceso e i nodi siano raggiungibili.'
          );
        }
      }

      // ========== FASE 3: Crea impianto (60-70% o 0-30% se no nodi) ==========
      setStatusMessage('Creazione impianto...');
      setProgress(hasNodes ? 65 : 10);

      console.log('[StepCompleto] Creazione impianto...', impianto);
      const impiantoRes = await impiantiApi.create({
        nome: impianto.nome.trim(),
        indirizzo: impianto.indirizzo.trim() || undefined,
        citta: impianto.citta.trim() || undefined,
        cap: impianto.cap.trim() || undefined,
      });

      const impiantoData = impiantoRes as any;
      const impiantoId = impiantoData.impianto?.id || impiantoData.data?.id || impiantoData.id;

      if (!impiantoId) {
        throw new Error('Errore nella creazione dell\'impianto');
      }

      console.log('[StepCompleto] Impianto creato con ID:', impiantoId);
      setProgress(hasNodes ? 70 : 30);

      // ========== FASE 4: Associa gateway (70-80% o 30-60%) ==========
      if (gateway) {
        setStatusMessage('Associazione gateway...');
        setProgress(hasNodes ? 75 : 40);

        console.log('[StepCompleto] Associazione gateway:', gateway.mac);
        try {
          await gatewayApi.associateGateway(impiantoId, gateway.mac, 'Gateway OmniaPi', gateway.ip, gateway.version);
        } catch (gatewayErr: any) {
          const errorMsg = gatewayErr.response?.data?.error || gatewayErr.message || '';
          if (errorMsg.toLowerCase().includes('già associato') || errorMsg.toLowerCase().includes('already associated')) {
            setIsGatewayError(true);
          }
          // Rollback impianto
          try { await impiantiApi.delete(impiantoId); } catch (_e) { /* ignore */ }
          throw gatewayErr;
        }
      }
      setProgress(hasNodes ? 80 : 60);

      // ========== FASE 5: Registra nodi commissionati nel DB (80-90%) ==========
      if (commissionedNodes.length > 0) {
        setStatusMessage('Registrazione nodi...');
        const nodeSlice = 10 / commissionedNodes.length;

        for (let i = 0; i < commissionedNodes.length; i++) {
          const node = commissionedNodes[i];
          try {
            await omniapiApi.registerNode(
              impiantoId,
              node.mac,
              node.name,
              undefined,
              (node.type as 'omniapi_node' | 'omniapi_led') || 'omniapi_node'
            );
            console.log(`[StepCompleto] Node ${node.mac} registered in DB`);
          } catch (regErr) {
            console.error(`[StepCompleto] DB registration failed for ${node.mac}:`, regErr);
          }
          setProgress((hasNodes ? 80 : 60) + Math.round((i + 1) * nodeSlice));
        }
      }
      setProgress(hasNodes ? 90 : 70);

      // ========== FASE 6: Auto-popola scene (non bloccante) ==========
      setStatusMessage('Finalizzazione...');
      setProgress(95);
      try {
        await api.post(`/api/impianti/${impiantoId}/scene/auto-populate`);
      } catch (_sceneErr) {
        // Non bloccante
      }

      setProgress(100);
      setCommissionFailures(failures);
      console.log('[StepCompleto] Setup completato! Failures:', failures);
      setPhase('success');
    } catch (err: any) {
      console.error('[StepCompleto] Errore setup:', err);
      hasCreatedRef.current = false;
      setError(err.response?.data?.error || err.message || 'Errore durante la creazione');
      setPhase('error');
    }
  };

  const handleRetry = () => {
    hasCreatedRef.current = false;
    startSetup();
  };

  const handleCancel = () => {
    cancelRef.current = true;
  };

  // ============================================
  // RENDER: SUMMARY (default view)
  // ============================================
  if (phase === 'summary') {
    return (
      <Card variant="glass" style={{ padding: spacing.md }}>
        {/* Header */}
        <div
          className="flex items-center"
          style={{ gap: spacing.sm, marginBottom: spacing.md }}
        >
          <div
            style={{
              padding: spacing.sm,
              borderRadius: radius.md,
              background: `${colors.accent}20`,
            }}
          >
            <RiCheckboxCircleLine
              style={{
                width: 'clamp(20px, 6vw, 28px)',
                height: 'clamp(20px, 6vw, 28px)',
                color: colors.accent,
              }}
            />
          </div>
          <div>
            <h2
              style={{
                fontSize: fontSize.lg,
                fontWeight: 'bold',
                color: modeColors.textPrimary,
              }}
            >
              Riepilogo Setup
            </h2>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
              Controlla i dati prima di completare
            </p>
          </div>
        </div>

        {/* Impianto */}
        <Card
          variant="glass-dark"
          style={{ padding: spacing.md, marginBottom: spacing.sm }}
        >
          <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <RiHome4Line style={{ width: 20, height: 20, color: colors.accent }} />
            <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              Impianto
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textPrimary, fontWeight: 500 }}>
              {impianto.nome}
            </p>
            <div className="flex items-center" style={{ gap: spacing.xs }}>
              <RiMapPinLine style={{ width: 14, height: 14, color: modeColors.textSecondary }} />
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                {impianto.indirizzo}, {impianto.citta} {impianto.cap}
              </p>
            </div>
          </div>
        </Card>

        {/* Gateway */}
        <Card
          variant="glass-dark"
          style={{ padding: spacing.md, marginBottom: spacing.sm }}
        >
          <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <RiRouterLine style={{ width: 20, height: 20, color: colors.accent }} />
            <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              Gateway
            </span>
          </div>
          {gateway ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.xs,
              }}
            >
              <div className="flex items-center" style={{ gap: spacing.xs }}>
                <RiCpuLine style={{ width: 14, height: 14, color: modeColors.textSecondary }} />
                <div>
                  <p style={{ fontSize: '10px', color: modeColors.textSecondary }}>MAC</p>
                  <p className="font-mono" style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}>
                    {gateway.mac}
                  </p>
                </div>
              </div>
              <div className="flex items-center" style={{ gap: spacing.xs }}>
                <RiWifiLine style={{ width: 14, height: 14, color: modeColors.textSecondary }} />
                <div>
                  <p style={{ fontSize: '10px', color: modeColors.textSecondary }}>IP</p>
                  <p className="font-mono" style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}>
                    {gateway.ip}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: fontSize.sm, color: modeColors.textMuted }}>
              Nessun gateway selezionato
            </p>
          )}
        </Card>

        {/* Nodi */}
        <Card
          variant="glass-dark"
          style={{ padding: spacing.md, marginBottom: spacing.lg }}
        >
          <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <RiDeviceLine style={{ width: 20, height: 20, color: colors.accent }} />
            <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              Nodi da commissionare ({selectedNodes.length})
            </span>
          </div>
          {selectedNodes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selectedNodes.map((n) => (
                <div key={n.mac} className="flex items-center justify-between">
                  <span style={{ fontSize: fontSize.sm, color: modeColors.textPrimary }}>
                    {n.name}
                  </span>
                  <span className="font-mono" style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                    {n.mac.slice(-8)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: fontSize.sm, color: modeColors.textMuted }}>
              Nessun nodo selezionato
            </p>
          )}
        </Card>

        {/* Bottone Completa Setup */}
        <div className="flex justify-center">
          <motion.button
            onClick={startSetup}
            whileHover={{ scale: 1.03, boxShadow: `0 6px 30px ${colors.accent}50` }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent}dd)`,
              color: '#fff',
              padding: '14px 32px',
              borderRadius: '14px',
              border: 'none',
              fontSize: fontSize.md,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 20px ${colors.accent}40`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RiCheckboxCircleLine size={20} />
            Completa Setup
          </motion.button>
        </div>
      </Card>
    );
  }

  // ============================================
  // RENDER: CREATING (progress bar)
  // ============================================
  if (phase === 'creating') {
    return (
      <div
        className="min-h-[300px] flex flex-col items-center justify-center"
        style={{
          padding: spacing.lg,
          borderRadius: radius.xl,
          background: 'transparent',
        }}
      >
        <RiLoader4Line
          className="animate-spin"
          style={{
            width: 'clamp(40px, 12vw, 56px)',
            height: 'clamp(40px, 12vw, 56px)',
            color: colors.accent,
            marginBottom: spacing.md,
          }}
        />
        <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs, color: modeColors.textPrimary }}>
          Configurazione in corso...
        </h2>
        <p className="text-center" style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, marginBottom: spacing.md }}>
          {statusMessage}
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            height: 8,
            borderRadius: 4,
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            overflow: 'hidden',
            marginBottom: spacing.xs,
          }}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 4,
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentDark || colors.accent})`,
              boxShadow: `0 0 10px ${colors.accent}60`,
            }}
          />
        </div>
        <p style={{ fontSize: fontSize.xs, color: modeColors.textMuted }}>
          {progress}%
        </p>

        {/* Per-node status list during commissioning */}
        {isCommissioning && Object.keys(nodeStatuses).length > 0 && (
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              marginTop: spacing.md,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {selectedNodes.map((node) => {
              const mac = node.mac.toUpperCase().replace(/-/g, ':');
              const status = nodeStatuses[mac] || 'waiting';
              return (
                <div
                  key={mac}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: radius.md,
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }}
                >
                  {status === 'waiting' && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: modeColors.textMuted, opacity: 0.4 }} />
                  )}
                  {status === 'in_progress' && (
                    <RiLoader4Line size={16} className="animate-spin" style={{ color: colors.accent, flexShrink: 0 }} />
                  )}
                  {status === 'success' && (
                    <RiCheckboxCircleLine size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                  )}
                  {status === 'failed' && (
                    <RiCloseCircleLine size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                  )}
                  {status === 'timeout' && (
                    <RiAlertLine size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: fontSize.sm, color: modeColors.textPrimary, flex: 1 }}>
                    {node.name}
                  </span>
                  <span style={{ fontSize: '10px', color: modeColors.textMuted }}>
                    {status === 'waiting' ? 'In attesa' :
                     status === 'in_progress' ? 'In corso...' :
                     status === 'success' ? 'OK' :
                     status === 'failed' ? 'Fallito' : 'Timeout'}
                  </span>
                </div>
              );
            })}

            {/* Cancel button */}
            <button
              onClick={handleCancel}
              style={{
                marginTop: spacing.sm,
                padding: '8px 16px',
                borderRadius: radius.md,
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                background: 'transparent',
                color: modeColors.textSecondary,
                fontSize: fontSize.sm,
                cursor: 'pointer',
              }}
            >
              Annulla
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (phase === 'error') {
    return (
      <div
        className="min-h-[300px] flex flex-col items-center justify-center"
        style={{
          padding: spacing.lg,
          borderRadius: radius.xl,
          background: isDarkMode ? 'rgba(20, 18, 15, 0.6)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <div style={{ padding: spacing.md, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', marginBottom: spacing.sm }}>
          <RiAlertLine style={{ width: 'clamp(32px, 10vw, 48px)', height: 'clamp(32px, 10vw, 48px)', color: '#ef4444' }} />
        </div>
        <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs, color: modeColors.textPrimary }}>
          {isGatewayError ? 'Gateway non disponibile' : 'Errore creazione'}
        </h2>
        <p className="text-center" style={{ color: '#ef4444', fontSize: fontSize.sm, marginBottom: spacing.md }}>
          {error}
        </p>
        {isGatewayError && (
          <p className="text-center" style={{ fontSize: fontSize.xs, color: modeColors.textSecondary, marginBottom: spacing.sm }}>
            Gateway già associato. Seleziona un altro.
          </p>
        )}
        <div className="flex flex-wrap justify-center" style={{ gap: spacing.sm }}>
          <Button variant="glass" onClick={onFinish}>Esci</Button>
          {isGatewayError && onGoToStep ? (
            <Button variant="primary" onClick={() => onGoToStep(2)}>Altro Gateway</Button>
          ) : (
            <Button variant="primary" onClick={handleRetry}>Riprova</Button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SUCCESS - ANIMAZIONE CYBER + ONDE LOOP
  // ============================================
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        minHeight: 'calc(100vh - 180px)',
        maxHeight: 600,
        background: 'transparent',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: spacing.sm }}>

        {/* PARTICELLE che convergono da tutti i lati */}
        <AnimatePresence>
          {animPhase === 'gathering' && particles.map(p => (
            <motion.div
              key={`particle-${p.id}-${animKey}`}
              initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 1 }}
              animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0.5], scale: [1, 0.5] }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
              onAnimationComplete={handleParticleArrived}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: colors.accent,
                boxShadow: `0 0 ${p.size * 2}px ${colors.accent}`,
              }}
            />
          ))}
        </AnimatePresence>

        {/* ANELLI ESPANDIBILI durante gathering/exploding */}
        {(animPhase === 'gathering' || animPhase === 'exploding') && (
          <>
            {[0, 0.3, 0.6].map((delay, i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full"
                initial={{ scale: 0.3, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 2, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }}
                style={{ width: 120, height: 120, border: `2px solid ${colors.accent}` }}
              />
            ))}
          </>
        )}

        {/* ICONA che CRESCE con le particelle */}
        {(animPhase === 'gathering' || animPhase === 'exploding') && (
          <motion.div
            animate={{
              scale: iconScale,
              boxShadow: animPhase === 'exploding'
                ? `0 0 100px ${colors.accent}, 0 0 200px ${colors.accent}50`
                : `0 0 ${30 + arrivedCount}px ${colors.accent}`,
              rotate: animPhase === 'exploding' ? [0, 360] : 0,
            }}
            transition={{ duration: animPhase === 'exploding' ? 0.5 : 0.2, rotate: { duration: 0.5 } }}
            style={{
              position: 'absolute',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors.accent}40, transparent)`,
            }}
          >
            <RiHome4Line size={60} color={colors.accent} />
          </motion.div>
        )}

        {/* ESPLOSIONE */}
        <AnimatePresence>
          {animPhase === 'exploding' && Array.from({ length: 80 }).map((_, i) => {
            const angle = (i / 80) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            return (
              <motion.div
                key={`explode-${i}-${animKey}`}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i % 3 === 0 ? '#fff' : colors.accent,
                  boxShadow: `0 0 10px ${colors.accent}`,
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* Onde esplosione singole */}
        <AnimatePresence>
          {animPhase === 'exploding' && [1, 2, 3, 4, 5].map((ring) => (
            <motion.div
              key={`wave-${ring}-${animKey}`}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: 5, opacity: 0 }}
              transition={{ duration: 1, delay: ring * 0.1, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: `3px solid ${colors.accent}`,
                boxShadow: `0 0 20px ${colors.accent}`,
              }}
            />
          ))}
        </AnimatePresence>

        {/* FASE COMPLETE */}
        {animPhase === 'complete' && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* WRAPPER per icona + onde */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 140,
                  height: 140,
                  marginBottom: spacing.md,
                }}
              >
                {/* ONDE LOOP INFINITO */}
                {[1, 2, 3].map(ring => (
                  <motion.div
                    key={`loop-ring-${ring}`}
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 4, opacity: 0 }}
                    transition={{
                      duration: 2.5,
                      delay: ring * 0.7,
                      repeat: Infinity,
                      repeatDelay: 0.3,
                      ease: 'easeOut',
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 100,
                      height: 100,
                      marginTop: -50,
                      marginLeft: -50,
                      borderRadius: '50%',
                      border: `2px solid ${colors.accent}`,
                      boxShadow: `0 0 20px ${colors.accent}40`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Icona Casa finale */}
                <motion.div
                  animate={{
                    boxShadow: [
                      `0 0 30px ${colors.accent}60`,
                      `0 0 60px ${colors.accent}80`,
                      `0 0 30px ${colors.accent}60`,
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: spacing.lg,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent})`,
                  }}
                >
                  <RiHome4Line size={60} color="#ffffff" />
                </motion.div>
              </div>

              {/* Testo */}
              <h1
                className="text-3xl font-bold mb-1"
                style={{ color: modeColors.textPrimary, textShadow: `0 0 20px ${colors.accent}30` }}
              >
                Impianto Creato!
              </h1>
              <p style={{ color: modeColors.textSecondary, marginBottom: spacing.sm }}>
                {impianto.nome} è pronto
              </p>

              {/* Warning per nodi falliti */}
              {commissionFailures.length > 0 && (
                <div
                  style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: radius.md,
                    padding: spacing.sm,
                    marginBottom: spacing.sm,
                    maxWidth: 300,
                  }}
                >
                  <p style={{ fontSize: fontSize.xs, color: '#eab308', fontWeight: 500, marginBottom: 2 }}>
                    Commissioning fallito per:
                  </p>
                  {commissionFailures.map((name, i) => (
                    <p key={i} style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                      • {name}
                    </p>
                  ))}
                  <p style={{ fontSize: '10px', color: modeColors.textMuted, marginTop: 4 }}>
                    Potrai aggiungerli in seguito dalle impostazioni
                  </p>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-3" style={{ marginBottom: spacing.lg }}>
                {gateway && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <RiRouterLine size={18} style={{ color: colors.accent }} />
                    <span className="text-sm" style={{ color: modeColors.textSecondary }}>Gateway</span>
                  </div>
                )}
                {selectedNodes.length > 0 && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <RiDeviceLine size={18} style={{ color: colors.accent }} />
                    <span className="text-sm" style={{ color: modeColors.textSecondary }}>
                      {selectedNodes.length - commissionFailures.length} nod{selectedNodes.length - commissionFailures.length === 1 ? 'o' : 'i'}
                    </span>
                  </div>
                )}
              </div>

              {/* Pulsante */}
              <motion.button
                onClick={onFinish}
                whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${colors.accent}60` }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent}dd)`,
                  color: '#fff',
                  padding: '16px 40px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: `0 4px 25px ${colors.accent}50`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <RiDashboardLine size={24} />
                Vai alla Dashboard
              </motion.button>
            </motion.div>
          </>
        )}

        {/* Progress durante gathering */}
        {animPhase === 'gathering' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              bottom: 40,
              color: modeColors.textSecondary,
              fontSize: fontSize.sm,
              zIndex: 30,
            }}
          >
            {Math.round((arrivedCount / TOTAL_PARTICLES) * 100)}%
          </motion.div>
        )}
      </div>
    </div>
  );
};
