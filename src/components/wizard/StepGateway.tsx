import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { gatewayApi, Gateway } from '@/services/gatewayApi';
import {
  RiRouterLine,
  RiWifiLine,
  RiLockLine,
  RiGlobalLine,
  RiRefreshLine,
  RiCheckLine,
  RiLoader4Line,
} from 'react-icons/ri';

// ============================================
// STEP 2: SELEZIONA GATEWAY (solo salvataggio locale)
// L'associazione con l'impianto avviene a Step 5
// ============================================

interface StepGatewayProps {
  onGatewaySelected: (gateway: { mac: string; ip?: string; version?: string }) => void;
  onBack: () => void;
}

export const StepGateway = ({ onGatewaySelected, onBack }: StepGatewayProps) => {
  const [polling, setPolling] = useState(true);
  const [pendingGateways, setPendingGateways] = useState<Gateway[]>([]);
  const [selecting, setSelecting] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling per gateway pending
  useEffect(() => {
    const pollGateways = async () => {
      try {
        const response = await gatewayApi.getPendingGateways();
        setPendingGateways(response.gateways || []);
      } catch (err) {
        // Ignora errori di polling silenziosamente
        console.error('Errore polling gateways:', err);
      }
    };

    // Prima chiamata immediata
    pollGateways();

    // Polling ogni 3 secondi
    if (polling) {
      pollIntervalRef.current = setInterval(pollGateways, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [polling]);

  const handleSelectGateway = (gateway: Gateway) => {
    setSelecting(gateway.mac);
    setPolling(false);

    // Salva solo in locale, l'associazione avverrà a Step 5
    onGatewaySelected({
      mac: gateway.mac,
      ip: gateway.ip,
      version: gateway.version,
    });
  };

  const instructions = [
    { icon: RiRouterLine, text: 'Collega il Gateway alla corrente' },
    { icon: RiWifiLine, text: 'Cerca la rete WiFi "OmniaPi-XXXX"' },
    { icon: RiLockLine, text: 'Password: omniapi123' },
    { icon: RiGlobalLine, text: 'Apri 192.168.4.1 nel browser' },
    { icon: RiCheckLine, text: 'Inserisci il tuo WiFi e salva' },
  ];

  return (
    <Card variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-secondary/20">
          <RiRouterLine size={28} className="text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-copy">
            Collega il Gateway
          </h2>
          <p className="text-copy-lighter text-sm">
            Segui le istruzioni per configurare il Gateway
          </p>
        </div>
      </div>

      {/* Istruzioni */}
      <div className="space-y-3 mb-6">
        {instructions.map((instruction, index) => {
          const Icon = instruction.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-foreground"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={20} className="text-primary" />
              </div>
              <span className="text-copy text-sm">
                {index + 1}. {instruction.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stato Polling */}
      <Card variant="glass-dark" className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {polling ? (
              <RiLoader4Line size={24} className="text-warning animate-spin" />
            ) : (
              <RiCheckLine size={24} className="text-success" />
            )}
            <div>
              <p className="text-copy font-medium">
                {polling ? 'In attesa del Gateway...' : 'Gateway trovato!'}
              </p>
              <p className="text-copy-lighter text-xs">
                {pendingGateways.length > 0
                  ? `${pendingGateways.length} gateway disponibil${pendingGateways.length === 1 ? 'e' : 'i'}`
                  : 'Nessun gateway rilevato ancora'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPolling(true)}
            disabled={polling}
          >
            <RiRefreshLine size={18} />
          </Button>
        </div>
      </Card>

      {/* Lista Gateway Pending */}
      {pendingGateways.length > 0 && (
        <div className="space-y-3 mb-4">
          {pendingGateways.map((gateway) => (
            <Card
              key={gateway.mac}
              variant="glass"
              hover
              className="p-4 cursor-pointer"
              onClick={() => handleSelectGateway(gateway)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-success/20 flex-shrink-0">
                    <RiRouterLine size={20} className="text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-copy font-medium truncate">
                      Gateway {gateway.mac?.slice(-5)}
                    </p>
                    <p className="text-copy-lighter text-xs truncate">
                      MAC: {gateway.mac} {gateway.ip && `| IP: ${gateway.ip}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selecting === gateway.mac}
                  className="flex-shrink-0 whitespace-nowrap"
                >
                  {selecting === gateway.mac ? (
                    <RiLoader4Line className="animate-spin" />
                  ) : (
                    'Seleziona'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Bottoni */}
      <div className="flex justify-between pt-4">
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
      </div>
    </Card>
  );
};
