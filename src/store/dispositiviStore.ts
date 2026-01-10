import { create } from 'zustand';
import { api } from '@/services/api';

// ============================================
// DISPOSITIVI STORE - State Management
// ============================================

export interface Dispositivo {
  id: number;
  nome: string;
  tipo: string;
  stanza_id: number | null;
  impianto_id: number;
  ip_address?: string;
  mac_address?: string;
  topic_mqtt?: string;
  stato?: string;
  power_state?: boolean;
  bloccato?: boolean;
  device_type?: string;
}

interface DispositiviState {
  dispositivi: Dispositivo[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDispositivi: (impiantoId: number) => Promise<void>;
  addDispositivo: (dispositivo: Dispositivo) => void;
  updateDispositivo: (dispositivo: Dispositivo) => void;
  removeDispositivo: (dispositivoId: number) => void;
  setDispositivi: (dispositivi: Dispositivo[]) => void;
  updatePowerState: (dispositivoId: number, powerState: boolean) => void;
}

export const useDispositiviStore = create<DispositiviState>((set) => ({
  dispositivi: [],
  loading: false,
  error: null,

  fetchDispositivi: async (impiantoId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/api/tasmota/impianto/${impiantoId}`);
      set({ dispositivi: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Errore fetch dispositivi:', error);
      set({ error: error.message, loading: false });
    }
  },

  addDispositivo: (dispositivo: Dispositivo) => {
    set((state) => ({ dispositivi: [...state.dispositivi, dispositivo] }));
  },

  updateDispositivo: (dispositivo: Dispositivo) => {
    set((state) => ({
      dispositivi: state.dispositivi.map((d) =>
        d.id === dispositivo.id ? { ...d, ...dispositivo } : d
      ),
    }));
  },

  removeDispositivo: (dispositivoId: number) => {
    set((state) => ({
      dispositivi: state.dispositivi.filter((d) => d.id !== dispositivoId),
    }));
  },

  setDispositivi: (dispositivi: Dispositivo[]) => {
    set({ dispositivi });
  },

  updatePowerState: (dispositivoId: number, powerState: boolean) => {
    set((state) => ({
      dispositivi: state.dispositivi.map((d) =>
        d.id === dispositivoId ? { ...d, power_state: powerState, stato: 'online' } : d
      ),
    }));
  },
}));
