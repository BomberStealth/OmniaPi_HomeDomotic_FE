import { create } from 'zustand';
import { api } from '@/services/api';

// ============================================
// SCENE STORE - State Management
// ============================================

interface Scena {
  id: number;
  nome: string;
  icona: string;
  impianto_id: number;
  azioni?: any[];
  is_base?: boolean;
  is_shortcut?: boolean;
  scheduling?: any;
  conditions?: any;
  lastExecuted?: string;
}

interface SceneState {
  scene: Scena[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchScene: (impiantoId: number) => Promise<void>;
  addScena: (scena: Scena) => void;
  updateScena: (scena: Scena) => void;
  removeScena: (scenaId: number) => void;
  setScene: (scene: Scena[]) => void;
  markExecuted: (scenaId: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scene: [],
  loading: false,
  error: null,

  fetchScene: async (impiantoId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/api/impianti/${impiantoId}/scene`);
      set({ scene: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Errore fetch scene:', error);
      set({ error: error.message, loading: false });
    }
  },

  addScena: (scena: Scena) => {
    set((state) => ({ scene: [...state.scene, scena] }));
  },

  updateScena: (scena: Scena) => {
    set((state) => ({
      scene: state.scene.map((s) => (s.id === scena.id ? { ...s, ...scena } : s)),
    }));
  },

  removeScena: (scenaId: number) => {
    set((state) => ({
      scene: state.scene.filter((s) => s.id !== scenaId),
    }));
  },

  setScene: (scene: Scena[]) => {
    set({ scene });
  },

  markExecuted: (scenaId: number) => {
    set((state) => ({
      scene: state.scene.map((s) =>
        s.id === scenaId ? { ...s, lastExecuted: new Date().toISOString() } : s
      ),
    }));
  },
}));
