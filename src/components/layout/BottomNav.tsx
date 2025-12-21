import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building2,
  Lightbulb,
  Sparkles,
  Settings
} from 'lucide-react';

// ============================================
// BOTTOM NAVIGATION - Mobile (stile Amazon)
// ============================================

export const BottomNav = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/impianti', icon: Building2, label: 'Impianti' },
    { path: '/dispositivi', icon: Lightbulb, label: 'Dispositivi' },
    { path: '/scene', icon: Sparkles, label: 'Scene' },
    { path: '/settings', icon: Settings, label: 'Altro' }
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-solid border-t dark:border-border light:border-border-light safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 transition-colors
                ${active
                  ? 'text-primary'
                  : 'dark:text-copy-lighter light:text-copy-lighter'
                }
              `}
            >
              <item.icon
                size={22}
                className={active ? 'text-primary' : ''}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
