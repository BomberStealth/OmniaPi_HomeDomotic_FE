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
  // LED Strip properties
  led_power?: boolean;
  led_r?: number;
  led_g?: number;
  led_b?: number;
  led_brightness?: number;
  led_effect?: number;
  led_speed?: number;
  // Sensor properties
  temperature?: number;
  humidity?: number;
  // Dimmer properties
  dimmer_level?: number;
  // Online status
  online?: boolean;
  rssi?: number;
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
  // LED actions
  updateLedState: (dispositivoId: number, ledState: Partial<Pick<Dispositivo, 'led_power' | 'led_r' | 'led_g' | 'led_b' | 'led_brightness' | 'led_effect' | 'led_speed'>>) => void;
  // By MAC (for WebSocket updates)
  updateByMac: (mac: string, updates: Partial<Dispositivo>) => void;
  clear: () => void;
}

export const useDispositiviStore = create<DispositiviState>((set) => ({
  dispositivi: [],
  loading: false,
  error: null,

  fetchDispositivi: async (impiantoId: number) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/api/impianti/${impiantoId}/dispositivi/all`);
      set({ dispositivi: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Errore fetch dispositivi:', error);
      set({ error: error.message, loading: false });
    }
  },

  addDispositivo: (dispositivo: Dispositivo) => {
    set((state) => {
      // Evita duplicati controllando se esiste già un dispositivo con lo stesso ID
      if (state.dispositivi.some((d) => d.id === dispositivo.id)) {
        return state; // Non modificare lo stato se già esiste
      }
      return { dispositivi: [...state.dispositivi, dispositivo] };
    });
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

  updateLedState: (dispositivoId: number, ledState) => {
    set((state) => ({
      dispositivi: state.dispositivi.map((d) =>
        d.id === dispositivoId ? { ...d, ...ledState, stato: 'online' } : d
      ),
    }));
  },

  updateByMac: (mac: string, updates: Partial<Dispositivo>) => {
    set((state) => ({
      dispositivi: state.dispositivi.map((d) =>
        d.mac_address === mac ? { ...d, ...updates } : d
      ),
    }));
  },

  clear: () => {
    set({ dispositivi: [], loading: false, error: null });
  },
}));
