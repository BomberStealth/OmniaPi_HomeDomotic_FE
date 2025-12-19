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
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password
    });
    return data;
  },

  getProfile: async () => {
    const { data } = await api.get<ApiResponse>('/auth/profile');
    return data;
  }
};

// ============================================
// IMPIANTI API
// ============================================

export const impiantiApi = {
  getAll: async () => {
    const { data } = await api.get<ApiResponse<Impianto[]>>('/impianti');
    return data;
  },

  getById: async (id: number) => {
    const { data } = await api.get<ApiResponse<Impianto>>(`/impianti/${id}`);
    return data;
  },

  create: async (impianto: Partial<Impianto>) => {
    const { data } = await api.post<ApiResponse>('/impianti', impianto);
    return data;
  },

  update: async (id: number, impianto: Partial<Impianto>) => {
    const { data } = await api.put<ApiResponse>(`/impianti/${id}`, impianto);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/impianti/${id}`);
    return data;
  }
};

// ============================================
// DISPOSITIVI API
// ============================================

export const dispositiviApi = {
  getByStanza: async (stanzaId: number) => {
    const { data } = await api.get<ApiResponse<Dispositivo[]>>(
      `/dispositivi/stanza/${stanzaId}`
    );
    return data;
  },

  create: async (dispositivo: Partial<Dispositivo>) => {
    const { data } = await api.post<ApiResponse>('/dispositivi', dispositivo);
    return data;
  },

  control: async (id: number, comando: any) => {
    const { data } = await api.post<ApiResponse>(
      `/dispositivi/${id}/control`,
      { comando }
    );
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete<ApiResponse>(`/dispositivi/${id}`);
    return data;
  }
};
