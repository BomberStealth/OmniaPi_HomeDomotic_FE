import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { StepImpianto } from '@/components/wizard/StepImpianto';
import { StepGateway } from '@/components/wizard/StepGateway';
import { StepGatewayConnected } from '@/components/wizard/StepGatewayConnected';
import { StepDispositivi } from '@/components/wizard/StepDispositivi';
import { StepCompleto } from '@/components/wizard/StepCompleto';
import { RiHome4Line, RiRouterLine, RiCheckboxCircleLine, RiDeviceLine, RiTrophyLine } from 'react-icons/ri';

// ============================================
// SETUP WIZARD - Configurazione Impianto + Gateway
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
    stanza_nome?: string;
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
  const [state, setState] = useState<WizardState>(() => {
    // Recupera stato salvato da localStorage
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

  // Salva stato in localStorage ad ogni cambio
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    clearWizard();
    // Usa window.location per forzare un refresh completo della pagina
    // così la dashboard caricherà i nuovi dati
    window.location.href = '/dashboard';
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      setState((prev) => ({ ...prev, currentStep: step }));
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header con Progress */}
      <header className="bg-foreground border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Logo e titolo */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-copy">
              Setup Impianto
            </h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm('Vuoi ricominciare da capo? Tutti i progressi verranno persi.')) {
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
                  if (confirm('Vuoi uscire? I dati inseriti verranno cancellati.')) {
                    clearWizard();
                    navigate('/dashboard');
                  }
                }}
              >
                Esci
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = state.currentStep === step.id;
              const isCompleted = state.currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isActive ? 'bg-primary text-background' : ''}
                        ${isCompleted ? 'bg-success text-background' : ''}
                        ${!isActive && !isCompleted ? 'bg-foreground-light text-copy-lighter' : ''}
                      `}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                      }}
                    >
                      <Icon size={20} />
                    </motion.div>
                    <span
                      className={`
                        text-xs mt-1 hidden sm:block
                        ${isActive ? 'text-primary font-semibold' : ''}
                        ${isCompleted ? 'text-success' : ''}
                        ${!isActive && !isCompleted ? 'text-copy-lighter' : ''}
                      `}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-2
                        ${isCompleted ? 'bg-success' : 'bg-foreground-light'}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
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
    </div>
  );
};

export default SetupWizard;
