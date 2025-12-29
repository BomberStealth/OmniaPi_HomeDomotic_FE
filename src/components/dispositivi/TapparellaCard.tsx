import { RiLayoutLine, RiArrowUpSLine, RiArrowDownSLine, RiStopLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Dispositivo, ConfigTapparella } from '@/types';
import { dispositiviApi } from '@/services/api';

// ============================================
// TAPPARELLA CARD COMPONENT
// ============================================

interface TapparellaCardProps {
  dispositivo: Dispositivo;
  onUpdate?: () => void;
}

export const TapparellaCard = ({ dispositivo, onUpdate }: TapparellaCardProps) => {
  const config = dispositivo.configurazione as ConfigTapparella;

  const handleAction = async (azione: 'apri' | 'chiudi' | 'stop', posizione?: number) => {
    try {
      await dispositiviApi.control(dispositivo.id, {
        azione,
        posizione,
        newConfig: {
          ...config,
          in_movimento: azione !== 'stop',
          posizione_corrente: posizione || config.posizione_corrente
        }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Errore controllo tapparella:', error);
    }
  };

  return (
    <Card variant="glass" hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-secondary bg-opacity-20">
            <RiLayoutLine size={24} className="text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-copy">{dispositivo.nome}</h3>
            <p className="text-xs text-copy-lighter">
              {config.in_movimento ? 'In movimento...' : `${config.posizione_corrente}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Posizione visuale */}
      <div className="mb-4 glass rounded-lg p-4">
        <div className="relative h-32 bg-foreground rounded-lg overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-gradient-to-t from-secondary to-secondary-light transition-all duration-500"
            style={{ height: `${config.posizione_corrente}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-copy drop-shadow-lg">
              {config.posizione_corrente}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="glass"
          size="sm"
          onClick={() => handleAction('apri', 100)}
        >
          <RiArrowUpSLine size={20} />
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => handleAction('stop')}
        >
          <RiStopLine size={20} />
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => handleAction('chiudi', 0)}
        >
          <RiArrowDownSLine size={20} />
        </Button>
      </div>
    </Card>
  );
};
