import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiFileCopyLine, RiRefreshLine, RiDeleteBinLine, RiSaveLine, RiGroupLine, RiMapPinLine } from 'react-icons/ri';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { impiantiApi } from '@/services/api';
import { useImpiantiStore } from '@/store/impiantiStore';
import { Impianto } from '@/types';
import { toast } from '@/utils/toast';

// ============================================
// IMPIANTO SETTINGS PAGE (Avanzate)
// Senza fotovoltaico, senza lat/long, senza condivisioni
// ============================================

export const ImpiantoSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Store per gestire stato globale impianti
  const { impianti, removeImpianto, fetchImpianti } = useImpiantiStore();

  const [impianto, setImpianto] = useState<Impianto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (senza fotovoltaico e lat/long)
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
  });

  // Codice condivisione
  const [codiceCondivisione, setCodiceCondivisione] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);

  // Delete modal con conferma "ELIMINA"
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (id) {
      loadImpianto();
    }
  }, [id]);

  const loadImpianto = async () => {
    try {
      const response = await impiantiApi.getById(parseInt(id!));
      if (response.success && response.data) {
        setImpianto(response.data);
        setFormData({
          nome: response.data.nome,
          indirizzo: response.data.indirizzo || '',
          citta: response.data.citta || '',
          cap: response.data.cap || '',
        });
        setCodiceCondivisione(response.data.codice_condivisione || '');
      }
    } catch (error) {
      console.error('Errore caricamento impianto:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await impiantiApi.update(parseInt(id!), formData);
      toast.success('Modifiche salvate con successo!');
      loadImpianto();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codiceCondivisione);
    toast.success('Codice copiato negli appunti!');
  };

  const handleRegenerateCode = async () => {
    try {
      const response = await fetch(`/api/impianti/${id}/regenerate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCodiceCondivisione(data.data.codice_condivisione);
        setShowRegenModal(false);
        toast.success('Codice rigenerato con successo!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Errore durante la rigenerazione del codice');
      }
    } catch (error) {
      toast.error('Errore durante la rigenerazione del codice');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'ELIMINA') {
      toast.error('Scrivi ELIMINA per confermare');
      return;
    }

    try {
      const impiantoId = parseInt(id!);

      // Calcola PRIMA se questo è l'ultimo impianto
      const isLastImpianto = impianti.length <= 1;

      await impiantiApi.delete(impiantoId);

      // Aggiorna lo store locale (auto-seleziona il prossimo)
      removeImpianto(impiantoId);

      toast.success('Impianto eliminato con successo');

      // Se era l'ultimo, vai alla home, altrimenti alla lista
      if (isLastImpianto) {
        navigate('/', { replace: true });
      } else {
        // Forza reload della lista dal backend e naviga
        await fetchImpianti();
        navigate('/impianti', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="dark:text-copy-lighter light:text-copy-lighter">Caricamento...</p>
        </div>
      </Layout>
    );
  }

  if (!impianto) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="dark:text-copy-lighter light:text-copy-lighter">Impianto non trovato</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 glass rounded-xl hover:bg-opacity-20 transition-colors"
          >
            <RiArrowLeftLine size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold dark:text-copy light:text-copy-light">
              Impostazioni Avanzate
            </h1>
            <p className="dark:text-copy-lighter light:text-copy-lighter">{impianto.nome}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna Sinistra - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informazioni Generali */}
            <Card variant="glass-solid">
              <div className="flex items-center gap-3 mb-6">
                <RiMapPinLine className="text-primary" size={24} />
                <h2 className="text-xl font-bold dark:text-copy light:text-copy-light">
                  Informazioni Generali
                </h2>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nome Impianto"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="es. Casa Principale"
                />

                <Input
                  label="Indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  placeholder="es. Via Roma 123"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Città"
                    value={formData.citta}
                    onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    placeholder="es. Milano"
                  />
                  <Input
                    label="CAP"
                    value={formData.cap}
                    onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                    placeholder="es. 20100"
                    maxLength={5}
                  />
                </div>

                {/* Placeholder Mappa */}
                <div className="mt-4 p-4 glass rounded-lg text-center">
                  <p className="text-2xl mb-2">🗺️</p>
                  <p className="dark:text-copy-lighter light:text-copy-lighter text-sm">
                    Mappa in arrivo
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Colonna Destra - Codice Condivisione */}
          <div className="space-y-6">
            {/* Codice Condivisione */}
            <Card variant="glass-solid">
              <div className="flex items-center gap-3 mb-4">
                <RiGroupLine className="text-secondary" size={24} />
                <h2 className="text-lg font-bold dark:text-copy light:text-copy-light">
                  Codice Condivisione
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 glass rounded-lg px-4 py-3 font-mono text-xl font-bold text-center dark:text-copy light:text-copy-light">
                    {codiceCondivisione || 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="glass" size="sm" onClick={handleCopyCode} fullWidth>
                    <RiFileCopyLine size={16} className="mr-1" />
                    Copia
                  </Button>
                  <Button variant="glass" size="sm" onClick={() => setShowRegenModal(true)} fullWidth>
                    <RiRefreshLine size={16} className="mr-1" />
                    Rigenera
                  </Button>
                </div>

                <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                  Condividi questo codice per dare accesso ad altri utenti
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <RiSaveLine size={20} className="mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <RiDeleteBinLine size={20} className="mr-2" />
            Elimina Impianto
          </Button>
        </div>
      </div>

      {/* Modal Rigenerazione Codice */}
      <Modal
        isOpen={showRegenModal}
        onClose={() => setShowRegenModal(false)}
        title="Rigenera Codice Condivisione"
        size="sm"
      >
        <div className="space-y-4">
          <p className="dark:text-copy-lighter light:text-copy-lighter">
            Sei sicuro di voler rigenerare il codice di condivisione? Il codice attuale non sarà più
            valido.
          </p>
          <div className="flex gap-3">
            <Button variant="glass" onClick={() => setShowRegenModal(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleRegenerateCode} fullWidth>
              Rigenera
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminazione con conferma "ELIMINA" */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Elimina Impianto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="dark:text-copy-lighter light:text-copy-lighter">
            Sei sicuro di voler eliminare questo impianto? Questa azione è irreversibile e
            cancellerà anche tutti i dispositivi, scene e dati associati.
          </p>

          <div>
            <label className="block text-sm font-medium dark:text-copy-lighter light:text-copy-lighter mb-2">
              Scrivi <span className="font-bold text-error">ELIMINA</span> per confermare:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
              placeholder="ELIMINA"
              className="text-center font-bold"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="glass" onClick={handleCloseDeleteModal} fullWidth>
              Annulla
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              fullWidth
              disabled={deleteConfirmText !== 'ELIMINA'}
            >
              Elimina Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
