import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  RiCheckboxCircleLine,
  RiRouterLine,
  RiWifiLine,
  RiCpuLine,
} from 'react-icons/ri';

// ============================================
// STEP 3: GATEWAY CONNESSO
// ============================================

interface StepGatewayConnectedProps {
  gateway: {
    id?: number;
    mac?: string;
    ip?: string;
    version?: string;
    nome?: string;
  };
  onNext: () => void;
  onBack: () => void;
}

export const StepGatewayConnected = ({
  gateway,
  onNext,
  onBack,
}: StepGatewayConnectedProps) => {
  return (
    <Card variant="glass" className="p-6">
      {/* Header con animazione successo */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-4">
          <div className="p-4 rounded-full bg-success/20">
            <RiCheckboxCircleLine size={48} className="text-success" />
          </div>
          {/* Pulse animation */}
          <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
        </div>
        <h2 className="text-2xl font-bold text-copy mb-2">
          Gateway Connesso!
        </h2>
        <p className="text-copy-lighter">
          Il Gateway e stato associato con successo al tuo impianto
        </p>
      </div>

      {/* Info Gateway */}
      <Card variant="glass-dark" className="p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <RiRouterLine size={24} className="text-primary" />
          </div>
          <div>
            <p className="text-copy font-bold">Gateway OmniaPi</p>
            <p className="text-copy-lighter text-sm">Pronto per ricevere dispositivi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* MAC Address */}
          <div className="flex items-center gap-2">
            <RiCpuLine size={16} className="text-copy-lighter" />
            <div>
              <p className="text-copy-lighter text-xs">MAC Address</p>
              <p className="text-copy text-sm font-mono">
                {gateway.mac || 'N/A'}
              </p>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex items-center gap-2">
            <RiWifiLine size={16} className="text-copy-lighter" />
            <div>
              <p className="text-copy-lighter text-xs">Indirizzo IP</p>
              <p className="text-copy text-sm font-mono">
                {gateway.ip || 'In attesa...'}
              </p>
            </div>
          </div>

          {/* Firmware */}
          {gateway.version && (
            <div className="col-span-2 flex items-center gap-2">
              <RiCpuLine size={16} className="text-copy-lighter" />
              <div>
                <p className="text-copy-lighter text-xs">Firmware</p>
                <p className="text-copy text-sm">v{gateway.version}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Prossimo step info */}
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
        <p className="text-copy text-sm">
          <span className="font-bold">Prossimo passo:</span> Aggiungi i dispositivi
          (interruttori, luci, etc.) al tuo impianto. Il Gateway rileva automaticamente
          i nodi OmniaPi nella tua rete.
        </p>
      </div>

      {/* Bottoni */}
      <div className="flex flex-wrap justify-between gap-3 pt-4">
        <Button variant="glass" onClick={onBack} className="flex-shrink-0">
          Indietro
        </Button>
        <Button variant="primary" onClick={onNext} className="flex-shrink-0 whitespace-nowrap">
          Aggiungi Dispositivi
        </Button>
      </div>
    </Card>
  );
};
