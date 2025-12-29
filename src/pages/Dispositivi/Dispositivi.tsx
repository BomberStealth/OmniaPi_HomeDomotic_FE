import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SkeletonList } from '@/components/common/Skeleton';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { tasmotaApi } from '@/services/api';
import { motion } from 'framer-motion';
import { RiLightbulbLine, RiAddLine, RiDeleteBinLine, RiLoader4Line, RiSearchLine, RiEyeLine, RiShutDownLine } from 'react-icons/ri';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// DISPOSITIVI TASMOTA PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bg: '#0a0a09',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  bgCard: '#1e1c18',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Device Toggle Component - Dark Luxury Style (stesso stile Dashboard)
const DeviceToggle = ({
  isOn,
  disabled,
  isLoading,
  onChange,
}: {
  isOn: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  onChange: (value: boolean) => void;
}) => {
  const { colors: themeColors } = useThemeColor();
  const isDisabled = disabled || isLoading;

  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
  }), [themeColors]);

  return (
    <motion.button
      onClick={() => !isDisabled && onChange(!isOn)}
      disabled={isDisabled}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '16px',
        background: isOn
          ? `linear-gradient(135deg, ${colors.accent}15, ${colors.accentDark}10)`
          : colors.toggleTrack,
        border: `1px solid ${isOn ? `${colors.accent}50` : colors.toggleTrackBorder}`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: isOn ? `0 0 16px ${colors.accent}20` : 'none',
        transition: 'all 0.3s ease',
      }}
      whileHover={!isDisabled ? { scale: 1.02, borderColor: colors.accent } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
    >
      {/* Stato testuale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isLoading ? (
          <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.accent }} />
        ) : (
          <RiShutDownLine
            size={18}
            style={{
              color: isOn ? colors.accent : colors.textMuted,
              filter: isOn ? `drop-shadow(0 0 6px ${colors.accent})` : 'none',
            }}
          />
        )}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isOn ? colors.accent : colors.textMuted,
          }}
        >
          {isLoading ? 'Invio...' : isOn ? 'Acceso' : 'Spento'}
        </span>
      </div>

      {/* Toggle Switch - stesso stile Dashboard */}
      <div
        style={{
          width: '44px',
          height: '24px',
          padding: '3px',
          borderRadius: '9999px',
          background: isOn
            ? `linear-gradient(90deg, ${colors.accentDark}, ${colors.accentLight})`
            : colors.toggleTrack,
          boxShadow: isOn
            ? `0 0 12px ${colors.accent}50, inset 0 1px 2px rgba(0,0,0,0.1)`
            : `inset 0 2px 4px rgba(0,0,0,0.3), inset 0 0 0 1px ${colors.toggleTrackBorder}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {/* Track marks for OFF state */}
        {!isOn && (
          <>
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: colors.textMuted,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '2px',
                height: '2px',
                borderRadius: '50%',
                background: `${colors.textMuted}60`,
              }}
            />
          </>
        )}
        {/* Knob */}
        <motion.div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: isOn
              ? 'linear-gradient(145deg, #ffffff, #f0f0f0)'
              : 'linear-gradient(145deg, #e0e0e0, #c8c8c8)',
            boxShadow: isOn
              ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)'
              : '0 1px 3px rgba(0,0,0,0.3)',
          }}
          animate={{ x: isOn ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
};

export const Dispositivi = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const { colors: themeColors } = useThemeColor();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

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
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [dispositiviScansionati, setDispositiviScansionati] = useState<any[]>([]);
  const [newDevice, setNewDevice] = useState({ ip_address: '', nome: '', tipo: 'generico' });
  const [addFromScanModalOpen, setAddFromScanModalOpen] = useState(false);
  const [selectedScanDevice, setSelectedScanDevice] = useState<any | null>(null);
  const [scanDeviceName, setScanDeviceName] = useState('');
  const [findingDevice, setFindingDevice] = useState<string | null>(null);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);

  const impiantoId = impiantoCorrente?.id || 0;
  const isAdmin = user?.ruolo === UserRole.ADMIN;

  useEffect(() => {
    if (impiantoId) {
      loadDispositivi();
    }
  }, [impiantoId]);

  const loadDispositivi = async () => {
    if (!impiantoId) return;
    try {
      setLoading(true);
      const data = await tasmotaApi.getDispositivi(impiantoId);
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanRete = async () => {
    if (!impiantoId) return;
    try {
      setScanning(true);
      const result = await tasmotaApi.scanRete(impiantoId);
      if (result.success && result.dispositivi) {
        setDispositiviScansionati(result.dispositivi);
        setScanModalOpen(true);
        toast.success(`Trovati ${result.dispositivi.length} dispositivi Tasmota`);
      } else {
        toast.warning('Nessun dispositivo trovato');
      }
    } catch (error: any) {
      console.error('Errore scan rete:', error);
      toast.error(error.response?.data?.error || 'Errore durante la scansione della rete');
    } finally {
      setScanning(false);
    }
  };

  const openAddFromScanModal = (device: any) => {
    setSelectedScanDevice(device);
    setScanDeviceName(device.nome || '');
    setAddFromScanModalOpen(true);
  };

  const handleConfirmAddFromScan = async () => {
    if (!selectedScanDevice || !scanDeviceName.trim()) {
      toast.error('Inserisci un nome per il dispositivo');
      return;
    }
    try {
      await tasmotaApi.addDispositivo(impiantoId, {
        ip_address: selectedScanDevice.ip_address,
        nome: scanDeviceName.trim(),
        tipo: 'luce'
      });
      await loadDispositivi();
      setDispositiviScansionati(prev => prev.filter(d => d.ip_address !== selectedScanDevice.ip_address));
      toast.success(`Dispositivo "${scanDeviceName}" aggiunto!`);
      setAddFromScanModalOpen(false);
      setSelectedScanDevice(null);
      setScanDeviceName('');
    } catch (error: any) {
      console.error('Errore aggiunta dispositivo:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiunta del dispositivo');
    }
  };

  const handleTrovami = async (ip_address: string) => {
    setFindingDevice(ip_address);
    try {
      await tasmotaApi.trovami(ip_address);
      toast.success('Dispositivo lampeggiato!');
    } catch (error) {
      console.error('Errore TROVAMI:', error);
      toast.error('Impossibile comunicare con il dispositivo');
    } finally {
      setFindingDevice(null);
    }
  };

  const handleAddDispositivo = async () => {
    if (!newDevice.ip_address || !newDevice.nome) {
      toast.error('IP e nome sono richiesti');
      return;
    }
    try {
      setLoading(true);
      await tasmotaApi.addDispositivo(impiantoId, newDevice);
      setModalOpen(false);
      setNewDevice({ ip_address: '', nome: '', tipo: 'generico' });
      await loadDispositivi();
      toast.success('Dispositivo aggiunto con successo!');
    } catch (error: any) {
      console.error('Errore add dispositivo:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiunta del dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleControlDispositivo = async (id: number, comando: string) => {
    if (togglingDevice === id) return; // Evita doppi click
    setTogglingDevice(id);
    try {
      const newPowerState = comando === 'ON';
      await tasmotaApi.controlDispositivo(id, comando);
      setDispositivi(prev => prev.map(d =>
        d.id === id ? { ...d, power_state: newPowerState } : d
      ));
      toast.success(`Comando ${comando} inviato!`);
    } catch (error: any) {
      console.error('Errore controllo dispositivo:', error);
      // Gestione dispositivo bloccato (DeviceGuard)
      if (error.response?.data?.blocked) {
        toast.error(`🔒 ${error.response.data.error}`);
      } else {
        toast.error(error.response?.data?.error || 'Errore durante il controllo del dispositivo');
        await loadDispositivi();
      }
    } finally {
      setTogglingDevice(null);
    }
  };

  const handleDeleteDispositivo = async (id: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questo dispositivo?')) return;
    try {
      await tasmotaApi.deleteDispositivo(id);
      await loadDispositivi();
    } catch (error) {
      console.error('Errore delete dispositivo:', error);
    }
  };

  const handleToggleBlocco = async (dispositivo: any) => {
    try {
      await tasmotaApi.toggleBlocco(dispositivo.id, !dispositivo.bloccato);
      await loadDispositivi();
      toast.success(dispositivo.bloccato ? 'Dispositivo sbloccato' : 'Dispositivo bloccato');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante il blocco/sblocco');
    }
  };

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
              {dispositivi.length} dispositiv{dispositivi.length === 1 ? 'o' : 'i'} configurati
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Scan Button */}
            <motion.button
              onClick={handleScanRete}
              disabled={scanning || !impiantoId}
              style={{
                padding: '12px',
                borderRadius: '16px',
                background: colors.bgCardLit,
                border: `1px solid ${colors.border}`,
                cursor: scanning || !impiantoId ? 'not-allowed' : 'pointer',
                opacity: scanning || !impiantoId ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: colors.cardShadowLit,
              }}
              whileHover={{ borderColor: colors.borderHover, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Scansiona Rete"
            >
              {scanning ? (
                <RiLoader4Line size={20} className="animate-spin" style={{ color: colors.accent }} />
              ) : (
                <RiSearchLine size={20} style={{ color: colors.textPrimary }} />
              )}
            </motion.button>

            {/* Add Button */}
            <motion.button
              onClick={() => setModalOpen(true)}
              disabled={!impiantoId}
              style={{
                padding: '12px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                cursor: !impiantoId ? 'not-allowed' : 'pointer',
                opacity: !impiantoId ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 20px ${colors.accent}50`,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 6px 24px ${colors.accent}60` }}
              whileTap={{ scale: 0.95 }}
              title="Aggiungi Dispositivo"
            >
              <RiAddLine size={20} style={{ color: colors.bg }} />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonList count={6} />
        ) : dispositivi.length === 0 ? (
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
              margin: '0 0 28px 0',
              maxWidth: '280px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Aggiungi dispositivi Tasmota per iniziare a controllare la tua casa
            </p>
            <motion.button
              onClick={() => setModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 28px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                border: 'none',
                color: colors.bg,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${colors.accent}50`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RiAddLine size={18} />
              Aggiungi Dispositivo
            </motion.button>
          </motion.div>
        ) : (
          /* Devices Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {dispositivi.filter(d => d !== null && d !== undefined).map((dispositivo, index) => (
              <motion.div
                key={dispositivo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: dispositivo.power_state
                    ? `linear-gradient(165deg, ${colors.accent}08, #1e1c18 50%, #1a1816 100%)`
                    : colors.bgCardLit,
                  border: `1px solid ${dispositivo.power_state ? `${colors.accent}40` : colors.border}`,
                  borderRadius: '24px',
                  boxShadow: dispositivo.power_state
                    ? `0 0 24px ${colors.accent}15, ${colors.cardShadowLit}`
                    : colors.cardShadowLit,
                  padding: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={topHighlight} />

                {/* Header: Name + Status + Delete */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Status Icon */}
                    <motion.div
                      animate={dispositivo.power_state ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{
                        padding: '10px',
                        borderRadius: '14px',
                        background: dispositivo.power_state
                          ? `${colors.accent}25`
                          : `${colors.textMuted}15`,
                        border: `1px solid ${dispositivo.power_state
                          ? `${colors.accent}50`
                          : colors.border
                        }`,
                        flexShrink: 0,
                      }}
                    >
                      <RiLightbulbLine
                        size={20}
                        style={{
                          color: dispositivo.power_state ? colors.accentLight : colors.textMuted,
                          filter: dispositivo.power_state ? `drop-shadow(0 0 6px ${colors.accent})` : 'none',
                        }}
                      />
                    </motion.div>

                    {/* Name + IP + Status */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {dispositivo.nome}
                      </h3>
                      <p style={{
                        fontSize: '11px',
                        color: colors.textMuted,
                        margin: '3px 0 0 0',
                        fontFamily: 'monospace',
                      }}>
                        {dispositivo.ip_address}
                      </p>
                      {/* Status Badges */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {/* Online/Offline Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: dispositivo.stato === 'online' ? `${colors.success}20` : `${colors.error}20`,
                          border: `1px solid ${dispositivo.stato === 'online' ? `${colors.success}30` : `${colors.error}30`}`,
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: dispositivo.stato === 'online' ? colors.success : colors.error,
                            boxShadow: `0 0 6px ${dispositivo.stato === 'online' ? colors.success : colors.error}`,
                          }} />
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: dispositivo.stato === 'online' ? colors.success : colors.error,
                            textTransform: 'uppercase',
                          }}>
                            {dispositivo.stato === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {/* Bloccato Badge */}
                        {dispositivo.bloccato && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: `${colors.warning}20`,
                            border: `1px solid ${colors.warning}30`,
                          }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              color: colors.warning,
                              textTransform: 'uppercase',
                            }}>
                              Bloccato
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <motion.button
                    onClick={() => handleDeleteDispositivo(dispositivo.id)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                    whileHover={{ background: `${colors.error}20`, borderColor: `${colors.error}50` }}
                    whileTap={{ scale: 0.9 }}
                    title="Elimina"
                  >
                    <RiDeleteBinLine size={14} style={{ color: colors.textMuted }} />
                  </motion.button>
                </div>

                {/* Toggle Button */}
                <DeviceToggle
                  isOn={dispositivo.power_state || false}
                  disabled={dispositivo.bloccato || dispositivo.stato !== 'online'}
                  isLoading={togglingDevice === dispositivo.id}
                  onChange={(isOn) => handleControlDispositivo(dispositivo.id, isOn ? 'ON' : 'OFF')}
                />

                {/* Admin Controls */}
                {isAdmin && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.border}`,
                  }}>
                    {/* Info */}
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{
                        fontSize: '10px',
                        color: colors.textMuted,
                        margin: '0 0 2px 0',
                      }}>
                        Tipo: <span style={{ color: colors.textSecondary }}>{dispositivo.tipo}</span>
                      </p>
                      <p style={{
                        fontSize: '10px',
                        color: colors.textMuted,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }} title={dispositivo.topic_mqtt}>
                        Topic: <span style={{ color: colors.textSecondary }}>{dispositivo.topic_mqtt}</span>
                      </p>
                    </div>

                    {/* Lock Toggle */}
                    <motion.div
                      onClick={() => handleToggleBlocco(dispositivo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: dispositivo.bloccato ? `${colors.warning}15` : `${colors.success}10`,
                        border: `1px solid ${dispositivo.bloccato ? `${colors.warning}30` : `${colors.success}20`}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: dispositivo.bloccato ? colors.warning : colors.success,
                      }}>
                        {dispositivo.bloccato ? '🔒 Bloccato' : '🔓 Sbloccato'}
                      </span>

                      {/* Mini Toggle */}
                      <div
                        style={{
                          width: '36px',
                          height: '20px',
                          borderRadius: '10px',
                          background: dispositivo.bloccato
                            ? `linear-gradient(135deg, ${colors.warning}, #b45309)`
                            : `linear-gradient(135deg, ${colors.success}, #15803d)`,
                          position: 'relative',
                          boxShadow: `0 2px 8px ${dispositivo.bloccato ? colors.warning : colors.success}40`,
                        }}
                      >
                        <motion.div
                          animate={{ x: dispositivo.bloccato ? 2 : 18 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          }}
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Aggiungi Dispositivo Manualmente */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Aggiungi Dispositivo"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Indirizzo IP"
            value={newDevice.ip_address}
            onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
            placeholder="es. 192.168.1.100"
          />
          <Input
            label="Nome Dispositivo"
            value={newDevice.nome}
            onChange={(e) => setNewDevice({ ...newDevice, nome: e.target.value })}
            placeholder="es. Luce Soggiorno"
          />
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: colors.textMuted,
              marginBottom: '8px',
            }}>
              Tipo Dispositivo
            </label>
            <select
              value={newDevice.tipo}
              onChange={(e) => setNewDevice({ ...newDevice, tipo: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                color: colors.textPrimary,
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="generico">Generico</option>
              <option value="luce">Luce</option>
              <option value="tapparella">Tapparella</option>
              <option value="termostato">Termostato</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleAddDispositivo} fullWidth disabled={loading}>
              {loading ? 'Aggiunta...' : 'Aggiungi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Risultati Scan Rete */}
      <Modal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title={`Trovati ${dispositiviScansionati.length} dispositivi`}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dispositiviScansionati.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: colors.textMuted,
              padding: '32px',
              fontSize: '14px',
            }}>
              Nessun nuovo dispositivo trovato
            </p>
          ) : (
            <div style={{
              maxHeight: '350px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {dispositiviScansionati.filter(d => d !== null && d !== undefined).map((device) => (
                <motion.div
                  key={device.ip_address}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <RiLightbulbLine size={18} style={{ color: colors.accent, flexShrink: 0 }} />
                    <span style={{
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      color: colors.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {device.ip_address}
                    </span>
                  </div>

                  {device.gia_aggiunto ? (
                    <span style={{
                      padding: '5px 10px',
                      background: `${colors.success}20`,
                      color: colors.success,
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      flexShrink: 0,
                    }}>
                      Aggiunto
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <motion.button
                        onClick={() => handleTrovami(device.ip_address)}
                        disabled={findingDevice === device.ip_address}
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          background: `${colors.warning}20`,
                          border: `1px solid ${colors.warning}30`,
                          cursor: 'pointer',
                          opacity: findingDevice === device.ip_address ? 0.5 : 1,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Lampeggia dispositivo"
                      >
                        {findingDevice === device.ip_address ? (
                          <RiLoader4Line size={14} className="animate-spin" style={{ color: colors.warning }} />
                        ) : (
                          <RiEyeLine size={14} style={{ color: colors.warning }} />
                        )}
                      </motion.button>
                      <motion.button
                        onClick={() => openAddFromScanModal(device)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                          border: 'none',
                          color: colors.bg,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Aggiungi
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => setScanModalOpen(false)}
            fullWidth
            style={{ marginTop: '8px' }}
          >
            Chiudi
          </Button>
        </div>
      </Modal>

      {/* Modal: Aggiungi da Scan */}
      <Modal
        isOpen={addFromScanModalOpen}
        onClose={() => {
          setAddFromScanModalOpen(false);
          setSelectedScanDevice(null);
          setScanDeviceName('');
        }}
        title="Configura Dispositivo"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* IP Display */}
          <div style={{
            padding: '14px',
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
          }}>
            <p style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>
              Indirizzo IP
            </p>
            <p style={{
              fontFamily: 'monospace',
              fontSize: '15px',
              color: colors.accent,
              margin: 0,
            }}>
              {selectedScanDevice?.ip_address}
            </p>
          </div>

          <Input
            label="Nome Dispositivo"
            value={scanDeviceName}
            onChange={(e) => setScanDeviceName(e.target.value)}
            placeholder="es. Luce Soggiorno"
            autoFocus
          />

          {/* Trovami Button */}
          {selectedScanDevice && (
            <motion.button
              onClick={() => handleTrovami(selectedScanDevice.ip_address)}
              disabled={findingDevice === selectedScanDevice.ip_address}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px',
                borderRadius: '14px',
                background: `${colors.warning}15`,
                border: `1px solid ${colors.warning}30`,
                cursor: 'pointer',
                opacity: findingDevice === selectedScanDevice.ip_address ? 0.6 : 1,
              }}
              whileHover={{ background: `${colors.warning}25` }}
              whileTap={{ scale: 0.98 }}
            >
              {findingDevice === selectedScanDevice.ip_address ? (
                <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.warning }} />
              ) : (
                <RiEyeLine size={18} style={{ color: colors.warning }} />
              )}
              <span style={{ fontSize: '14px', fontWeight: 600, color: colors.warning }}>
                {findingDevice === selectedScanDevice.ip_address ? 'Lampeggio in corso...' : 'TROVAMI'}
              </span>
            </motion.button>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setAddFromScanModalOpen(false);
                setSelectedScanDevice(null);
                setScanDeviceName('');
              }}
              fullWidth
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAddFromScan}
              fullWidth
              disabled={!scanDeviceName.trim()}
            >
              Aggiungi
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
