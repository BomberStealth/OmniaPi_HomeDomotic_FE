import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Building2,
  Lightbulb,
  Sparkles,
  Settings,
  LogOut,
  DoorOpen
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';
import { APP_VERSION, APP_NAME } from '@/config/version';

// ============================================
// SIDEBAR NAVIGATION
// ============================================

export const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: t('nav.dashboard') },
    { path: '/impianti', icon: Building2, label: t('nav.impianti') },
    { path: '/stanze', icon: DoorOpen, label: 'Stanze' },
    { path: '/dispositivi', icon: Lightbulb, label: t('nav.dispositivi') },
    { path: '/scene', icon: Sparkles, label: t('nav.scene') },
    { path: '/settings', icon: Settings, label: t('nav.settings') }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 md:w-64 h-screen glass-solid p-3 sm:p-4 flex flex-col dark:bg-foreground light:bg-white dark:border-r dark:border-border light:border-r light:border-border-light">
      {/* Logo */}
      <div className="mb-6 sm:mb-8 px-2 sm:px-4">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {APP_NAME}
        </h1>
        <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
          {t('app.title')} <span className="text-primary font-semibold">{APP_VERSION}</span>
        </p>
      </div>

      {/* User Info */}
      <Card className="mb-4 sm:mb-6" padding={false}>
        <div className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium dark:text-copy light:text-copy-light truncate">{user?.nome} {user?.cognome}</p>
          <p className="text-xs dark:text-copy-lighter light:text-copy-lighter truncate">{user?.email}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs rounded-lg bg-primary bg-opacity-20 text-primary">
            {user?.ruolo}
          </span>
        </div>
      </Card>

      {/* Impianto Selector - Desktop */}
      <div className="mb-4 sm:mb-6">
        <ImpiantoSelector variant="desktop" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 space-y-1 sm:space-y-2">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <div
              className={`
                flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all
                ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-lg dark:shadow-primary/50 light:shadow-primary/20'
                    : 'dark:text-copy-light light:text-copy-light dark:hover:bg-foreground light:hover:bg-slate-100'
                }
              `}
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl dark:text-copy-light light:text-copy-light hover:bg-error hover:text-white transition-all"
      >
        <LogOut size={20} className="flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base">{t('auth.logout')}</span>
      </button>
    </aside>
  );
};
