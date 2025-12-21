import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Bell, Moon, Sun, Shield } from 'lucide-react';
import { UserRole } from '@/types';
import { APP_VERSION } from '@/config/version';

export const Settings = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.ruolo === UserRole.ADMIN;

  // Grid compatto senza scrollbar
  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold dark:text-copy light:text-copy-light">Impostazioni</h1>
          <span className="text-sm dark:text-copy-lighter light:text-copy-lighter">
            <span className="text-primary font-semibold">{APP_VERSION}</span>
          </span>
        </div>

        {/* Griglia compatta 2 colonne mobile, 3 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Profilo */}
          <Card variant="glass" className="p-4">
            <User className="text-primary mb-2" size={24} />
            <h3 className="font-bold dark:text-copy light:text-copy-light text-sm">Profilo</h3>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mt-1">{user?.nome}</p>
          </Card>

          {/* Sicurezza */}
          <Card variant="glass" className="p-4">
            <Shield className="text-warning mb-2" size={24} />
            <h3 className="font-bold dark:text-copy light:text-copy-light text-sm">Sicurezza</h3>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mt-1">Password</p>
          </Card>

          {/* Notifiche */}
          <Card variant="glass" className="p-4">
            <Bell className="text-secondary mb-2" size={24} />
            <h3 className="font-bold dark:text-copy light:text-copy-light text-sm">Notifiche</h3>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mt-1">Abilitate</p>
          </Card>

          {/* Tema - Mobile e Desktop */}
          <Card variant="glass" className="p-4 col-span-2 md:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="text-primary" size={24} /> : <Sun className="text-warning" size={24} />}
                <div>
                  <h3 className="font-bold dark:text-copy light:text-copy-light text-sm">Tema</h3>
                  <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">{theme === 'dark' ? 'Scuro' : 'Chiaro'}</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-warning'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${theme === 'dark' ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </Card>

          {/* Admin Panel - Solo per admin */}
          {isAdmin && (
            <Card variant="glass" className="p-4 col-span-2 md:col-span-3">
              <h3 className="font-bold dark:text-copy light:text-copy-light mb-3 flex items-center gap-2">
                <Shield className="text-error" size={20} />
                Amministrazione Account
              </h3>

              <div className="space-y-3">
                <Input
                  label="Cerca utente"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="es. anna"
                />

                <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                  Funzionalità in sviluppo - Connetti al backend per cercare utenti
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};
