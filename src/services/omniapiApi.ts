import { api } from './api';

// ============================================
// OMNIAPI SERVICE
// Gateway ESP-NOW e Node management
// ============================================

export interface OmniapiGateway {
  online: boolean;
  ip: string;
  version: string;
  nodeCount: number;
  mqttConnected: boolean;
  lastSeen?: string;
}

export interface OmniapiNode {
  mac: string;
  online: boolean;
  rssi: number;
  version: string;
  relay1: boolean;
  relay2: boolean;
  lastSeen?: string;
}

export interface OmniapiNodesResponse {
  nodes: OmniapiNode[];
  count: number;
}

export const omniapiApi = {
  // Stato del Gateway
  getGateway: async (): Promise<OmniapiGateway> => {
    const { data } = await api.get<OmniapiGateway>('/api/omniapi/gateway');
    return data;
  },

  // Lista di tutti i nodi
  getNodes: async (): Promise<OmniapiNodesResponse> => {
    const { data } = await api.get<OmniapiNodesResponse>('/api/omniapi/nodes');
    return data;
  },

  // Stato di un singolo nodo
  getNode: async (mac: string): Promise<OmniapiNode> => {
    const { data } = await api.get<OmniapiNode>(`/api/omniapi/nodes/${mac}`);
    return data;
  },

  // Invia comando relay
  sendCommand: async (
    node_mac: string,
    channel: 1 | 2,
    action: 'on' | 'off' | 'toggle'
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/omniapi/command', {
      node_mac,
      channel,
      action,
    });
    return data;
  },

  // Trigger discovery dei nodi
  discover: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/omniapi/discover');
    return data;
  },
};
