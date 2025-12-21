import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useImpiantiStore } from '@/store/impiantiStore';
import type { Impianto } from '@/types';

// ============================================
// IMPIANTO CONTEXT - Gestione Globale Impianto
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
  const { impianti, fetchImpianti } = useImpiantiStore();
  const [impiantoCorrente, setImpiantoCorrenteState] = useState<Impianto | null>(null);
  const [loading, setLoading] = useState(true);

  // Carica impianti e ripristina selezione al mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchImpianti();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Esegui solo al mount

  // Ripristina impianto selezionato da localStorage
  useEffect(() => {
    if (impianti.length > 0 && !impiantoCorrente) {
      const savedId = localStorage.getItem('impianto_selected_id');

      if (savedId) {
        const saved = impianti.find(i => i.id === parseInt(savedId));
        if (saved) {
          setImpiantoCorrenteState(saved);
          return;
        }
      }

      // Default: primo impianto disponibile
      setImpiantoCorrenteState(impianti[0]);
    }
  }, [impianti, impiantoCorrente]);

  // Funzione per cambiare impianto
  const setImpiantoCorrente = (impianto: Impianto | null) => {
    setImpiantoCorrenteState(impianto);
    if (impianto) {
      localStorage.setItem('impianto_selected_id', impianto.id.toString());
    } else {
      localStorage.removeItem('impianto_selected_id');
    }
  };

  // Refresh impianti
  const refresh = async () => {
    setLoading(true);
    await fetchImpianti();
    setLoading(false);
  };

  return (
    <ImpiantoContext.Provider
      value={{
        impiantoCorrente,
        setImpiantoCorrente,
        impianti,
        loading,
        refresh
      }}
    >
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
