import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
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
  const { modeColors, colors } = useThemeColor();

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header con animazione successo */}
      <div
        className="flex flex-col items-center text-center"
        style={{ marginBottom: spacing.lg }}
      >
        <div className="relative" style={{ marginBottom: spacing.sm }}>
          <div
            style={{
              padding: spacing.md,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
            }}
          >
            <RiCheckboxCircleLine
              style={{
                width: 'clamp(36px, 10vw, 48px)',
                height: 'clamp(36px, 10vw, 48px)',
                color: '#22c55e',
              }}
            />
          </div>
          {/* Pulse animation */}
          <div
            className="absolute inset-0 animate-ping"
            style={{
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.2)',
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
          Gateway Connesso!
        </h2>
        <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
          Associato con successo al tuo impianto
        </p>
      </div>

      {/* Info Gateway */}
      <Card variant="glass-dark" style={{ padding: spacing.sm, marginBottom: spacing.md }}>
        <div
          className="flex items-center"
          style={{ gap: spacing.sm, marginBottom: spacing.sm }}
        >
          <div
            style={{
              padding: spacing.xs,
              borderRadius: radius.md,
              background: `${colors.accent}20`,
            }}
          >
            <RiRouterLine
              style={{
                width: 'clamp(18px, 5vw, 24px)',
                height: 'clamp(18px, 5vw, 24px)',
                color: colors.accent,
              }}
            />
          </div>
          <div>
            <p
              style={{
                fontWeight: 'bold',
                fontSize: fontSize.md,
                color: modeColors.textPrimary,
              }}
            >
              Gateway OmniaPi
            </p>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
              Pronto per ricevere dispositivi
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.sm,
          }}
        >
          {/* MAC Address */}
          <div className="flex items-center" style={{ gap: spacing.xs }}>
            <RiCpuLine
              style={{
                width: 14,
                height: 14,
                color: modeColors.textSecondary,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                MAC
              </p>
              <p
                className="truncate font-mono"
                style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}
              >
                {gateway.mac || 'N/A'}
              </p>
            </div>
          </div>

          {/* IP Address */}
          <div className="flex items-center" style={{ gap: spacing.xs }}>
            <RiWifiLine
              style={{
                width: 14,
                height: 14,
                color: modeColors.textSecondary,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                IP
              </p>
              <p
                className="truncate font-mono"
                style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}
              >
                {gateway.ip || 'In attesa...'}
              </p>
            </div>
          </div>

          {/* Firmware */}
          {gateway.version && (
            <div
              className="flex items-center col-span-2"
              style={{ gap: spacing.xs }}
            >
              <RiCpuLine
                style={{
                  width: 14,
                  height: 14,
                  color: modeColors.textSecondary,
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                  Firmware
                </p>
                <p style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}>
                  v{gateway.version}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Prossimo step info */}
      <div
        style={{
          padding: spacing.sm,
          borderRadius: radius.md,
          background: `${colors.accent}10`,
          border: `1px solid ${colors.accent}20`,
          marginBottom: spacing.md,
        }}
      >
        <p style={{ fontSize: fontSize.sm, color: modeColors.textPrimary }}>
          <span style={{ fontWeight: 'bold' }}>Prossimo passo:</span> Aggiungi i dispositivi al tuo impianto.
        </p>
      </div>

      {/* Bottoni */}
      <div
        className="flex flex-wrap justify-between"
        style={{ gap: spacing.sm, paddingTop: spacing.sm }}
      >
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
        <Button variant="primary" onClick={onNext}>
          Aggiungi Dispositivi
        </Button>
      </div>
    </Card>
  );
};
