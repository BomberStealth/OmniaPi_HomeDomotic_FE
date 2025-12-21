import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';

// ============================================
// MAIN LAYOUT
// ============================================

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen dark:bg-background light:bg-foreground-light overflow-hidden">
      {/* Mobile Header - Mobile only */}
      <MobileHeader />

      {/* Sidebar - Desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 pt-20 lg:pt-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNav />
    </div>
  );
};
