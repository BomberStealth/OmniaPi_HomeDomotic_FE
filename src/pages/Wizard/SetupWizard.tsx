import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { Button } from '@/components/common/Button';
import { StepImpianto } from '@/components/wizard/StepImpianto';
import { StepGateway } from '@/components/wizard/StepGateway';
import { StepGatewayConnected } from '@/components/wizard/StepGatewayConnected';
import { StepDispositivi } from '@/components/wizard/StepDispositivi';
import { StepCompleto } from '@/components/wizard/StepCompleto';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { RiHome4Line, RiRouterLine, RiCheckboxCircleLine, RiDeviceLine, RiTrophyLine, RiSparklingLine } from 'react-icons/ri';

// ============================================
// SETUP WIZARD - Anno 3050 Edition 🚀
// Con particelle fluttuanti e animazioni WOW
// ============================================

const STORAGE_KEY = 'omniapi_setup_wizard';

export interface WizardState {
  currentStep: number;
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
    device_type?: string;
    stanza_nome?: string;
    stanza_icona?: string;
  }>;
}

const initialState: WizardState = {
  currentStep: 1,
  impianto: {
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
  },
  gateway: {},
  dispositivi: [],
};

const steps = [
  { id: 1, title: 'Impianto', icon: RiHome4Line },
  { id: 2, title: 'Gateway', icon: RiRouterLine },
  { id: 3, title: 'Connesso', icon: RiCheckboxCircleLine },
  { id: 4, title: 'Dispositivi', icon: RiDeviceLine },
  { id: 5, title: 'Completato', icon: RiTrophyLine },
];

export const SetupWizard = () => {
  const navigate = useNavigate();
  const { modeColors, isDarkMode, colors } = useThemeColor();
  const [particlesInit, setParticlesInit] = useState(false);
  const [state, setState] = useState<WizardState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  // Inizializza tsParticles
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  // Salva stato in localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Configurazione particelle dinamica basata sul tema
  const particlesOptions = useMemo(() => ({
    fullScreen: false,
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    particles: {
      number: { value: 40, density: { enable: true } },
      color: { value: colors.accent },
      opacity: { value: { min: 0.1, max: 0.5 } },
      size: { value: { min: 1, max: 4 } },
      move: {
        enable: true,
        speed: 0.8,
        direction: 'none' as const,
        random: true,
        straight: false,
        outModes: { default: 'out' as const },
      },
      links: {
        enable: true,
        color: colors.accent,
        opacity: 0.15,
        distance: 150,
        width: 1,
      },
      shape: { type: 'circle' },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
        onClick: { enable: true, mode: 'push' },
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.4 } },
        push: { quantity: 3 },
      },
    },
    detectRetina: true,
  }), [colors.accent]);

  const clearWizard = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  const nextStep = () => {
    if (state.currentStep < 5) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const updateImpianto = (data: Partial<WizardState['impianto']>) => {
    setState((prev) => ({
      ...prev,
      impianto: { ...prev.impianto, ...data },
    }));
  };

  const updateGateway = (data: Partial<WizardState['gateway']>) => {
    setState((prev) => ({
      ...prev,
      gateway: { ...prev.gateway, ...data },
    }));
  };

  const addDispositivo = (dispositivo: WizardState['dispositivi'][0]) => {
    setState((prev) => ({
      ...prev,
      dispositivi: [...prev.dispositivi, dispositivo],
    }));
  };

  const finishWizard = () => {
    // Rimuovi localStorage PRIMA di qualsiasi state change per evitare race condition
    // (l'useEffect salva state in localStorage ad ogni cambiamento)
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = '/dashboard';
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  // Animazioni per gli step
  const stepVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
  };

  // Glow pulsante per step attivo
  const glowStyle = {
    boxShadow: `0 0 20px ${colors.accent}40, 0 0 40px ${colors.accent}20, 0 0 60px ${colors.accent}10`,
  };

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: isDarkMode ? '#0a0a0c' : modeColors.bg }}
    >
      {/* Particelle di sfondo */}
      {particlesInit && (
        <Particles
          id="wizard-particles"
          options={particlesOptions}
          className="absolute inset-0 z-0"
        />
      )}

      {/* Gradient overlay per profondità */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: isDarkMode
            ? `radial-gradient(ellipse at 50% 0%, ${colors.accent}10 0%, transparent 50%),
               radial-gradient(ellipse at 100% 100%, ${colors.accentDark}08 0%, transparent 40%)`
            : `radial-gradient(ellipse at 50% 0%, ${colors.accent}08 0%, transparent 50%)`,
        }}
      />

      {/* Header con Progress - Glass effect */}
      <header
        className="px-4 py-4 relative z-10"
        style={{
          background: isDarkMode
            ? 'rgba(20, 18, 15, 0.8)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Logo e titolo con animazione */}
          <div className="flex items-center justify-between mb-6">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <RiSparklingLine size={28} style={{ color: colors.accent }} />
              </motion.div>
              <h1 className="text-xl font-bold" style={{ color: modeColors.textPrimary }}>
                Setup Impianto
              </h1>
            </motion.div>
            {/* Nascondi pulsanti nello step finale */}
            {state.currentStep !== 5 && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Vuoi ricominciare da capo?')) {
                      clearWizard();
                    }
                  }}
                >
                  Ricomincia
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Vuoi uscire?')) {
                      clearWizard();
                      navigate('/dashboard');
                    }
                  }}
                >
                  Esci
                </Button>
              </div>
            )}
          </div>

          {/* Progress Steps con animazioni WOW - CENTRATO */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              padding: '0 clamp(4px, 1vw, 12px)',
            }}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = state.currentStep === step.id;
              const isCompleted = state.currentStep > step.id;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flex: isLast ? 'none' : 1,
                    maxWidth: isLast ? 'auto' : '100%',
                  }}
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      className="rounded-full flex items-center justify-center relative"
                      style={{
                        width: 'clamp(36px, 10vw, 48px)',
                        height: 'clamp(36px, 10vw, 48px)',
                        background: isActive
                          ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`
                          : isCompleted
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : isDarkMode ? 'rgba(42, 42, 64, 0.8)' : 'rgba(229, 231, 235, 0.8)',
                        color: isActive || isCompleted ? '#ffffff' : modeColors.textMuted,
                        ...(isActive ? glowStyle : {}),
                      }}
                      animate={{
                        scale: isActive ? [1, 1.08, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {/* Anello rotante per step attivo */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: `2px solid ${colors.accent}`,
                            borderTopColor: 'transparent',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      {/* Checkmark animato per step completati */}
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <RiCheckboxCircleLine className="w-[clamp(18px,5vw,24px)] h-[clamp(18px,5vw,24px)]" />
                        </motion.div>
                      ) : (
                        <Icon className="w-[clamp(16px,4.5vw,22px)] h-[clamp(16px,4.5vw,22px)]" />
                      )}
                    </motion.div>
                    <motion.span
                      className="text-xs mt-2 hidden sm:block font-medium"
                      style={{
                        color: isActive
                          ? colors.accent
                          : isCompleted
                          ? '#22c55e'
                          : modeColors.textMuted,
                      }}
                      animate={{
                        opacity: isActive ? [0.7, 1, 0.7] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isActive ? Infinity : 0,
                      }}
                    >
                      {step.title}
                    </motion.span>
                  </div>

                  {/* Connector Line animata */}
                  {index < steps.length - 1 && (
                    <div
                      className="flex-1 relative"
                      style={{
                        height: 'clamp(2px, 0.5vw, 4px)',
                        margin: '0 clamp(4px, 1.5vw, 12px)',
                      }}
                    >
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: isDarkMode ? 'rgba(42, 42, 64, 0.5)' : 'rgba(209, 213, 219, 0.5)',
                        }}
                      />
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          background: isCompleted
                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                            : `linear-gradient(90deg, ${colors.accent}, ${colors.accentLight})`,
                        }}
                        initial={{ width: '0%' }}
                        animate={{
                          width: isCompleted ? '100%' : isActive ? '50%' : '0%',
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content con animazioni fluide */}
      <main className="flex-1 px-4 py-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {state.currentStep === 1 && (
                <StepImpianto
                  data={state.impianto}
                  onUpdate={updateImpianto}
                  onNext={nextStep}
                />
              )}

              {state.currentStep === 2 && (
                <StepGateway
                  onGatewaySelected={(gateway) => {
                    updateGateway(gateway);
                    nextStep();
                  }}
                  onBack={prevStep}
                />
              )}

              {state.currentStep === 3 && (
                <StepGatewayConnected
                  gateway={state.gateway}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              )}

              {state.currentStep === 4 && (
                <StepDispositivi
                  dispositivi={state.dispositivi}
                  onAddDispositivo={addDispositivo}
                  onNext={nextStep}
                  onSkip={nextStep}
                  onBack={prevStep}
                />
              )}

              {state.currentStep === 5 && (
                <StepCompleto
                  impianto={state.impianto}
                  gateway={state.gateway}
                  dispositivi={state.dispositivi}
                  onFinish={finishWizard}
                  onGoToStep={goToStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer decorativo */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background: isDarkMode
            ? `linear-gradient(to top, ${colors.accent}05, transparent)`
            : `linear-gradient(to top, ${colors.accent}03, transparent)`,
        }}
      />
    </div>
  );
};

export default SetupWizard;
