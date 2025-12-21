import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { ChevronDown, Building2, Loader, Plus } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { impiantiApi } from '@/services/api';
import { toast } from 'sonner';

// ============================================
// IMPIANTO SELECTOR - Dropdown Multi-impianto
// ============================================

interface ImpiantoSelectorProps {
  variant?: 'mobile' | 'desktop';
}

export const ImpiantoSelector = ({ variant = 'mobile' }: ImpiantoSelectorProps) => {
  const { impiantoCorrente, setImpiantoCorrente, impianti, loading, refresh } = useImpiantoContext();
  const [isOpen, setIsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newImpianto, setNewImpianto] = useState({
    nome: '',
    indirizzo: '',
    citta: ''
  });

  const handleCreateNew = () => {
    setIsOpen(false);
    setCreateModalOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!newImpianto.nome || !newImpianto.citta) {
      toast.error('Nome e città sono richiesti');
      return;
    }

    try {
      setCreating(true);
      await impiantiApi.create(newImpianto);
      toast.success('Impianto creato!');
      setCreateModalOpen(false);
      setNewImpianto({ nome: '', indirizzo: '', citta: '' });
      await refresh();
    } catch (error: any) {
      console.error('Errore creazione impianto:', error);
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader size={16} className="animate-spin text-primary" />
        <span className="text-sm dark:text-copy-lighter light:text-copy-lighter">
          Caricamento...
        </span>
      </div>
    );
  }

  // Nessun impianto - mostra solo "Crea nuovo"
  if (!impiantoCorrente || impianti.length === 0) {
    return (
      <button
        onClick={handleCreateNew}
        className={`w-full flex items-center gap-2 px-3 py-2 transition-all ${
          variant === 'desktop'
            ? 'glass rounded-lg hover:bg-opacity-80'
            : 'hover:bg-white hover:bg-opacity-5'
        }`}
      >
        <Plus size={18} className="text-primary" />
        <span className="text-sm font-semibold text-primary">
          Crea nuovo impianto
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 transition-all ${
          variant === 'desktop'
            ? 'glass rounded-lg hover:bg-opacity-80'
            : 'hover:bg-white hover:bg-opacity-5'
        }`}
      >
        <Building2 size={18} className="text-primary" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold dark:text-copy light:text-copy-light">
            {impiantoCorrente.nome}
          </p>
          <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
            {impiantoCorrente.citta}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform dark:text-copy-lighter light:text-copy-lighter ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay per chiudere al click fuori */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-50 w-full top-full mt-1 dark:bg-background light:bg-white rounded-lg border dark:border-border light:border-border-light shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {impianti.map((impianto) => (
              <button
                key={impianto.id}
                onClick={() => {
                  setImpiantoCorrente(impianto);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white hover:bg-opacity-10 ${
                  impianto.id === impiantoCorrente.id
                    ? 'bg-primary bg-opacity-20 border-l-2 border-primary'
                    : ''
                }`}
              >
                <Building2 size={16} className={
                  impianto.id === impiantoCorrente.id ? 'text-primary' : 'dark:text-copy-lighter light:text-copy-lighter'
                } />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    impianto.id === impiantoCorrente.id
                      ? 'text-primary'
                      : 'dark:text-copy light:text-copy-light'
                  }`}>
                    {impianto.nome}
                  </p>
                  <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                    {impianto.citta}
                  </p>
                </div>
              </button>
            ))}

            {/* Separatore + Crea Nuovo */}
            <div className="border-t dark:border-border light:border-border-light">
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white hover:bg-opacity-10"
              >
                <Plus size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">
                  Crea nuovo impianto
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Crea Nuovo Impianto */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Nuovo Impianto"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nome Impianto"
            value={newImpianto.nome}
            onChange={(e) => setNewImpianto({ ...newImpianto, nome: e.target.value })}
            placeholder="es. Casa Principale"
          />

          <Input
            label="Indirizzo"
            value={newImpianto.indirizzo}
            onChange={(e) => setNewImpianto({ ...newImpianto, indirizzo: e.target.value })}
            placeholder="es. Via Roma 1"
          />

          <Input
            label="Città"
            value={newImpianto.citta}
            onChange={(e) => setNewImpianto({ ...newImpianto, citta: e.target.value })}
            placeholder="es. Milano"
          />

          <div className="flex gap-2 mt-4">
            <Button variant="glass" onClick={() => setCreateModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleSubmitCreate} fullWidth disabled={creating}>
              {creating ? 'Creazione...' : 'Crea'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
