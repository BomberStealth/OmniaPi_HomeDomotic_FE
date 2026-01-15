import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { gatewayApi, Gateway } from '@/services/gatewayApi';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
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
  const { modeColors, isDarkMode, colors } = useThemeColor();

  useEffect(() => {
    const pollGateways = async () => {
      try {
        const response = await gatewayApi.getPendingGateways();
        setPendingGateways(response.gateways || []);
      } catch (err) {
        console.error('Errore polling gateways:', err);
      }
    };

    pollGateways();

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
          <RiRouterLine
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
            Collega il Gateway
          </h2>
          <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
            Segui le istruzioni
          </p>
        </div>
      </div>

      {/* Istruzioni */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
          marginBottom: spacing.md,
        }}
      >
        {instructions.map((instruction, index) => {
          const Icon = instruction.icon;
          return (
            <div
              key={index}
              className="flex items-center"
              style={{
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: radius.md,
                background: isDarkMode ? modeColors.bgSecondary : '#f0f0f0',
                border: `1px solid ${modeColors.border}`,
              }}
            >
              <div
                style={{
                  padding: spacing.xs,
                  borderRadius: radius.sm,
                  background: `${colors.accent}15`,
                  flexShrink: 0,
                }}
              >
                <Icon
                  style={{
                    width: 'clamp(14px, 4vw, 18px)',
                    height: 'clamp(14px, 4vw, 18px)',
                    color: colors.accent,
                  }}
                />
              </div>
              <span style={{ fontSize: fontSize.sm, color: modeColors.textPrimary }}>
                {index + 1}. {instruction.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stato Polling */}
      <Card variant="glass-dark" style={{ padding: spacing.sm, marginBottom: spacing.sm }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center" style={{ gap: spacing.sm }}>
            {polling ? (
              <RiLoader4Line
                className="animate-spin"
                style={{
                  width: 'clamp(18px, 5vw, 24px)',
                  height: 'clamp(18px, 5vw, 24px)',
                  color: '#eab308',
                }}
              />
            ) : (
              <RiCheckLine
                style={{
                  width: 'clamp(18px, 5vw, 24px)',
                  height: 'clamp(18px, 5vw, 24px)',
                  color: '#22c55e',
                }}
              />
            )}
            <div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: fontSize.sm,
                  color: modeColors.textPrimary,
                }}
              >
                {polling ? 'In attesa del Gateway...' : 'Gateway trovato!'}
              </p>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                {pendingGateways.length > 0
                  ? `${pendingGateways.length} gateway disponibil${pendingGateways.length === 1 ? 'e' : 'i'}`
                  : 'Nessun gateway rilevato'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPolling(true)} disabled={polling}>
            <RiRefreshLine size={16} />
          </Button>
        </div>
      </Card>

      {/* Lista Gateway Pending */}
      {pendingGateways.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.sm }}>
          {pendingGateways.map((gateway) => (
            <div
              key={gateway.mac}
              onClick={() => handleSelectGateway(gateway)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.sm,
                borderRadius: radius.md,
                background: modeColors.bgCard,
                border: `1px solid ${modeColors.border}`,
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center" style={{ gap: spacing.sm, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    padding: spacing.xs,
                    borderRadius: radius.sm,
                    background: 'rgba(34, 197, 94, 0.2)',
                    flexShrink: 0,
                  }}
                >
                  <RiRouterLine style={{ width: 18, height: 18, color: '#22c55e' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    className="truncate"
                    style={{
                      fontWeight: 500,
                      fontSize: fontSize.sm,
                      color: modeColors.textPrimary,
                    }}
                  >
                    Gateway {gateway.mac?.slice(-5)}
                  </p>
                  <p
                    className="truncate"
                    style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}
                  >
                    {gateway.ip || gateway.mac}
                  </p>
                </div>
              </div>
              <Button variant="primary" size="sm" disabled={selecting === gateway.mac}>
                {selecting === gateway.mac ? <RiLoader4Line className="animate-spin" /> : 'Seleziona'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Bottoni */}
      <div className="flex justify-between" style={{ paddingTop: spacing.sm }}>
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
      </div>
    </Card>
  );
};
