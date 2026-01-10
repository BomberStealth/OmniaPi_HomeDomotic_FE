import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/services/api';
import { socketService } from '@/services/socket';

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
    console.log('🔵 LOGIN START - URL:', '/api/auth/login');
    console.log('🔵 LOGIN DATA:', { email, password: '***' });
    try {
      const response = await authApi.login(email, password);
      console.log('🟢 LOGIN RESPONSE:', response);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isLoading: false });
        console.log('🟢 LOGIN SUCCESS - User:', user.email);

        // Connetti WebSocket
        socketService.connect(token);
      }
    } catch (error) {
      console.log('🔴 LOGIN ERROR:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    // Pulisci anche lo stato del wizard
    localStorage.removeItem('omniapi_setup_wizard');
    socketService.disconnect();
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
