import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';
import { useImpiantiStore } from '@/store/impiantiStore';
import { Home, Lightbulb, Thermometer, Blinds } from 'lucide-react';

// ============================================
// DASHBOARD PAGE
// ============================================

export const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { impianti, fetchImpianti } = useImpiantiStore();

  useEffect(() => {
    fetchImpianti();
  }, []);

  const stats = [
    { icon: Home, label: 'Impianti', value: impianti.length, color: 'primary' },
    { icon: Lightbulb, label: 'Luci', value: 0, color: 'warning' },
    { icon: Blinds, label: 'Tapparelle', value: 0, color: 'secondary' },
    { icon: Thermometer, label: 'Termostati', value: 0, color: 'success' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-copy mb-2">
            {t('dashboard.welcome')}, {user?.nome}!
          </h1>
          <p className="text-copy-lighter">
            {new Date().toLocaleDateString('it-IT', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} variant="glass" hover>
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl bg-${stat.color} bg-opacity-20`}>
                  <stat.icon size={32} className={`text-${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-copy">{stat.value}</p>
                  <p className="text-sm text-copy-lighter">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Shortcuts */}
        <div>
          <h2 className="text-2xl font-bold text-copy mb-4">
            {t('dashboard.shortcuts')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Buongiorno', 'Buonanotte', 'Esco', 'Torno'].map((scena) => (
              <Card
                key={scena}
                variant="glass-dark"
                padding={false}
                hover
                className="text-center py-8"
              >
                <p className="text-lg font-medium text-copy">{scena}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-bold text-copy mb-4">
            {t('dashboard.recentActivity')}
          </h2>
          <Card variant="glass-solid">
            <p className="text-copy-lighter text-center py-8">
              Nessuna attività recente
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
