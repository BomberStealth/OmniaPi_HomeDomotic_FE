import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import { RiHome4Line, RiArrowLeftLine, RiPlayLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

// ============================================
// TEST ANIMATION PAGE - SOLO CYBER
// Particelle da tutti i lati + Icona cresce + Onde
// ============================================

type Phase = 'idle' | 'gathering' | 'exploding' | 'complete';

export const TestAnimation = () => {
  const navigate = useNavigate();
  const { colors, modeColors, isDarkMode } = useThemeColor();
  const [phase, setPhase] = useState<Phase>('idle');
  const [arrivedCount, setArrivedCount] = useState(0);
  const [key, setKey] = useState(0);

  const TOTAL_PARTICLES = 60;

  // Genera particelle da TUTTI i bordi (random)
  const particles = useMemo(() => Array.from({ length: TOTAL_PARTICLES }, (_, i) => {
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
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
  }), [key]);

  // Avvia animazione
  const startAnimation = useCallback(() => {
    if (phase !== 'idle' && phase !== 'complete') return;
    setKey(k => k + 1);
    setArrivedCount(0);
    setPhase('gathering');
  }, [phase]);

  // Callback quando una particella arriva
  const handleParticleArrived = useCallback(() => {
    setArrivedCount(prev => {
      const newCount = prev + 1;
      // Quando TUTTE sono arrivate, esplodi!
      if (newCount >= TOTAL_PARTICLES) {
        setTimeout(() => setPhase('exploding'), 200);
        setTimeout(() => setPhase('complete'), 1500);
      }
      return newCount;
    });
  }, []);

  // Scala icona: parte da 0.1 e cresce fino a 1.0
  const iconScale = phase === 'gathering'
    ? 0.1 + (arrivedCount / TOTAL_PARTICLES) * 0.9  // Da 0.1 a 1.0
    : phase === 'exploding' ? 1.3
    : 1;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
        <Button variant="ghost" onClick={() => navigate('/settings')}>
          <RiArrowLeftLine size={20} />
        </Button>
        <h1 style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: modeColors.textPrimary }}>
          Test Animazione
        </h1>
      </div>

      <Card variant="glass" style={{ padding: spacing.lg }}>
        {/* Container animazione */}
        <div
          style={{
            position: 'relative',
            height: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: radius.lg,
            background: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)',
          }}
        >
          {/* Particelle che convergono da tutti i lati */}
          <AnimatePresence>
            {phase === 'gathering' && particles.map(p => (
              <motion.div
                key={`particle-${p.id}-${key}`}
                initial={{
                  x: p.startX,
                  y: p.startY,
                  opacity: 0,
                  scale: 1,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 1, 1, 0.5],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: 'easeIn',
                }}
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

          {/* ANELLI ESPANDIBILI (copiati da StepCompleto) */}
          {(phase === 'gathering' || phase === 'exploding') && (
            <>
              {[0, 0.3, 0.6].map((delay, i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute rounded-full"
                  initial={{ scale: 0.3, opacity: 0.8 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{
                    duration: 2,
                    delay,
                    ease: 'easeOut',
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                  style={{
                    width: 120,
                    height: 120,
                    border: `2px solid ${colors.accent}`,
                  }}
                />
              ))}
            </>
          )}

          {/* Icona centrale che CRESCE con le particelle */}
          {(phase === 'gathering' || phase === 'exploding' || phase === 'complete') && (
            <motion.div
              animate={{
                scale: iconScale,
                boxShadow: phase === 'exploding'
                  ? `0 0 100px ${colors.accent}, 0 0 200px ${colors.accent}50`
                  : `0 0 ${30 + arrivedCount}px ${colors.accent}`,
                rotate: phase === 'exploding' ? [0, 360] : 0,
              }}
              transition={{
                duration: phase === 'exploding' ? 0.5 : 0.2,
                rotate: { duration: 0.5 },
              }}
              style={{
                position: 'absolute',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: phase === 'complete'
                  ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent})`
                  : `radial-gradient(circle, ${colors.accent}40, transparent)`,
              }}
            >
              <RiHome4Line
                size={60}
                color={phase === 'complete' ? '#fff' : colors.accent}
              />
            </motion.div>
          )}

          {/* ESPLOSIONE - Particelle verso fuori */}
          <AnimatePresence>
            {phase === 'exploding' && Array.from({ length: 80 }).map((_, i) => {
              const angle = (i / 80) * Math.PI * 2;
              const distance = 150 + Math.random() * 100;
              return (
                <motion.div
                  key={`explode-${i}-${key}`}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: 0,
                    scale: 0,
                  }}
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

          {/* Onde esplosione (come StepCompleto) */}
          <AnimatePresence>
            {phase === 'exploding' && [1, 2, 3, 4, 5].map((ring) => (
              <motion.div
                key={`wave-${ring}-${key}`}
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

          {/* Particelle decorative (come StepCompleto) */}
          {phase === 'exploding' && (
            <>
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`decor-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 4 + (i % 3) * 2,
                    height: 4 + (i % 3) * 2,
                    background: colors.accent,
                  }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos((i * 30 * Math.PI) / 180) * (120 + i * 8),
                    y: Math.sin((i * 30 * Math.PI) / 180) * (120 + i * 8),
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </>
          )}

          {/* RISULTATO FINALE + ONDE LOOP INFINITO */}
          {phase === 'complete' && (
            <>
              {/* ONDE LOOP INFINITO - CENTRATE */}
              {[1, 2, 3].map(ring => (
                <motion.div
                  key={`loop-ring-${ring}`}
                  initial={{ scale: 0.5, opacity: 0.6 }}
                  animate={{ scale: 3.5, opacity: 0 }}
                  transition={{
                    duration: 2.5,
                    delay: ring * 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.3,
                    ease: 'easeOut',
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: `2px solid ${colors.accent}`,
                    boxShadow: `0 0 20px ${colors.accent}40`,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              ))}
              {/* Testo finale */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 80 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  position: 'absolute',
                  textAlign: 'center',
                  zIndex: 10,
                }}
              >
                <h2 style={{
                  color: colors.accent,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  margin: 0,
                  textShadow: `0 0 20px ${colors.accent}50`,
                }}>
                  Impianto Creato!
                </h2>
              </motion.div>
            </>
          )}

          {/* Pulsante avvia (quando idle o complete) */}
          {(phase === 'idle' || phase === 'complete') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: phase === 'complete' ? 1 : 0 }}
              style={{
                position: 'absolute',
                bottom: 30,
              }}
            >
              <Button
                variant="primary"
                onClick={startAnimation}
              >
                <RiPlayLine size={20} style={{ marginRight: spacing.xs }} />
                {phase === 'idle' ? 'AVVIA ANIMAZIONE' : 'RIPETI'}
              </Button>
            </motion.div>
          )}

          {/* Progress durante gathering */}
          {phase === 'gathering' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                bottom: 20,
                color: modeColors.textSecondary,
                fontSize: fontSize.sm,
              }}
            >
              {Math.round((arrivedCount / TOTAL_PARTICLES) * 100)}%
            </motion.div>
          )}
        </div>

        <p
          className="text-center"
          style={{ marginTop: spacing.md, fontSize: fontSize.sm, color: modeColors.textSecondary }}
        >
          Animazione Cyber - Particelle da tutti i lati
        </p>
      </Card>
    </Layout>
  );
};
