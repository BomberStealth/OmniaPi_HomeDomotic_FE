import { ImpiantoSelector } from '@/components/shared/ImpiantoSelector';

// ============================================
// MOBILE HEADER - Header fisso mobile
// ============================================

export const MobileHeader = () => {
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b dark:border-border light:border-border-light backdrop-blur-xl">
      <div className="px-4 py-3">
        <ImpiantoSelector variant="mobile" />
      </div>
    </div>
  );
};
