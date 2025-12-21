import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { WizardNuovoImpianto } from '@/components/impianti/WizardNuovoImpianto';
import { useImpiantiStore } from '@/store/impiantiStore';
import { Building2, MapPin, Plus } from 'lucide-react';

// ============================================
// IMPIANTI PAGE
// ============================================

export const Impianti = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { impianti, fetchImpianti, setImpiantoCorrente } = useImpiantiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchImpianti();
  }, []);

  // Tutti gli utenti autenticati possono creare impianti
  const canCreateImpianto = true;

  const handleSelectImpianto = (impianto: any) => {
    setImpiantoCorrente(impianto);
    navigate(`/impianti/${impianto.id}`);
  };

  const handleSuccess = () => {
    fetchImpianti();
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-copy mb-1 sm:mb-2">
              {t('impianti.title')}
            </h1>
            <p className="text-sm sm:text-base dark:text-copy-lighter light:text-copy-lighter">{impianti.length} impianti totali</p>
          </div>

          {canCreateImpianto && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
              <Plus size={20} className="mr-2" />
              <span className="text-sm sm:text-base">{t('impianti.nuovo')}</span>
            </Button>
          )}
        </div>

        {/* Impianti Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {impianti.filter(i => i !== null && i !== undefined).map((impianto) => (
            <Card
              key={impianto.id}
              variant="glass"
              hover
              className="cursor-pointer"
              onClick={() => handleSelectImpianto(impianto)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-primary bg-opacity-20 flex-shrink-0">
                  <Building2 size={28} className="sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-copy mb-1">
                    {impianto.nome}
                  </h3>
                  {impianto.indirizzo && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{impianto.indirizzo}, {impianto.citta}</span>
                    </div>
                  )}
                  <div className="mt-2 sm:mt-3 text-xs dark:text-copy-lighter light:text-copy-lighter">
                    Creato il {new Date(impianto.creato_il).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {impianti.length === 0 && (
          <Card variant="glass-solid" className="text-center py-12 sm:py-16">
            <Building2 size={48} className="sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 dark:text-copy-lighter light:text-copy-lighter" />
            <h3 className="text-lg sm:text-xl font-semibold text-copy mb-2">
              Nessun impianto trovato
            </h3>
            <p className="text-sm sm:text-base text-copy-lighter mb-4 sm:mb-6 px-4">
              {canCreateImpianto
                ? 'Crea il tuo primo impianto per iniziare'
                : 'Contatta un installatore per creare un impianto'}
            </p>
            {canCreateImpianto && (
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={20} className="mr-2" />
                <span className="text-sm sm:text-base">{t('impianti.nuovo')}</span>
              </Button>
            )}
          </Card>
        )}

        <WizardNuovoImpianto
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </Layout>
  );
};
