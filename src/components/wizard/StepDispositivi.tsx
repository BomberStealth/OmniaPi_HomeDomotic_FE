import { useState, useCallback } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { DeviceIcon } from '@/components/dispositivi';
import { DeviceDiscovery, DiscoveredDevice } from '@/components/dispositivi/DeviceDiscovery';
import { getDeviceConfig } from '@/config/deviceTypes';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiDeviceLine,
  RiCheckLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { ROOM_ICON_OPTIONS, getRoomIcon } from '@/config/roomIcons';

// ============================================
// STEP 4: AGGIUNGI DISPOSITIVI
// Usa DeviceDiscovery unificato
// ============================================

interface StepDispositiviProps {
  impiantoId?: number;
  dispositivi: Array<{
    mac: string;
    nome: string;
    device_type?: string;
    stanza_nome?: string;
    stanza_icona?: string;
  }>;
  onAddDispositivo: (dispositivo: {
    mac: string;
    nome: string;
    device_type?: string;
    stanza_nome?: string;
    stanza_icona?: string;
  }) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const StepDispositivi = ({
  dispositivi,
  onAddDispositivo,
  onNext,
  onSkip,
  onBack,
}: StepDispositiviProps) => {
  const { modeColors, isDarkMode, colors } = useThemeColor();

  // Form per aggiungere dispositivo
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [stanzaName, setStanzaName] = useState('');
  const [stanzaIcona, setStanzaIcona] = useState('');
  const [error, setError] = useState('');

  // Ref per refresh esterno
  const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);

  // Stanze già inserite (per autocompletamento)
  const stanzeGiaInserite = [...new Set(dispositivi.map(d => d.stanza_nome).filter(Boolean))];

  // MAC già aggiunti
  const existingMacs = dispositivi.map(d => d.mac);

  // Callback quando DeviceDiscovery seleziona un dispositivo
  const handleDeviceSelected = (device: DiscoveredDevice) => {
    setSelectedDevice(device);
    setDeviceName(
      device.device_type === 'omniapi_led'
        ? 'LED Strip'
        : `Interruttore ${device.mac.slice(-5)}`
    );
    setStanzaName('');
    setStanzaIcona('');
    setError('');
  };

  // Aggiungi dispositivo alla lista locale (registrazione in Step 5)
  const handleAddDevice = () => {
    if (!selectedDevice || !deviceName.trim()) {
      setError('Inserisci un nome per il dispositivo');
      return;
    }

    setError('');

    // Salva solo in locale - la registrazione avverrà a Step 5
    onAddDispositivo({
      mac: selectedDevice.mac,
      nome: deviceName.trim(),
      device_type: selectedDevice.device_type,
      stanza_nome: stanzaName.trim() || undefined,
      stanza_icona: stanzaIcona || undefined,
    });

    // Reset form
    setSelectedDevice(null);
    setDeviceName('');
    setStanzaName('');
    setStanzaIcona('');
  };

  const handleCancelSelection = () => {
    setSelectedDevice(null);
    setDeviceName('');
    setStanzaName('');
    setStanzaIcona('');
    setError('');
  };

  // Callback per ricevere la funzione refresh da DeviceDiscovery
  const handleRefreshRef = useCallback((fn: () => Promise<void>) => {
    setRefreshFn(() => fn);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: spacing.md }}
      >
        <div className="flex items-center" style={{ gap: spacing.sm }}>
          <div
            style={{
              padding: spacing.sm,
              borderRadius: radius.md,
              background: 'rgba(234, 179, 8, 0.2)',
            }}
          >
            <RiDeviceLine size={24} className="text-warning" />
          </div>
          <div>
            <h2
              style={{
                fontSize: fontSize.lg,
                fontWeight: 'bold',
                color: modeColors.textPrimary,
              }}
            >
              Aggiungi Dispositivi
            </h2>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
              Seleziona i dispositivi da aggiungere
            </p>
          </div>
        </div>
        {/* Refresh button - usa la funzione esposta da DeviceDiscovery */}
        {refreshFn && !selectedDevice && (
          <Button variant="ghost" size="sm" onClick={refreshFn}>
            <RiRefreshLine size={18} />
          </Button>
        )}
      </div>

      {/* Lista dispositivi già aggiunti */}
      {dispositivi.length > 0 && (
        <div style={{ marginBottom: spacing.md }}>
          <p
            style={{
              fontSize: fontSize.xs,
              color: modeColors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Dispositivi aggiunti ({dispositivi.length}):
          </p>
          <div>
            {dispositivi.map((d) => (
              <div
                key={d.mac}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: spacing.sm,
                  borderRadius: radius.md,
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  marginBottom: spacing.xs,
                  gap: spacing.sm,
                }}
              >
                <RiCheckLine size={16} className="text-success flex-shrink-0" />
                <DeviceIcon
                  deviceType={d.device_type || 'omniapi_node'}
                  size={16}
                  className="flex-shrink-0"
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: fontSize.sm,
                    color: modeColors.textPrimary,
                  }}
                >
                  {d.nome}
                </span>
                <span
                  style={{
                    fontSize: fontSize.xs,
                    color: modeColors.textMuted,
                  }}
                >
                  {d.stanza_nome || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form aggiunta dispositivo */}
      {selectedDevice ? (
        <Card variant="glass-dark" style={{ padding: spacing.md, marginBottom: spacing.sm }}>
          <div
            className="flex items-center"
            style={{ gap: spacing.sm, marginBottom: spacing.md }}
          >
            <DeviceIcon
              deviceType={selectedDevice.device_type}
              size={24}
              className="text-white"
            />
            <div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: fontSize.sm,
                  color: modeColors.textPrimary,
                }}
              >
                Configura: {getDeviceConfig(selectedDevice.device_type)?.name || selectedDevice.mac.slice(-8)}
              </p>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                MAC: {selectedDevice.mac}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <Input
              label="Nome Dispositivo"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="es. Luce Soggiorno"
            />

            {/* Nome stanza con selezione icona */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: fontSize.xs,
                  color: modeColors.textSecondary,
                  marginBottom: spacing.xs,
                }}
              >
                Stanza (opzionale) - clicca un'icona o scrivi
              </label>
              {/* Griglia icone stanze */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  marginBottom: spacing.sm,
                }}
              >
                {ROOM_ICON_OPTIONS.slice(0, 8).map((opt) => {
                  const Icon = getRoomIcon(opt.id);
                  const isSelected = stanzaIcona === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setStanzaName(opt.label); setStanzaIcona(opt.id); }}
                      style={{
                        padding: '8px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        borderRadius: radius.sm,
                        border: isSelected ? `2px solid ${colors.accent}` : `1px solid ${modeColors.border}`,
                        background: isSelected ? `${colors.accent}20` : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon size={18} style={{ color: isSelected ? colors.accent : modeColors.textMuted }} />
                      <span style={{ fontSize: '9px', color: isSelected ? colors.accent : modeColors.textMuted }}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                list="stanze-list"
                value={stanzaName}
                onChange={(e) => setStanzaName(e.target.value)}
                placeholder="es. Soggiorno"
                style={{
                  width: '100%',
                  height: 'clamp(38px, 9vw, 44px)',
                  padding: '0 clamp(10px, 2.5vw, 14px)',
                  borderRadius: radius.sm,
                  background: isDarkMode ? modeColors.bgSecondary : '#f0f0f0',
                  border: `1px solid ${modeColors.border}`,
                  color: modeColors.textPrimary,
                  fontSize: 'clamp(13px, 3.2vw, 15px)',
                }}
              />
              <datalist id="stanze-list">
                {stanzeGiaInserite.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: fontSize.xs }}>{error}</p>
            )}

            <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
              <Button variant="glass" onClick={handleCancelSelection}>
                Annulla
              </Button>
              <button
                onClick={handleAddDevice}
                style={{
                  flex: 1,
                  height: 'clamp(38px, 9vw, 44px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  padding: '0 clamp(10px, 2.5vw, 14px)',
                  borderRadius: radius.sm,
                  background: colors.accent,
                  border: 'none',
                  color: '#fff',
                  fontSize: 'clamp(13px, 3.2vw, 15px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span style={{ lineHeight: 1 }}>+</span>
                <span>Aggiungi</span>
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Device Discovery - COMPONENTE UNIFICATO */
        <div style={{ marginBottom: spacing.sm }}>
          <DeviceDiscovery
            onDeviceSelected={handleDeviceSelected}
            excludeMacs={existingMacs}
            showRefreshButton={false}
            compact={true}
            onRefreshRef={handleRefreshRef}
          />
        </div>
      )}

      {/* Bottoni navigazione */}
      <div
        className="flex flex-wrap justify-between"
        style={{ gap: spacing.sm, paddingTop: spacing.sm }}
      >
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
        <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
          <Button variant="glass" onClick={onSkip}>
            Salta
          </Button>
          {dispositivi.length > 0 && (
            <Button variant="primary" onClick={onNext}>
              Avanti
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
