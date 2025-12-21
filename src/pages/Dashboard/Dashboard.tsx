import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { sceneApi, tasmotaApi } from '@/services/api';
import { Lightbulb, Thermometer, Zap, Loader } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// DASHBOARD PAGE - Mobile-First Redesign
// ============================================

export const Dashboard = () => {
  const { t } = useTranslation();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const [sceneBase, setSceneBase] = useState<any[]>([]);
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [executing, setExecuting] = useState<number | null>(null);

  useEffect(() => {
    if (impiantoCorrente) {
      loadScene();
      loadDispositivi();
    }
  }, [impiantoCorrente]);

  const loadScene = async () => {
    if (!impiantoCorrente) return;

    try {
      const data = await sceneApi.getScene(impiantoCorrente.id);
      const scenes = Array.isArray(data) ? data : [];
      const base = scenes.filter((s: any) => s.is_base);
      setSceneBase(base);
    } catch (error) {
      console.error('Errore caricamento scene:', error);
      setSceneBase([]);
    }
  };

  const loadDispositivi = async () => {
    if (!impiantoCorrente) return;

    try {
      const data = await tasmotaApi.getDispositivi(impiantoCorrente.id);
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    }
  };

  const executeScene = async (scenaId: number) => {
    setExecuting(scenaId);
    try {
      await sceneApi.executeScena(scenaId);
      toast.success('Scena eseguita!');
    } catch (error) {
      console.error('Errore esecuzione scena:', error);
      toast.error('Errore esecuzione scena');
    } finally {
      setExecuting(null);
    }
  };

  // Calcola statistiche dai dispositivi
  const luciOn = dispositivi.filter(d => d.tipo === 'luce' && d.power_state).length;
  const totLuci = dispositivi.filter(d => d.tipo === 'luce').length;
  const termostati = dispositivi.filter(d => d.tipo === 'termostato').length;

  // Saluto dinamico basato sull'ora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const userName = user?.nome || 'Utente';

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header con Saluto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              {getGreeting()}, {userName.split(' ')[0]}
            </h1>
            {impiantoCorrente && (
              <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
                {impiantoCorrente.nome}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats - Riga Orizzontale Compatta */}
        <Card variant="glass" className="!p-2 sm:!p-3">
          <div className="flex items-center justify-around">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 rounded-lg bg-warning/20">
                <Lightbulb size={14} className="text-warning sm:w-4 sm:h-4" />
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold dark:text-copy light:text-copy-light leading-none">
                  {luciOn}/{totLuci}
                </p>
                <p className="text-[9px] sm:text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                  Luci ON
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-border/30" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 rounded-lg bg-success/20">
                <Thermometer size={14} className="text-success sm:w-4 sm:h-4" />
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold dark:text-copy light:text-copy-light leading-none">
                  {termostati}
                </p>
                <p className="text-[9px] sm:text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                  Termostati
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-border/30" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Zap size={14} className="text-primary sm:w-4 sm:h-4" />
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-lg font-bold dark:text-copy light:text-copy-light leading-none">
                  {dispositivi.length}
                </p>
                <p className="text-[9px] sm:text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                  Dispositivi
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Scene Rapide - Grid Compatta */}
        {sceneBase.length > 0 && (
          <div>
            <h2 className="text-sm sm:text-base font-semibold dark:text-copy light:text-copy-light mb-2">
              {t('dashboard.shortcuts')}
            </h2>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {sceneBase.filter(s => s !== null && s !== undefined).map((scena) => (
                <button
                  key={scena.id}
                  onClick={() => executeScene(scena.id)}
                  disabled={executing === scena.id}
                  className={`
                    flex flex-col items-center justify-center gap-1 p-2.5 sm:p-3
                    rounded-xl glass transition-all duration-200
                    hover:scale-105 active:scale-95
                    ${executing === scena.id ? 'animate-pulse ring-2 ring-primary' : ''}
                  `}
                >
                  <span className="text-xl sm:text-2xl">
                    {executing === scena.id ? (
                      <Loader size={20} className="animate-spin text-primary" />
                    ) : (
                      scena.icona
                    )}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium dark:text-copy light:text-copy-light text-center leading-tight truncate w-full">
                    {scena.nome}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messaggio se nessun impianto selezionato */}
        {!impiantoCorrente && (
          <Card variant="glass" className="text-center py-8">
            <p className="dark:text-copy-lighter light:text-copy-lighter text-sm">
              Seleziona un impianto per vedere i tuoi dispositivi
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};
