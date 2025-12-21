import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { WizardNuovoImpianto } from '@/components/impianti/WizardNuovoImpianto';
import { useImpiantiStore } from '@/store/impiantiStore';
import { Building2, Home, MapPin, Plus, ChevronRight } from 'lucide-react';

// ============================================
// IMPIANTI PAGE - Redesign Lista Compatta
// ============================================

export const Impianti = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { impianti, fetchImpianti, setImpiantoCorrente } = useImpiantiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchImpianti();
  }, []);

  const handleSelectImpianto = (impianto: any) => {
    setImpiantoCorrente(impianto);
    navigate(`/impianti/${impianto.id}`);
  };

  const handleSuccess = () => {
    fetchImpianti();
  };

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4">
        {/* Header Compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              {t('impianti.title')}
            </h1>
            <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
              {impianti.length} impianti
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-xl bg-primary hover:bg-primary-dark transition-colors"
            title="Nuovo Impianto"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Lista Impianti Compatta */}
        {impianti.length > 0 ? (
          <div className="flex flex-col gap-2">
            {impianti.filter(i => i !== null && i !== undefined).map((impianto) => (
              <Card
                key={impianto.id}
                variant="glass"
                hover
                padding={false}
                className="cursor-pointer"
                onClick={() => handleSelectImpianto(impianto)}
              >
                <div className="flex items-center gap-3 p-3">
                  {/* Icona */}
                  <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
                    <Home size={18} className="text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm dark:text-copy light:text-copy-light truncate">
                      {impianto.nome}
                    </h3>
                    {impianto.indirizzo && (
                      <p className="text-[11px] dark:text-copy-lighter light:text-copy-lighter truncate flex items-center gap-1">
                        <MapPin size={10} className="flex-shrink-0" />
                        {impianto.indirizzo}, {impianto.citta}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={18} className="dark:text-copy-lighter light:text-copy-lighter flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="text-center py-8">
            <Building2 size={40} className="mx-auto mb-3 dark:text-copy-lighter light:text-copy-lighter" />
            <h3 className="text-base font-semibold dark:text-copy light:text-copy-light mb-1">
              Nessun impianto
            </h3>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mb-4">
              Aggiungi il tuo primo impianto
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} className="inline mr-1" />
              Nuovo Impianto
            </button>
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
