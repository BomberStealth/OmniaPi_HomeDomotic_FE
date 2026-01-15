// ============================================
// NOTIFICHE STORE - Zustand
// Gestisce conteggio notifiche non lette
// CENTRALIZZATO: un solo listener WebSocket
// ============================================

import { create } from 'zustand';
import { api } from '@/services/api';
import { socketService, NotificationEvent } from '@/services/socket';

interface NotificheState {
  unreadCount: number;
  loading: boolean;
  lastFetch: number | null;
  listenerRegistered: boolean;
  fetchUnreadCount: (impiantoId: number) => Promise<void>;
  resetUnreadCount: () => void;
  decrementUnreadCount: () => void;
  incrementUnreadCount: () => void;
  initWebSocketListener: () => void;
  cleanupWebSocketListener: () => void;
}

// Callback globale per evitare duplicati
let globalNotificationHandler: ((notification: NotificationEvent) => void) | null = null;

export const useNotificheStore = create<NotificheState>((set, get) => ({
  unreadCount: 0,
  loading: false,
  lastFetch: null,
  listenerRegistered: false,

  fetchUnreadCount: async (impiantoId: number) => {
    // Evita fetch troppo frequenti (min 10 secondi)
    const now = Date.now();
    const lastFetch = get().lastFetch;
    if (lastFetch && now - lastFetch < 10000) {
      return;
    }

    if (!impiantoId) return;

    set({ loading: true });
    try {
      const res = await api.get(`/api/notifications/history?impiantoId=${impiantoId}&limit=1`);
      set({
        unreadCount: res.data.unreadCount || 0,
        loading: false,
        lastFetch: now
      });
    } catch (error) {
      console.error('Errore fetch unreadCount:', error);
      set({ loading: false });
    }
  },

  resetUnreadCount: () => {
    set({ unreadCount: 0 });
  },

  decrementUnreadCount: () => {
    set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
  },

  incrementUnreadCount: () => {
    set(state => ({ unreadCount: state.unreadCount + 1 }));
  },

  // INIT WebSocket listener - chiamare UNA SOLA VOLTA
  initWebSocketListener: () => {
    if (get().listenerRegistered || globalNotificationHandler) {
      console.log('🔔 Notification listener già registrato, skip');
      return;
    }

    globalNotificationHandler = () => {
      console.log('🔔 WebSocket notification ricevuta - incremento badge');
      set(state => ({ unreadCount: state.unreadCount + 1 }));
    };

    socketService.onNotification(globalNotificationHandler);
    set({ listenerRegistered: true });
    console.log('🔔 Notification listener registrato (centralizzato)');
  },

  // Cleanup - chiamare al logout
  cleanupWebSocketListener: () => {
    if (globalNotificationHandler) {
      socketService.offNotification();
      globalNotificationHandler = null;
      set({ listenerRegistered: false });
      console.log('🔔 Notification listener rimosso');
    }
  },
}));
