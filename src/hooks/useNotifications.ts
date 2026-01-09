import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '../config/firebase';
import { api } from '../services/api';

interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  token: string | null;
  loading: boolean;
  error: string | null;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    token: null,
    loading: false,
    error: null
  });

  // Check if notifications are supported
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, permission: 'unsupported' }));
      return;
    }
    setState(prev => ({ ...prev, permission: Notification.permission }));
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    onForegroundMessage((payload) => {
      // Show a toast or in-app notification
      const title = payload.notification?.title || 'OmniaPi';
      const body = payload.notification?.body || '';

      // If app is focused, show custom notification
      if (document.hasFocus()) {
        // You can integrate with a toast library here
        console.log('Notification:', title, body);

        // Simple browser notification as fallback
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png'
          });
        }
      }
    });
  }, []);

  // Request permission and register token
  const enableNotifications = useCallback(async () => {
    // IMPORTANTE: requestPermission DEVE essere la prima cosa chiamata
    // altrimenti il browser blocca la richiesta perché non è "direttamente" dal click

    try {
      // Prima chiedi il permesso - SUBITO, senza setState prima!
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission: permission,
          error: permission === 'denied'
            ? 'Notifiche bloccate. Abilita dalle impostazioni del browser.'
            : 'Permesso notifiche non concesso'
        }));
        return false;
      }

      // Ora aggiorna lo stato e continua
      setState(prev => ({ ...prev, loading: true, error: null }));

      const token = await requestNotificationPermission();

      if (!token) {
        setState(prev => ({
          ...prev,
          loading: false,
          permission: 'granted',
          error: 'Impossibile ottenere il token FCM'
        }));
        return false;
      }

      // Save token to backend
      await api.post('/api/notifications/register', { token });

      setState(prev => ({
        ...prev,
        loading: false,
        permission: 'granted',
        token
      }));

      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Errore durante l\'attivazione delle notifiche'
      }));
      return false;
    }
  }, []);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      if (state.token) {
        await api.delete('/api/notifications/unregister', {
          data: { token: state.token }
        });
      }

      setState(prev => ({
        ...prev,
        loading: false,
        token: null
      }));

      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Errore durante la disattivazione'
      }));
      return false;
    }
  }, [state.token]);

  return {
    ...state,
    isSupported: state.permission !== 'unsupported',
    isEnabled: state.permission === 'granted' && !!state.token,
    enableNotifications,
    disableNotifications
  };
}
