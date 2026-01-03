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
    nome?: string
  ): Promise<{ success: boolean; gateway: Gateway }> => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/gateway/associate`, {
      mac,
      nome,
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
};
