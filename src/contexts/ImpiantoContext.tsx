import { createContext, useContext, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useImpiantiStore } from '@/store/impiantiStore';
import type { Impianto } from '@/types';

// ============================================
// IMPIANTO CONTEXT - Wrapper per Zustand Store
// Mantiene API retrocompatibile mentre usa lo store
// ============================================

interface ImpiantoContextType {
  impiantoCorrente: Impianto | null;
  setImpiantoCorrente: (impianto: Impianto | null) => void;
  impianti: Impianto[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const ImpiantoContext = createContext<ImpiantoContextType | undefined>(undefined);

export const ImpiantoProvider = ({ children }: { children: ReactNode }) => {
  // Usa lo store Zustand come single source of truth
  const {
    impianti,
    impiantoCorrente,
    isLoading,
    fetchImpianti,
    setImpiantoCorrente: storeSetImpiantoCorrente
  } = useImpiantiStore();

  // Carica impianti al mount
  useEffect(() => {
    fetchImpianti();
  }, [fetchImpianti]);

  // Memoizza setImpiantoCorrente per stabilità referenziale
  const setImpiantoCorrente = useCallback((impianto: Impianto | null) => {
    storeSetImpiantoCorrente(impianto);
  }, [storeSetImpiantoCorrente]);

  // Memoizza refresh
  const refresh = useCallback(async () => {
    await fetchImpianti();
  }, [fetchImpianti]);

  // Memoizza il value per evitare re-render
  const value = useMemo<ImpiantoContextType>(() => ({
    impiantoCorrente,
    setImpiantoCorrente,
    impianti,
    loading: isLoading,
    refresh
  }), [impiantoCorrente, setImpiantoCorrente, impianti, isLoading, refresh]);

  return (
    <ImpiantoContext.Provider value={value}>
      {children}
    </ImpiantoContext.Provider>
  );
};

// Hook per usare il context
export const useImpiantoContext = () => {
  const context = useContext(ImpiantoContext);
  if (!context) {
    throw new Error('useImpiantoContext deve essere usato dentro ImpiantoProvider');
  }
  return context;
};
