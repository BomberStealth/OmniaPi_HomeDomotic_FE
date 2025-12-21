import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Bell, Moon, Sun, Shield, Mail, ChevronRight } from 'lucide-react';
import { UserRole } from '@/types';
import { APP_VERSION } from '@/config/version';

// ============================================
// SETTINGS PAGE - Mobile-First Redesign
// ============================================

export const Settings = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.ruolo === UserRole.ADMIN;

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header Compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              Impostazioni
            </h1>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
              v{APP_VERSION}
            </p>
          </div>
        </div>

        {/* Profilo Utente Card */}
        <Card variant="glass" className="!p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-primary sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base dark:text-copy light:text-copy-light truncate">
                {user?.nome || 'Utente'}
              </h3>
              <p className="text-[10px] sm:text-xs dark:text-copy-lighter light:text-copy-lighter flex items-center gap-1 truncate">
                <Mail size={10} />
                {user?.email || 'email@example.com'}
              </p>
            </div>
            <ChevronRight size={16} className="dark:text-copy-lighter light:text-copy-lighter flex-shrink-0" />
          </div>
        </Card>

        {/* Sezioni Impostazioni */}
        <div className="space-y-2">
          {/* Tema Toggle */}
          <Card variant="glass" className="!p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-primary/20' : 'bg-warning/20'}`}>
                  {theme === 'dark' ? (
                    <Moon size={16} className="text-primary" />
                  ) : (
                    <Sun size={16} className="text-warning" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-sm dark:text-copy light:text-copy-light">Tema</h3>
                  <p className="text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                    {theme === 'dark' ? 'Scuro' : 'Chiaro'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary' : 'bg-warning'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                    theme === 'dark' ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Notifiche */}
          <Card variant="glass" hover className="!p-3 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-secondary/20">
                  <Bell size={16} className="text-secondary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm dark:text-copy light:text-copy-light">Notifiche</h3>
                  <p className="text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                    Gestisci notifiche push
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="dark:text-copy-lighter light:text-copy-lighter" />
            </div>
          </Card>

          {/* Sicurezza */}
          <Card variant="glass" hover className="!p-3 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-warning/20">
                  <Shield size={16} className="text-warning" />
                </div>
                <div>
                  <h3 className="font-medium text-sm dark:text-copy light:text-copy-light">Sicurezza</h3>
                  <p className="text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                    Password e autenticazione
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="dark:text-copy-lighter light:text-copy-lighter" />
            </div>
          </Card>
        </div>

        {/* Admin Panel - Solo per admin */}
        {isAdmin && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider dark:text-copy-lighter light:text-copy-lighter px-1">
              Amministrazione
            </h2>
            <Card variant="glass" className="!p-3">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-1.5 rounded-lg bg-error/20">
                  <Shield size={16} className="text-error" />
                </div>
                <h3 className="font-medium text-sm dark:text-copy light:text-copy-light">
                  Gestione Account
                </h3>
              </div>

              <div className="space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca utente..."
                />
                <p className="text-[10px] dark:text-copy-lighter light:text-copy-lighter">
                  Funzionalità in sviluppo
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
