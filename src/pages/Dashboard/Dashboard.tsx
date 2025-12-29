import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { ContextMenu, ContextMenuItem } from '@/components/common/ContextMenu';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useAuthStore } from '@/store/authStore';
import { sceneApi, tasmotaApi, stanzeApi } from '@/services/api';
import { DeviceCard } from '@/components/dispositivi/DeviceCard';
import { SceneIcon } from '@/pages/Scene/Scene';
import { motion } from 'framer-motion';
import {
  RiLightbulbLine, RiTempHotLine, RiLoader4Line, RiUnpinLine,
  RiArrowDownSLine, RiHome4Line, RiSofaLine, RiHotelBedLine, RiRestaurantLine,
  RiDropLine, RiTvLine, RiPlantLine, RiCarLine, RiStore2Line, RiBox3Line
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { toast } from 'sonner';

// ============================================
// DASHBOARD PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Mappa icone per tipo stanza
const getRoomIcon = (nome: string): IconType => {
  const lowerNome = nome.toLowerCase();
  if (lowerNome.includes('soggiorno') || lowerNome.includes('living') || lowerNome.includes('salotto')) return RiSofaLine;
  if (lowerNome.includes('camera') || lowerNome.includes('letto') || lowerNome.includes('bedroom')) return RiHotelBedLine;
  if (lowerNome.includes('cucina') || lowerNome.includes('kitchen')) return RiRestaurantLine;
  if (lowerNome.includes('bagno') || lowerNome.includes('bathroom')) return RiDropLine;
  if (lowerNome.includes('tv') || lowerNome.includes('media') || lowerNome.includes('studio')) return RiTvLine;
  if (lowerNome.includes('giardino') || lowerNome.includes('garden') || lowerNome.includes('esterno')) return RiPlantLine;
  if (lowerNome.includes('garage') || lowerNome.includes('box auto')) return RiCarLine;
  if (lowerNome.includes('cantina') || lowerNome.includes('magazzino')) return RiStore2Line;
  return RiHome4Line;
};

export const Dashboard = () => {
  const { t } = useTranslation();
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors } = useThemeColor();
  const { user } = useAuthStore();
  const [sceneShortcuts, setSceneShortcuts] = useState<any[]>([]);
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [stanze, setStanze] = useState<any[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set());
  const [executing, setExecuting] = useState<number | null>(null);
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null);
  const [togglingAll, setTogglingAll] = useState<string | null>(null);

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

  useEffect(() => {
    if (impiantoCorrente) {
      loadScene();
      loadDispositivi();
      loadStanze();
    }
  }, [impiantoCorrente]);

  const loadScene = async () => {
    if (!impiantoCorrente) return;
    try {
      const data = await sceneApi.getScene(impiantoCorrente.id);
      const scenes = Array.isArray(data) ? data : [];
      const shortcuts = scenes.filter((s: any) => s.is_shortcut !== false && s.is_shortcut !== 0);
      setSceneShortcuts(shortcuts);
    } catch (error) {
      console.error('Errore caricamento scene:', error);
      setSceneShortcuts([]);
    }
  };

  const loadDispositivi = async () => {
    if (!impiantoCorrente) return;
    try {
      const data = await tasmotaApi.getDispositivi(impiantoCorrente.id);
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    }
  };

  const loadStanze = async () => {
    if (!impiantoCorrente) return;
    try {
      const data = await stanzeApi.getStanze(impiantoCorrente.id);
      const stanzeArray = Array.isArray(data) ? data : [];
      setStanze(stanzeArray);
      setExpandedRooms(new Set(stanzeArray.map((s: any) => s.id)));
    } catch (error) {
      console.error('Errore caricamento stanze:', error);
      setStanze([]);
    }
  };

  const toggleRoom = (roomId: number) => {
    setExpandedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const toggleDevice = async (dispositivo: any) => {
    if (togglingDevice === dispositivo.id) return;
    setTogglingDevice(dispositivo.id);
    try {
      const newState = !dispositivo.power_state;
      await tasmotaApi.controlDispositivo(dispositivo.id, newState ? 'ON' : 'OFF');
      setDispositivi(prev => prev.map(d =>
        d.id === dispositivo.id ? { ...d, power_state: newState } : d
      ));
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
      // Ricarica stato dispositivi dopo esecuzione scena per sync UI
      setTimeout(() => loadDispositivi(), 300);
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
      await loadScene();
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
          await tasmotaApi.controlDispositivo(luce.id, turnOn ? 'ON' : 'OFF');
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

      // Aggiorna solo le luci che sono state controllate
      setDispositivi(prev => prev.map(d =>
        luciControllate.includes(d.id) ? { ...d, power_state: turnOn } : d
      ));

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
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const userName = user?.nome || 'Utente';

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header con Saluto */}
        <div style={{ paddingTop: '8px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.textPrimary, margin: 0, lineHeight: 1.2 }}>
            {getGreeting()}, {userName.split(' ')[0]}
          </h1>
          {impiantoCorrente && (
            <p style={{ color: colors.textMuted, fontSize: '12px', margin: '4px 0 0 0' }}>
              {impiantoCorrente.nome}
            </p>
          )}
        </div>

        {/* Quick Stats Card */}
        <div
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: '28px',
            boxShadow: colors.cardShadowLit,
            padding: '12px',
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px' }}>
            {/* Luci */}
            <motion.button
              onClick={toggleAllLights}
              disabled={togglingAll === 'luci' || totLuci === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '16px',
                background: 'transparent',
                border: 'none',
                cursor: totLuci === 0 ? 'not-allowed' : 'pointer',
                opacity: totLuci === 0 ? 0.5 : 1,
              }}
              whileHover={totLuci > 0 ? { scale: 1.05 } : undefined}
              whileTap={totLuci > 0 ? { scale: 0.95 } : undefined}
            >
              <div
                style={{
                  padding: '8px',
                  borderRadius: '12px',
                  background: luciOn > 0 ? `${colors.accent}40` : `${colors.accent}25`,
                  boxShadow: luciOn > 0 ? `0 0 12px ${colors.accent}50` : 'none',
                }}
              >
                {togglingAll === 'luci' ? (
                  <RiLoader4Line size={18} className="animate-spin" style={{ color: colors.accent }} />
                ) : (
                  <RiLightbulbLine
                    size={18}
                    style={{
                      color: luciOn > 0 ? colors.accentLight : colors.accent,
                      filter: luciOn > 0 ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                    }}
                  />
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0, lineHeight: 1 }}>
                  {luciOn}/{totLuci}
                </p>
                <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0 }}>Luci</p>
              </div>
            </motion.button>

            <div style={{ width: '1px', height: '40px', background: colors.border }} />

            {/* Termostati */}
            <motion.button
              onClick={toggleAllTermostati}
              disabled={termostati === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '16px',
                background: 'transparent',
                border: 'none',
                cursor: termostati === 0 ? 'not-allowed' : 'pointer',
                opacity: termostati === 0 ? 0.5 : 1,
              }}
              whileHover={termostati > 0 ? { scale: 1.05 } : undefined}
              whileTap={termostati > 0 ? { scale: 0.95 } : undefined}
            >
              <div style={{ padding: '8px', borderRadius: '12px', background: `${colors.accent}26` }}>
                <RiTempHotLine size={18} style={{ color: colors.accent }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: colors.textPrimary, margin: 0, lineHeight: 1 }}>
                  {termostati}
                </p>
                <p style={{ fontSize: '10px', color: colors.textMuted, margin: 0 }}>Termostati</p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Scene Rapide */}
        {sceneShortcuts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, marginBottom: '8px' }}>
              {t('dashboard.shortcuts')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
              {sceneShortcuts.filter(s => s !== null && s !== undefined).map((scena) => (
                <ContextMenu key={scena.id} items={getContextMenuItems(scena.id)}>
                  <motion.button
                    onClick={() => executeScene(scena.id)}
                    disabled={executing === scena.id}
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '12px',
                      background: colors.bgCardLit,
                      border: executing === scena.id ? `1px solid ${colors.accent}` : `1px solid ${colors.border}`,
                      borderRadius: '20px',
                      boxShadow: executing === scena.id ? `0 0 16px ${colors.accent}30` : colors.cardShadowLit,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    whileHover={{ scale: 1.05, borderColor: colors.borderHover }}
                    whileTap={{ scale: 0.95 }}
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
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      padding: '6px',
                      borderRadius: '10px',
                      background: `${colors.accent}15`,
                    }}>
                      {executing === scena.id ? (
                        <RiLoader4Line size={20} className="animate-spin" style={{ color: colors.accent }} />
                      ) : (
                        <SceneIcon
                          iconId={scena.icona}
                          size={20}
                          style={{
                            color: colors.accentLight,
                            filter: `drop-shadow(0 0 4px ${colors.accent}50)`,
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        textAlign: 'center',
                        lineHeight: 1.2,
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

        {/* Stanze e Dispositivi */}
        {impiantoCorrente && (stanze.length > 0 || unassignedDevices.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
              Stanze e Dispositivi
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {stanze.map((stanza) => {
                const RoomIcon = getRoomIcon(stanza.nome);
                const roomDevices = getDevicesByRoom(stanza.id);
                const isExpanded = expandedRooms.has(stanza.id);
                const devicesOn = roomDevices.filter(d => d.power_state).length;

                return (
                  <div
                    key={stanza.id}
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
                          }}
                        >
                          <RoomIcon size={20} style={{ color: colors.accentLight }} />
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

                    {isExpanded && roomDevices.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', borderTop: `1px solid ${colors.border}` }}>
                        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                          Nessun dispositivo in questa stanza
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Dispositivi non assegnati */}
              {unassignedDevices.length > 0 && (
                <div
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
                    <motion.div animate={{ rotate: expandedRooms.has(-1) ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <RiArrowDownSLine size={20} style={{ color: colors.textMuted }} />
                    </motion.div>
                  </motion.button>

                  {expandedRooms.has(-1) && (
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
                </div>
              )}
            </div>
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
