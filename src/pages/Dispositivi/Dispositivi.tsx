import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SkeletonList } from '@/components/common/Skeleton';
import { UnifiedDeviceCard } from '@/components/devices';
import { AddDeviceModal } from '@/components/dispositivi';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useDispositiviStore, Dispositivo } from '@/store/dispositiviStore';
import { omniapiApi } from '@/services/omniapiApi';
import { tasmotaApi } from '@/services/api';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine,
  RiAddLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { toast } from '@/utils/toast';
import { useThemeColor } from '@/contexts/ThemeColorContext';

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

// Variants per animazioni card
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};

export const Dispositivi = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors, modeColors } = useThemeColor();

  // Use the SAME store as Dashboard
  const { dispositivi, loading, updatePowerState, updateLedState, fetchDispositivi } = useDispositiviStore();

  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  // Toggle device (same logic as Dashboard)
  const toggleDevice = async (dispositivo: Dispositivo) => {
    if (togglingDevice === dispositivo.id) return;
    setTogglingDevice(dispositivo.id);

    try {
      const newState = !dispositivo.power_state;

      // LED Strip
      if (dispositivo.device_type === 'omniapi_led') {
        await omniapiApi.sendLedCommand(dispositivo.mac_address!, newState ? 'on' : 'off');
        updateLedState(dispositivo.id, { led_power: newState });
        updatePowerState(dispositivo.id, newState);
      }
      // OmniaPi relay nodes
      else if (dispositivo.device_type === 'omniapi_node') {
        await omniapiApi.controlNode(dispositivo.id, 1, newState ? 'on' : 'off');
        updatePowerState(dispositivo.id, newState);
      }
      // Tasmota devices
      else {
        await tasmotaApi.controlDispositivo(dispositivo.id, newState ? 'ON' : 'OFF');
        updatePowerState(dispositivo.id, newState);
      }
    } catch (error: any) {
      console.error('Errore toggle dispositivo:', error);
      if (error.response?.data?.blocked) {
        toast.error('Bloccato');
      } else {
        toast.error('Errore');
      }
    } finally {
      setTogglingDevice(null);
    }
  };

  // Handle LED brightness/color change
  const handleLedChange = async (dispositivo: Dispositivo, color: { r: number; g: number; b: number }, brightness: number) => {
    if (!dispositivo.mac_address) return;

    try {
      await omniapiApi.sendLedCommand(dispositivo.mac_address, 'set_color', {
        r: color.r,
        g: color.g,
        b: color.b,
        brightness
      });
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

  // Filter valid devices
  const validDevices = dispositivi.filter(d => d !== null && d !== undefined);

  // Group devices by type for display
  const relayDevices = validDevices.filter(d => d.device_type === 'omniapi_node' || d.device_type === 'tasmota' || !d.device_type);
  const ledDevices = validDevices.filter(d => d.device_type === 'omniapi_led');
  const sensorDevices = validDevices.filter(d => d.device_type === 'sensor');

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                background: colors.bgCardLit,
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
              onClick={() => setShowAddModal(true)}
              style={{
                width: '44px',
                height: '44px',
                padding: 0,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px ${colors.accent}50`,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 24px ${colors.accent}60` }}
              whileTap={{ scale: 0.95 }}
              title="Aggiungi Dispositivo"
            >
              <RiAddLine size={20} style={{ color: '#fff', display: 'block' }} />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonList count={6} />
        ) : validDevices.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: colors.bgCardLit,
              border: `1px solid ${colors.border}`,
              borderRadius: '28px',
              boxShadow: colors.cardShadowLit,
              padding: '60px 32px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={topHighlight} />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
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
            </motion.div>
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
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={containerVariants}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {ledDevices.map((dispositivo) => (
                    <motion.div key={dispositivo.id} variants={cardVariants}>
                      <UnifiedDeviceCard
                        nome={dispositivo.nome}
                        isOn={!!dispositivo.led_power || !!dispositivo.power_state}
                        isLoading={togglingDevice === dispositivo.id}
                        bloccato={!!dispositivo.bloccato}
                        onToggle={() => toggleDevice(dispositivo)}
                        deviceType="omniapi_led"
                        variant="full"
                        ledColor={{
                          r: dispositivo.led_r ?? 255,
                          g: dispositivo.led_g ?? 255,
                          b: dispositivo.led_b ?? 255
                        }}
                        ledBrightness={dispositivo.led_brightness ?? 255}
                        onLedChange={(color, brightness) => handleLedChange(dispositivo, color, brightness)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
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
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={containerVariants}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {relayDevices.map((dispositivo) => (
                    <motion.div key={dispositivo.id} variants={cardVariants}>
                      <UnifiedDeviceCard
                        nome={dispositivo.nome}
                        isOn={!!dispositivo.power_state}
                        isLoading={togglingDevice === dispositivo.id}
                        bloccato={!!dispositivo.bloccato}
                        onToggle={() => toggleDevice(dispositivo)}
                        deviceType={dispositivo.device_type || 'relay'}
                        variant="full"
                      />
                    </motion.div>
                  ))}
                </motion.div>
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
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={containerVariants}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {sensorDevices.map((dispositivo) => (
                    <motion.div key={dispositivo.id} variants={cardVariants}>
                      <UnifiedDeviceCard
                        nome={dispositivo.nome}
                        isOn={false}
                        onToggle={() => {}}
                        deviceType="sensor"
                        variant="full"
                        temperature={dispositivo.temperature}
                        humidity={dispositivo.humidity}
                      />
                    </motion.div>
                  ))}
                </motion.div>
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
    </Layout>
  );
};
