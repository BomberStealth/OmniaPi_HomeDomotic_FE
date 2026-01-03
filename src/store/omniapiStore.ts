import { create } from 'zustand';
import { omniapiApi, OmniapiGateway, OmniapiNode } from '@/services/omniapiApi';

// ============================================
// OMNIAPI STORE - State Management
// Gateway ESP-NOW e Node state
// ============================================

interface OmniapiState {
  gateway: OmniapiGateway | null;
  nodes: OmniapiNode[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchGateway: () => Promise<void>;
  fetchNodes: () => Promise<void>;
  sendCommand: (mac: string, channel: 1 | 2, action: 'on' | 'off' | 'toggle') => Promise<boolean>;

  // WebSocket updates
  updateGateway: (gateway: OmniapiGateway) => void;
  updateNode: (node: OmniapiNode) => void;
  updateNodes: (nodes: OmniapiNode[]) => void;
}

export const useOmniapiStore = create<OmniapiState>((set, get) => ({
  gateway: null,
  nodes: [],
  isLoading: false,
  error: null,

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

  // WebSocket handlers
  updateGateway: (gateway) => {
    set({ gateway });
  },

  updateNode: (updatedNode) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.mac === updatedNode.mac ? { ...node, ...updatedNode } : node
      ),
    }));
  },

  updateNodes: (nodes) => {
    set({ nodes });
  },
}));
