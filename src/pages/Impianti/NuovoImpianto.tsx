import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { impiantiApi } from '@/services/api';
import { RiArrowLeftLine, RiBuilding2Line, RiMapPinLine, RiHome4Line, RiHashtag, RiSunLine, RiFlashlightLine } from 'react-icons/ri';
import { toast } from '@/utils/toast';

// ============================================
// NUOVO IMPIANTO PAGE - Creazione Impianto
// ============================================

export const NuovoImpianto = () => {
  const navigate = useNavigate();
  const { refresh } = useImpiantoContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    ha_fotovoltaico: false,
    fotovoltaico_potenza: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error('Il nome è richiesto');
      return;
    }

    if (!formData.indirizzo.trim()) {
      toast.error('L\'indirizzo è richiesto');
      return;
    }

    if (!formData.citta.trim()) {
      toast.error('La città è richiesta');
      return;
    }

    if (!formData.cap.trim()) {
      toast.error('Il CAP è richiesto');
      return;
    }

    try {
      setLoading(true);
      await impiantiApi.create({
        ...formData,
        fotovoltaico_potenza: formData.fotovoltaico_potenza ? parseFloat(formData.fotovoltaico_potenza) : undefined
      });
      toast.success('Impianto creato con successo!');
      await refresh();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Errore creazione impianto:', error);
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.nome.trim() && formData.indirizzo.trim() && formData.citta.trim() && formData.cap.trim();

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl glass hover:bg-white/10 transition-colors"
          >
            <RiArrowLeftLine size={20} className="dark:text-copy light:text-copy-light" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              Nuovo Impianto
            </h1>
            <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
              Crea un nuovo impianto domotico
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card variant="glass" className="!p-4 sm:!p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                <RiHome4Line size={16} className="text-primary" />
                Nome Impianto *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="es. Casa Principale"
                autoFocus
              />
            </div>

            {/* Indirizzo */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                <RiMapPinLine size={16} className="text-primary" />
                Indirizzo *
              </label>
              <Input
                value={formData.indirizzo}
                onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                placeholder="es. Via Roma 1"
              />
            </div>

            {/* Città e CAP in row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Città */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                  <RiBuilding2Line size={16} className="text-primary" />
                  Città *
                </label>
                <Input
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  placeholder="es. Milano"
                />
              </div>

              {/* CAP */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                  <RiHashtag size={16} className="text-primary" />
                  CAP *
                </label>
                <Input
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  placeholder="es. 20100"
                  maxLength={5}
                />
              </div>
            </div>

            {/* Fotovoltaico Toggle */}
            <div className="p-3 rounded-xl glass">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RiSunLine size={16} className="text-warning" />
                  <span className="text-sm font-medium dark:text-copy light:text-copy-light">
                    Impianto Fotovoltaico
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ha_fotovoltaico: !formData.ha_fotovoltaico })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    formData.ha_fotovoltaico ? 'bg-success' : 'bg-gray-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      formData.ha_fotovoltaico ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Potenza Fotovoltaico */}
              {formData.ha_fotovoltaico && (
                <div className="mt-3 pt-3 border-t dark:border-border light:border-border-light">
                  <label className="flex items-center gap-2 text-sm font-medium dark:text-copy light:text-copy-light mb-2">
                    <RiFlashlightLine size={16} className="text-warning" />
                    Potenza (kW)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.fotovoltaico_potenza}
                    onChange={(e) => setFormData({ ...formData, fotovoltaico_potenza: e.target.value })}
                    placeholder="es. 6.0"
                  />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                Dopo la creazione potrai aggiungere stanze e dispositivi al tuo impianto.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="glass"
                onClick={() => navigate(-1)}
                fullWidth
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={loading || !isFormValid}
              >
                {loading ? 'Creazione...' : 'Crea Impianto'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};
