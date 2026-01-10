import { create } from 'zustand';
import { api } from '@/services/api';

// ============================================
// STANZE STORE - State Management
// ============================================

interface Stanza {
  id: number;
  nome: string;
  icona: string;
  impianto_id: number;
  dispositivi_count?: number;
}

interface StanzeState {
  stanze: Stanza[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchStanze: (impiantoId: number) => Promise<void>;
  addStanza: (stanza: Stanza) => void;
  updateStanza: (stanza: Stanza) => void;
  removeStanza: (stanzaId: number) => void;
  setStanze: (stanze: Stanza[]) => void;
}

export const useStanzeStore = create<StanzeState>((set) => ({
  stanze: [],
  loading: false,
  error: null,

  fetchStanze: async (impiantoId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/api/impianti/${impiantoId}/stanze`);
      set({ stanze: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Errore fetch stanze:', error);
      set({ error: error.message, loading: false });
    }
  },

  addStanza: (stanza: Stanza) => {
    set((state) => ({ stanze: [...state.stanze, stanza] }));
  },

  updateStanza: (stanza: Stanza) => {
    set((state) => ({
      stanze: state.stanze.map((s) => (s.id === stanza.id ? { ...s, ...stanza } : s)),
    }));
  },

  removeStanza: (stanzaId: number) => {
    set((state) => ({
      stanze: state.stanze.filter((s) => s.id !== stanzaId),
    }));
  },

  setStanze: (stanze: Stanza[]) => {
    set({ stanze });
  },
}));
