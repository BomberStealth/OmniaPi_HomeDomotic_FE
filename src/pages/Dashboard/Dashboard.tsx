import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { sceneApi } from '@/services/api';
import { Home, Lightbulb, Thermometer, Blinds } from 'lucide-react';

// ============================================
// DASHBOARD PAGE
// ============================================

export const Dashboard = () => {
  const { t } = useTranslation();
  const { impiantoCorrente, impianti } = useImpiantoContext();
  const [sceneBase, setSceneBase] = useState<any[]>([]);

  useEffect(() => {
    if (impiantoCorrente) {
      loadScene();
    }
  }, [impiantoCorrente]);

  const loadScene = async () => {
    if (!impiantoCorrente) return;

    try {
      const data = await sceneApi.getScene(impiantoCorrente.id);
      // Filtra solo le scene base
      const scenes = Array.isArray(data) ? data : [];
      const base = scenes.filter((s: any) => s.is_base);
      setSceneBase(base);
    } catch (error) {
      console.error('Errore caricamento scene:', error);
      setSceneBase([]);
    }
  };

  const executeScene = async (scenaId: number) => {
    try {
      await sceneApi.executeScena(scenaId);
    } catch (error) {
      console.error('Errore esecuzione scena:', error);
    }
  };

  const stats = [
    { icon: Home, label: 'Impianti', value: impianti.length, color: 'primary' },
    { icon: Lightbulb, label: 'Luci', value: 0, color: 'warning' },
    { icon: Blinds, label: 'Tapparelle', value: 0, color: 'secondary' },
    { icon: Thermometer, label: 'Termostati', value: 0, color: 'success' }
  ];

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Stats Grid - Ultra Compact for Mobile */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} variant="glass" hover className="p-2 sm:p-3">
              <div className="flex flex-col items-center justify-center gap-1">
                <div className={`p-1.5 sm:p-2 rounded-lg bg-${stat.color} bg-opacity-20`}>
                  <stat.icon size={16} className={`text-${stat.color} sm:w-5 sm:h-5`} />
                </div>
                <p className="text-lg sm:text-2xl font-bold dark:text-copy light:text-copy-light">{stat.value}</p>
                <p className="text-[10px] sm:text-xs dark:text-copy-lighter light:text-copy-lighter text-center leading-tight">
                  {stat.label}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Shortcuts Scene - Ultra Compact */}
        {sceneBase.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold dark:text-copy light:text-copy-light mb-2 sm:mb-3">
              {t('dashboard.shortcuts')}
            </h2>
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              {sceneBase.filter(s => s !== null && s !== undefined).map((scena) => (
                <Card
                  key={scena.id}
                  variant="glass-dark"
                  padding={false}
                  hover
                  className="cursor-pointer p-2 sm:p-3"
                  onClick={() => executeScene(scena.id)}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                    <span className="text-lg sm:text-2xl">{scena.icona}</span>
                    <p className="text-[10px] sm:text-xs font-medium dark:text-copy light:text-copy-light text-center leading-tight">
                      {scena.nome}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
