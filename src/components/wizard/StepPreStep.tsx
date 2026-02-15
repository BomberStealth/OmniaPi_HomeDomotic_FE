import { useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiRouterLine,
  RiPlugLine,
  RiBluetoothLine,
  RiWifiLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowLeftSLine,
  RiSearchLine,
  RiLockLine,
  RiEditLine,
} from 'react-icons/ri';
import {
  isBleSupported,
  scanForGateway,
  connectAndScan,
  provisionWithConnection,
  provisionWiFi,
  type ProvProgress,
  type WiFiNetwork,
  type BleConnection,
} from '@/utils/bleProvisioning';

// ============================================
// PRE-STEP (Step 0): Collegamento Gateway
// ============================================

interface StepPreStepProps {
  onReady: () => void;
}

type View = 'main' | 'ethernet' | 'bluetooth';
type BleStep = 'scan' | 'scanning' | 'networks' | 'password' | ProvProgress;

export const StepPreStep = ({ onReady }: StepPreStepProps) => {
  const { modeColors, colors, isDarkMode } = useThemeColor();
  const [view, setView] = useState<View>('main');

  // BLE state
  const [bleStep, setBleStep] = useState<BleStep>('scan');
  const [bleDevice, setBleDevice] = useState<BluetoothDevice | null>(null);
  const [bleMessage, setBleMessage] = useState('');
  const [bleScanning, setBleScanning] = useState(false);
  const [bleConnection, setBleConnection] = useState<BleConnection | null>(null);

  // WiFi state
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAuth, setSelectedAuth] = useState(0);

  const hasBle = isBleSupported();

  // ---- BLE handlers ----
  const handleBleScan = async () => {
    setBleScanning(true);
    try {
      const device = await scanForGateway();
      setBleDevice(device);
      setBleStep('scanning');
      setBleMessage('Connessione al gateway...');

      try {
        const { networks, connection } = await connectAndScan(
          device,
          (msg) => setBleMessage(msg)
        );
        setBleConnection(connection);
        setWifiNetworks(networks);
        setBleStep('networks');
        setBleMessage('');
      } catch (e) {
        const err = e as Error;
        setBleMessage(err.message || 'Errore connessione');
        setBleStep('networks'); // Show empty list with manual option
      }
    } catch (e) {
      const err = e as Error;
      if (err.name !== 'NotFoundError' && !err.message?.includes('cancelled')) {
        setBleMessage(err.message || 'Errore scansione');
      }
      setBleStep('scan');
    }
    setBleScanning(false);
  };

  const handleNetworkSelect = (network: WiFiNetwork) => {
    setWifiSsid(network.ssid);
    setSelectedAuth(network.auth);
    setWifiPassword('');
    setShowPassword(false);

    if (network.auth === 0) {
      // Open network — provision directly
      handleProvision(network.ssid, '');
    } else {
      setBleStep('password');
    }
  };

  const fetchMqttBrokerUri = async (): Promise<string> => {
    const apiUrl = import.meta.env.VITE_API_URL as string || '';
    try {
      const resp = await fetch(`${apiUrl}/api/system/mqtt-broker`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.uri) return data.uri;
      }
    } catch { /* fall through */ }
    // Fallback: same host serving the frontend
    return `mqtt://${window.location.hostname}:1883`;
  };

  const handleProvision = async (ssid?: string, password?: string) => {
    const s = ssid ?? wifiSsid;
    const p = password ?? wifiPassword;
    if (!s) return;

    const mqttBrokerUri = await fetchMqttBrokerUri();

    const onProgress = (step: ProvProgress, msg: string) => {
      setBleStep(step);
      setBleMessage(msg);
    };

    let success: boolean;
    if (bleConnection) {
      success = await provisionWithConnection(bleConnection, s, p, onProgress, mqttBrokerUri);
    } else if (bleDevice) {
      success = await provisionWiFi(bleDevice, s, p, onProgress, mqttBrokerUri);
    } else {
      return;
    }

    if (success) setTimeout(() => onReady(), 3000);
  };

  const resetBle = () => {
    if (bleConnection) {
      try { bleConnection.gattServer.disconnect(); } catch { /* ok */ }
    }
    setBleStep('scan');
    setBleDevice(null);
    setBleMessage('');
    setBleScanning(false);
    setBleConnection(null);
    setWifiNetworks([]);
    setWifiSsid('');
    setWifiPassword('');
    setShowPassword(false);
  };

  const bleIsWorking = ['connecting', 'session', 'sending', 'applying'].includes(bleStep);

  const getSignalColor = (rssi: number) => {
    if (rssi > -50) return '#22c55e';
    if (rssi > -70) return '#f59e0b';
    return '#ef4444';
  };

  // ---- Shared styles ----
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: radius.md,
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    color: modeColors.textPrimary,
    fontSize: fontSize.md,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const optionCardStyle = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    background: `${color}0A`,
    border: `2px solid ${color}30`,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'transform 0.15s, border-color 0.15s',
  });

  const iconCircleStyle = (color: string): React.CSSProperties => ({
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: `${color}18`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  // ============================================
  // VIEW: Ethernet instructions
  // ============================================
  if (view === 'ethernet') {
    return (
      <Card variant="glass" style={{ padding: spacing.md }}>
        <button
          onClick={() => setView('main')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: modeColors.textSecondary, fontSize: fontSize.sm, background: 'none', border: 'none', cursor: 'pointer', marginBottom: spacing.md, padding: 0 }}
        >
          <RiArrowLeftSLine size={18} /> Indietro
        </button>

        <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <div style={iconCircleStyle('#22c55e')}>
            <RiPlugLine style={{ width: 24, height: 24, color: '#22c55e' }} />
          </div>
          <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: modeColors.textPrimary }}>
            Collegamento Ethernet
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.lg }}>
          {[
            'Collega il gateway alla corrente',
            'Collega il cavo Ethernet al router',
            'Attendi 30 secondi',
          ].map((text, i) => (
            <div key={i} className="flex items-center" style={{ gap: spacing.sm }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: fontSize.sm, fontWeight: 700, color: '#22c55e' }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: fontSize.md, color: modeColors.textPrimary }}>{text}</span>
            </div>
          ))}
        </div>

        <Button variant="primary" fullWidth onClick={onReady}>
          Pronto, procedi
        </Button>
      </Card>
    );
  }

  // ============================================
  // VIEW: Bluetooth provisioning
  // ============================================
  if (view === 'bluetooth') {
    return (
      <Card variant="glass" style={{ padding: spacing.md }}>
        <button
          onClick={() => { resetBle(); setView('main'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: modeColors.textSecondary, fontSize: fontSize.sm, background: 'none', border: 'none', cursor: 'pointer', marginBottom: spacing.md, padding: 0 }}
        >
          <RiArrowLeftSLine size={18} /> Indietro
        </button>

        <div className="flex items-center" style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <div style={iconCircleStyle('#60a5fa')}>
            <RiBluetoothLine style={{ width: 24, height: 24, color: '#60a5fa' }} />
          </div>
          <h2 style={{ fontSize: fontSize.lg, fontWeight: 'bold', color: modeColors.textPrimary }}>
            Configura WiFi via Bluetooth
          </h2>
        </div>

        {/* Step 1: Scan for gateway */}
        {bleStep === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
              Accendi il gateway senza cavo Ethernet. Apparirà come dispositivo Bluetooth.
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleBleScan}
              disabled={bleScanning}
            >
              {bleScanning ? (
                <><RiLoader4Line style={{ animation: 'spin 1s linear infinite' }} size={20} /> Seleziona dal popup...</>
              ) : (
                <><RiSearchLine size={20} /> Cerca Gateway</>
              )}
            </Button>
            {bleMessage && (
              <p style={{ fontSize: fontSize.sm, color: '#ef4444' }}>{bleMessage}</p>
            )}
          </div>
        )}

        {/* Step 2: Scanning WiFi networks */}
        {bleStep === 'scanning' && (
          <div className="flex items-center" style={{ gap: spacing.sm, padding: spacing.md, justifyContent: 'center' }}>
            <RiLoader4Line style={{ color: '#60a5fa', width: 24, height: 24, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: fontSize.md, color: modeColors.textPrimary }}>{bleMessage}</span>
          </div>
        )}

        {/* Step 3: Network list */}
        {bleStep === 'networks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Connected device badge */}
            {bleDevice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.md, background: 'rgba(96,165,250,0.1)', marginBottom: spacing.xs }}>
                <RiBluetoothLine style={{ color: '#60a5fa', width: 16, height: 16 }} />
                <span style={{ fontSize: fontSize.sm, fontWeight: 600, color: '#60a5fa' }}>
                  {bleDevice.name}
                </span>
                <RiCheckboxCircleLine style={{ color: '#22c55e', width: 16, height: 16, marginLeft: 'auto' }} />
              </div>
            )}

            {wifiNetworks.length > 0 ? (
              <>
                <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
                  Seleziona la rete WiFi:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {wifiNetworks.map((net, i) => (
                    <button
                      key={`${net.ssid}-${i}`}
                      onClick={() => handleNetworkSelect(net)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: `${spacing.sm} ${spacing.md}`,
                        borderRadius: radius.md,
                        background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <RiWifiLine style={{ width: 20, height: 20, color: getSignalColor(net.rssi), flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: fontSize.md, color: modeColors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {net.ssid}
                      </span>
                      {net.auth !== 0 && (
                        <RiLockLine style={{ width: 14, height: 14, color: modeColors.textMuted, flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, textAlign: 'center', padding: spacing.md }}>
                {bleMessage || 'Nessuna rete trovata'}
              </p>
            )}

            {/* Manual entry link */}
            <button
              onClick={() => {
                setWifiSsid('');
                setWifiPassword('');
                setSelectedAuth(1); // assume protected
                setBleStep('password');
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                color: colors.accent, fontSize: fontSize.sm, background: 'none',
                border: 'none', cursor: 'pointer', padding: spacing.xs, marginTop: 4,
              }}
            >
              <RiEditLine size={14} /> Inserisci manualmente
            </button>
          </div>
        )}

        {/* Step 4: Password form */}
        {bleStep === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Back to networks */}
            <button
              onClick={() => { setBleStep('networks'); setWifiPassword(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: modeColors.textSecondary, fontSize: fontSize.sm, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <RiArrowLeftSLine size={16} /> Reti disponibili
            </button>

            {/* SSID display or manual input */}
            {wifiSsid ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: spacing.xs,
                padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.md,
                background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              }}>
                <RiWifiLine style={{ width: 18, height: 18, color: colors.accent }} />
                <span style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
                  {wifiSsid}
                </span>
                {selectedAuth !== 0 && (
                  <RiLockLine style={{ width: 14, height: 14, color: modeColors.textMuted, marginLeft: 'auto' }} />
                )}
              </div>
            ) : (
              <div>
                <label style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, display: 'block', marginBottom: 4 }}>
                  Rete WiFi
                </label>
                <input
                  type="text"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder="Es. Casa-WiFi, Vodafone-12345..."
                  style={inputStyle}
                  autoFocus
                />
              </div>
            )}

            {/* Password field (only for protected networks) */}
            {selectedAuth !== 0 && (
              <div>
                <label style={{ fontSize: fontSize.sm, color: modeColors.textSecondary, display: 'block', marginBottom: 4 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Password WiFi"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    autoFocus={!!wifiSsid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: modeColors.textMuted, padding: 4 }}
                  >
                    {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                  </button>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={() => handleProvision()}
              disabled={!wifiSsid}
              style={{ marginTop: spacing.xs }}
            >
              Connetti
            </Button>
          </div>
        )}

        {/* Working states */}
        {bleIsWorking && (
          <div className="flex items-center" style={{ gap: spacing.sm, padding: spacing.md }}>
            <RiLoader4Line style={{ color: '#60a5fa', width: 24, height: 24, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: fontSize.md, color: modeColors.textPrimary }}>{bleMessage}</span>
          </div>
        )}

        {/* Success */}
        {bleStep === 'success' && (
          <div className="flex items-center" style={{ gap: spacing.sm, padding: spacing.md }}>
            <RiCheckboxCircleLine style={{ color: '#22c55e', width: 28, height: 28, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: fontSize.md, fontWeight: 600, color: '#22c55e' }}>Gateway configurato!</p>
              <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>Riavvio in corso...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {bleStep === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <p style={{ fontSize: fontSize.sm, color: '#ef4444' }}>{bleMessage}</p>
            <Button variant="ghost" size="sm" onClick={resetBle}>
              Riprova
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // ============================================
  // VIEW: Main — 3 clean option cards
  // ============================================
  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div className="flex flex-col items-center text-center" style={{ marginBottom: spacing.lg }}>
        <div style={{ padding: spacing.md, borderRadius: '50%', background: `${colors.accent}15`, marginBottom: spacing.sm }}>
          <RiRouterLine style={{ width: 'clamp(32px, 9vw, 44px)', height: 'clamp(32px, 9vw, 44px)', color: colors.accent }} />
        </div>
        <h2 style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: modeColors.textPrimary, marginBottom: 4 }}>
          Collega il Gateway
        </h2>
        <p style={{ fontSize: fontSize.sm, color: modeColors.textSecondary }}>
          Come vuoi collegare il gateway alla rete?
        </p>
      </div>

      {/* 3 options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {/* A: Ethernet */}
        <button onClick={() => setView('ethernet')} style={optionCardStyle('#22c55e')}>
          <div style={iconCircleStyle('#22c55e')}>
            <RiPlugLine style={{ width: 24, height: 24, color: '#22c55e' }} />
          </div>
          <div>
            <p style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              Cavo Ethernet
            </p>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
              Il metodo più affidabile
            </p>
          </div>
        </button>

        {/* B: Bluetooth */}
        {hasBle && (
          <button onClick={() => setView('bluetooth')} style={optionCardStyle('#60a5fa')}>
            <div style={iconCircleStyle('#60a5fa')}>
              <RiBluetoothLine style={{ width: 24, height: 24, color: '#60a5fa' }} />
            </div>
            <div>
              <p style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
                Configura WiFi via Bluetooth
              </p>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                Per installazioni senza cavo
              </p>
            </div>
          </button>
        )}

        {/* C: Already connected */}
        <button onClick={onReady} style={optionCardStyle(colors.accent)}>
          <div style={iconCircleStyle(colors.accent)}>
            <RiWifiLine style={{ width: 24, height: 24, color: colors.accent }} />
          </div>
          <div>
            <p style={{ fontSize: fontSize.md, fontWeight: 600, color: modeColors.textPrimary }}>
              Il gateway è già connesso
            </p>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
              Se hai già configurato la rete
            </p>
          </div>
        </button>
      </div>
    </Card>
  );
};
