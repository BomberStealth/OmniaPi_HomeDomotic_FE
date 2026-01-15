import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useAuthStore } from '@/store/authStore';
import { useStanzeStore } from '@/store/stanzeStore';
import { useSceneStore } from '@/store/sceneStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { sceneApi, tasmotaApi } from '@/services/api';
import { omniapiApi } from '@/services/omniapiApi';
import { DeviceCard } from '@/components/dispositivi/DeviceCard';
import { SceneIcon } from '@/pages/Scene/Scene';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine, RiTempHotLine, RiLoader4Line, RiUnpinLine,
  RiArrowDownSLine, RiBox3Line, RiFlashlightLine, RiHistoryLine
} from 'react-icons/ri';
import { toast } from '@/utils/toast';
import { getRoomIcon } from '@/config/roomIcons';
import { spacing, radius } from '@/styles/responsive';

// Icone meteo
const weatherIcons: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// ============================================
// DASHBOARD PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Helper per formattare tempo relativo
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'ora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ore fa`;
  return `${Math.floor(diff / 86400)} giorni fa`;
};


// Variants per animazioni card stanze (uniformi per tutte)
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
};

export const Dashboard = () => {
  useTranslation(); // Hook per traduzioni (non usato direttamente ma necessario)
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors, modeColors } = useThemeColor();
  const { user } = useAuthStore();

  // Store data (real-time via useRealTimeSync nel Layout)
  const { stanze } = useStanzeStore();
  const { scene } = useSceneStore();
  const { dispositivi, updatePowerState } = useDispositiviStore();

  const [expandedRooms, setExpandedRooms] = useState<Record<number, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [executing, setExecuting] = useState<number | null>(null);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [togglingAll, setTogglingAll] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: number; icon: string } | null>(null);
  const [recentActivity] = useState<any[]>([]);  // Placeholder per futuro

  // Deriva sceneShortcuts dallo store
  const sceneShortcuts = useMemo(() => {
    const shortcuts = scene.filter((s: any) => s.is_shortcut !== false && s.is_shortcut !== 0);
    // Ordina: Entra → Esci → Giorno → Notte → altre (alfabetico)
    const ordineScene = ['Entra', 'Esci', 'Giorno', 'Notte'];
    return [...shortcuts].sort((a: any, b: any) => {
      const indexA = ordineScene.indexOf(a.nome);
      const indexB = ordineScene.indexOf(b.nome);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.nome.localeCompare(b.nome);
    });
  }, [scene]);

  // Colori dinamici basati sul tema (usa modeColors per dark/light)
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);

  // Inizializza stanze espanse quando cambiano (tutte chiuse di default)
  useEffect(() => {
    if (stanze.length > 0) {
      setExpandedRooms(prev => {
        const newState: Record<number, boolean> = {};
        stanze.forEach((s: any) => {
          newState[s.id] = prev[s.id] ?? false; // Mantieni stato esistente o chiuso
        });
        return newState;
      });
    }
  }, [stanze]);

  // Fetch meteo (Rimini default)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=44.06&longitude=12.57&current_weather=true');
        const data = await res.json();
        if (data.current_weather) {
          const code = data.current_weather.weathercode;
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            icon: weatherIcons[code] || '🌡️'
          });
        }
      } catch {
        // Silently fail
      }
    };
    fetchWeather();
  }, []);

  // Attività recente - placeholder per futuro
  // useEffect per fetch activity quando l'API sarà disponibile

  const toggleRoom = (roomId: number) => {
    setExpandedRooms(prev => {
      const newState = { ...prev };
      const newValue = !newState[roomId];

      // Caso speciale: "Non assegnati" (id = -1)
      if (roomId === -1) {
        newState[-1] = newValue;
        return newState;
      }

      if (isMobile) {
        // Mobile: toggle singola stanza
        newState[roomId] = newValue;
      } else {
        // Desktop: toggle stanze sulla stessa riga (grid 2 colonne)
        const roomIndex = stanze.findIndex((s: any) => s.id === roomId);
        const row = Math.floor(roomIndex / 2);
        const startIndex = row * 2;

        // Toggle entrambe le stanze nella riga
        if (stanze[startIndex]) newState[stanze[startIndex].id] = newValue;
        if (stanze[startIndex + 1]) newState[stanze[startIndex + 1].id] = newValue;
      }

      return newState;
    });
  };

  const toggleDevice = async (dispositivo: any) => {
    if (togglingDevice === dispositivo.id) return;
    setTogglingDevice(dispositivo.id);
    try {
      const newState = !dispositivo.power_state;

      // OmniaPi nodes use MQTT via gateway
      if (dispositivo.device_type === 'omniapi_node') {
        await omniapiApi.controlNode(dispositivo.id, 1, newState ? 'on' : 'off');
      } else {
        // Tasmota devices use HTTP
        await tasmotaApi.controlDispositivo(dispositivo.id, newState ? 'ON' : 'OFF');
      }

      // Update ottimistico - il WebSocket aggiornerà comunque
      updatePowerState(dispositivo.id, newState);
    } catch (error: any) {
      console.error('Errore toggle dispositivo:', error);
      // Gestione dispositivo bloccato
      if (error.response?.data?.blocked) {
        toast.error('Bloccato');
      } else {
        toast.error('Errore');
      }
    } finally {
      setTogglingDevice(null);
    }
  };

  const getDevicesByRoom = (stanzaId: number | null) => {
    return dispositivi.filter(d => d && d.stanza_id === stanzaId);
  };

  const unassignedDevices = dispositivi.filter(d => d && !d.stanza_id);

  const executeScene = async (scenaId: number) => {
    setExecuting(scenaId);
    try {
      const result = await sceneApi.executeScena(scenaId);
      // Mostra messaggio appropriato in base ai dispositivi bloccati
      if (result?.bloccati && result.bloccati > 0) {
        toast.warning(`OK (${result.bloccati} bloccat${result.bloccati === 1 ? 'o' : 'i'})`);
      } else {
        toast.success('OK');
      }
      // WebSocket aggiornerà automaticamente lo stato dispositivi
    } catch (error) {
      console.error('Errore esecuzione scena:', error);
      toast.error('Errore');
    } finally {
      setExecuting(null);
    }
  };

  const handleRemoveShortcut = async (scenaId: number) => {
    try {
      await sceneApi.toggleShortcut(scenaId, false);
      toast.success('Rimossa');
      // WebSocket aggiornerà automaticamente la scena
    } catch (error) {
      console.error('Errore rimozione shortcut:', error);
      toast.error('Errore');
    }
  };

  const getContextMenuItems = (scenaId: number): ContextMenuItem[] => [
    { label: 'Rimuovi dalle scorciatoie', icon: RiUnpinLine, onClick: () => handleRemoveShortcut(scenaId) }
  ];

  const dispositiviValidi = dispositivi.filter(d => d !== null && d !== undefined);
  const luci = dispositiviValidi.filter(d => d.tipo === 'luce');
  const luciOn = luci.filter(d => d.power_state).length;
  const totLuci = luci.length;
  const termostatiList = dispositiviValidi.filter(d => d.tipo === 'termostato');
  const termostati = termostatiList.length;

  const toggleAllLights = async () => {
    if (togglingAll || totLuci === 0) return;
    setTogglingAll('luci');
    const turnOn = luciOn < totLuci;
    let controllate = 0;
    let bloccate = 0;
    const luciControllate: number[] = [];

    try {
      for (const luce of luci) {
        try {
          // OmniaPi nodes use MQTT via gateway
          if (luce.device_type === 'omniapi_node') {
            await omniapiApi.controlNode(luce.id, 1, turnOn ? 'on' : 'off');
          } else {
            // Tasmota devices use HTTP
            await tasmotaApi.controlDispositivo(luce.id, turnOn ? 'ON' : 'OFF');
          }
          controllate++;
          luciControllate.push(luce.id);
        } catch (error: any) {
          if (error.response?.data?.blocked) {
            bloccate++;
          } else {
            throw error;
          }
        }
      }

      // Update ottimistico per le luci controllate
      luciControllate.forEach(id => updatePowerState(id, turnOn));

      if (bloccate > 0) {
        toast.warning(`${controllate} OK, ${bloccate} bloccat${bloccate === 1 ? 'a' : 'e'}`);
      } else {
        toast.success(turnOn ? 'Luci ON' : 'Luci OFF');
      }
    } catch (error) {
      console.error('Errore toggle luci:', error);
      toast.error('Errore');
    } finally {
      setTogglingAll(null);
    }
  };

  const toggleAllTermostati = async () => {
    if (togglingAll || termostati === 0) return;
    toast.info('Funzione termostati in arrivo!');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 13) return 'Buongiorno';
    if (hour >= 13 && hour < 18) return 'Buon pomeriggio';
    if (hour >= 18 && hour < 22) return 'Buonasera';
    return 'Buonanotte';
  };

  const userName = user?.nome || 'Utente';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header con Saluto e Meteo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0, lineHeight: 1.2 }}>
              {getGreeting()}, {userName.split(' ')[0]}
            </h1>
            {impiantoCorrente && (
              <p style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 0 0' }}>
                {impiantoCorrente.nome}
              </p>
            )}
          </div>
          {weather && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: `${colors.accent}15`,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <span style={{ fontSize: '18px' }}>{weather.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{weather.temp}°C</span>
            </motion.div>
          )}
        </div>

        {/* Quick Stats Card - RESPONSIVE */}
        <div
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: colors.cardShadowLit,
            padding: spacing.sm,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '25%',
              right: '25%',
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.xs, width: '100%' }}>
            {/* Luci con Progress Bar */}
            <motion.button
              onClick={toggleAllLights}
              disabled={togglingAll === 'luci' || totLuci === 0}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(4px, 1.5vw, 6px)',
                padding: 'clamp(8px, 2.5vw, 12px) clamp(4px, 1.5vw, 8px)',
                borderRadius: radius.md,
                background: 'transparent',
                border: 'none',
                cursor: totLuci === 0 ? 'not-allowed' : 'pointer',
                opacity: totLuci === 0 ? 0.5 : 1,
                minWidth: 'clamp(60px, 20vw, 100px)',
              }}
              whileHover={totLuci > 0 ? { scale: 1.02, background: `${colors.accent}10` } : undefined}
              whileTap={totLuci > 0 ? { scale: 0.98 } : undefined}
            >
              <div
                style={{
                  width: 'clamp(36px, 10vw, 48px)',
                  height: 'clamp(36px, 10vw, 48px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  background: luciOn > 0 ? `${colors.accent}30` : `${colors.accent}15`,
                  boxShadow: luciOn > 0 ? `0 0 16px ${colors.accent}40` : 'none',
                }}
              >
                {togglingAll === 'luci' ? (
                  <RiLoader4Line style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)', color: colors.accent }} className="animate-spin" />
                ) : (
                  <RiLightbulbLine
                    style={{
                      width: 'clamp(18px, 5vw, 24px)',
                      height: 'clamp(18px, 5vw, 24px)',
                      color: luciOn > 0 ? colors.accentLight : colors.accent,
                      filter: luciOn > 0 ? `drop-shadow(0 0 6px ${colors.accent})` : 'none',
                    }}
                  />
                )}
              </div>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  {luciOn}/{totLuci}
                </p>
                <p style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', color: colors.textMuted, margin: '2px 0 4px 0' }}>Luci</p>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: 'clamp(3px, 1vw, 4px)', background: `${colors.accent}20`, borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: totLuci > 0 ? `${(luciOn / totLuci) * 100}%` : '0%' }}
                    transition={{ duration: 0.5 }}
                    style={{ height: '100%', background: colors.accent, borderRadius: '2px' }}
                  />
                </div>
              </div>
            </motion.button>

            {/* Termostati/Clima */}
            <motion.button
              onClick={toggleAllTermostati}
              disabled={termostati === 0}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(4px, 1.5vw, 6px)',
                padding: 'clamp(8px, 2.5vw, 12px) clamp(4px, 1.5vw, 8px)',
                borderRadius: radius.md,
                background: 'transparent',
                border: 'none',
                cursor: termostati === 0 ? 'not-allowed' : 'pointer',
                opacity: termostati === 0 ? 0.5 : 1,
                minWidth: 'clamp(60px, 20vw, 100px)',
              }}
              whileHover={termostati > 0 ? { scale: 1.02, background: `${colors.accent}10` } : undefined}
              whileTap={termostati > 0 ? { scale: 0.98 } : undefined}
            >
              <div style={{
                width: 'clamp(36px, 10vw, 48px)',
                height: 'clamp(36px, 10vw, 48px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                background: `${colors.accent}15`
              }}>
                <RiTempHotLine style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)', color: colors.accent }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>
                  {termostati > 0 ? termostati : '--'}
                </p>
                <p style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', color: colors.textMuted, margin: '2px 0 0 0' }}>Clima</p>
              </div>
            </motion.button>

            {/* Energia (placeholder) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(4px, 1.5vw, 6px)',
                padding: 'clamp(8px, 2.5vw, 12px) clamp(4px, 1.5vw, 8px)',
                borderRadius: radius.md,
                opacity: 0.4,
                minWidth: 'clamp(60px, 20vw, 100px)',
              }}
            >
              <div style={{
                width: 'clamp(36px, 10vw, 48px)',
                height: 'clamp(36px, 10vw, 48px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                background: `${colors.accent}15`
              }}>
                <RiFlashlightLine style={{ width: 'clamp(18px, 5vw, 24px)', height: 'clamp(18px, 5vw, 24px)', color: colors.accent }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>--</p>
                <p style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', color: colors.textMuted, margin: '2px 0 0 0' }}>Energia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scene Rapide */}
        {sceneShortcuts.length > 0 && (
          <div
            style={{
              background: colors.bgCardLit,
              border: `1px solid ${colors.border}`,
              borderRadius: '20px',
              boxShadow: colors.cardShadowLit,
              padding: '10px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {sceneShortcuts.filter(s => s !== null && s !== undefined).map((scena) => (
                <ContextMenu key={scena.id} items={getContextMenuItems(scena.id)}>
                  <motion.button
                    onClick={() => executeScene(scena.id)}
                    disabled={executing === scena.id}
                    style={{
                      width: '52px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '3px',
                      padding: '8px 4px',
                      background: colors.bgCardLit,
                      border: executing === scena.id ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                      borderRadius: '14px',
                      boxShadow: executing === scena.id ? `0 0 12px ${colors.accent}30` : colors.cardShadowLit,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    whileHover={{ scale: 1.05, borderColor: colors.borderHover }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: `${colors.accent}15`,
                    }}>
                      {executing === scena.id ? (
                        <RiLoader4Line size={16} className="animate-spin" style={{ color: colors.accent }} />
                      ) : (
                        <SceneIcon
                          iconId={scena.icona}
                          size={16}
                          style={{
                            color: colors.accentLight,
                            filter: `drop-shadow(0 0 3px ${colors.accent}50)`,
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        textAlign: 'center',
                        lineHeight: 1.1,
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {scena.nome}
                    </span>
                  </motion.button>
                </ContextMenu>
              ))}
            </div>
          </div>
        )}

        {/* Attività Recente */}
        {recentActivity.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <RiHistoryLine size={14} style={{ color: colors.textMuted }} />
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                Attività recente
              </h2>
            </div>
            <div
              style={{
                background: colors.bgCardLit,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '8px 12px',
                overflow: 'hidden',
              }}
            >
              {recentActivity.slice(0, 4).map((activity, index) => (
                <div
                  key={activity.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < Math.min(recentActivity.length, 4) - 1 ? `1px solid ${colors.border}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                    {activity.descrizione || activity.azione}
                  </span>
                  <span style={{ fontSize: '10px', color: colors.textMuted }}>
                    {activity.tempo_fa || formatTimeAgo(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stanze e Dispositivi */}
        {impiantoCorrente && (stanze.length > 0 || unassignedDevices.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
              Stanze e Dispositivi
            </h2>

            <motion.div
              initial="hidden"
              animate="show"
              variants={containerVariants}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}
            >
              {stanze.map((stanza) => {
                const roomDevices = getDevicesByRoom(stanza.id);
                const isExpanded = expandedRooms[stanza.id];
                const devicesOn = roomDevices.filter(d => d.power_state).length;

                return (
                  <motion.div
                    key={stanza.id}
                    variants={cardVariants}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: colors.bgCardLit,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '24px',
                      boxShadow: devicesOn > 0 ? `0 0 20px ${colors.accent}30` : colors.cardShadowLit,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '25%',
                        right: '25%',
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
                      }}
                    />

                    <motion.button
                      onClick={() => toggleRoom(stanza.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      whileHover={{ background: 'rgba(255, 255, 255, 0.02)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            padding: '8px',
                            borderRadius: '12px',
                            background: `${colors.accent}20`,
                            boxShadow: `0 0 8px ${colors.accent}30`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {(() => { const Icon = getRoomIcon(stanza.icona); return <Icon size={20} style={{ color: colors.accent }} />; })()}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                            {stanza.nome}
                          </h3>
                          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                            {roomDevices.length} dispositiv{roomDevices.length === 1 ? 'o' : 'i'}
                            {devicesOn > 0 && (
                              <span style={{ color: colors.accent, marginLeft: '4px' }}>({devicesOn} ON)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <RiArrowDownSLine size={20} style={{ color: colors.textMuted }} />
                      </motion.div>
                    </motion.button>

                    {isExpanded && roomDevices.length > 0 && (
                      <div style={{ padding: '12px', borderTop: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                          {roomDevices.map((dispositivo) => (
                            <DeviceCard
                              key={dispositivo.id}
                              nome={dispositivo.nome}
                              isOn={!!dispositivo.power_state}
                              isLoading={togglingDevice === dispositivo.id}
                              bloccato={!!dispositivo.bloccato}
                              onClick={() => toggleDevice(dispositivo)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rimuove il blocco "Nessun dispositivo" - stanza chiusa = solo header */}
                  </motion.div>
                );
              })}

              {/* Dispositivi non assegnati */}
              {unassignedDevices.length > 0 && (
                <motion.div
                  variants={cardVariants}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: colors.bgCardLit,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '24px',
                    boxShadow: colors.cardShadowLit,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '25%',
                      right: '25%',
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />

                  <motion.button
                    onClick={() => toggleRoom(-1)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    whileHover={{ background: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(156, 163, 175, 0.15)' }}>
                        <RiBox3Line size={20} style={{ color: '#9ca3af' }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                          Non assegnati
                        </h3>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                          {unassignedDevices.length} dispositiv{unassignedDevices.length === 1 ? 'o' : 'i'}
                        </p>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: expandedRooms[-1] ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <RiArrowDownSLine size={20} style={{ color: colors.textMuted }} />
                    </motion.div>
                  </motion.button>

                  {expandedRooms[-1] && (
                    <div style={{ padding: '12px', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                        {unassignedDevices.map((dispositivo) => (
                          <DeviceCard
                            key={dispositivo.id}
                            nome={dispositivo.nome}
                            isOn={!!dispositivo.power_state}
                            isLoading={togglingDevice === dispositivo.id}
                            bloccato={!!dispositivo.bloccato}
                            onClick={() => toggleDevice(dispositivo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {/* Messaggio se nessun impianto */}
        {!impiantoCorrente && (
          <div
            style={{
              background: colors.bgCardLit,
              border: `1px solid ${colors.border}`,
              borderRadius: '28px',
              boxShadow: colors.cardShadowLit,
              padding: '32px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '25%',
                right: '25%',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
              }}
            />
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
              Seleziona un impianto per vedere i tuoi dispositivi
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};
