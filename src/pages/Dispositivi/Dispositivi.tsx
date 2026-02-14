import { useState, useMemo, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { UnifiedDeviceCard, GatewayCard } from '@/components/devices';
import { AddDeviceModal } from '@/components/dispositivi';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useDispositiviStore, Dispositivo } from '@/store/dispositiviStore';
import { useOmniapiStore } from '@/store/omniapiStore';
import { usePermessiImpianto } from '@/hooks/usePermessiImpianto';
import { omniapiApi } from '@/services/omniapiApi';
import { tasmotaApi } from '@/services/api';
import { gatewayApi, Gateway } from '@/services/gatewayApi';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine,
  RiAddLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiLoader4Line,
} from 'react-icons/ri';
import { toast } from '@/utils/toast';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { ConfirmPopup } from '@/components/ui/ConfirmPopup';

// ============================================
// DISPOSITIVI PAGE - Same system as Dashboard
// Uses useDispositiviStore (unified with Dashboard)
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};


export const Dispositivi = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors, modeColors } = useThemeColor();

  // Use the SAME store as Dashboard
  const { dispositivi, loading, updatePowerState, updateLedState, fetchDispositivi } = useDispositiviStore();
  const { setPending, isDevicePending } = useOmniapiStore();

  // Permessi utente sull'impianto corrente
  const { permessi, canControl, canViewState } = usePermessiImpianto(impiantoCorrente?.id || null);

  // Filtra dispositivi in base ai permessi stanze
  const dispositiviFiltrati = useMemo(() => {
    if (!dispositivi || dispositivi.length === 0) return [];
    if (permessi.stanze_abilitate === null) return dispositivi; // Accesso completo
    // Mostra solo dispositivi delle stanze abilitate + quelli non assegnati
    return dispositivi.filter((d: Dispositivo) =>
      !d.stanza_id || permessi.stanze_abilitate!.includes(d.stanza_id)
    );
  }, [dispositivi, permessi.stanze_abilitate]);

  const debounceTimers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Dispositivo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [gatewayBusy, setGatewayBusy] = useState(false);

  // Fetch gateway info
  useEffect(() => {
    const fetchGateway = async () => {
      if (!impiantoCorrente?.id) {
        setGateway(null);
        setGatewayLoading(false);
        return;
      }

      try {
        const response = await gatewayApi.getImpiantoGateway(impiantoCorrente.id);
        setGateway(response.gateway);
      } catch (error) {
        console.error('Error fetching gateway:', error);
        setGateway(null);
      } finally {
        setGatewayLoading(false);
      }
    };

    fetchGateway();
  }, [impiantoCorrente?.id]);

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);

  // Top edge highlight dinamico
  const topHighlight = {
    position: 'absolute' as const,
    top: 0,
    left: '25%',
    right: '25%',
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
    pointerEvents: 'none' as const,
  };

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => { debounceTimers.current.forEach(t => clearTimeout(t)); };
  }, []);

  // Toggle device with 300ms trailing debounce (same logic as Dashboard)
  const toggleDevice = (dispositivo: Dispositivo) => {
    if (!canControl) {
      toast.error('Non hai i permessi per controllare i dispositivi');
      return;
    }

    const newState = !dispositivo.power_state;

    // Optimistic UI update immediately
    updatePowerState(dispositivo.id, newState);
    if (dispositivo.device_type === 'omniapi_led') {
      updateLedState(dispositivo.id, { led_power: newState });
    }

    // Set pending IMMEDIATELY for spinner (before debounce)
    if (dispositivo.device_type === 'omniapi_node' && dispositivo.mac_address) {
      console.log('[TOGGLE] setPending Dispositivi:', dispositivo.mac_address, 'type:', dispositivo.device_type);
      setPending(dispositivo.mac_address, 1);
    }

    // Cancel previous timer for this device
    const existing = debounceTimers.current.get(dispositivo.id);
    if (existing) clearTimeout(existing);

    // 300ms trailing debounce — only final state sends API call
    debounceTimers.current.set(dispositivo.id, setTimeout(async () => {
      debounceTimers.current.delete(dispositivo.id);
      const current = useDispositiviStore.getState().dispositivi.find(d => d.id === dispositivo.id);
      if (!current) return;
      const targetState = !!current.power_state;

      try {
        if (dispositivo.device_type === 'omniapi_led') {
          await omniapiApi.sendLedCommand(dispositivo.mac_address!, targetState ? 'on' : 'off');
        } else if (dispositivo.device_type === 'omniapi_node') {
          await omniapiApi.controlNode(dispositivo.id, 1, targetState ? 'on' : 'off');
        } else {
          await tasmotaApi.controlDispositivo(dispositivo.id, targetState ? 'ON' : 'OFF');
        }
      } catch (err: any) {
        // Revert on error + clear pending
        updatePowerState(dispositivo.id, !targetState);
        if (dispositivo.device_type === 'omniapi_led') updateLedState(dispositivo.id, { led_power: !targetState });
        if (dispositivo.mac_address) useOmniapiStore.getState().clearPending(dispositivo.mac_address);
        toast.error(err.response?.data?.blocked ? 'Bloccato' : 'Errore');
      }
    }, 300));
  };

  // Handle LED effect change
  const handleLedEffectChange = async (dispositivo: Dispositivo, effect: number) => {
    if (!canControl) {
      toast.error('Non hai i permessi per controllare i dispositivi');
      return;
    }
    if (!dispositivo.mac_address) return;

    try {
      await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_effect', { effect });
      updateLedState(dispositivo.id, { led_effect: effect });
    } catch (error) {
      console.error('Errore effetto LED:', error);
      toast.error('Errore LED');
    }
  };

  // Handle LED speed change
  const handleLedSpeedChange = async (dispositivo: Dispositivo, speed: number) => {
    if (!canControl) {
      toast.error('Non hai i permessi per controllare i dispositivi');
      return;
    }
    if (!dispositivo.mac_address) return;

    try {
      await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_speed', { speed });
      updateLedState(dispositivo.id, { led_speed: speed });
    } catch (error) {
      console.error('Errore speed LED:', error);
      toast.error('Errore LED');
    }
  };

  // Handle LED brightness/color change - sends SEPARATE commands
  const handleLedChange = async (dispositivo: Dispositivo, color: { r: number; g: number; b: number }, brightness: number) => {
    if (!canControl) {
      toast.error('Non hai i permessi per controllare i dispositivi');
      return;
    }
    if (!dispositivo.mac_address) return;

    // Determine what changed
    const colorChanged = color.r !== dispositivo.led_r || color.g !== dispositivo.led_g || color.b !== dispositivo.led_b;
    const brightnessChanged = brightness !== dispositivo.led_brightness;

    try {
      // Send separate commands for color and brightness
      if (colorChanged) {
        await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_color', {
          r: color.r,
          g: color.g,
          b: color.b
        });
      }
      if (brightnessChanged) {
        await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_brightness', { brightness });
      }
      updateLedState(dispositivo.id, {
        led_r: color.r,
        led_g: color.g,
        led_b: color.b,
        led_brightness: brightness
      });
    } catch (error) {
      console.error('Errore controllo LED:', error);
      toast.error('Errore LED');
    }
  };

  // Handle LED num_leds change
  const handleLedNumLedsChange = async (dispositivo: Dispositivo, numLeds: number) => {
    if (!dispositivo.mac_address) return;

    try {
      await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_num_leds', { num_leds: numLeds });
      toast.success(`LED: ${numLeds}`);
    } catch (error) {
      console.error('Errore num_leds LED:', error);
      toast.error('Errore LED');
    }
  };

  // Handle LED custom effect (3 colors)
  const handleLedCustomEffect = async (dispositivo: Dispositivo, colors: { r: number; g: number; b: number }[]) => {
    if (!dispositivo.mac_address) return;

    try {
      await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_custom_effect', { colors });
      toast.success('Custom Rainbow applicato');
    } catch (error) {
      console.error('Errore custom effect LED:', error);
      toast.error('Errore LED');
    }
  };

  // Refresh devices
  const handleRefresh = async () => {
    if (!impiantoCorrente?.id) return;
    setRefreshing(true);
    try {
      await fetchDispositivi(impiantoCorrente.id);
      toast.success('Aggiornato');
    } catch {
      toast.error('Errore');
    } finally {
      setRefreshing(false);
    }
  };

  // Delete device
  const handleDeleteDevice = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setGatewayBusy(true);
    try {
      const res = await omniapiApi.unregisterNode(deleteTarget.id);
      if ((res as any).gateway_confirmed === false) {
        toast.success(`${deleteTarget.nome} eliminato. Il gateway potrebbe impiegare qualche secondo per aggiornare.`);
      } else {
        toast.success(`${deleteTarget.nome} eliminato`);
      }
      if (impiantoCorrente?.id) {
        await fetchDispositivi(impiantoCorrente.id);
      }
    } catch (error) {
      console.error('Errore eliminazione dispositivo:', error);
      toast.error('Errore durante l\'eliminazione');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
      // Cooldown: gateway needs time after delete before scan/commission
      setTimeout(() => setGatewayBusy(false), 2000);
    }
  };

  // Filter valid devices (usa dispositiviFiltrati per rispettare permessi)
  const validDevices = dispositiviFiltrati.filter(d => d !== null && d !== undefined);

  // Group devices by type for display
  const relayDevices = validDevices.filter(d => d.device_type === 'omniapi_node' || d.device_type === 'tasmota' || !d.device_type);
  const ledDevices = validDevices.filter(d => d.device_type === 'omniapi_led');
  const sensorDevices = validDevices.filter(d => d.device_type === 'sensor');

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', viewTransitionName: 'page-content' as any }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Dispositivi
            </h1>
            <p style={{
              fontSize: '13px',
              color: colors.textMuted,
              margin: '4px 0 0 0',
            }}>
              {validDevices.length} dispositiv{validDevices.length === 1 ? 'o' : 'i'} configurati
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Refresh */}
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                width: '44px',
                height: '44px',
                padding: 0,
                borderRadius: '16px',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Aggiorna"
            >
              <RiRefreshLine
                size={18}
                style={{ color: colors.textMuted }}
                className={refreshing ? 'animate-spin' : ''}
              />
            </motion.button>

            {/* Add Device */}
            <motion.button
              onClick={() => !gatewayBusy && setShowAddModal(true)}
              style={{
                width: '44px',
                height: '44px',
                padding: 0,
                borderRadius: '16px',
                background: gatewayBusy
                  ? colors.textMuted
                  : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                cursor: gatewayBusy ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: gatewayBusy ? 'none' : `0 4px 20px ${colors.accent}50`,
                opacity: gatewayBusy ? 0.5 : 1,
              }}
              whileHover={gatewayBusy ? {} : { scale: 1.05, boxShadow: `0 6px 24px ${colors.accent}60` }}
              whileTap={gatewayBusy ? {} : { scale: 0.95 }}
              title={gatewayBusy ? 'Attendere...' : 'Aggiungi Dispositivo'}
            >
              <RiAddLine size={20} style={{ color: '#fff', display: 'block' }} />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {validDevices.length === 0 && !gateway && !loading && !gatewayLoading ? (
          /* Empty State */
          <div
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '28px',
              boxShadow: colors.cardShadow,
              padding: '60px 32px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={topHighlight} />
            <div
              style={{
                display: 'inline-flex',
                padding: '20px',
                background: `${colors.accent}15`,
                borderRadius: '24px',
                marginBottom: '20px',
                border: `1px solid ${colors.accent}30`,
              }}
            >
              <RiLightbulbLine size={48} style={{ color: colors.textMuted }} />
            </div>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: '0 0 10px 0',
            }}>
              Nessun dispositivo
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.textMuted,
              margin: 0,
              maxWidth: '280px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Usa il Wizard nelle Impostazioni per aggiungere nuovi dispositivi
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Gateway Section */}
            {!gatewayLoading && gateway && (
              <div>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.textMuted,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Gateway
                </h2>
                <GatewayCard
                  nome={gateway.nome}
                  mac={gateway.mac}
                  ip={gateway.ip}
                  version={gateway.version}
                  status={gateway.status}
                  nodeCount={gateway.nodeCount}
                  lastSeen={gateway.lastSeen}
                />
              </div>
            )}

            {/* LED Strip Section */}
            {ledDevices.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.textMuted,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  LED Strip ({ledDevices.length})
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {ledDevices.map((dispositivo) => (
                    <div key={dispositivo.id} style={{ position: 'relative' }}>
                      <UnifiedDeviceCard
                        nome={dispositivo.nome}
                        isOn={!!dispositivo.led_power || !!dispositivo.power_state}
                        isLoading={false}
                        bloccato={!!dispositivo.bloccato}
                        canControl={canControl}
                        canViewState={canViewState}
                        isOffline={dispositivo.stato === 'offline'}
                        onToggle={() => toggleDevice(dispositivo)}
                        showDelete={canControl}
                        onDelete={() => setDeleteTarget(dispositivo)}
                        deviceType="omniapi_led"
                        variant="full"
                        ledColor={{
                          r: dispositivo.led_r ?? 255,
                          g: dispositivo.led_g ?? 255,
                          b: dispositivo.led_b ?? 255
                        }}
                        ledBrightness={dispositivo.led_brightness ?? 255}
                        ledEffect={dispositivo.led_effect ?? 0}
                        ledSpeed={dispositivo.led_speed ?? 128}
                        onLedChange={(color, brightness) => handleLedChange(dispositivo, color, brightness)}
                        onLedEffectChange={(effect) => handleLedEffectChange(dispositivo, effect)}
                        onLedSpeedChange={(speed) => handleLedSpeedChange(dispositivo, speed)}
                        onLedNumLedsChange={(numLeds) => handleLedNumLedsChange(dispositivo, numLeds)}
                        onLedCustomEffect={(colors) => handleLedCustomEffect(dispositivo, colors)}
                      />
                      {deleting && deleteTarget?.id === dispositivo.id && (
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: '16px',
                          background: 'rgba(0,0,0,0.6)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', zIndex: 10,
                        }}>
                          <RiLoader4Line size={28} className="animate-spin" style={{ color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relay/Switch Section */}
            {relayDevices.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.textMuted,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Interruttori ({relayDevices.length})
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {relayDevices.map((dispositivo) => (
                    <div key={dispositivo.id} style={{ position: 'relative' }}>
                      <UnifiedDeviceCard
                        nome={dispositivo.nome}
                        isOn={!!dispositivo.power_state}
                        isLoading={dispositivo.device_type === 'omniapi_node' && !!dispositivo.mac_address && isDevicePending(dispositivo.mac_address)}
                        bloccato={!!dispositivo.bloccato}
                        canControl={canControl}
                        canViewState={canViewState}
                        isOffline={dispositivo.stato === 'offline'}
                        onToggle={() => toggleDevice(dispositivo)}
                        showDelete={canControl}
                        onDelete={() => setDeleteTarget(dispositivo)}
                        deviceType={dispositivo.device_type || 'relay'}
                        variant="full"
                      />
                      {deleting && deleteTarget?.id === dispositivo.id && (
                        <div style={{
                          position: 'absolute', inset: 0, borderRadius: '16px',
                          background: 'rgba(0,0,0,0.6)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', zIndex: 10,
                        }}>
                          <RiLoader4Line size={28} className="animate-spin" style={{ color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sensors Section */}
            {sensorDevices.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.textMuted,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Sensori ({sensorDevices.length})
                </h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {sensorDevices.map((dispositivo) => (
                    <UnifiedDeviceCard
                      key={dispositivo.id}
                      nome={dispositivo.nome}
                      isOn={false}
                      onToggle={() => {}}
                      deviceType="sensor"
                      variant="full"
                      canViewState={canViewState}
                      temperature={dispositivo.temperature}
                      humidity={dispositivo.humidity}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        impiantoId={impiantoCorrente?.id || 0}
        onDeviceAdded={() => {
          if (impiantoCorrente?.id) {
            fetchDispositivi(impiantoCorrente.id);
          }
        }}
        existingMacs={validDevices.map(d => d.mac_address || '').filter(Boolean)}
      />

      {/* Delete Confirmation */}
      <ConfirmPopup
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDevice}
        title="Elimina dispositivo"
        message={`Vuoi eliminare "${deleteTarget?.nome}"? Il dispositivo verrà rimosso dall'impianto e da tutte le scene.`}
        confirmText="Elimina"
        cancelText="Annulla"
        confirmVariant="danger"
        icon={<RiDeleteBinLine size={20} />}
      />
    </Layout>
  );
};
