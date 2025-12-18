import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Building2,
  Lightbulb,
  Sparkles,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';

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
    { path: '/dispositivi', icon: Lightbulb, label: t('nav.dispositivi') },
    { path: '/scene', icon: Sparkles, label: t('nav.scene') },
    { path: '/settings', icon: Settings, label: t('nav.settings') }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 h-screen glass-solid p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {t('app.name')}
        </h1>
        <p className="text-sm text-copy-lighter">{t('app.title')}</p>
      </div>

      {/* User Info */}
      <Card className="mb-6" padding={false}>
        <div className="p-4">
          <p className="text-sm font-medium text-copy">{user?.nome} {user?.cognome}</p>
          <p className="text-xs text-copy-lighter">{user?.email}</p>
          <span className="inline-block mt-2 px-2 py-1 text-xs rounded-lg bg-primary bg-opacity-20 text-primary">
            {user?.ruolo}
          </span>
        </div>
      </Card>

      {/* Menu Items */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/50'
                    : 'text-copy-light hover:bg-foreground'
                }
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-copy-light hover:bg-error hover:text-white transition-all"
      >
        <LogOut size={20} />
        <span className="font-medium">{t('auth.logout')}</span>
      </button>
    </aside>
  );
};
