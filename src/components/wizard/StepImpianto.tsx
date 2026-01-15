import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { RiHome4Line } from 'react-icons/ri';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';

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
  const { modeColors, colors } = useThemeColor();

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
    onNext();
  };

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div
        className="flex items-center"
        style={{ gap: spacing.sm, marginBottom: spacing.md }}
      >
        <div
          style={{
            padding: spacing.sm,
            borderRadius: radius.md,
            background: `${colors.accent}20`,
          }}
        >
          <RiHome4Line
            style={{
              width: 'clamp(20px, 6vw, 28px)',
              height: 'clamp(20px, 6vw, 28px)',
              color: colors.accent,
            }}
          />
        </div>
        <div>
          <h2
            style={{
              fontSize: fontSize.lg,
              fontWeight: 'bold',
              color: modeColors.textPrimary,
            }}
          >
            Crea il tuo Impianto
          </h2>
          <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
            Inserisci le informazioni base
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.sm,
          }}
        >
          <Input
            label="Città"
            value={data.citta}
            onChange={(e) => onUpdate({ citta: e.target.value })}
            placeholder="es. Milano"
          />
          <Input
            label="CAP"
            value={data.cap}
            onChange={(e) => onUpdate({ cap: e.target.value.replace(/\D/g, '').slice(0, 5) })}
            placeholder="es. 20100"
            maxLength={5}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: fontSize.xs }}>{error}</p>
        )}

        {/* Bottone */}
        <div
          className="flex justify-end"
          style={{ paddingTop: spacing.sm }}
        >
          <Button variant="primary" onClick={handleSubmit}>
            Avanti
          </Button>
        </div>
      </div>
    </Card>
  );
};
