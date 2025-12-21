import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, RefreshCw, Trash2, Save, Users, MapPin, Zap } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { impiantiApi } from '@/services/api';
import { Impianto } from '@/types';
import { toast } from 'sonner';

// ============================================
// IMPIANTO SETTINGS PAGE
// ============================================

interface CondivisioneUtente {
  id: number;
  email: string;
  ruolo: string;
  creato_il: string;
}

export const ImpiantoSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [impianto, setImpianto] = useState<Impianto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    latitudine: 0,
    longitudine: 0,
    ha_fotovoltaico: false,
    fotovoltaico_potenza: undefined as number | undefined,
  });

  // Codice condivisione
  const [codiceCondivisione, setCodiceCondivisione] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);

  // Condivisioni attive
  const [condivisioni, setCondivisioni] = useState<CondivisioneUtente[]>([]);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadImpianto();
      loadCondivisioni();
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
          latitudine: response.data.latitudine || 0,
          longitudine: response.data.longitudine || 0,
          ha_fotovoltaico: response.data.ha_fotovoltaico || false,
          fotovoltaico_potenza: response.data.fotovoltaico_potenza,
        });
        setCodiceCondivisione(response.data.codice_condivisione || '');
      }
    } catch (error) {
      console.error('Errore caricamento impianto:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCondivisioni = async () => {
    try {
      const response = await fetch(`/api/impianti/${id}/condivisioni`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCondivisioni(data.data || []);
      }
    } catch (error) {
      console.error('Errore caricamento condivisioni:', error);
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
    try {
      await impiantiApi.delete(parseInt(id!));
      toast.success('Impianto eliminato con successo');
      navigate('/impianti');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleRevokeAccess = async (condivisioneId: number) => {
    try {
      const response = await fetch(`/api/condivisioni/${condivisioneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadCondivisioni();
        toast.success('Accesso revocato con successo!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Errore durante la revoca dell\'accesso');
      }
    } catch (error) {
      toast.error('Errore durante la revoca dell\'accesso');
    }
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
            onClick={() => navigate(`/impianti/${id}`)}
            className="p-3 glass rounded-xl hover:bg-opacity-20 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold dark:text-copy light:text-copy-light">
              Impostazioni Impianto
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
                <MapPin className="text-primary" size={24} />
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

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Latitudine"
                    type="number"
                    value={formData.latitudine}
                    onChange={(e) => setFormData({ ...formData, latitudine: parseFloat(e.target.value) })}
                    step="0.000001"
                  />
                  <Input
                    label="Longitudine"
                    type="number"
                    value={formData.longitudine}
                    onChange={(e) => setFormData({ ...formData, longitudine: parseFloat(e.target.value) })}
                    step="0.000001"
                  />
                </div>
              </div>
            </Card>

            {/* Fotovoltaico */}
            <Card variant="glass-solid">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="text-warning" size={24} />
                <h2 className="text-xl font-bold dark:text-copy light:text-copy-light">
                  Fotovoltaico
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Card
                    variant={formData.ha_fotovoltaico ? 'glass' : 'glass-dark'}
                    hover
                    className={`cursor-pointer p-4 text-center border-2 ${
                      formData.ha_fotovoltaico ? 'border-success' : 'border-transparent'
                    }`}
                    onClick={() => setFormData({ ...formData, ha_fotovoltaico: true })}
                  >
                    <p className="font-semibold dark:text-copy light:text-copy-light">Presente</p>
                  </Card>
                  <Card
                    variant={!formData.ha_fotovoltaico ? 'glass' : 'glass-dark'}
                    hover
                    className={`cursor-pointer p-4 text-center border-2 ${
                      !formData.ha_fotovoltaico ? 'border-success' : 'border-transparent'
                    }`}
                    onClick={() =>
                      setFormData({ ...formData, ha_fotovoltaico: false, fotovoltaico_potenza: undefined })
                    }
                  >
                    <p className="font-semibold dark:text-copy light:text-copy-light">Non presente</p>
                  </Card>
                </div>

                {formData.ha_fotovoltaico && (
                  <Input
                    label="Potenza Fotovoltaico (kW)"
                    type="number"
                    value={formData.fotovoltaico_potenza || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, fotovoltaico_potenza: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="es. 6.0"
                    step="0.1"
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Colonna Destra - Codice e Condivisioni */}
          <div className="space-y-6">
            {/* Codice Condivisione */}
            <Card variant="glass-solid">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-secondary" size={24} />
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
                    <Copy size={16} className="mr-1" />
                    Copia
                  </Button>
                  <Button variant="glass" size="sm" onClick={() => setShowRegenModal(true)} fullWidth>
                    <RefreshCw size={16} className="mr-1" />
                    Rigenera
                  </Button>
                </div>

                <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                  Condividi questo codice per dare accesso ad altri utenti
                </p>
              </div>
            </Card>

            {/* Condivisioni Attive */}
            <Card variant="glass-solid">
              <h3 className="font-bold dark:text-copy light:text-copy-light mb-4">
                Condivisioni Attive ({condivisioni.length})
              </h3>

              {condivisioni.length === 0 ? (
                <p className="text-sm dark:text-copy-lighter light:text-copy-lighter text-center py-4">
                  Nessuna condivisione attiva
                </p>
              ) : (
                <div className="space-y-2">
                  {condivisioni.filter(c => c !== null && c !== undefined).map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-center justify-between p-3 glass rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium dark:text-copy light:text-copy-light">
                          {cond.email}
                        </p>
                        <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                          {cond.ruolo}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevokeAccess(cond.id)}
                        className="p-2 rounded-lg hover:bg-error hover:bg-opacity-20 transition-colors"
                      >
                        <Trash2 size={16} className="text-error" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-3">
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            <Save size={20} className="mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={20} className="mr-2" />
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

      {/* Modal Eliminazione */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Elimina Impianto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="dark:text-copy-lighter light:text-copy-lighter">
            Sei sicuro di voler eliminare questo impianto? Questa azione è irreversibile e
            cancellerà anche tutti i dispositivi, scene e dati associati.
          </p>
          <div className="flex gap-3">
            <Button variant="glass" onClick={() => setShowDeleteModal(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="danger" onClick={handleDelete} fullWidth>
              Elimina Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
