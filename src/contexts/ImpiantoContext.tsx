import { createContext, useContext, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { useImpiantiStore } from '@/store/impiantiStore';
import { socketService } from '@/services/socket';
import { toast } from '@/utils/toast';
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
    setImpiantoCorrente: storeSetImpiantoCorrente,
    removeImpianto
  } = useImpiantiStore();

  const listenerInitialized = useRef(false);

  // Carica impianti al mount
  useEffect(() => {
    fetchImpianti();
  }, [fetchImpianti]);

  // Listener per condivisione rimossa (accesso revocato)
  // Il backend emette tramite 'notification' con tipo='condivisione-rimossa'
  // IMPORTANTE: usa listener diretto per non interferire con altri listener
  const condivisioneHandlerRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    if (listenerInitialized.current) return;
    listenerInitialized.current = true;

    const handleCondivisioneRimossa = (data: any) => {
      // Filtra solo eventi di tipo condivisione-rimossa
      if (data.tipo === 'condivisione-rimossa') {
        console.log('📡 Condivisione rimossa ricevuta via WS:', data);
        // Rimuovi l'impianto dalla lista locale
        removeImpianto(data.impianto_id);

        // Se l'utente era su quell'impianto, mostra toast
        if (impiantoCorrente?.id === data.impianto_id) {
          toast.error('Accesso all\'impianto revocato');
        }
      }
    };

    // Registra listener direttamente sul socket per non interferire con altri
    condivisioneHandlerRef.current = handleCondivisioneRimossa;
    socketService.getSocket()?.on('notification', handleCondivisioneRimossa);

    return () => {
      // Rimuovi SOLO questo listener specifico
      if (condivisioneHandlerRef.current) {
        socketService.getSocket()?.off('notification', condivisioneHandlerRef.current);
        condivisioneHandlerRef.current = null;
      }
      listenerInitialized.current = false;
    };
  }, [removeImpianto, impiantoCorrente?.id]);

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
