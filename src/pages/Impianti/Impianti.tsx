import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { NuovoImpiantoModal } from '@/components/impianti/NuovoImpiantoModal';
import { useImpiantiStore } from '@/store/impiantiStore';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { Building2, MapPin, Plus } from 'lucide-react';

// ============================================
// IMPIANTI PAGE
// ============================================

export const Impianti = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { impianti, fetchImpianti, setImpiantoCorrente } = useImpiantiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchImpianti();
  }, []);

  const canCreateImpianto = user?.ruolo === UserRole.INSTALLATORE || user?.ruolo === UserRole.ADMIN;

  const handleSelectImpianto = (impianto: any) => {
    setImpiantoCorrente(impianto);
    navigate(`/impianti/${impianto.id}`);
  };

  const handleSuccess = () => {
    fetchImpianti();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-copy mb-2">
              {t('impianti.title')}
            </h1>
            <p className="text-copy-lighter">{impianti.length} impianti totali</p>
          </div>

          {canCreateImpianto && (
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} className="mr-2" />
              {t('impianti.nuovo')}
            </Button>
          )}
        </div>

        {/* Impianti Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {impianti.map((impianto) => (
            <Card
              key={impianto.id}
              variant="glass"
              hover
              className="cursor-pointer"
              onClick={() => handleSelectImpianto(impianto)}
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-primary bg-opacity-20">
                  <Building2 size={32} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-copy mb-1">
                    {impianto.nome}
                  </h3>
                  {impianto.indirizzo && (
                    <div className="flex items-center gap-2 text-sm text-copy-lighter">
                      <MapPin size={14} />
                      <span>{impianto.indirizzo}, {impianto.citta}</span>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-copy-lighter">
                    Creato il {new Date(impianto.creato_il).toLocaleDateString('it-IT')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {impianti.length === 0 && (
          <Card variant="glass-solid" className="text-center py-16">
            <Building2 size={64} className="mx-auto mb-4 text-copy-lighter" />
            <h3 className="text-xl font-semibold text-copy mb-2">
              Nessun impianto trovato
            </h3>
            <p className="text-copy-lighter mb-6">
              {canCreateImpianto
                ? 'Crea il tuo primo impianto per iniziare'
                : 'Contatta un installatore per creare un impianto'}
            </p>
            {canCreateImpianto && (
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                <Plus size={20} className="mr-2" />
                {t('impianti.nuovo')}
              </Button>
            )}
          </Card>
        )}

        <NuovoImpiantoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      </div>
    </Layout>
  );
};
