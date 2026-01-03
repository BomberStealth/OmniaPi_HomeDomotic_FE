import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  RiTrophyLine,
  RiHome4Line,
  RiRouterLine,
  RiDeviceLine,
  RiDashboardLine,
  RiLoader4Line,
  RiAlertLine,
} from 'react-icons/ri';
import confetti from 'canvas-confetti';
import { impiantiApi, stanzeApi } from '@/services/api';
import { gatewayApi } from '@/services/gatewayApi';
import { omniapiApi } from '@/services/omniapiApi';

// ============================================
// STEP 5: COMPLETATO
// Qui viene creato TUTTO nel database:
// 1. Impianto
// 2. Associazione Gateway
// 3. Stanze
// 4. Dispositivi
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

  // Previene doppia esecuzione in React 18 Strict Mode
  const hasCreatedRef = useRef(false);

  // Crea tutto al mount del componente
  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;
    createEverything();
  }, []);

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
          // ROLLBACK: elimina l'impianto appena creato
          console.error('Errore associazione gateway, rollback impianto:', createdImpiantoId);
          try {
            await impiantiApi.delete(createdImpiantoId);
            console.log('Impianto eliminato per rollback');
          } catch (deleteErr) {
            console.error('Errore durante rollback impianto:', deleteErr);
          }

          // Verifica se è un errore "Gateway già associato"
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

      // Crea ogni stanza unica
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
        console.log('Dispositivo registrato:', dispositivo.nome, dispositivo.mac);
      }

      // Effetto confetti
      triggerConfetti();

    } catch (err: any) {
      console.error('Errore creazione:', err);
      setError(err.response?.data?.error || err.message || 'Errore durante la creazione');
    } finally {
      setCreating(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ['#6ad4a0', '#22c55e', '#fbbf24', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // Conta stanze uniche
  const stanzeUniche = new Set(
    dispositivi.filter((d) => d.stanza_nome).map((d) => d.stanza_nome)
  );

  // Loading state
  if (creating) {
    return (
      <Card variant="glass" className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <RiLoader4Line size={56} className="text-primary animate-spin mb-4" />
          <h2 className="text-xl font-bold text-copy mb-2">
            Creazione in corso...
          </h2>
          <p className="text-copy-lighter text-center">
            Stiamo configurando il tuo impianto, gateway e dispositivi
          </p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="glass" className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 rounded-full bg-error/20 mb-4">
            <RiAlertLine size={48} className="text-error" />
          </div>
          <h2 className="text-xl font-bold text-copy mb-2">
            {isGatewayError ? 'Gateway non disponibile' : 'Errore durante la creazione'}
          </h2>
          <p className="text-error text-center mb-6">{error}</p>

          {isGatewayError && (
            <p className="text-copy-lighter text-sm text-center mb-4">
              Il Gateway selezionato è già associato ad un altro impianto.
              Seleziona un altro Gateway o verifica le impostazioni.
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="glass" onClick={onFinish} className="flex-shrink-0">
              Esci
            </Button>
            {isGatewayError && onGoToStep ? (
              <Button
                variant="primary"
                onClick={() => onGoToStep(2)}
                className="flex-shrink-0 whitespace-nowrap"
              >
                <RiRouterLine size={18} className="mr-2 flex-shrink-0" />
                <span>Seleziona altro Gateway</span>
              </Button>
            ) : (
              <Button variant="primary" onClick={createEverything} className="flex-shrink-0">
                Riprova
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-6">
      {/* Header con animazione */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <div className="p-5 rounded-full bg-success/20">
            <RiTrophyLine size={56} className="text-success" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-copy mb-2">
          Impianto Configurato!
        </h2>
        <p className="text-copy-lighter">
          Tutto pronto! Puoi iniziare a controllare la tua casa
        </p>
      </div>

      {/* Riepilogo */}
      <div className="space-y-4 mb-8">
        {/* Impianto */}
        <Card variant="glass-dark" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <RiHome4Line size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-copy-lighter text-xs">Impianto</p>
              <p className="text-copy font-bold">{impianto.nome}</p>
              {impianto.indirizzo && (
                <p className="text-copy-lighter text-sm">
                  {impianto.indirizzo}
                  {impianto.citta && `, ${impianto.citta}`}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Gateway */}
        <Card variant="glass-dark" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <RiRouterLine size={20} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-copy-lighter text-xs">Gateway</p>
              <p className="text-copy font-bold">OmniaPi Gateway</p>
              <p className="text-copy-lighter text-sm font-mono">
                {gateway.mac} {gateway.ip && `| ${gateway.ip}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Dispositivi */}
        <Card variant="glass-dark" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/20">
              <RiDeviceLine size={20} className="text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-copy-lighter text-xs">Dispositivi</p>
              <p className="text-copy font-bold">
                {dispositivi.length} dispositiv{dispositivi.length === 1 ? 'o' : 'i'}
              </p>
              {stanzeUniche.size > 0 && (
                <p className="text-copy-lighter text-sm">
                  in {stanzeUniche.size} stanz{stanzeUniche.size === 1 ? 'a' : 'e'}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Info aggiuntive */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
        <p className="text-copy text-sm">
          Puoi sempre aggiungere altri dispositivi, creare scene e automazioni
          dalla Dashboard.
        </p>
      </div>

      {/* Bottone finale */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          onClick={onFinish}
          className="w-full max-w-md py-4 text-lg flex items-center justify-center"
        >
          <RiDashboardLine size={24} className="mr-3 flex-shrink-0" />
          <span>Vai alla Dashboard</span>
        </Button>
      </div>
    </Card>
  );
};
