import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RiLoader4Line,
  RiWifiLine,
  RiAddLine,
  RiLightbulbFlashLine,
  RiFlashlightLine,
  RiRefreshLine,
  RiCheckLine,
} from 'react-icons/ri';
import { omniapiApi } from '@/services/omniapiApi';
import { useThemeColors } from '@/hooks/useThemeColors';
import { toast } from '@/utils/toast';

// ============================================
// DEVICE DISCOVERY - Componente UNIFICATO
// Usato in: Dispositivi.tsx, StepDispositivi.tsx
// ============================================

export interface DiscoveredDevice {
  mac: string;
  device_type: 'omniapi_node' | 'omniapi_led';
  online: boolean;
  rssi?: number;
  // LED specific
  power?: boolean;
  r?: number;
  g?: number;
  b?: number;
  brightness?: number;
  // Relay specific
  relay1?: boolean;
  relay2?: boolean;
  version?: string;
}

interface DeviceDiscoveryProps {
  // Callback quando un dispositivo viene selezionato (per wizard step)
  onDeviceSelected?: (device: DiscoveredDevice) => void;
  // MAC da escludere (già registrati)
  excludeMacs?: string[];
  // Mostra bottone refresh esterno
  showRefreshButton?: boolean;
  // Stile compatto per wizard
  compact?: boolean;
  // Ref per refresh esterno
  onRefreshRef?: (fn: () => Promise<void>) => void;
}

export const DeviceDiscovery = ({
  onDeviceSelected,
  excludeMacs = [],
  showRefreshButton = true,
  compact = false,
  onRefreshRef,
}: DeviceDiscoveryProps) => {
  const { colors } = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [testingMac, setTestingMac] = useState<string | null>(null);

  // Fetch dispositivi disponibili
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sia nodes che LED in parallelo
      const [nodesRes, ledRes] = await Promise.all([
        omniapiApi.getNodes().catch(() => ({ nodes: [] })),
        omniapiApi.getLedDevices().catch(() => ({ devices: [] }))
      ]);

      const allDevices: DiscoveredDevice[] = [];

      // Aggiungi relay nodes
      if (nodesRes.nodes) {
        nodesRes.nodes.forEach((node: any) => {
          allDevices.push({
            mac: node.mac,
            device_type: 'omniapi_node',
            online: node.online ?? true,
            rssi: node.rssi,
            relay1: node.relay1,
            relay2: node.relay2,
            version: node.version
          });
        });
      }

      // Aggiungi LED strip
      if (ledRes.devices) {
        ledRes.devices.forEach((led: any) => {
          allDevices.push({
            mac: led.mac,
            device_type: 'omniapi_led',
            online: led.online ?? true,
            power: led.power,
            r: led.r ?? 255,
            g: led.g ?? 255,
            b: led.b ?? 255,
            brightness: led.brightness ?? 100
          });
        });
      }

      setDevices(allDevices);
    } catch (error) {
      console.error('Errore fetch dispositivi:', error);
      toast.error('Errore caricamento');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch iniziale
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Esponi refresh ref per componenti esterni
  useEffect(() => {
    if (onRefreshRef) {
      onRefreshRef(fetchDevices);
    }
  }, [onRefreshRef, fetchDevices]);

  // Filtra dispositivi già registrati
  const availableDevices = devices.filter(
    d => !excludeMacs.includes(d.mac)
  );

  // Test dispositivo
  const handleTest = async (device: DiscoveredDevice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (testingMac) return;

    setTestingMac(device.mac);
    try {
      if (device.device_type === 'omniapi_led') {
        // Blink LED
        await omniapiApi.sendLedCommand(device.mac, 'on');
        setTimeout(() => omniapiApi.sendLedCommand(device.mac, 'off'), 500);
      } else {
        // Test relay
        await omniapiApi.testDevice(device.mac);
      }
      toast.success('Test inviato!');
    } catch {
      toast.error('Errore test');
    } finally {
      setTimeout(() => setTestingMac(null), 2000);
    }
  };

  // Select device
  const handleSelect = (device: DiscoveredDevice) => {
    if (onDeviceSelected) {
      onDeviceSelected(device);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: compact ? '24px' : '40px'
      }}>
        <RiLoader4Line
          size={compact ? 28 : 32}
          className="animate-spin"
          style={{ color: colors.accent, margin: '0 auto' }}
        />
        <p style={{
          color: colors.textMuted,
          marginTop: '12px',
          fontSize: compact ? '13px' : '14px'
        }}>
          Ricerca dispositivi...
        </p>
      </div>
    );
  }

  // Empty state
  if (availableDevices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: compact ? '24px' : '40px' }}>
        <RiWifiLine
          size={compact ? 36 : 48}
          style={{ color: colors.textMuted, marginBottom: '12px' }}
        />
        <p style={{
          fontSize: compact ? '14px' : '15px',
          color: colors.textSecondary,
          margin: 0
        }}>
          Nessun nuovo dispositivo
        </p>
        <p style={{
          fontSize: compact ? '12px' : '13px',
          color: colors.textMuted,
          marginTop: '8px'
        }}>
          Accendi i dispositivi OmniaPi e premi Aggiorna
        </p>
        {showRefreshButton && (
          <motion.button
            onClick={fetchDevices}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              borderRadius: '12px',
              background: `${colors.accent}15`,
              border: `1px solid ${colors.accent}30`,
              color: colors.accent,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RiRefreshLine size={16} />
            Aggiorna
          </motion.button>
        )}
      </div>
    );
  }

  // Device list
  return (
    <div>
      {/* Header con refresh */}
      {showRefreshButton && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '12px',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {availableDevices.length} disponibil{availableDevices.length === 1 ? 'e' : 'i'}
          </span>
          <motion.button
            onClick={fetchDevices}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            whileHover={{ borderColor: colors.accent, color: colors.accent }}
            whileTap={{ scale: 0.98 }}
          >
            <RiRefreshLine size={12} />
            Aggiorna
          </motion.button>
        </div>
      )}

      {/* Device list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '6px' : '8px' }}>
        {availableDevices.map((device) => {
          const isLed = device.device_type === 'omniapi_led';
          const ledColor = isLed ? `rgb(${device.r},${device.g},${device.b})` : colors.accent;
          const isTesting = testingMac === device.mac;

          return (
            <motion.div
              key={device.mac}
              style={{
                padding: compact ? '10px 12px' : '14px',
                background: colors.bgSecondary,
                borderRadius: compact ? '12px' : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${colors.border}`,
              }}
              whileHover={{ borderColor: colors.accent }}
            >
              {/* Device info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '10px' : '12px', flex: 1, minWidth: 0 }}>
                {/* Icon */}
                {isLed ? (
                  <div style={{
                    width: compact ? '32px' : '40px',
                    height: compact ? '32px' : '40px',
                    borderRadius: compact ? '10px' : '12px',
                    background: device.power ? ledColor : colors.bgCard,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: device.power ? `0 0 12px ${ledColor}` : 'none',
                    flexShrink: 0,
                  }}>
                    <RiLightbulbFlashLine
                      size={compact ? 16 : 20}
                      style={{ color: device.power ? '#fff' : colors.textMuted }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: compact ? '32px' : '40px',
                    height: compact ? '32px' : '40px',
                    borderRadius: compact ? '10px' : '12px',
                    background: `${colors.accent}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <RiFlashlightLine size={compact ? 16 : 20} style={{ color: colors.accent }} />
                  </div>
                )}

                {/* Info */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: compact ? '13px' : '14px',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {isLed ? 'LED Strip' : 'Relay Node'}
                  </p>
                  <p style={{
                    fontSize: compact ? '10px' : '11px',
                    color: colors.textMuted,
                    margin: 0
                  }}>
                    {device.mac.slice(-8)} • {device.online ? 'Online' : 'Offline'}
                    {device.rssi && ` • ${device.rssi}dBm`}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: compact ? '6px' : '8px', flexShrink: 0 }}>
                {/* Test button */}
                <motion.button
                  onClick={(e) => handleTest(device, e)}
                  disabled={isTesting}
                  style={{
                    padding: compact ? '6px 10px' : '8px 12px',
                    borderRadius: compact ? '8px' : '10px',
                    background: isTesting ? colors.accent : 'transparent',
                    border: `1px solid ${colors.accent}`,
                    color: isTesting ? '#fff' : colors.accent,
                    fontSize: compact ? '11px' : '12px',
                    fontWeight: 600,
                    cursor: isTesting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  whileHover={isTesting ? {} : { background: `${colors.accent}15` }}
                  whileTap={isTesting ? {} : { scale: 0.98 }}
                >
                  {isTesting ? <RiCheckLine size={12} /> : null}
                  TEST
                </motion.button>

                {/* Select/Add button */}
                <motion.button
                  onClick={() => handleSelect(device)}
                  style={{
                    width: compact ? '32px' : '36px',
                    height: compact ? '32px' : '36px',
                    borderRadius: compact ? '8px' : '10px',
                    background: colors.accent,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RiAddLine size={compact ? 16 : 18} style={{ color: '#fff' }} />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
