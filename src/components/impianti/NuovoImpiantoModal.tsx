import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { impiantiApi } from '@/services/api';

// ============================================
// NUOVO IMPIANTO MODAL
// ============================================

interface NuovoImpiantoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NuovoImpiantoModal = ({ isOpen, onClose, onSuccess }: NuovoImpiantoModalProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    indirizzo: '',
    citta: '',
    cap: '',
    cliente_id: 1 // Da sostituire con select clienti
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await impiantiApi.create(formData);
      onSuccess();
      onClose();
      setFormData({ nome: '', indirizzo: '', citta: '', cap: '', cliente_id: 1 });
    } catch (error) {
      console.error('Errore creazione impianto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('impianti.nuovo')} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('impianti.nome')}
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
          placeholder="Casa Famiglia"
        />

        <Input
          label={t('impianti.indirizzo')}
          value={formData.indirizzo}
          onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
          placeholder="Via Roma 123"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('impianti.citta')}
            value={formData.citta}
            onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
            placeholder="Milano"
          />

          <Input
            label={t('impianti.cap')}
            value={formData.cap}
            onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
            placeholder="20100"
            maxLength={5}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="glass" fullWidth onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
