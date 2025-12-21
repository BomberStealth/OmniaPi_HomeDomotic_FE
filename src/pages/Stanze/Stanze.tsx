import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { stanzeApi, tasmotaApi } from '@/services/api';
import { DoorOpen, Plus, Loader, Settings, Trash2, Lightbulb, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// STANZE PAGE - Mobile-First Redesign
// ============================================

export const Stanze = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const [stanze, setStanze] = useState<any[]>([]);
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [selectedStanza, setSelectedStanza] = useState<any | null>(null);
  const [selectedDispositivo, setSelectedDispositivo] = useState<any | null>(null);
  const [newStanza, setNewStanza] = useState({ nome: '', icona: '🚪' });

  const impiantoId = impiantoCorrente?.id || 0;

  useEffect(() => {
    if (impiantoId) {
      loadData();
    }
  }, [impiantoId]);

  const loadData = async () => {
    if (!impiantoId) return;

    try {
      setLoading(true);
      const [stanzeData, dispositiviData] = await Promise.all([
        stanzeApi.getStanze(impiantoId),
        tasmotaApi.getDispositivi(impiantoId)
      ]);
      setStanze(Array.isArray(stanzeData) ? stanzeData : []);
      setDispositivi(Array.isArray(dispositiviData) ? dispositiviData : []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      setStanze([]);
      setDispositivi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStanza = async () => {
    if (!newStanza.nome) {
      toast.error('Inserisci il nome della stanza');
      return;
    }

    try {
      setLoading(true);
      await stanzeApi.createStanza(impiantoId, newStanza);
      toast.success('Stanza creata!');
      setModalOpen(false);
      setNewStanza({ nome: '', icona: '🚪' });
      await loadData();
    } catch (error: any) {
      console.error('Errore creazione stanza:', error);
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStanza = async () => {
    if (!selectedStanza) return;

    try {
      await stanzeApi.deleteStanza(selectedStanza.id);
      toast.success('Stanza eliminata!');
      setSettingsModalOpen(false);
      setSelectedStanza(null);
      await loadData();
    } catch (error: any) {
      console.error('Errore eliminazione stanza:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleMoveDispositivo = async (stanzaId: number | null) => {
    if (!selectedDispositivo) return;

    try {
      await tasmotaApi.assignToStanza(selectedDispositivo.id, stanzaId);
      toast.success('Dispositivo spostato!');
      setMoveModalOpen(false);
      setSelectedDispositivo(null);
      await loadData();
    } catch (error: any) {
      console.error('Errore spostamento dispositivo:', error);
      toast.error(error.response?.data?.error || 'Errore durante lo spostamento');
    }
  };

  const openSettings = (stanza: any) => {
    setSelectedStanza(stanza);
    setSettingsModalOpen(true);
  };

  const openMoveModal = (dispositivo: any) => {
    setSelectedDispositivo(dispositivo);
    setMoveModalOpen(true);
  };

  // Filtra valori validi (no null/undefined)
  const stanzeValide = stanze.filter(s => s !== null && s !== undefined);
  const dispositiviValidi = dispositivi.filter(d => d !== null && d !== undefined);

  // Raggruppa dispositivi per stanza
  const getDispositiviByStanza = (stanzaId: number) => {
    return dispositiviValidi.filter(d => d.stanza_id === stanzaId);
  };

  // Dispositivi senza stanza
  const dispositiviNonAssegnati = dispositiviValidi.filter(d => !d.stanza_id);

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header Compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              Stanze
            </h1>
            <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
              {stanzeValide.length} stanze, {dispositiviValidi.length} dispositivi
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            disabled={!impiantoId}
            className="p-2 rounded-xl bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
            title="Nuova Stanza"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        ) : !impiantoId ? (
          <Card variant="glass" className="text-center py-8">
            <p className="dark:text-copy-lighter light:text-copy-lighter text-sm">
              Seleziona un impianto per vedere le stanze
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Dispositivi Non Assegnati */}
            {dispositiviNonAssegnati.length > 0 && (
              <Card variant="glass" className="!p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <h3 className="font-semibold text-sm dark:text-copy light:text-copy-light">
                      Non assegnati
                    </h3>
                  </div>
                  <span className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                    {dispositiviNonAssegnati.length} dispositivi
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dispositiviNonAssegnati.map((disp) => (
                    <button
                      key={disp.id}
                      onClick={() => openMoveModal(disp)}
                      className={`
                        flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs
                        glass hover:bg-white/10 transition-colors
                        ${disp.power_state ? 'ring-1 ring-success' : ''}
                      `}
                    >
                      <Lightbulb
                        size={12}
                        className={disp.power_state ? 'text-success' : 'dark:text-copy-lighter light:text-copy-lighter'}
                      />
                      <span className="dark:text-copy light:text-copy-light truncate max-w-[80px]">
                        {disp.nome}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Lista Stanze */}
            {stanzeValide.length === 0 ? (
              <Card variant="glass" className="text-center py-8">
                <DoorOpen size={32} className="mx-auto mb-2 dark:text-copy-lighter light:text-copy-lighter" />
                <h3 className="font-semibold text-sm dark:text-copy light:text-copy-light mb-1">
                  Nessuna stanza
                </h3>
                <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mb-3">
                  Crea la tua prima stanza
                </p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium"
                >
                  <Plus size={14} className="inline mr-1" />
                  Nuova Stanza
                </button>
              </Card>
            ) : (
              stanzeValide.map((stanza) => {
                const dispositiviStanza = getDispositiviByStanza(stanza.id);
                return (
                  <Card key={stanza.id} variant="glass" className="!p-3">
                    {/* Header Stanza */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stanza.icona || '🚪'}</span>
                        <h3 className="font-semibold text-sm dark:text-copy light:text-copy-light">
                          {stanza.nome}
                        </h3>
                      </div>
                      <button
                        onClick={() => openSettings(stanza)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Settings size={16} className="dark:text-copy-lighter light:text-copy-lighter" />
                      </button>
                    </div>

                    {/* Dispositivi della Stanza */}
                    {dispositiviStanza.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dispositiviStanza.map((disp) => (
                          <button
                            key={disp.id}
                            onClick={() => openMoveModal(disp)}
                            className={`
                              flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs
                              glass hover:bg-white/10 transition-colors
                              ${disp.power_state ? 'ring-1 ring-success' : ''}
                            `}
                          >
                            <Lightbulb
                              size={12}
                              className={disp.power_state ? 'text-success' : 'dark:text-copy-lighter light:text-copy-lighter'}
                            />
                            <span className="dark:text-copy light:text-copy-light truncate max-w-[80px]">
                              {disp.nome}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs dark:text-copy-lighter light:text-copy-lighter italic">
                        Nessun dispositivo
                      </p>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal Nuova Stanza */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuova Stanza"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nome Stanza"
            value={newStanza.nome}
            onChange={(e) => setNewStanza({ ...newStanza, nome: e.target.value })}
            placeholder="es. Soggiorno"
          />

          <div>
            <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
              Icona
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {['🚪', '🛋️', '🍳', '🛏️', '🚿', '🏢', '🏠', '📺', '💻', '🌳', '🚗', '🎮'].map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewStanza({ ...newStanza, icona: icon })}
                  className={`p-2 text-xl rounded-lg border-2 transition-colors ${
                    newStanza.icona === icon
                      ? 'border-primary bg-primary/20'
                      : 'dark:border-border light:border-border-light'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="glass" onClick={() => setModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleCreateStanza} fullWidth disabled={loading}>
              {loading ? 'Creazione...' : 'Crea'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Impostazioni Stanza */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title={`Impostazioni - ${selectedStanza?.nome || ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">
            Gestisci la stanza "{selectedStanza?.nome}"
          </p>

          <div className="p-3 glass rounded-lg">
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mb-1">
              Dispositivi assegnati
            </p>
            <p className="text-lg font-bold dark:text-copy light:text-copy-light">
              {selectedStanza ? getDispositiviByStanza(selectedStanza.id).length : 0}
            </p>
          </div>

          <Button
            variant="danger"
            fullWidth
            onClick={handleDeleteStanza}
          >
            <Trash2 size={16} className="mr-2" />
            Elimina Stanza
          </Button>

          <Button variant="glass" onClick={() => setSettingsModalOpen(false)} fullWidth>
            Chiudi
          </Button>
        </div>
      </Modal>

      {/* Modal Sposta Dispositivo */}
      <Modal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        title={`Sposta - ${selectedDispositivo?.nome || ''}`}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">
            Seleziona la stanza di destinazione
          </p>

          {/* Opzione: Rimuovi da stanza */}
          <button
            onClick={() => handleMoveDispositivo(null)}
            className="w-full flex items-center gap-2 p-3 rounded-lg glass hover:bg-white/10 transition-colors text-left"
          >
            <X size={16} className="text-error" />
            <span className="text-sm dark:text-copy light:text-copy-light">
              Rimuovi dalla stanza
            </span>
          </button>

          {/* Lista Stanze */}
          {stanzeValide.map((stanza) => (
            <button
              key={stanza.id}
              onClick={() => handleMoveDispositivo(stanza.id)}
              disabled={selectedDispositivo?.stanza_id === stanza.id}
              className={`
                w-full flex items-center gap-2 p-3 rounded-lg transition-colors text-left
                ${selectedDispositivo?.stanza_id === stanza.id
                  ? 'bg-primary/20 border border-primary cursor-default'
                  : 'glass hover:bg-white/10'
                }
              `}
            >
              <span className="text-lg">{stanza.icona || '🚪'}</span>
              <span className="text-sm dark:text-copy light:text-copy-light flex-1">
                {stanza.nome}
              </span>
              {selectedDispositivo?.stanza_id === stanza.id && (
                <span className="text-xs text-primary">Attuale</span>
              )}
            </button>
          ))}

          <Button variant="glass" onClick={() => setMoveModalOpen(false)} fullWidth>
            Annulla
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};
