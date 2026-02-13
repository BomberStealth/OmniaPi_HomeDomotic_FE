import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { gatewayApi, DiscoveredGateway } from '@/services/gatewayApi';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiRouterLine,
  RiRefreshLine,
  RiCheckLine,
  RiLoader4Line,
  RiCloseLine,
  RiLinkM,
  RiCpuLine,
  RiWifiLine,
  RiAlertLine,
} from 'react-icons/ri';

// ============================================
// STEP 2: CERCA E SELEZIONA GATEWAY
// - Chiama GET /api/gateway/discover (match IP pubblico)
// - Polling automatico ogni 5 secondi
// - L'utente DEVE selezionare un gateway libero
// ============================================

interface StepGatewayProps {
  onGatewaySelected: (gateway: { mac: string; ip: string; version: string }) => void;
  onBack: () => void;
}

export const StepGateway = ({ onGatewaySelected, onBack }: StepGatewayProps) => {
  const [gateways, setGateways] = useState<DiscoveredGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoadDone, setFirstLoadDone] = useState(false);
  const { modeColors, colors } = useThemeColor();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchGateways = useCallback(async (isFirstLoad = false) => {
    if (isFirstLoad) setLoading(true);
    try {
      const res = await gatewayApi.discoverGateways();
      setGateways(res.gateways);
    } catch (err) {
      console.error('[StepGateway] Discover error:', err);
    } finally {
      if (isFirstLoad) {
        setLoading(false);
        setFirstLoadDone(true);
      }
    }
  }, []);

  // First load + polling every 5s
  useEffect(() => {
    fetchGateways(true);
    pollingRef.current = setInterval(() => fetchGateways(false), 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchGateways]);

  const handleSelect = (gw: DiscoveredGateway) => {
    if (!gw.available) return;
    onGatewaySelected({ mac: gw.mac, ip: gw.ip, version: gw.version });
  };

  const handleRetry = () => {
    fetchGateways(true);
  };

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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
            Cerca Gateway
          </h2>
          <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
            Seleziona il gateway dalla tua rete
          </p>
        </div>
      </div>

      {/* Loading state (solo primo caricamento) */}
      {loading && (
        <div
          className="flex flex-col items-center justify-center"
          style={{ padding: spacing.lg }}
        >
          <div
            style={{
              position: 'relative',
              width: 80,
              height: 80,
              marginBottom: spacing.md,
            }}
          >
            <RiLoader4Line
              className="animate-spin"
              style={{
                width: 80,
                height: 80,
                color: colors.accent,
                opacity: 0.3,
              }}
            />
            <RiRouterLine
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                color: colors.accent,
              }}
            />
          </div>
          <p
            style={{
              fontSize: fontSize.md,
              fontWeight: 600,
              color: modeColors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Sto cercando gateway nella tua rete...
          </p>
          <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
            Potrebbe richiedere alcuni secondi
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && firstLoadDone && (
        <>
          {gateways.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md }}>
              {gateways.map((gw) => (
                <Card
                  key={gw.mac}
                  variant="glass-dark"
                  style={{
                    padding: spacing.md,
                    background: gw.available
                      ? 'rgba(34, 197, 94, 0.08)'
                      : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${
                      gw.available
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(239, 68, 68, 0.3)'
                    }`,
                    opacity: gw.available ? 1 : 0.7,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center" style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
                        {gw.available ? (
                          <RiCheckLine style={{ width: 16, height: 16, color: '#22c55e' }} />
                        ) : (
                          <RiCloseLine style={{ width: 16, height: 16, color: '#ef4444' }} />
                        )}
                        <span
                          style={{
                            fontSize: fontSize.sm,
                            fontWeight: 600,
                            color: gw.available ? '#22c55e' : '#ef4444',
                          }}
                        >
                          {gw.available ? 'Disponibile' : 'GIA\' CONFIGURATO'}
                        </span>
                      </div>

                      {/* Info */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: spacing.xs,
                        }}
                      >
                        <div className="flex items-center" style={{ gap: spacing.xs }}>
                          <RiCpuLine style={{ width: 14, height: 14, color: modeColors.textSecondary, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '10px', color: modeColors.textSecondary }}>MAC</p>
                            <p className="truncate font-mono" style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}>
                              {gw.mac}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center" style={{ gap: spacing.xs }}>
                          <RiWifiLine style={{ width: 14, height: 14, color: modeColors.textSecondary, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: '10px', color: modeColors.textSecondary }}>IP</p>
                            <p className="truncate font-mono" style={{ fontSize: fontSize.xs, color: modeColors.textPrimary }}>
                              {gw.ip}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Version + Uptime + Nodi */}
                      <div style={{ display: 'flex', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' }}>
                        {gw.version && (
                          <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                            Firmware: v{gw.version}
                          </p>
                        )}
                        {gw.uptime > 0 && (
                          <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                            Uptime: {formatUptime(gw.uptime)}
                          </p>
                        )}
                        {gw.nodes_count > 0 && (
                          <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                            Nodi: {gw.nodes_count}
                          </p>
                        )}
                      </div>

                      {!gw.available && gw.impianto_nome && (
                        <p style={{ fontSize: fontSize.xs, color: '#ef4444', marginTop: 4 }}>
                          Associato a: {gw.impianto_nome}
                        </p>
                      )}
                    </div>

                    {gw.available && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSelect(gw)}
                        style={{ flexShrink: 0, marginLeft: spacing.sm }}
                      >
                        <RiLinkM size={14} />
                        <span style={{ marginLeft: 4 }}>Seleziona</span>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* Nessun gateway trovato */
            <Card
              variant="glass-dark"
              style={{
                padding: spacing.lg,
                marginBottom: spacing.md,
                textAlign: 'center',
              }}
            >
              <RiAlertLine
                style={{
                  width: 40,
                  height: 40,
                  color: '#eab308',
                  margin: '0 auto',
                  marginBottom: spacing.sm,
                }}
              />
              <p
                style={{
                  fontSize: fontSize.md,
                  fontWeight: 600,
                  color: modeColors.textPrimary,
                  marginBottom: spacing.xs,
                }}
              >
                Nessun gateway trovato
              </p>
              <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, marginBottom: spacing.md }}>
                Verifica che il gateway sia acceso e collegato alla rete.
              </p>
              <Button variant="glass" onClick={handleRetry}>
                <RiRefreshLine size={14} />
                <span style={{ marginLeft: 4 }}>Riprova</span>
              </Button>
            </Card>
          )}
        </>
      )}

      {/* Bottoni */}
      <div
        className="flex justify-between"
        style={{ paddingTop: spacing.sm }}
      >
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
        {!loading && gateways.length > 0 && (
          <Button variant="glass" onClick={handleRetry}>
            <RiRefreshLine size={14} />
            <span style={{ marginLeft: 4 }}>Aggiorna</span>
          </Button>
        )}
      </div>
    </Card>
  );
};
