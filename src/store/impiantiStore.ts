import { create } from 'zustand';
import { Impianto } from '@/types';
import { impiantiApi } from '@/services/api';

// ============================================
// IMPIANTI STORE - State Management Centralizzato
// Include persistenza localStorage e selezione automatica
// ============================================

const STORAGE_KEY = 'impianto_selected_id';

interface ImpiantiState {
  impianti: Impianto[];
  impiantoCorrente: Impianto | null;
  isLoading: boolean;
  initialized: boolean;
  fetchImpianti: () => Promise<void>;
  fetchImpianto: (id: number) => Promise<void>;
  setImpiantoCorrente: (impianto: Impianto | null) => void;
  removeImpianto: (id: number) => void;
  initializeSelection: () => void;
  clear: () => void;
}

export const useImpiantiStore = create<ImpiantiState>((set, get) => ({
  impianti: [],
  impiantoCorrente: null,
  isLoading: false,
  initialized: false,

  fetchImpianti: async () => {
    set({ isLoading: true });
    try {
      const response = await impiantiApi.getAll();
      if (response.success && response.data) {
        set({ impianti: response.data, isLoading: false });
        // Auto-inizializza selezione dopo fetch
        get().initializeSelection();
      }
    } catch (error) {
      set({ isLoading: false });
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
    }
  },

  setImpiantoCorrente: (impianto) => {
    set({ impiantoCorrente: impianto });
    // Persisti in localStorage
    if (impianto) {
      localStorage.setItem(STORAGE_KEY, impianto.id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  // Rimuove un impianto dalla lista e resetta selezione se necessario
  removeImpianto: (id) => {
    const { impianti, impiantoCorrente } = get();
    const newImpianti = impianti.filter(i => i.id !== id);

    // Se l'impianto eliminato era quello corrente
    if (impiantoCorrente?.id === id) {
      // Pulisci localStorage
      localStorage.removeItem(STORAGE_KEY);

      // Auto-seleziona il primo impianto rimanente (o null se vuoto)
      const newCorrente = newImpianti.length > 0 ? newImpianti[0] : null;

      // Resetta initialized per permettere ri-inizializzazione
      set({
        impianti: newImpianti,
        impiantoCorrente: newCorrente,
        initialized: newImpianti.length === 0 // Reset solo se vuoto
      });

      // Se c'è un nuovo corrente, salvalo
      if (newCorrente) {
        localStorage.setItem(STORAGE_KEY, newCorrente.id.toString());
      }
    } else {
      // L'impianto eliminato non era quello corrente
      set({ impianti: newImpianti });
    }
  },

  // Inizializza selezione da localStorage o primo impianto
  initializeSelection: () => {
    const { impianti, impiantoCorrente, initialized } = get();

    if (initialized || impianti.length === 0) return;
    if (impiantoCorrente) {
      set({ initialized: true });
      return;
    }

    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const saved = impianti.find(i => i.id === parseInt(savedId));
      if (saved) {
        set({ impiantoCorrente: saved, initialized: true });
        return;
      }
    }

    // Default: primo impianto
    set({ impiantoCorrente: impianti[0], initialized: true });
  },

  // Reset completo dello store (usato al logout)
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      impianti: [],
      impiantoCorrente: null,
      isLoading: false,
      initialized: false,
    });
  },
}));
