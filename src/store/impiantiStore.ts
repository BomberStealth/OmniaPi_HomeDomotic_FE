import { create } from 'zustand';
import { Impianto } from '@/types';
import { impiantiApi } from '@/services/api';

// ============================================
// IMPIANTI STORE
// ============================================

interface ImpiantiState {
  impianti: Impianto[];
  impiantoCorrente: Impianto | null;
  isLoading: boolean;
  fetchImpianti: () => Promise<void>;
  fetchImpianto: (id: number) => Promise<void>;
  setImpiantoCorrente: (impianto: Impianto | null) => void;
}

export const useImpiantiStore = create<ImpiantiState>((set) => ({
  impianti: [],
  impiantoCorrente: null,
  isLoading: false,

  fetchImpianti: async () => {
    set({ isLoading: true });
    try {
      const response = await impiantiApi.getAll();
      if (response.success && response.data) {
        set({ impianti: response.data, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      console.error('Errore fetch impianti:', error);
    }
  },

  fetchImpianto: async (id) => {
    set({ isLoading: true });
    try {
      const response = await impiantiApi.getById(id);
      if (response.success && response.data) {
        set({ impiantoCorrente: response.data, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      console.error('Errore fetch impianto:', error);
    }
  },

  setImpiantoCorrente: (impianto) => {
    set({ impiantoCorrente: impianto });
  }
}));
