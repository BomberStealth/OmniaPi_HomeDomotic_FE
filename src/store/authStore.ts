import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/services/api';
import { socketService } from '@/services/socket';
import { useAdminModeStore } from './adminModeStore';
import { useImpiantiStore } from './impiantiStore';
import { useDispositiviStore } from './dispositiviStore';
import { useStanzeStore } from './stanzeStore';
import { useSceneStore } from './sceneStore';

// ============================================
// AUTH STORE (ZUSTAND)
// ============================================

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // IMPORTANTE: Pulisci tutti gli store PRIMA del login
      // Questo evita che dati di un account precedente rimangano
      console.log('🔐 LOGIN - Resetting all stores before login...');
      useAdminModeStore.getState().clear();
      useImpiantiStore.getState().clear();
      useDispositiviStore.getState().clear();
      useStanzeStore.getState().clear();
      useSceneStore.getState().clear();

      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });

        // Connetti WebSocket
        socketService.connect(token);
        console.log('🔐 LOGIN - Success for user:', user.email);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    // Pulisci anche lo stato del wizard
    localStorage.removeItem('omniapi_setup_wizard');
    socketService.disconnect();

    // Pulisci tutti gli store
    useAdminModeStore.getState().clear();
    useImpiantiStore.getState().clear();
    useDispositiviStore.getState().clear();
    useStanzeStore.getState().clear();
    useSceneStore.getState().clear();

    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        set({ user: response.data });
        socketService.connect(token);
      }
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  setUser: (user: User) => {
    set({ user });
  }
}));
