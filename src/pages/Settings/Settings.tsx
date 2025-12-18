import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';
import {
  User,
  Lock,
  Globe,
  Bell,
  Wifi,
  Database,
  Shield,
  Moon,
  Sun
} from 'lucide-react';

// ============================================
// SETTINGS PAGE
// ============================================

export const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system' | 'notifications'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profilo', icon: User },
    { id: 'security', label: 'Sicurezza', icon: Shield },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'system', label: 'Sistema', icon: Database }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-copy mb-2">{t('nav.settings')}</h1>
          <p className="text-copy-lighter">Gestisci le impostazioni dell'applicazione</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <Card variant="glass-solid" padding={false}>
            <div className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${activeTab === tab.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/50'
                      : 'text-copy-light hover:bg-foreground'
                    }
                  `}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card variant="glass">
                <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                  <User size={24} />
                  Informazioni Profilo
                </h2>

                <div className="space-y-4">
                  <Input label="Nome" value={user?.nome || ''} readOnly />
                  <Input label="Cognome" value={user?.cognome || ''} readOnly />
                  <Input label="Email" value={user?.email || ''} readOnly />
                  <Input label="Ruolo" value={user?.ruolo || ''} readOnly />
                </div>

                <div className="mt-6">
                  <Button variant="primary">Modifica Profilo</Button>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card variant="glass">
                <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                  <Lock size={24} />
                  Sicurezza
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-copy mb-3">Cambia Password</h3>
                    <div className="space-y-3">
                      <Input type="password" label="Password Attuale" />
                      <Input type="password" label="Nuova Password" />
                      <Input type="password" label="Conferma Password" />
                      <Button variant="primary">Aggiorna Password</Button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-lg font-semibold text-copy mb-3">Autenticazione a Due Fattori</h3>
                    <p className="text-sm text-copy-lighter mb-3">
                      Aggiungi un ulteriore livello di sicurezza al tuo account
                    </p>
                    <Button variant="glass">Abilita 2FA</Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card variant="glass">
                <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                  <Bell size={24} />
                  Notifiche
                </h2>

                <div className="space-y-4">
                  {[
                    { label: 'Notifiche dispositivi offline', enabled: true },
                    { label: 'Avvisi aggiornamenti sistema', enabled: true },
                    { label: 'Report settimanale attività', enabled: false },
                    { label: 'Notifiche scene automatiche', enabled: true }
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center justify-between p-4 glass rounded-lg">
                      <span className="text-copy">{notif.label}</span>
                      <button
                        className={`
                          relative w-14 h-8 rounded-full transition-colors
                          ${notif.enabled ? 'bg-primary' : 'bg-border'}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                            ${notif.enabled ? 'right-1' : 'left-1'}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* System Tab */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <Card variant="glass">
                  <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                    <Globe size={24} />
                    Lingua e Regione
                  </h2>

                  <div className="flex gap-3">
                    <Button
                      variant={i18n.language === 'it' ? 'primary' : 'glass'}
                      onClick={() => changeLanguage('it')}
                    >
                      🇮🇹 Italiano
                    </Button>
                    <Button
                      variant={i18n.language === 'en' ? 'primary' : 'glass'}
                      onClick={() => changeLanguage('en')}
                    >
                      🇬🇧 English
                    </Button>
                  </div>
                </Card>

                <Card variant="glass">
                  <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                    <Wifi size={24} />
                    Connessione
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div>
                        <p className="font-medium text-copy">Backend API</p>
                        <p className="text-sm text-copy-lighter">http://192.168.1.11:3000</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div>
                        <p className="font-medium text-copy">WebSocket</p>
                        <p className="text-sm text-copy-lighter">Real-time connection</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between p-4 glass rounded-lg">
                      <div>
                        <p className="font-medium text-copy">MQTT Broker</p>
                        <p className="text-sm text-copy-lighter">Tasmota devices</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                    </div>
                  </div>
                </Card>

                <Card variant="glass">
                  <h2 className="text-2xl font-bold text-copy mb-6 flex items-center gap-2">
                    <Database size={24} />
                    Dati e Privacy
                  </h2>

                  <div className="space-y-3">
                    <Button variant="glass" fullWidth>Esporta Dati</Button>
                    <Button variant="danger" fullWidth>Elimina Account</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
