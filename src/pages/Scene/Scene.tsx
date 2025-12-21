import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { SceneList } from '@/components/scene/SceneList';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { sceneApi, tasmotaApi } from '@/services/api';
import { Plus, Play, Loader } from 'lucide-react';
import { toast } from 'sonner';
import type { ScheduleConfig } from '@/types';

// ============================================
// SCENE PAGE
// ============================================

export const Scene = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const [scene, setScene] = useState<any[]>([]);
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSceneForSchedule, setSelectedSceneForSchedule] = useState<any | null>(null);
  const [newScene, setNewScene] = useState({ nome: '', icona: '⚡', azioni: [] as any[] });
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    time: '18:00',
    mode: 'daily',
    days: []
  });

  const impiantoId = impiantoCorrente?.id || 0;

  // Ricarica dati quando cambia impianto
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
      console.log('📍 Caricamento scene per impianto ID:', impiantoId);
      const data = await sceneApi.getScene(impiantoId);
      console.log('📦 Scene caricate:', data);
      const sceneArray = Array.isArray(data) ? data : [];
      console.log('✅ Scene totali:', sceneArray.length);
      setScene(sceneArray);
    } catch (error) {
      console.error('❌ Errore caricamento scene:', error);
      setScene([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDispositivi = async () => {
    if (!impiantoId) return;

    try {
      const data = await tasmotaApi.getDispositivi(impiantoId);
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    }
  };

  const executeScene = async (scenaId: number) => {
    setExecuting(scenaId);
    try {
      await sceneApi.executeScena(scenaId);
    } catch (error) {
      console.error('Errore esecuzione scena:', error);
    } finally {
      setExecuting(null);
    }
  };

  const handleCreateScene = async () => {
    if (!newScene.nome) {
      toast.error('Inserisci il nome della scena');
      return;
    }

    try {
      await sceneApi.createScena(impiantoId, newScene);
      toast.success('Scena creata con successo!');
      setModalOpen(false);
      setNewScene({ nome: '', icona: '⚡', azioni: [] });
      await loadScene();
    } catch (error: any) {
      console.error('Errore creazione scena:', error);
      toast.error(error.response?.data?.error || 'Errore durante la creazione della scena');
    }
  };

  const handleDeleteScene = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa scena?')) return;

    try {
      await sceneApi.deleteScena(id);
      toast.success('Scena eliminata con successo!');
      await loadScene();
    } catch (error: any) {
      console.error('Errore eliminazione scena:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione della scena');
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
    if (scena.scheduling) {
      setScheduleConfig(scena.scheduling);
    } else {
      setScheduleConfig({
        enabled: false,
        time: '18:00',
        mode: 'daily',
        days: []
      });
    }
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedSceneForSchedule) return;

    try {
      await sceneApi.updateScena(selectedSceneForSchedule.id, {
        scheduling: scheduleConfig.enabled ? scheduleConfig : null
      });
      toast.success('Programmazione salvata!');
      setScheduleModalOpen(false);
      await loadScene();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
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

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              Scene
            </h1>
            <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
              Tap per eseguire
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="p-2 rounded-xl bg-primary hover:bg-primary-dark transition-colors"
            title="Nuova Scena"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Scene Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        ) : scene.length === 0 ? (
          <EmptyState
            icon={Play}
            title="Nessuna scena"
            description="Crea la tua prima scena usando il pulsante in alto"
          />
        ) : (
          <SceneList
            scene={scene}
            executingId={executing}
            onExecute={executeScene}
            onDelete={handleDeleteScene}
            onSchedule={openScheduleModal}
          />
        )}
      </div>

      {/* Modal Nuova Scena */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuova Scena"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome Scena"
            value={newScene.nome}
            onChange={(e) => setNewScene({ ...newScene, nome: e.target.value })}
            placeholder="es. Cinema"
          />

          <div>
            <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
              Icona
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {['⚡', '☀️', '🌙', '🚪', '👋', '🎬', '💡', '🌅', '🌆', '🏠', '🔥', '❄️'].map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewScene({ ...newScene, icona: icon })}
                  className={`p-2 sm:p-3 text-xl sm:text-2xl rounded-lg border-2 ${
                    newScene.icona === icon
                      ? 'border-primary bg-primary bg-opacity-20'
                      : 'dark:border-border light:border-border-light'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
              Dispositivi ({newScene.azioni.length} selezionati)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dispositivi.filter(d => d !== null && d !== undefined).map((disp) => {
                const azione = newScene.azioni.find((a: any) => a.dispositivo_id === disp.id);
                return (
                  <Card key={disp.id} variant="glass-solid" className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!azione}
                          onChange={() => toggleDispositivoInScene(disp.id, disp.topic_mqtt)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium dark:text-copy light:text-copy-light">
                          {disp.nome}
                        </span>
                      </div>
                    </div>
                    {azione && (
                      <div className="flex gap-2 ml-6">
                        <button
                          onClick={() => updateAzioneStato(disp.id, 'ON')}
                          className={`flex-1 px-3 py-1 text-xs rounded ${
                            azione.stato === 'ON'
                              ? 'bg-success text-white'
                              : 'dark:bg-foreground light:bg-foreground-light'
                          }`}
                        >
                          ON
                        </button>
                        <button
                          onClick={() => updateAzioneStato(disp.id, 'OFF')}
                          className={`flex-1 px-3 py-1 text-xs rounded ${
                            azione.stato === 'OFF'
                              ? 'bg-error text-white'
                              : 'dark:bg-foreground light:bg-foreground-light'
                          }`}
                        >
                          OFF
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleCreateScene} fullWidth disabled={loading}>
              {loading ? 'Creazione...' : 'Crea Scena'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Programmazione Scena */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Programmazione Scena"
        size="md"
      >
        <div className="space-y-4">
          {/* Toggle Abilitazione */}
          <div className="flex items-center justify-between p-3 glass rounded-lg">
            <span className="font-medium dark:text-copy light:text-copy-light">Programmazione Attiva</span>
            <button
              onClick={() => setScheduleConfig({ ...scheduleConfig, enabled: !scheduleConfig.enabled })}
              className={`w-12 h-6 rounded-full transition-colors ${
                scheduleConfig.enabled ? 'bg-success' : 'bg-gray-400'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  scheduleConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {scheduleConfig.enabled && (
            <>
              {/* Orario */}
              <div>
                <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                  Orario
                </label>
                <Input
                  type="time"
                  value={scheduleConfig.time}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                />
              </div>

              {/* Modalità */}
              <div>
                <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                  Modalità
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily', 'weekly', 'once'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setScheduleConfig({ ...scheduleConfig, mode: mode as any })}
                      className={`p-2 text-sm rounded-lg border-2 ${
                        scheduleConfig.mode === mode
                          ? 'border-primary bg-primary bg-opacity-20 dark:text-copy light:text-copy-light'
                          : 'dark:border-border light:border-border-light dark:text-copy-lighter light:text-copy-lighter'
                      }`}
                    >
                      {mode === 'daily' ? 'Giornaliero' : mode === 'weekly' ? 'Settimanale' : 'Una tantum'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Giorni (solo per weekly) */}
              {scheduleConfig.mode === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                    Giorni della settimana
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {['D', 'L', 'M', 'M', 'G', 'V', 'S'].map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleDay(idx)}
                        className={`p-2 text-xs font-bold rounded-lg ${
                          scheduleConfig.days?.includes(idx)
                            ? 'bg-primary text-white'
                            : 'glass dark:text-copy-lighter light:text-copy-lighter'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data (solo per once) */}
              {scheduleConfig.mode === 'once' && (
                <div>
                  <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                    Data
                  </label>
                  <Input
                    type="date"
                    value={scheduleConfig.date || ''}
                    onChange={(e) => setScheduleConfig({ ...scheduleConfig, date: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setScheduleModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleSaveSchedule} fullWidth>
              Salva
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
