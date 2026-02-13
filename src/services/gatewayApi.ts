import { api } from './api';

// ============================================
// GATEWAY API SERVICE
// Gestione Gateway OmniaPi (registrazione, associazione)
// ============================================

export interface Gateway {
  id: number;
  mac: string;
  nome?: string;
  ip?: string;
  version?: string;
  status: 'online' | 'offline' | 'setup' | 'pending';
  mqttConnected?: boolean;
  nodeCount?: number;
  lastSeen?: string;
  createdAt?: string;
  impianto_id?: number;
}

export interface PendingGatewaysResponse {
  gateways: Gateway[];
  count: number;
}

export interface ImpiantoGatewayResponse {
  gateway: Gateway | null;
  message?: string;
}

export interface ScannedGateway {
  ip: string;
  mac: string;
  version: string;
  nodeCount: number;
  mqttConnected: boolean;
  uptime?: number;
  source: 'network_scan';
}

export interface ScanGatewaysResponse {
  gateways: ScannedGateway[];
}

export interface DiscoveredGateway {
  mac: string;
  ip: string;
  version: string;
  uptime: number;
  nodes_count: number;
  available: boolean;
  impianto_nome: string | null;
}

export interface DiscoverGatewaysResponse {
  success: boolean;
  gateways: DiscoveredGateway[];
}

// ============================================
// SCAN NODI + COMMISSIONING
// ============================================

export interface ScannedNode {
  mac: string;
  device_type: string;
  firmware: string;
  rssi: number;
  commissioned: boolean;
}

export interface ScanResultsResponse {
  success: boolean;
  nodes: ScannedNode[];
  count: number;
}

export interface CommissionResultResponse {
  success: boolean;
  commissioned: boolean | null;
  message: string;
}

export const gatewayApi = {
  /**
   * Lista gateway in attesa di associazione (pending)
   * Richiede auth admin
   */
  getPendingGateways: async (): Promise<PendingGatewaysResponse> => {
    const { data } = await api.get<PendingGatewaysResponse>('/api/gateway/pending');
    return data;
  },

  /**
   * Scan rete locale per trovare gateway OmniaPi
   * Ping sweep + verifica /api/status su ogni IP
   */
  scanNetworkGateways: async (): Promise<ScanGatewaysResponse> => {
    const { data } = await api.get<ScanGatewaysResponse>('/api/gateway/scan');
    return data;
  },

  /**
   * Recupera gateway dell'impianto
   */
  getImpiantoGateway: async (impiantoId: number): Promise<ImpiantoGatewayResponse> => {
    const { data } = await api.get<ImpiantoGatewayResponse>(`/api/impianti/${impiantoId}/gateway`);
    return data;
  },

  /**
   * Associa un gateway all'impianto
   */
  associateGateway: async (
    impiantoId: number,
    mac: string,
    nome?: string,
    ip?: string,
    version?: string
  ): Promise<{ success: boolean; gateway: Gateway }> => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/gateway/associate`, {
      mac,
      nome,
      ip,
      version,
    });
    return data;
  },

  /**
   * Disassocia gateway dall'impianto
   */
  disassociateGateway: async (impiantoId: number): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/impianti/${impiantoId}/gateway`);
    return data;
  },

  /**
   * Aggiorna info gateway (nome)
   */
  updateGateway: async (
    gatewayId: number,
    updates: { nome?: string }
  ): Promise<{ success: boolean }> => {
    const { data } = await api.put(`/api/gateway/${gatewayId}`, updates);
    return data;
  },

  /**
   * Discover gateway sulla stessa rete (match IP pubblico)
   * Il backend filtra i gateway online con lo stesso IP pubblico dell'utente
   */
  discoverGateways: async (): Promise<DiscoverGatewaysResponse> => {
    const { data } = await api.get<DiscoverGatewaysResponse>('/api/gateway/discover');
    return data;
  },

  // ============================================
  // SCAN NODI (via MQTT → gateway)
  // ============================================

  startNodeScan: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/gateway/scan/start');
    return data;
  },

  stopNodeScan: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/gateway/scan/stop');
    return data;
  },

  getNodeScanResults: async (): Promise<ScanResultsResponse> => {
    const { data } = await api.get<ScanResultsResponse>('/api/gateway/scan/results');
    return data;
  },

  // ============================================
  // COMMISSIONING NODI (via MQTT → gateway)
  // ============================================

  commissionNode: async (mac: string, name?: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/api/gateway/commission', { mac, name });
    return data;
  },

  getCommissionResult: async (mac: string): Promise<CommissionResultResponse> => {
    const { data } = await api.get<CommissionResultResponse>(`/api/gateway/commission/result/${encodeURIComponent(mac)}`);
    return data;
  },
};
