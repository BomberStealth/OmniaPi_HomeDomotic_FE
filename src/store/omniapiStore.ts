import { create } from 'zustand';
import { omniapiApi, OmniapiGateway, OmniapiNode, LedDevice } from '@/services/omniapiApi';

// ============================================
// OMNIAPI STORE - State Management
// Gateway ESP-NOW e Node state
// ============================================

interface OmniapiState {
  gateway: OmniapiGateway | null;
  nodes: OmniapiNode[];
  ledDevices: LedDevice[];
  isLoading: boolean;
  error: string | null;

  // Pending relay commands (MAC_channel keys, e.g. "AA:BB:CC:DD:EE:FF_1")
  pendingCommands: Set<string>;

  // Actions
  fetchGateway: () => Promise<void>;
  fetchNodes: () => Promise<void>;
  sendCommand: (mac: string, channel: 1 | 2, action: 'on' | 'off' | 'toggle') => Promise<boolean>;

  // LED Strip Actions
  fetchLedDevices: () => Promise<void>;
  sendLedCommand: (mac: string, action: string, params?: { r?: number; g?: number; b?: number; brightness?: number; effect?: number; speed?: number }) => Promise<boolean>;

  // Pending commands management
  setPending: (mac: string, channel: number) => void;
  clearPending: (mac: string) => void;
  isDevicePending: (mac: string) => boolean;

  // WebSocket updates
  updateGateway: (gateway: OmniapiGateway) => void;
  updateNode: (node: OmniapiNode) => void;
  updateNodes: (nodes: OmniapiNode[]) => void;
  updateLedDevice: (ledDevice: LedDevice) => void;
  setLedDevices: (devices: LedDevice[]) => void;
  clear: () => void;
}

export const useOmniapiStore = create<OmniapiState>((set, get) => ({
  gateway: null,
  nodes: [],
  ledDevices: [],
  isLoading: false,
  error: null,
  pendingCommands: new Set<string>(),

  fetchGateway: async () => {
    try {
      const gateway = await omniapiApi.getGateway();
      set({ gateway, error: null });
    } catch (error: any) {
      console.error('Errore fetch gateway:', error);
      set({ error: error.message || 'Errore caricamento gateway' });
    }
  },

  fetchNodes: async () => {
    set({ isLoading: true });
    try {
      const response = await omniapiApi.getNodes();
      set({ nodes: response.nodes || [], isLoading: false, error: null });
    } catch (error: any) {
      console.error('Errore fetch nodes:', error);
      set({ isLoading: false, error: error.message || 'Errore caricamento nodi' });
    }
  },

  sendCommand: async (mac, channel, action) => {
    try {
      await omniapiApi.sendCommand(mac, channel, action);
      // Optimistic update
      const nodes = get().nodes.map((node) => {
        if (node.mac === mac) {
          const newState = action === 'toggle'
            ? (channel === 1 ? !node.relay1 : !node.relay2)
            : action === 'on';
          return {
            ...node,
            relay1: channel === 1 ? newState : node.relay1,
            relay2: channel === 2 ? newState : node.relay2,
          };
        }
        return node;
      });
      set({ nodes });
      return true;
    } catch (error: any) {
      console.error('Errore invio comando:', error);
      return false;
    }
  },

  // Pending commands management
  setPending: (mac, channel) => {
    const key = `${mac}_${channel}`;
    set((state) => {
      const next = new Set(state.pendingCommands);
      next.add(key);
      return { pendingCommands: next };
    });
  },

  clearPending: (mac) => {
    set((state) => {
      const next = new Set(state.pendingCommands);
      // Clear all channels for this MAC
      for (const key of next) {
        if (key.startsWith(mac)) next.delete(key);
      }
      return { pendingCommands: next };
    });
  },

  isDevicePending: (mac) => {
    const { pendingCommands } = get();
    for (const key of pendingCommands) {
      if (key.startsWith(mac)) return true;
    }
    return false;
  },

  // WebSocket handlers
  updateGateway: (gateway) => {
    set({ gateway });
  },

  updateNode: (updatedNode) => {
    // Clear pending state when we get a confirmed update from backend
    const next = new Set(get().pendingCommands);
    for (const key of next) {
      if (key.startsWith(updatedNode.mac)) next.delete(key);
    }
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.mac === updatedNode.mac ? { ...node, ...updatedNode } : node
      ),
      pendingCommands: next,
    }));
  },

  updateNodes: (nodes) => {
    set({ nodes });
  },

  // ============================================
  // LED STRIP ACTIONS
  // ============================================

  fetchLedDevices: async () => {
    try {
      const response = await omniapiApi.getLedDevices();
      set({ ledDevices: response.devices || [] });
    } catch (error: any) {
      console.error('Errore fetch LED devices:', error);
    }
  },

  sendLedCommand: async (mac, action, params) => {
    try {
      await omniapiApi.sendLedCommand(mac, action, params);
      return true;
    } catch (error: any) {
      console.error('Errore invio comando LED:', error);
      return false;
    }
  },

  updateLedDevice: (ledDevice) => {
    set((state) => {
      const existingIndex = state.ledDevices.findIndex((d) => d.mac === ledDevice.mac);
      if (existingIndex >= 0) {
        // Update existing device
        const updatedDevices = [...state.ledDevices];
        updatedDevices[existingIndex] = { ...updatedDevices[existingIndex], ...ledDevice };
        return { ledDevices: updatedDevices };
      } else {
        // Add new device
        return { ledDevices: [...state.ledDevices, ledDevice] };
      }
    });
  },

  setLedDevices: (devices) => {
    set({ ledDevices: devices });
  },

  clear: () => {
    set({ gateway: null, nodes: [], ledDevices: [], isLoading: false, error: null, pendingCommands: new Set() });
  },
}));
