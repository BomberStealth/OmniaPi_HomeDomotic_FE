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
  device_type?: 'omniapi_node' | 'omniapi_led';
  ledState?: {
    power: boolean;
    r: number;
    g: number;
    b: number;
    brightness: number;
    effect: number;
  };
}

// Nodo registrato nel database (estende OmniapiNode)
export interface RegisteredNode extends OmniapiNode {
  id: number;
  nome: string;
  stanza_id: number | null;
  stanza_nome: string | null;
  impianto_id: number;
  device_type: 'omniapi_node' | 'omniapi_led';
  firmware_version?: string;
}

export interface OmniapiNodesResponse {
  nodes: OmniapiNode[];
  count: number;
}

// ============================================
// LED STRIP TYPES
// ============================================

export interface LedDevice {
  mac: string;
  power: boolean;
  r: number;
  g: number;
  b: number;
  brightness: number;
  effect: number;
  online: boolean;
  lastSeen?: string;
}

export interface LedDevicesResponse {
  devices: LedDevice[];
  count: number;
}

export interface RegisteredNodesResponse {
  nodes: RegisteredNode[];
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

  // Test dispositivo (toggle 3 volte per identificarlo)
  testDevice: async (mac: string): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/api/omniapi/nodes/${mac}/test`);
    return data;
  },

  // ============================================
  // REGISTRAZIONE NODI (Database)
  // ============================================

  // Nodi registrati per impianto
  getRegisteredNodes: async (impiantoId: number): Promise<RegisteredNodesResponse> => {
    const { data } = await api.get<RegisteredNodesResponse>(
      `/api/impianti/${impiantoId}/omniapi/nodes`
    );
    return data;
  },

  // Nodi disponibili (online ma non registrati)
  getAvailableNodes: async (impiantoId: number): Promise<OmniapiNodesResponse> => {
    const { data } = await api.get<OmniapiNodesResponse>(
      `/api/impianti/${impiantoId}/omniapi/available`
    );
    return data;
  },

  // Registra un nodo o LED Strip
  registerNode: async (
    impiantoId: number,
    mac: string,
    nome: string,
    stanza_id?: number,
    device_type?: 'omniapi_node' | 'omniapi_led'
  ): Promise<{ success: boolean; dispositivo: RegisteredNode }> => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/omniapi/register`, {
      mac,
      nome,
      stanza_id,
      device_type,
    });
    return data;
  },

  // Rimuovi nodo registrato
  unregisterNode: async (nodeId: number): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/omniapi/nodes/${nodeId}`);
    return data;
  },

  // Aggiorna nodo (nome, stanza)
  updateNode: async (
    nodeId: number,
    updates: { nome?: string; stanza_id?: number }
  ): Promise<{ success: boolean }> => {
    const { data } = await api.put(`/api/omniapi/nodes/${nodeId}`, updates);
    return data;
  },

  // Controlla nodo registrato
  controlNode: async (
    nodeId: number,
    channel: 1 | 2,
    action: 'on' | 'off' | 'toggle'
  ): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/api/omniapi/nodes/${nodeId}/control`, {
      channel,
      action,
    });
    return data;
  },

  // ============================================
  // LED STRIP API
  // ============================================

  // Lista dispositivi LED
  getLedDevices: async (): Promise<LedDevicesResponse> => {
    const { data } = await api.get<LedDevicesResponse>('/api/led/devices');
    return data;
  },

  // Stato singolo LED
  getLedState: async (mac: string): Promise<LedDevice> => {
    const { data } = await api.get<LedDevice>(`/api/led/state/${mac}`);
    return data;
  },

  // Invia comando LED
  sendLedCommand: async (
    mac: string,
    action: string,
    params?: { r?: number; g?: number; b?: number; brightness?: number; effect?: number; speed?: number; num_leds?: number; colors?: { r: number; g: number; b: number }[] }
  ): Promise<{ success: boolean; payload: any }> => {
    const { data } = await api.post('/api/led/command', { mac, action, ...params });
    return data;
  },
};
