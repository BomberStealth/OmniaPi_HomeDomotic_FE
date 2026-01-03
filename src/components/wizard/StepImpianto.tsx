import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RiHome4Line } from 'react-icons/ri';

// ============================================
// STEP 1: DATI IMPIANTO (solo salvataggio locale)
// L'impianto viene creato nel DB solo a Step 5
// ============================================

interface StepImpiantoProps {
  data: {
    nome: string;
    indirizzo: string;
    citta: string;
    cap: string;
  };
  onUpdate: (data: Partial<StepImpiantoProps['data']>) => void;
  onNext: () => void;
}

export const StepImpianto = ({ data, onUpdate, onNext }: StepImpiantoProps) => {
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (!data.nome.trim()) {
      setError('Inserisci il nome dell\'impianto');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    setError('');
    if (!validate()) return;

    // Salva solo in locale e procedi
    // L'impianto verrà creato nel DB solo a Step 5
    onNext();
  };

  return (
    <Card variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-primary/20">
          <RiHome4Line size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-copy">
            Crea il tuo Impianto
          </h2>
          <p className="text-copy-lighter text-sm">
            Inserisci le informazioni base del tuo impianto
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <Input
          label="Nome Impianto *"
          value={data.nome}
          onChange={(e) => onUpdate({ nome: e.target.value })}
          placeholder="es. Casa Principale"
          autoFocus
        />

        <Input
          label="Indirizzo (opzionale)"
          value={data.indirizzo}
          onChange={(e) => onUpdate({ indirizzo: e.target.value })}
          placeholder="es. Via Roma 123"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Citta (opzionale)"
            value={data.citta}
            onChange={(e) => onUpdate({ citta: e.target.value })}
            placeholder="es. Milano"
          />
          <Input
            label="CAP (opzionale)"
            value={data.cap}
            onChange={(e) => onUpdate({ cap: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            placeholder="es. 20100"
            maxLength={5}
          />
        </div>

        {error && (
          <p className="text-error text-sm">{error}</p>
        )}

        {/* Bottone */}
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="min-w-32"
          >
            Avanti
          </Button>
        </div>
      </div>
    </Card>
  );
};
