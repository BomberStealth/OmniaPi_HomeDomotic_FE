import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { SceneList } from '@/components/scene/SceneList';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { sceneApi, tasmotaApi } from '@/services/api';
import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import {
  RiAddLine, RiPlayLine, RiLoader4Line, RiLightbulbLine, RiCheckLine, RiShutDownLine,
  RiFlashlightLine, RiSunLine, RiMoonLine, RiDoorOpenLine, RiHandHeartLine, RiFilmLine,
  RiSunFoggyLine, RiMoonClearLine, RiHome4Line, RiFireLine, RiSnowflakeLine,
  RiCupLine, RiHotelBedLine, RiTvLine, RiMusic2Line, RiShieldLine, RiHeartLine
} from 'react-icons/ri';
import { toast } from 'sonner';
import type { ScheduleConfig } from '@/types';

// ============================================
// SCENE PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  success: '#10b981',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

// Icone scene con Remix Icons
const sceneIcons: { id: string; icon: IconType; label: string }[] = [
  { id: 'zap', icon: RiFlashlightLine, label: 'Energia' },
  { id: 'sun', icon: RiSunLine, label: 'Giorno' },
  { id: 'moon', icon: RiMoonLine, label: 'Notte' },
  { id: 'door', icon: RiDoorOpenLine, label: 'Porta' },
  { id: 'hand', icon: RiHandHeartLine, label: 'Ciao' },
  { id: 'movie', icon: RiFilmLine, label: 'Cinema' },
  { id: 'lightbulb', icon: RiLightbulbLine, label: 'Luce' },
  { id: 'sunrise', icon: RiSunFoggyLine, label: 'Alba' },
  { id: 'sunset', icon: RiMoonClearLine, label: 'Tramonto' },
  { id: 'home', icon: RiHome4Line, label: 'Casa' },
  { id: 'flame', icon: RiFireLine, label: 'Fuoco' },
  { id: 'snow', icon: RiSnowflakeLine, label: 'Freddo' },
  { id: 'coffee', icon: RiCupLine, label: 'Caffè' },
  { id: 'bed', icon: RiHotelBedLine, label: 'Letto' },
  { id: 'tv', icon: RiTvLine, label: 'TV' },
  { id: 'music', icon: RiMusic2Line, label: 'Musica' },
  { id: 'shield', icon: RiShieldLine, label: 'Sicurezza' },
  { id: 'heart', icon: RiHeartLine, label: 'Amore' },
];

// Mappa emoji legacy → ID icona Remix
const emojiToIconMap: Record<string, string> = {
  '⚡': 'zap',
  '☀️': 'sun',
  '🌙': 'moon',
  '🚪': 'door',
  '👋': 'hand',
  '🎬': 'movie',
  '💡': 'lightbulb',
  '🌅': 'sunrise',
  '🌇': 'sunset',
  '🏠': 'home',
  '🔥': 'flame',
  '❄️': 'snow',
  '☕': 'coffee',
  '🛏️': 'bed',
  '📺': 'tv',
  '🎵': 'music',
  '🛡️': 'shield',
  '❤️': 'heart',
};

// Funzione per ottenere icona da ID o emoji legacy
export const getSceneIcon = (iconId: string): IconType => {
  // Prima controlla se è un emoji legacy e converti
  const mappedId = emojiToIconMap[iconId] || iconId;
  const found = sceneIcons.find(i => i.id === mappedId);
  if (found) return found.icon;
  // Fallback per icone non trovate
  return RiFlashlightLine;
};

// Componente per renderizzare icona scena
export const SceneIcon = ({ iconId, size = 24, style }: { iconId: string; size?: number; style?: React.CSSProperties }) => {
  const Icon = getSceneIcon(iconId);
  return <Icon size={size} style={style} className="remix-icon" />;
};

export const Scene = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors } = useThemeColor();
  const [scene, setScene] = useState<any[]>([]);
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<any | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSceneForSchedule, setSelectedSceneForSchedule] = useState<any | null>(null);
  const [newScene, setNewScene] = useState({ nome: '', icona: 'zap', azioni: [] as any[] });
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    time: '18:00',
    mode: 'daily',
    days: []
  });

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

  const impiantoId = impiantoCorrente?.id || 0;

  useEffect(() => {
    if (impiantoId) {
      loadScene();
      loadDispositivi();
    }
  }, [impiantoId]);

  const loadScene = async () => {
    if (!impiantoId) return;
    try {
      setLoading(true);
      const data = await sceneApi.getScene(impiantoId);
      setScene(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento scene:', error);
      setScene([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDispositivi = async () => {
    if (!impiantoId) return;
    try {
      const data = await tasmotaApi.getAllDispositivi(impiantoId);
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    }
  };

  const executeScene = async (scenaId: number) => {
    setExecuting(scenaId);
    try {
      const result = await sceneApi.executeScena(scenaId);
      // Mostra messaggio appropriato in base ai dispositivi bloccati
      if (result?.bloccati && result.bloccati > 0) {
        toast.warning(`Eseguita (${result.bloccati} bloccat${result.bloccati === 1 ? 'o' : 'i'})`);
      } else {
        toast.success('OK');
      }
    } catch (error) {
      console.error('Errore esecuzione scena:', error);
      toast.error('Errore');
    } finally {
      setExecuting(null);
    }
  };

  const handleCreateScene = async () => {
    if (!newScene.nome) {
      toast.error('Nome richiesto');
      return;
    }
    try {
      await sceneApi.createScena(impiantoId, newScene);
      toast.success('Creata');
      setModalOpen(false);
      setNewScene({ nome: '', icona: 'zap', azioni: [] });
      await loadScene();
    } catch (error: any) {
      toast.error('Errore');
    }
  };

  const handleDeleteScene = async (id: number) => {
    if (!confirm('Eliminare la scena?')) return;
    try {
      await sceneApi.deleteScena(id);
      toast.success('Eliminata');
      await loadScene();
    } catch (error: any) {
      toast.error('Errore');
    }
  };

  const handleToggleShortcut = async (scenaId: number, isShortcut: boolean) => {
    try {
      await sceneApi.toggleShortcut(scenaId, isShortcut);
      toast.success(isShortcut ? 'Aggiunta' : 'Rimossa');
      await loadScene();
    } catch (error: any) {
      toast.error('Errore');
    }
  };

  const handleEditScene = (scena: any) => {
    setEditingScene(scena);
    let azioni = [];
    try {
      if (typeof scena.azioni === 'string') {
        azioni = JSON.parse(scena.azioni || '[]');
      } else if (Array.isArray(scena.azioni)) {
        azioni = scena.azioni;
      }
    } catch {
      azioni = [];
    }
    setNewScene({ nome: scena.nome, icona: scena.icona, azioni });
    setEditModalOpen(true);
  };

  const handleUpdateScene = async () => {
    if (!editingScene) return;
    try {
      await sceneApi.updateScena(editingScene.id, {
        nome: newScene.nome,
        icona: newScene.icona,
        azioni: newScene.azioni
      });
      toast.success('Salvata');
      setEditModalOpen(false);
      setEditingScene(null);
      setNewScene({ nome: '', icona: 'zap', azioni: [] });
      await loadScene();
    } catch (error: any) {
      toast.error('Errore');
    }
  };

  const toggleDispositivoInScene = (dispositivoId: number, topic: string) => {
    const existing = newScene.azioni.find((a: any) => a.dispositivo_id === dispositivoId);
    if (existing) {
      setNewScene({
        ...newScene,
        azioni: newScene.azioni.filter((a: any) => a.dispositivo_id !== dispositivoId)
      });
    } else {
      setNewScene({
        ...newScene,
        azioni: [...newScene.azioni, { dispositivo_id: dispositivoId, topic, stato: 'ON' }]
      });
    }
  };

  const updateAzioneStato = (dispositivoId: number, stato: string) => {
    setNewScene({
      ...newScene,
      azioni: newScene.azioni.map((a: any) =>
        a.dispositivo_id === dispositivoId ? { ...a, stato } : a
      )
    });
  };

  const openScheduleModal = (scena: any) => {
    setSelectedSceneForSchedule(scena);
    setScheduleConfig(scena.scheduling || { enabled: false, time: '18:00', mode: 'daily', days: [] });
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedSceneForSchedule) return;
    try {
      await sceneApi.updateScena(selectedSceneForSchedule.id, {
        scheduling: scheduleConfig.enabled ? scheduleConfig : null
      });
      toast.success('Salvata');
      setScheduleModalOpen(false);
      await loadScene();
    } catch (error: any) {
      toast.error('Errore');
    }
  };

  const toggleDay = (day: number) => {
    const days = scheduleConfig.days || [];
    if (days.includes(day)) {
      setScheduleConfig({ ...scheduleConfig, days: days.filter(d => d !== day) });
    } else {
      setScheduleConfig({ ...scheduleConfig, days: [...days, day] });
    }
  };

  const renderDeviceSelector = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
      {dispositivi.filter(d => d !== null && d !== undefined).map((disp) => {
        const azione = newScene.azioni.find((a: any) => a.dispositivo_id === disp.id);
        const isSelected = !!azione;
        return (
          <div
            key={disp.id}
            style={{
              padding: '12px',
              borderRadius: '16px',
              background: isSelected ? `${colors.accent}15` : 'rgba(255,255,255,0.05)',
              border: isSelected ? `2px solid ${colors.accent}` : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <motion.button
                onClick={() => toggleDispositivoInScene(disp.id, disp.topic_mqtt)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? colors.accent : 'transparent',
                    border: isSelected ? 'none' : `2px solid ${colors.border}`,
                  }}
                >
                  {isSelected && <RiCheckLine size={14} style={{ color: '#0a0a0c' }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RiLightbulbLine size={16} style={{ color: isSelected ? colors.accent : colors.textMuted }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: isSelected ? colors.textPrimary : colors.textMuted }}>{disp.nome}</span>
                </div>
              </motion.button>
              {isSelected && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateAzioneStato(disp.id, azione.stato === 'ON' ? 'OFF' : 'ON');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: azione.stato === 'ON' ? `${colors.accent}20` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${azione.stato === 'ON' ? colors.accent : colors.border}`,
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RiShutDownLine size={14} style={{ color: azione.stato === 'ON' ? colors.accent : colors.textMuted }} />
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: azione.stato === 'ON' ? colors.accent : colors.textMuted,
                  }}>
                    {azione.stato}
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Scene</h1>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '4px 0 0 0' }}>Tap per eseguire</p>
          </div>
          <motion.button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '10px',
              borderRadius: '16px',
              background: `linear-gradient(165deg, ${colors.accent}, #4aa870)`,
              border: 'none',
              cursor: 'pointer',
              boxShadow: `0 4px 16px ${colors.accent}40`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RiAddLine size={20} style={{ color: '#0a0a0c' }} />
          </motion.button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <RiLoader4Line size={32} className="animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : scene.length === 0 ? (
          <EmptyState icon={RiPlayLine} title="Nessuna scena" description="Crea la tua prima scena usando il pulsante in alto" />
        ) : (
          <SceneList
            scene={scene}
            executingId={executing}
            onExecute={executeScene}
            onDelete={handleDeleteScene}
            onSchedule={openScheduleModal}
            onToggleShortcut={handleToggleShortcut}
            onEdit={handleEditScene}
          />
        )}
      </div>

      {/* Modal Nuova Scena */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuova Scena" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nome Scena" value={newScene.nome} onChange={(e) => setNewScene({ ...newScene, nome: e.target.value })} placeholder="es. Cinema" />
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Icona</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {sceneIcons.map(({ id, icon: IconComponent, label }) => (
                <motion.button
                  key={id}
                  onClick={() => setNewScene({ ...newScene, icona: id })}
                  title={label}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: newScene.icona === id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                    background: newScene.icona === id ? `${colors.accent}20` : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  whileHover={{ scale: 1.05, borderColor: colors.borderHover }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent
                    size={22}
                    style={{
                      color: newScene.icona === id ? colors.accent : colors.textMuted,
                      filter: newScene.icona === id ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>
              Dispositivi ({newScene.azioni.length} selezionati)
            </label>
            {renderDeviceSelector()}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleCreateScene} fullWidth disabled={loading}>{loading ? 'Creazione...' : 'Crea Scena'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Programmazione */}
      <Modal isOpen={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Programmazione Scena" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <span style={{ fontWeight: 500, color: colors.textPrimary }}>Programmazione Attiva</span>
            <button
              onClick={() => setScheduleConfig({ ...scheduleConfig, enabled: !scheduleConfig.enabled })}
              style={{
                width: '48px',
                height: '24px',
                borderRadius: '9999px',
                background: scheduleConfig.enabled ? colors.success : '#6b7280',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: scheduleConfig.enabled ? '26px' : '2px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
            </button>
          </div>

          {scheduleConfig.enabled && (
            <>
              <Input label="Orario" type="time" value={scheduleConfig.time} onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })} />
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Modalità</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[{ id: 'daily', label: 'Giornaliero' }, { id: 'weekly', label: 'Settimanale' }, { id: 'once', label: 'Una tantum' }].map(({ id, label }) => (
                    <motion.button
                      key={id}
                      onClick={() => setScheduleConfig({ ...scheduleConfig, mode: id as any })}
                      style={{
                        padding: '10px',
                        fontSize: '12px',
                        borderRadius: '12px',
                        border: scheduleConfig.mode === id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                        background: scheduleConfig.mode === id ? `${colors.accent}20` : 'transparent',
                        color: scheduleConfig.mode === id ? colors.textPrimary : colors.textMuted,
                        cursor: 'pointer',
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
              {scheduleConfig.mode === 'weekly' && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Giorni</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((day, idx) => (
                      <motion.button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        style={{
                          padding: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '8px',
                          background: scheduleConfig.days?.includes(idx) ? colors.accent : 'rgba(255,255,255,0.05)',
                          color: scheduleConfig.days?.includes(idx) ? '#0a0a0c' : colors.textMuted,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {day}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {scheduleConfig.mode === 'once' && (
                <Input label="Data" type="date" value={scheduleConfig.date || ''} onChange={(e) => setScheduleConfig({ ...scheduleConfig, date: e.target.value })} />
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setScheduleModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleSaveSchedule} fullWidth>Salva</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Modifica Scena */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingScene(null); setNewScene({ nome: '', icona: '⚡', azioni: [] }); }}
        title={`Modifica ${editingScene?.nome || 'Scena'}`}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nome Scena" value={newScene.nome} onChange={(e) => setNewScene({ ...newScene, nome: e.target.value })} placeholder="es. Cinema" disabled={editingScene?.is_base} />
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Icona</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {sceneIcons.map(({ id, icon: IconComponent, label }) => (
                <motion.button
                  key={id}
                  onClick={() => setNewScene({ ...newScene, icona: id })}
                  title={label}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: newScene.icona === id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                    background: newScene.icona === id ? `${colors.accent}20` : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  whileHover={{ scale: 1.05, borderColor: colors.borderHover }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent
                    size={22}
                    style={{
                      color: newScene.icona === id ? colors.accent : colors.textMuted,
                      filter: newScene.icona === id ? `drop-shadow(0 0 4px ${colors.accent})` : 'none',
                    }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>
              Dispositivi ({newScene.azioni.length} selezionati)
            </label>
            {renderDeviceSelector()}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => { setEditModalOpen(false); setEditingScene(null); setNewScene({ nome: '', icona: '⚡', azioni: [] }); }} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleUpdateScene} fullWidth disabled={loading}>{loading ? 'Salvataggio...' : 'Salva Modifiche'}</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
