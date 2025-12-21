import axios from 'axios';
import type { ApiResponse, AuthResponse, Impianto, Dispositivo } from '@/types';

// ============================================
// API CLIENT CONFIGURATION
// ============================================

// Se VITE_API_URL è vuoto, usa URL relativi (same-origin tramite Nginx)
// Altrimenti usa l'URL specificato
const API_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor per aggiungere token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per gestire errori
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      email,
      password
    });
    return data;
  },

  register: async (userData: { nome: string; cognome: string; email: string; password: string }) => {
    const { data } = await api.post<ApiResponse>('/api/auth/register', userData);
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get<ApiResponse>('/api/auth/profile');
    return data;
  }
};

// ============================================
// IMPIANTI API
// ============================================

export const impiantiApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Impianto[]>>('/api/impianti');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ApiResponse<Impianto>>(`/api/impianti/${id}`);
    return data;
  },

  create: async (impianto: Partial<Impianto>) => {
    const { data } = await api.post<ApiResponse>('/api/impianti', impianto);
    return data;
  },

  update: async (id: number, impianto: Partial<Impianto>) => {
    const { data } = await api.put<ApiResponse>(`/api/impianti/${id}`, impianto);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/api/impianti/${id}`);
    return data;
  },

  connect: async (codiceCondivisione: string) => {
    const { data } = await api.post<ApiResponse>('/api/impianti/connetti', {
      codice_condivisione: codiceCondivisione
    });
    return data;
  }
};

// ============================================
// DISPOSITIVI API
// ============================================

export const dispositiviApi = {
  getByStanza: async (stanzaId: number) => {
    const { data } = await api.get<ApiResponse<Dispositivo[]>>(
      `/api/dispositivi/stanza/${stanzaId}`
    );
    return data;
  },

  create: async (dispositivo: Partial<Dispositivo>) => {
    const { data } = await api.post<ApiResponse>('/api/dispositivi', dispositivo);
    return data;
  },

  control: async (id: number, comando: any) => {
    const { data } = await api.post<ApiResponse>(
      `/api/dispositivi/${id}/control`,
      { comando }
    );
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/api/dispositivi/${id}`);
    return data;
  }
};

// ============================================
// TASMOTA API
// ============================================

export const tasmotaApi = {
  getDispositivi: async (impiantoId: number) => {
    const { data } = await api.get(`/api/impianti/${impiantoId}/dispositivi`);
    return data;
  },

  scanRete: async (impiantoId: number) => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/dispositivi/scan`);
    return data;
  },

  addDispositivo: async (impiantoId: number, dispositivo: any) => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/dispositivi`, dispositivo);
    return data;
  },

  deleteDispositivo: async (id: number) => {
    const { data } = await api.delete(`/api/dispositivi/${id}`);
    return data;
  },

  controlDispositivo: async (id: number, comando: string) => {
    const { data } = await api.post(`/api/dispositivi/${id}/control`, { comando });
    return data;
  },

  toggleBlocco: async (id: number, bloccato: boolean) => {
    const { data } = await api.put(`/api/dispositivi/${id}/blocco`, { bloccato });
    return data;
  }
};

// ============================================
// SCENE API
// ============================================

export const sceneApi = {
  getScene: async (impiantoId: number) => {
    const { data } = await api.get(`/api/impianti/${impiantoId}/scene`);
    return data;
  },

  createScena: async (impiantoId: number, scena: any) => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/scene`, scena);
    return data;
  },

  updateScena: async (id: number, scena: any) => {
    const { data } = await api.put(`/api/scene/${id}`, scena);
    return data;
  },

  deleteScena: async (id: number) => {
    const { data } = await api.delete(`/api/scene/${id}`);
    return data;
  },

  executeScena: async (id: number) => {
    const { data } = await api.post(`/api/scene/${id}/execute`);
    return data;
  }
};

// ============================================
// STANZE API
// ============================================

export const stanzeApi = {
  getStanze: async (impiantoId: number) => {
    const { data } = await api.get(`/api/impianti/${impiantoId}/stanze`);
    return data;
  },

  createStanza: async (impiantoId: number, stanza: any) => {
    const { data } = await api.post(`/api/impianti/${impiantoId}/stanze`, stanza);
    return data;
  },

  updateStanza: async (id: number, stanza: any) => {
    const { data } = await api.put(`/api/stanze/${id}`, stanza);
    return data;
  },

  deleteStanza: async (id: number) => {
    const { data } = await api.delete(`/api/stanze/${id}`);
    return data;
  }
};

// ============================================
// ADMIN API
// ============================================

export const adminApi = {
  getAllUsers: async () => {
    const { data } = await api.get('/api/admin/users');
    return data;
  },

  searchUsers: async (query: string) => {
    const { data } = await api.get(`/api/admin/users/search?q=${query}`);
    return data;
  },

  getUserPermissions: async (userId: number) => {
    const { data } = await api.get(`/api/admin/users/${userId}/permissions`);
    return data;
  },

  updateUserPermissions: async (userId: number, permessi: any) => {
    const { data } = await api.put(`/api/admin/users/${userId}/permissions`, { permessi });
    return data;
  },

  updateUserRole: async (userId: number, ruolo: string) => {
    const { data } = await api.put(`/api/admin/users/${userId}/role`, { ruolo });
    return data;
  },

  deleteUser: async (userId: number) => {
    const { data } = await api.delete(`/api/admin/users/${userId}`);
    return data;
  }
};
