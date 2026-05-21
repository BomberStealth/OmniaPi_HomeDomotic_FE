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

// Il backend salva azioni/scheduling/conditions come stringhe JSON in DB
// e a volte le restituisce non parsate. Normalizziamo qui per evitare bug
// downstream (es. .length su stringa = numero di caratteri).
const parseJsonField = (value: any, fallback: any) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeScena = (s: any): Scena => ({
  ...s,
  azioni: parseJsonField(s?.azioni, []),
  scheduling: parseJsonField(s?.scheduling, null),
  conditions: parseJsonField(s?.conditions, null),
});

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
  clear: () => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  scene: [],
  loading: false,
  error: null,

  fetchScene: async (impiantoId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/api/impianti/${impiantoId}/scene`);
      const scene = Array.isArray(data) ? data.map(normalizeScena) : [];
      set({ scene, loading: false });
    } catch (error: any) {
      console.error('Errore fetch scene:', error);
      set({ error: error.message, loading: false });
    }
  },

  addScena: (scena: Scena) => {
    const normalized = normalizeScena(scena);
    set((state) => {
      // Previeni duplicati - se la scena esiste già, aggiornala invece di aggiungerla
      const exists = state.scene.some((s) => s.id === normalized.id);
      if (exists) {
        console.log('[SceneStore] addScena: scena già esiste, aggiorno invece', normalized.id);
        return {
          scene: state.scene.map((s) => (s.id === normalized.id ? { ...s, ...normalized } : s)),
        };
      }
      console.log('[SceneStore] addScena: nuova scena aggiunta', normalized.id, normalized.nome);
      return { scene: [...state.scene, normalized] };
    });
  },

  updateScena: (scena: Scena) => {
    const normalized = normalizeScena(scena);
    set((state) => ({
      scene: state.scene.map((s) => (s.id === normalized.id ? { ...s, ...normalized } : s)),
    }));
  },

  removeScena: (scenaId: number) => {
    set((state) => ({
      scene: state.scene.filter((s) => s.id !== scenaId),
    }));
  },

  setScene: (scene: Scena[]) => {
    set({ scene: scene.map(normalizeScena) });
  },

  markExecuted: (scenaId: number) => {
    set((state) => ({
      scene: state.scene.map((s) =>
        s.id === scenaId ? { ...s, lastExecuted: new Date().toISOString() } : s
      ),
    }));
  },

  clear: () => {
    set({ scene: [], loading: false, error: null });
  },
}));
