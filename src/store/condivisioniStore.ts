import { create } from 'zustand';
import { condivisioniApi } from '@/services/api';

// ============================================
// CONDIVISIONI STORE - State Management
// ============================================

export interface Condivisione {
  id: number;
  impianto_id: number;
  utente_id: number | null;
  email_invitato: string;
  accesso_completo: boolean;
  ruolo_visualizzato: 'installatore_secondario' | 'co_proprietario' | 'ospite';
  stato: 'pendente' | 'accettato' | 'rifiutato';
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null;
  invitato_da: number;
  creato_il: string;
  accettato_il: string | null;
  utente_nome?: string;
  utente_cognome?: string;
  utente_tipo_account?: string;
}

interface CondivisioniState {
  condivisioni: Condivisione[];
  loading: boolean;
  error: string | null;
  currentImpiantoId: number | null;

  // Actions
  fetchCondivisioni: (impiantoId: number) => Promise<void>;
  addCondivisione: (condivisione: Condivisione) => void;
  updateCondivisione: (condivisione: Condivisione) => void;
  removeCondivisione: (condivisioneId: number) => void;
  setCondivisioni: (condivisioni: Condivisione[]) => void;
  clear: () => void;
}

export const useCondivisioniStore = create<CondivisioniState>((set, get) => ({
  condivisioni: [],
  loading: false,
  error: null,
  currentImpiantoId: null,

  fetchCondivisioni: async (impiantoId: number) => {
    // Evita fetch se già caricato per questo impianto
    if (get().currentImpiantoId === impiantoId && get().condivisioni.length > 0) {
      return;
    }

    set({ loading: true, error: null, currentImpiantoId: impiantoId });
    try {
      const response = await condivisioniApi.getCondivisioni(impiantoId);
      set({ condivisioni: response.data || [], loading: false });
    } catch (error: any) {
      // 403 è normale per utenti senza permesso
      if (error.response?.status !== 403) {
        console.error('Errore fetch condivisioni:', error);
        set({ error: error.message, loading: false });
      } else {
        set({ condivisioni: [], loading: false });
      }
    }
  },

  addCondivisione: (condivisione: Condivisione) => {
    set((state) => {
      // Previeni duplicati
      const exists = state.condivisioni.some((c) => c.id === condivisione.id);
      if (exists) {
        console.log('[CondivisioniStore] addCondivisione: già esiste, aggiorno', condivisione.id);
        return {
          condivisioni: state.condivisioni.map((c) =>
            c.id === condivisione.id ? { ...c, ...condivisione } : c
          ),
        };
      }
      console.log('[CondivisioniStore] addCondivisione: nuova', condivisione.id);
      return { condivisioni: [...state.condivisioni, condivisione] };
    });
  },

  updateCondivisione: (condivisione: Condivisione) => {
    set((state) => ({
      condivisioni: state.condivisioni.map((c) =>
        c.id === condivisione.id ? { ...c, ...condivisione } : c
      ),
    }));
    console.log('[CondivisioniStore] updateCondivisione:', condivisione.id, condivisione.stato);
  },

  removeCondivisione: (condivisioneId: number) => {
    set((state) => ({
      condivisioni: state.condivisioni.filter((c) => c.id !== condivisioneId),
    }));
    console.log('[CondivisioniStore] removeCondivisione:', condivisioneId);
  },

  setCondivisioni: (condivisioni: Condivisione[]) => {
    set({ condivisioni });
  },

  clear: () => {
    set({ condivisioni: [], currentImpiantoId: null, error: null });
  },
}));
