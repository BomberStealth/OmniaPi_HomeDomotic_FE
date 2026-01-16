import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCloseLine,
  RiLightbulbFlashLine,
  RiFlashlightLine,
} from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';
import { toast } from '@/utils/toast';
import { omniapiApi } from '@/services/omniapiApi';
import { DeviceDiscovery, DiscoveredDevice } from './DeviceDiscovery';

// ============================================
// ADD DEVICE MODAL
// Usa DeviceDiscovery per lista dispositivi
// ============================================

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  impiantoId: number;
  onDeviceAdded: () => void;
  existingMacs: string[];
}

export const AddDeviceModal = ({
  isOpen,
  onClose,
  impiantoId,
  onDeviceAdded,
  existingMacs
}: AddDeviceModalProps) => {
  const { colors } = useThemeColors();
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Registra dispositivo usando API OmniaPi corretta
  const handleRegister = async () => {
    if (!selectedDevice || !deviceName.trim()) {
      toast.error('Inserisci un nome');
      return;
    }

    setRegistering(true);
    try {
      await omniapiApi.registerNode(
        impiantoId,
        selectedDevice.mac,
        deviceName.trim(),
        undefined, // stanza_id
        selectedDevice.device_type
      );

      toast.success('Dispositivo aggiunto!');
      onDeviceAdded();
      handleClose();
    } catch (error: any) {
      console.error('Errore registrazione:', error);
      toast.error(error.response?.data?.error || 'Errore registrazione');
    } finally {
      setRegistering(false);
    }
  };

  // Close e reset
  const handleClose = () => {
    setSelectedDevice(null);
    setDeviceName('');
    onClose();
  };

  // Callback quando seleziona dispositivo da DeviceDiscovery
  const handleDeviceSelected = (device: DiscoveredDevice) => {
    setSelectedDevice(device);
    setDeviceName(
      device.device_type === 'omniapi_led'
        ? 'LED Strip'
        : `Interruttore ${device.mac.slice(-5)}`
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: colors.bgCard,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
              {selectedDevice ? 'Configura Dispositivo' : 'Aggiungi Dispositivo'}
            </h2>
            <button
              onClick={handleClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RiCloseLine size={20} style={{ color: colors.textMuted }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {selectedDevice ? (
              /* Form registrazione */
              <div>
                <div style={{
                  padding: '16px',
                  background: `${colors.accent}10`,
                  borderRadius: '16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  {selectedDevice.device_type === 'omniapi_led' ? (
                    <RiLightbulbFlashLine size={24} style={{ color: colors.accent }} />
                  ) : (
                    <RiFlashlightLine size={24} style={{ color: colors.accent }} />
                  )}
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                      {selectedDevice.device_type === 'omniapi_led' ? 'LED Strip' : 'Relay Node'}
                    </p>
                    <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                      {selectedDevice.mac}
                    </p>
                  </div>
                </div>

                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: colors.textSecondary }}>
                  Nome dispositivo
                </label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="es. Luce Soggiorno"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    fontSize: '15px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    onClick={() => setSelectedDevice(null)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      color: colors.textSecondary,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Indietro
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={registering || !deviceName.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: colors.accent,
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: registering ? 'not-allowed' : 'pointer',
                      opacity: registering || !deviceName.trim() ? 0.6 : 1,
                    }}
                  >
                    {registering ? 'Aggiunta...' : 'Aggiungi'}
                  </button>
                </div>
              </div>
            ) : (
              /* Device Discovery */
              <DeviceDiscovery
                onDeviceSelected={handleDeviceSelected}
                excludeMacs={existingMacs}
                showRefreshButton={true}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
