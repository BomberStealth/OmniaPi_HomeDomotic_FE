import { useState } from 'react';
import { Thermometer, Minus, Plus, Power } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Dispositivo, ConfigTermostato } from '@/types';
import { dispositiviApi } from '@/services/api';

// ============================================
// TERMOSTATO CARD COMPONENT
// ============================================

interface TermostatoCardProps {
  dispositivo: Dispositivo;
  onUpdate?: () => void;
}

export const TermostatoCard = ({ dispositivo, onUpdate }: TermostatoCardProps) => {
  const config = dispositivo.configurazione as ConfigTermostato;
  const [target, setTarget] = useState(config.temperatura_target);

  const changeTemp = async (newTemp: number) => {
    setTarget(newTemp);
    try {
      await dispositiviApi.control(dispositivo.id, {
        temperatura_target: newTemp,
        newConfig: { ...config, temperatura_target: newTemp }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Errore cambio temperatura:', error);
    }
  };

  const togglePower = async () => {
    try {
      await dispositiviApi.control(dispositivo.id, {
        acceso: !config.acceso,
        newConfig: { ...config, acceso: !config.acceso }
      });
      onUpdate?.();
    } catch (error) {
      console.error('Errore toggle termostato:', error);
    }
  };

  const getStatusColor = () => {
    if (!config.acceso) return 'copy-lighter';
    return config.modalita === 'riscaldamento' ? 'error' : 'success';
  };

  return (
    <Card variant="glass" hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl bg-${getStatusColor()} bg-opacity-20`}>
            <Thermometer size={24} className={`text-${getStatusColor()}`} />
          </div>
          <div>
            <h3 className="font-semibold text-copy">{dispositivo.nome}</h3>
            <p className="text-xs text-copy-lighter capitalize">{config.modalita}</p>
          </div>
        </div>
        <button
          onClick={togglePower}
          className={`p-2 rounded-lg ${
            config.acceso ? 'bg-primary text-white' : 'glass'
          }`}
        >
          <Power size={16} />
        </button>
      </div>

      {/* Temperature Display */}
      <div className="mb-4 glass rounded-lg p-6 text-center">
        <div className="text-5xl font-bold text-copy mb-2">
          {config.temperatura_corrente}°
        </div>
        <div className="text-sm text-copy-lighter">Temperatura attuale</div>
      </div>

      {/* Target Temperature */}
      {config.acceso && (
        <div className="space-y-3">
          <div className="flex items-center justify-between glass rounded-lg px-4 py-3">
            <button
              onClick={() => changeTemp(target - 0.5)}
              className="p-2 hover:bg-foreground rounded-lg transition-colors"
            >
              <Minus size={20} />
            </button>

            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{target}°</div>
              <div className="text-xs text-copy-lighter">Target</div>
            </div>

            <button
              onClick={() => changeTemp(target + 0.5)}
              className="p-2 hover:bg-foreground rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {['riscaldamento', 'raffreddamento', 'auto'].map((mode) => (
              <button
                key={mode}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  config.modalita === mode
                    ? 'bg-primary text-white'
                    : 'glass hover:bg-opacity-20'
                }`}
              >
                {mode === 'riscaldamento' ? '🔥' : mode === 'raffreddamento' ? '❄️' : '🔄'}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
