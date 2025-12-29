import { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import { impiantiApi } from '@/services/api';
import { RiAddLine, RiLinksLine, RiMapPinLine, RiFlashlightLine, RiCheckLine } from 'react-icons/ri';

// ============================================
// WIZARD NUOVO IMPIANTO - Multi Step
// ============================================

interface WizardNuovoImpiantoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type WizardMode = 'choice' | 'connect' | 'create';
type WizardStep = 1 | 2 | 3;

interface ImpiantoForm {
  nome: string;
  indirizzo: string;
  citta: string;
  cap: string;
  ha_fotovoltaico: boolean;
  fotovoltaico_potenza: number | undefined;
}

export const WizardNuovoImpianto = ({ isOpen, onClose, onSuccess }: WizardNuovoImpiantoProps) => {
  const [mode, setMode] = useState<WizardMode>('choice');
  const [step, setStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form per nuovo impianto
  const [form, setForm] = useState<ImpiantoForm>({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    ha_fotovoltaico: false,
    fotovoltaico_potenza: undefined
  });

  // Codice per connessione
  const [codiceCondivisione, setCodiceCondivisione] = useState('');

  const resetWizard = () => {
    setMode('choice');
    setStep(1);
    setForm({
      nome: '',
      indirizzo: '',
      citta: '',
      cap: '',
      ha_fotovoltaico: false,
      fotovoltaico_potenza: undefined
    });
    setCodiceCondivisione('');
    setError('');
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  // ============================================
  // CONNETTI AD IMPIANTO ESISTENTE
  // ============================================

  const handleConnetti = async () => {
    if (!codiceCondivisione.trim()) {
      setError('Inserisci un codice condivisione');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await impiantiApi.connect(codiceCondivisione.trim().toUpperCase());
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Codice non valido o impianto non trovato');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // WIZARD CREA NUOVO IMPIANTO
  // ============================================

  const validateStep1 = () => {
    if (!form.nome.trim()) {
      setError('Inserisci il nome dell\'impianto');
      return false;
    }
    if (!form.indirizzo.trim()) {
      setError('Inserisci l\'indirizzo');
      return false;
    }
    if (!form.citta.trim()) {
      setError('Inserisci la città');
      return false;
    }
    if (!form.cap.trim() || !/^\d{5}$/.test(form.cap)) {
      setError('Inserisci un CAP valido (5 cifre)');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Validazione obbligatoria: deve selezionare se ha o no fotovoltaico
    if (form.ha_fotovoltaico === null || form.ha_fotovoltaico === undefined) {
      setError('Indica se l\'impianto ha il fotovoltaico');
      return false;
    }

    if (form.ha_fotovoltaico && (!form.fotovoltaico_potenza || form.fotovoltaico_potenza <= 0)) {
      setError('Inserisci la potenza del fotovoltaico');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');

    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step < 3) {
      setStep((step + 1) as WizardStep);
    }
  };

  const handlePrevStep = () => {
    setError('');
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleCreaImpianto = async () => {
    setLoading(true);
    setError('');

    try {
      await impiantiApi.create({
        nome: form.nome.trim(),
        indirizzo: form.indirizzo.trim(),
        citta: form.citta.trim(),
        cap: form.cap.trim(),
        ha_fotovoltaico: form.ha_fotovoltaico,
        fotovoltaico_potenza: form.ha_fotovoltaico ? form.fotovoltaico_potenza : undefined
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore durante la creazione dell\'impianto');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER: SCHERMATA SCELTA INIZIALE
  // ============================================

  if (mode === 'choice') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Aggiungi Impianto" size="md">
        <div className="space-y-4">
          <p className="dark:text-copy-lighter light:text-copy-lighter">
            Scegli come vuoi aggiungere un impianto:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nuovo Impianto */}
            <Card
              variant="glass"
              hover
              className="cursor-pointer p-6 text-center"
              onClick={() => setMode('create')}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-primary bg-opacity-20">
                  <RiAddLine size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-copy light:text-copy-light mb-2">
                    Nuovo Impianto
                  </h3>
                  <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">
                    Crea un nuovo impianto da zero
                  </p>
                </div>
              </div>
            </Card>

            {/* Connetti ad Esistente */}
            <Card
              variant="glass"
              hover
              className="cursor-pointer p-6 text-center"
              onClick={() => setMode('connect')}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-xl bg-secondary bg-opacity-20">
                  <RiLinksLine size={32} className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-copy light:text-copy-light mb-2">
                    Connetti ad Esistente
                  </h3>
                  <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">
                    Usa un codice condivisione
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Modal>
    );
  }

  // ============================================
  // RENDER: CONNETTI AD IMPIANTO ESISTENTE
  // ============================================

  if (mode === 'connect') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Connetti ad Impianto" size="sm">
        <div className="space-y-4">
          <p className="dark:text-copy-lighter light:text-copy-lighter">
            Inserisci il codice condivisione ricevuto dal proprietario dell'impianto:
          </p>

          <Input
            label="Codice Condivisione"
            value={codiceCondivisione}
            onChange={(e) => setCodiceCondivisione(e.target.value.toUpperCase())}
            placeholder="es. 3AF2FB62"
            maxLength={10}
          />

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setMode('choice')} disabled={loading}>
              Indietro
            </Button>
            <Button variant="primary" onClick={handleConnetti} disabled={loading}>
              {loading ? 'Connessione...' : 'Connetti'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // ============================================
  // RENDER: WIZARD CREA NUOVO IMPIANTO (3 STEP)
  // ============================================

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium dark:text-copy light:text-copy-light">
          Step {step} di 3
        </span>
        <span className="text-sm dark:text-copy-lighter light:text-copy-lighter">
          {step === 1 && 'Informazioni Base'}
          {step === 2 && 'Fotovoltaico'}
          {step === 3 && 'Riepilogo'}
        </span>
      </div>
      <div className="w-full bg-foreground h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuovo Impianto" size="md">
      {renderProgressBar()}

      <div className="space-y-4">
        {/* STEP 1: Informazioni Base */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <RiMapPinLine className="text-primary" size={24} />
              <h3 className="text-lg font-bold dark:text-copy light:text-copy-light">
                Dove si trova l'impianto?
              </h3>
            </div>

            <Input
              label="Nome Impianto"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="es. Casa Principale"
            />

            <Input
              label="Indirizzo"
              value={form.indirizzo}
              onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
              placeholder="es. Via Roma 123"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Città"
                value={form.citta}
                onChange={(e) => setForm({ ...form, citta: e.target.value })}
                placeholder="es. Milano"
              />

              <Input
                label="CAP"
                value={form.cap}
                onChange={(e) => setForm({ ...form, cap: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                placeholder="es. 20100"
                maxLength={5}
              />
            </div>
          </>
        )}

        {/* STEP 2: Fotovoltaico */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <RiFlashlightLine className="text-warning" size={24} />
              <h3 className="text-lg font-bold dark:text-copy light:text-copy-light">
                È presente il fotovoltaico?
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card
                variant={form.ha_fotovoltaico ? 'glass' : 'glass-dark'}
                hover
                className={`cursor-pointer p-4 text-center border-2 ${
                  form.ha_fotovoltaico ? 'border-success' : 'border-transparent'
                }`}
                onClick={() => setForm({ ...form, ha_fotovoltaico: true })}
              >
                <p className="font-semibold dark:text-copy light:text-copy-light">Sì</p>
              </Card>

              <Card
                variant={!form.ha_fotovoltaico ? 'glass' : 'glass-dark'}
                hover
                className={`cursor-pointer p-4 text-center border-2 ${
                  !form.ha_fotovoltaico ? 'border-success' : 'border-transparent'
                }`}
                onClick={() => setForm({ ...form, ha_fotovoltaico: false, fotovoltaico_potenza: undefined })}
              >
                <p className="font-semibold dark:text-copy light:text-copy-light">No</p>
              </Card>
            </div>

            {form.ha_fotovoltaico && (
              <Input
                label="Potenza Fotovoltaico (kW)"
                type="number"
                value={form.fotovoltaico_potenza || ''}
                onChange={(e) => setForm({ ...form, fotovoltaico_potenza: parseFloat(e.target.value) || undefined })}
                placeholder="es. 6.0"
                step="0.1"
              />
            )}
          </>
        )}

        {/* STEP 3: Riepilogo */}
        {step === 3 && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <RiCheckLine className="text-success" size={24} />
              <h3 className="text-lg font-bold dark:text-copy light:text-copy-light">
                Conferma i Dati
              </h3>
            </div>

            <Card variant="glass-solid">
              <div className="space-y-3">
                <div>
                  <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">Nome</p>
                  <p className="font-semibold dark:text-copy light:text-copy-light">{form.nome}</p>
                </div>
                <div>
                  <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">Indirizzo</p>
                  <p className="font-semibold dark:text-copy light:text-copy-light">
                    {form.indirizzo}, {form.citta} {form.cap}
                  </p>
                </div>
                <div>
                  <p className="text-sm dark:text-copy-lighter light:text-copy-lighter">Fotovoltaico</p>
                  <p className="font-semibold dark:text-copy light:text-copy-light">
                    {form.ha_fotovoltaico
                      ? `Sì (${form.fotovoltaico_potenza} kW)`
                      : 'No'}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {error && (
          <p className="text-error text-sm">{error}</p>
        )}

        {/* Bottoni Navigazione */}
        <div className="flex gap-3 mt-6">
          {step === 1 ? (
            <Button variant="glass" onClick={() => setMode('choice')} disabled={loading}>
              Indietro
            </Button>
          ) : (
            <Button variant="glass" onClick={handlePrevStep} disabled={loading}>
              Indietro
            </Button>
          )}

          {step < 3 ? (
            <Button variant="primary" onClick={handleNextStep} disabled={loading}>
              Avanti
            </Button>
          ) : (
            <Button variant="primary" onClick={handleCreaImpianto} disabled={loading}>
              {loading ? 'Creazione...' : 'Crea Impianto'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
