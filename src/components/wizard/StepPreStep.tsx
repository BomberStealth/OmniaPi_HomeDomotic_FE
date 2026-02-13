import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiRouterLine,
  RiCheckboxCircleLine,
  RiSettingsLine,
  RiPlugLine,
  RiWifiLine,
} from 'react-icons/ri';

// ============================================
// PRE-STEP (Step 0): "Il gateway è già in rete?"
// Due opzioni: SÌ → Step 1, NO → istruzioni collegamento
// ============================================

interface StepPreStepProps {
  onReady: () => void;
}

export const StepPreStep = ({ onReady }: StepPreStepProps) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const { modeColors, colors } = useThemeColor();

  if (showInstructions) {
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
            <RiSettingsLine
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
              Come collegare il gateway
            </h2>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
              Segui una delle opzioni seguenti
            </p>
          </div>
        </div>

        {/* OPZIONE A - Cavo Ethernet */}
        <Card
          variant="glass-dark"
          style={{
            padding: spacing.md,
            marginBottom: spacing.md,
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
          }}
        >
          <div className="flex items-center" style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
            <RiPlugLine style={{ color: '#22c55e', width: 20, height: 20 }} />
            <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              OPZIONE A — Cavo di rete (consigliato)
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {[
              'Collega il gateway alla corrente',
              'Collega il cavo di rete (Ethernet) al router',
              'Attendi 30 secondi che il LED verde si accenda',
              'Clicca "Pronto, ho collegato il gateway"',
            ].map((text, index) => (
              <div
                key={index}
                className="flex items-center"
                style={{
                  gap: spacing.sm,
                  padding: spacing.xs,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.sm,
                    background: 'rgba(34, 197, 94, 0.15)',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: '#22c55e' }}>
                    {index + 1}
                  </span>
                </div>
                <span style={{ fontSize: fontSize.sm, color: modeColors.textPrimary }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* OPZIONE B - WiFi */}
        <Card
          variant="glass-dark"
          style={{
            padding: spacing.md,
            marginBottom: spacing.lg,
            background: `${colors.accent}08`,
            border: `1px solid ${colors.accent}30`,
          }}
        >
          <div className="flex items-center" style={{ gap: spacing.xs, marginBottom: spacing.sm }}>
            <RiWifiLine style={{ color: colors.accent, width: 20, height: 20 }} />
            <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              OPZIONE B — WiFi
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            {[
              'Collega il gateway alla corrente',
              'Dal telefono, vai nelle impostazioni WiFi',
              'Cerca e collegati alla rete "OmniaPi-XXXX" (password: omniapi123)',
              'Si aprirà automaticamente una pagina di configurazione',
              'Seleziona la rete WiFi di casa e inserisci la password',
              'Il gateway si riavvia e si collega al WiFi',
              'Ricollega il telefono al WiFi di casa',
              'Clicca "Pronto, ho collegato il gateway"',
            ].map((text, index) => (
              <div
                key={index}
                className="flex items-center"
                style={{
                  gap: spacing.sm,
                  padding: spacing.xs,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.sm,
                    background: `${colors.accent}15`,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colors.accent }}>
                    {index + 1}
                  </span>
                </div>
                <span style={{ fontSize: fontSize.sm, color: modeColors.textPrimary }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bottone */}
        <div className="flex justify-center">
          <Button variant="primary" onClick={onReady}>
            Pronto, ho collegato il gateway
          </Button>
        </div>
      </Card>
    );
  }

  // Schermata iniziale con due opzioni
  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div
        className="flex flex-col items-center text-center"
        style={{ marginBottom: spacing.lg }}
      >
        <div
          style={{
            padding: spacing.md,
            borderRadius: '50%',
            background: `${colors.accent}20`,
            marginBottom: spacing.sm,
          }}
        >
          <RiRouterLine
            style={{
              width: 'clamp(36px, 10vw, 48px)',
              height: 'clamp(36px, 10vw, 48px)',
              color: colors.accent,
            }}
          />
        </div>
        <h2
          style={{
            fontSize: fontSize.xl,
            fontWeight: 'bold',
            color: modeColors.textPrimary,
            marginBottom: spacing.xs,
          }}
        >
          Il gateway è già in rete?
        </h2>
        <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
          Il gateway deve essere collegato alla stessa rete del tuo dispositivo
        </p>
      </div>

      {/* Opzioni */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {/* SÌ */}
        <button
          onClick={onReady}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            background: 'rgba(34, 197, 94, 0.1)',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              padding: spacing.sm,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
              flexShrink: 0,
            }}
          >
            <RiCheckboxCircleLine
              style={{
                width: 'clamp(24px, 7vw, 32px)',
                height: 'clamp(24px, 7vw, 32px)',
                color: '#22c55e',
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: fontSize.md, fontWeight: 'bold', color: modeColors.textPrimary }}>
              Sì, è già collegato
            </p>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
              Il gateway è acceso e connesso alla rete
            </p>
          </div>
        </button>

        {/* NO */}
        <button
          onClick={() => setShowInstructions(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            padding: spacing.md,
            borderRadius: radius.lg,
            background: `${colors.accent}08`,
            border: `2px solid ${colors.accent}30`,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              padding: spacing.sm,
              borderRadius: '50%',
              background: `${colors.accent}20`,
              flexShrink: 0,
            }}
          >
            <RiSettingsLine
              style={{
                width: 'clamp(24px, 7vw, 32px)',
                height: 'clamp(24px, 7vw, 32px)',
                color: colors.accent,
              }}
            />
          </div>
          <div>
            <p style={{ fontSize: fontSize.md, fontWeight: 'bold', color: modeColors.textPrimary }}>
              No, devo configurarlo
            </p>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
              Ho bisogno delle istruzioni per collegarlo
            </p>
          </div>
        </button>
      </div>
    </Card>
  );
};
