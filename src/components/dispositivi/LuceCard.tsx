import { useState } from 'react';
import { Lightbulb, Minus, Plus } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Dispositivo, ConfigLuce } from '@/types';
import { dispositiviApi } from '@/services/api';

// ============================================
// LUCE CARD COMPONENT
// ============================================

interface LuceCardProps {
  dispositivo: Dispositivo;
  onUpdate?: () => void;
}

export const LuceCard = ({ dispositivo, onUpdate }: LuceCardProps) => {
  const config = dispositivo.configurazione as ConfigLuce;
  const [livello, setLivello] = useState(config.livello_corrente || 100);

  const toggleLuce = async () => {
    try {
      await dispositiviApi.control(dispositivo.id, {
        accesa: !config.accesa,
        newConfig: { ...config, accesa: !config.accesa }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Errore toggle luce:', error);
    }
  };

  const changeLivello = async (newLivello: number) => {
    if (!config.dimmerabile) return;

    setLivello(newLivello);
    try {
      await dispositiviApi.control(dispositivo.id, {
        livello: newLivello,
        newConfig: { ...config, livello_corrente: newLivello }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Errore cambio livello:', error);
    }
  };

  return (
    <Card variant="glass" hover className="relative overflow-hidden">
      {/* Status indicator */}
      <div
        className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
          config.accesa ? 'bg-warning animate-pulse' : 'bg-copy-lighter'
        }`}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl ${
              config.accesa ? 'bg-warning bg-opacity-20' : 'bg-foreground'
            }`}
          >
            <Lightbulb
              size={24}
              className={config.accesa ? 'text-warning' : 'text-copy-lighter'}
            />
          </div>
          <div>
            <h3 className="font-semibold text-copy">{dispositivo.nome}</h3>
            <p className="text-xs text-copy-lighter">{dispositivo.stato}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <Button
          variant={config.accesa ? 'primary' : 'glass'}
          fullWidth
          onClick={toggleLuce}
        >
          {config.accesa ? 'Spegni' : 'Accendi'}
        </Button>

        {config.dimmerabile && config.accesa && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeLivello(Math.max(0, livello - 10))}
              className="p-2 glass rounded-lg hover:bg-opacity-20"
            >
              <Minus size={16} />
            </button>

            <div className="flex-1 glass rounded-lg px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-copy-lighter">Intensità</span>
                <span className="text-xs text-copy">{livello}%</span>
              </div>
              <div className="w-full h-2 bg-foreground rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-warning transition-all"
                  style={{ width: `${livello}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => changeLivello(Math.min(100, livello + 10))}
              className="p-2 glass rounded-lg hover:bg-opacity-20"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
