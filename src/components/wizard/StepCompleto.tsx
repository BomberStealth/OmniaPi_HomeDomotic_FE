import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'react-icons/ri';
import { impiantiApi, stanzeApi, api } from '@/services/api';
import { gatewayApi } from '@/services/gatewayApi';
import { omniapiApi } from '@/services/omniapiApi';

// ============================================
// STEP 5: COMPLETATO - ANIMAZIONE CYBER
// Particelle convergono + Icona cresce + Esplosione + Onde Loop
// ============================================

interface StepCompletoProps {
  impianto: {
    nome: string;
    indirizzo: string;
    citta: string;
    cap: string;
  };
  gateway: {
    mac?: string;
    ip?: string;
    version?: string;
  };
  dispositivi: Array<{
    mac: string;
    nome: string;
    stanza_nome?: string;
  }>;
  onFinish: () => void;
  onGoToStep?: (step: number) => void;
}

type AnimPhase = 'gathering' | 'exploding' | 'complete';

export const StepCompleto = ({
  impianto,
  gateway,
  dispositivi,
  onFinish,
  onGoToStep,
}: StepCompletoProps) => {
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState('');
  const [isGatewayError, setIsGatewayError] = useState(false);
  const [animPhase, setAnimPhase] = useState<AnimPhase>('gathering');
  const [arrivedCount, setArrivedCount] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const { modeColors, colors, isDarkMode } = useThemeColor();

  const TOTAL_PARTICLES = 60;

  // Previene doppia esecuzione in React 18 Strict Mode
  const hasCreatedRef = useRef(false);

  // Scroll to top quando si arriva a questo step
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Crea tutto al mount del componente
  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;
    createEverything();
  }, []);

  // Avvia animazione dopo creazione completata
  useEffect(() => {
    if (!creating && !error) {
      setAnimKey(k => k + 1);
      setArrivedCount(0);
      setAnimPhase('gathering');
    }
  }, [creating, error]);

  // Genera particelle da TUTTI i bordi (random)
  const particles = useMemo(() => Array.from({ length: TOTAL_PARTICLES }, (_, i) => {
    const side = Math.floor(Math.random() * 4);
    let startX = 0, startY = 0;

    switch(side) {
      case 0: // Top
        startX = Math.random() * 400 - 200;
        startY = -200 - Math.random() * 50;
        break;
      case 1: // Right
        startX = 200 + Math.random() * 50;
        startY = Math.random() * 400 - 200;
        break;
      case 2: // Bottom
        startX = Math.random() * 400 - 200;
        startY = 200 + Math.random() * 50;
        break;
      case 3: // Left
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

  // Callback quando una particella arriva
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

  // Scala icona: parte da 0.1 e cresce fino a 1.0
  const iconScale = animPhase === 'gathering'
    ? 0.1 + (arrivedCount / TOTAL_PARTICLES) * 0.9
    : animPhase === 'exploding' ? 1.3
    : 1;

  const createEverything = async () => {
    setCreating(true);
    setError('');
    setIsGatewayError(false);

    let createdImpiantoId: number | null = null;

    try {
      // 1. Crea l'impianto
      const impiantoRes = await impiantiApi.create({
        nome: impianto.nome.trim(),
        indirizzo: impianto.indirizzo.trim() || undefined,
        citta: impianto.citta.trim() || undefined,
        cap: impianto.cap.trim() || undefined,
      });

      const impiantoData = impiantoRes as any;
      createdImpiantoId = impiantoData.impianto?.id || impiantoData.data?.id || impiantoData.id;

      if (!createdImpiantoId) {
        throw new Error('Errore nella creazione dell\'impianto');
      }

      console.log('Impianto creato:', createdImpiantoId);

      // 2. Associa il gateway all'impianto
      if (gateway.mac) {
        try {
          await gatewayApi.associateGateway(createdImpiantoId, gateway.mac, 'Gateway OmniaPi');
          console.log('Gateway associato:', gateway.mac);
        } catch (gatewayErr: any) {
          console.error('Errore associazione gateway, rollback impianto:', createdImpiantoId);
          try {
            await impiantiApi.delete(createdImpiantoId);
            console.log('Impianto eliminato per rollback');
          } catch (deleteErr) {
            console.error('Errore durante rollback impianto:', deleteErr);
          }

          const errorMsg = gatewayErr.response?.data?.error || gatewayErr.message || '';
          if (errorMsg.toLowerCase().includes('già associato') || errorMsg.toLowerCase().includes('already associated')) {
            setIsGatewayError(true);
          }

          throw gatewayErr;
        }
      }

      // 3. Crea le stanze uniche e registra i dispositivi
      const stanzeUniche = [...new Set(dispositivi.map(d => d.stanza_nome).filter(Boolean))];
      const stanzeMap: Record<string, number> = {};

      for (const stanzaNome of stanzeUniche) {
        if (stanzaNome) {
          const stanzaRes = await stanzeApi.createStanza(createdImpiantoId, { nome: stanzaNome });
          stanzeMap[stanzaNome] = stanzaRes.id;
          console.log('Stanza creata:', stanzaNome, '->', stanzaRes.id);
        }
      }

      // 4. Registra tutti i dispositivi
      for (const dispositivo of dispositivi) {
        const stanzaId = dispositivo.stanza_nome ? stanzeMap[dispositivo.stanza_nome] : undefined;
        await omniapiApi.registerNode(createdImpiantoId, dispositivo.mac, dispositivo.nome, stanzaId);
      }

      // 5. Auto-popola scene Entra/Esci
      try {
        await api.post(`/api/impianti/${createdImpiantoId}/scene/auto-populate`);
      } catch (sceneErr) {
        // Non blocca il flusso
      }

    } catch (err: any) {
      console.error('Errore creazione:', err);
      setError(err.response?.data?.error || err.message || 'Errore durante la creazione');
    } finally {
      setCreating(false);
    }
  };

  // Loading state
  if (creating) {
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
        <RiLoader4Line
          className="animate-spin"
          style={{
            width: 'clamp(40px, 12vw, 56px)',
            height: 'clamp(40px, 12vw, 56px)',
            color: colors.accent,
            marginBottom: spacing.sm,
          }}
        />
        <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs, color: modeColors.textPrimary }}>
          Creazione in corso...
        </h2>
        <p className="text-center" style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
          Stiamo configurando il tuo impianto
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
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
            <Button variant="primary" onClick={createEverything}>Riprova</Button>
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // SUCCESS STATE - ANIMAZIONE CYBER + ONDE LOOP
  // ============================================

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        minHeight: 'calc(100vh - 180px)',  // Altezza dinamica, meno spazio vuoto
        maxHeight: 600,
        background: isDarkMode ? 'rgba(10, 10, 12, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Container animazione centrato */}
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

        {/* ESPLOSIONE - Particelle verso fuori */}
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

        {/* ============================================ */}
        {/* FASE COMPLETE - Contenuto + ONDE LOOP INFINITO */}
        {/* ============================================ */}
        {animPhase === 'complete' && (
          <>
            {/* CONTENUTO FINALE con wrapper per icona + onde */}
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
              {/* WRAPPER per icona + onde - centratura perfetta */}
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
                {/* ONDE LOOP INFINITO - centrate nel wrapper con margin */}
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
                      marginTop: -50,   // Centra verticalmente (metà dell'altezza)
                      marginLeft: -50,  // Centra orizzontalmente (metà della larghezza)
                      borderRadius: '50%',
                      border: `2px solid ${colors.accent}`,
                      boxShadow: `0 0 20px ${colors.accent}40`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Icona Casa finale - centrata */}
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
              <p style={{ color: modeColors.textSecondary, marginBottom: spacing.md }}>
                {impianto.nome} è pronto
              </p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center gap-3" style={{ marginBottom: spacing.lg }}>
                {gateway.mac && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <RiRouterLine size={18} style={{ color: colors.accent }} />
                    <span className="text-sm" style={{ color: modeColors.textSecondary }}>Gateway</span>
                  </div>
                )}
                {dispositivi.length > 0 && (
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <RiDeviceLine size={18} style={{ color: colors.accent }} />
                    <span className="text-sm" style={{ color: modeColors.textSecondary }}>
                      {dispositivi.length} dispositiv{dispositivi.length === 1 ? 'o' : 'i'}
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
