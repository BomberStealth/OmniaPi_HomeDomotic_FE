import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { EmptyState } from '@/components/shared/EmptyState';
import { StanzaList } from '@/components/stanze/StanzaList';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { stanzeApi } from '@/services/api';
import { DoorOpen, Plus, Loader } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// STANZE PAGE
// ============================================

export const Stanze = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const [stanze, setStanze] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newStanza, setNewStanza] = useState({ nome: '', icona: '🚪' });

  const impiantoId = impiantoCorrente?.id || 0;

  // Ricarica dati quando cambia impianto
  useEffect(() => {
    if (impiantoId) {
      loadStanze();
    }
  }, [impiantoId]);

  const loadStanze = async () => {
    if (!impiantoId) return;

    try {
      setLoading(true);
      const data = await stanzeApi.getStanze(impiantoId);
      // Fix: assicurati che sia un array
      setStanze(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento stanze:', error);
      setStanze([]);
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
      setModalOpen(false);
      setNewStanza({ nome: '', icona: '🚪' });
      await loadStanze();
    } catch (error: any) {
      console.error('Errore creazione stanza:', error);
      toast.error(error.response?.data?.error || 'Errore durante la creazione della stanza');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStanza = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa stanza?')) return;

    try {
      await stanzeApi.deleteStanza(id);
      await loadStanze();
    } catch (error: any) {
      console.error('Errore eliminazione stanza:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione della stanza');
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-copy light:text-copy-light">
              Stanze
            </h1>
            <p className="text-sm sm:text-base dark:text-copy-lighter light:text-copy-lighter">
              Gestisci le stanze del tuo impianto
            </p>
          </div>

          <Button variant="primary" onClick={() => setModalOpen(true)} disabled={!impiantoId}>
            <Plus size={18} className="mr-2" />
            Nuova Stanza
          </Button>
        </div>

        {/* Stanze Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size={32} className="animate-spin text-primary" />
          </div>
        ) : stanze.length === 0 ? (
          <EmptyState
            icon={DoorOpen}
            title="Nessuna stanza"
            description="Crea la tua prima stanza e aggiungi dispositivi"
            actionLabel="Nuova Stanza"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <StanzaList
            stanze={stanze}
            onDelete={handleDeleteStanza}
          />
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
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {['🚪', '🛋️', '🍳', '🛏️', '🚿', '🏢', '🏠', '📺', '💻', '🌳', '🚗', '🎮'].map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewStanza({ ...newStanza, icona: icon })}
                  className={`p-2 sm:p-3 text-xl sm:text-2xl rounded-lg border-2 ${
                    newStanza.icona === icon
                      ? 'border-primary bg-primary bg-opacity-20'
                      : 'dark:border-border light:border-border-light'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleCreateStanza} fullWidth disabled={loading}>
              {loading ? 'Creazione...' : 'Crea Stanza'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
