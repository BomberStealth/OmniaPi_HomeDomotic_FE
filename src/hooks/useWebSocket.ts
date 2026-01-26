import { useEffect, useRef, useCallback } from 'react';
import { socketService, WS_EVENTS, WSEvent } from '@/services/socket';
import { useStanzeStore } from '@/store/stanzeStore';
import { useSceneStore } from '@/store/sceneStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { useOmniapiStore } from '@/store/omniapiStore';
import { useCondivisioniStore } from '@/store/condivisioniStore';
import { useAuthStore } from '@/store/authStore';

// ============================================
// WEBSOCKET HOOK - Simplified Architecture
// ============================================

interface UseWebSocketOptions {
  onNotification?: (notification: any) => void;
  onPermessiAggiornati?: (data: any) => void;
  onKickedFromImpianto?: (data: { impiantoId: number }) => void;
  onCondivisioneUpdate?: (type: string, data: any) => void;
  onGatewayUpdate?: (type: string, data: any) => void;
}

export function useWebSocket(impiantoId: number | null, options: UseWebSocketOptions = {}) {
  const token = useAuthStore((state) => state.token);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // ============================================
  // SINGLE EFFECT - Connection, Join, Subscribe
  // ============================================
  useEffect(() => {
    if (!token) return;

    // Connect if needed
    if (!socketService.isConnected()) {
      socketService.connect(token);
    }

    // Join impianto (socketService handles duplicates internally)
    if (impiantoId) {
      socketService.joinImpianto(impiantoId);

      // Fetch initial data
      useStanzeStore.getState().fetchStanze(impiantoId);
      useSceneStore.getState().fetchScene(impiantoId);
      useDispositiviStore.getState().fetchDispositivi(impiantoId);
    }

    // Event handler
    const handleEvent = (event: WSEvent) => {
      const { type, payload } = event;
      const opts = optionsRef.current;
      const stanzeStore = useStanzeStore.getState();
      const sceneStore = useSceneStore.getState();
      const dispositiviStore = useDispositiviStore.getState();
      const omniapiStore = useOmniapiStore.getState();

      switch (type) {
        // STANZE
        case WS_EVENTS.STANZA_CREATED:
          if (payload?.id) stanzeStore.addStanza(payload);
          break;
        case WS_EVENTS.STANZA_UPDATED:
          if (payload?.id) stanzeStore.updateStanza(payload);
          break;
        case WS_EVENTS.STANZA_DELETED:
          if (payload?.id) stanzeStore.removeStanza(payload.id);
          break;

        // SCENE
        case WS_EVENTS.SCENA_CREATED:
          if (payload?.id) sceneStore.addScena(payload);
          break;
        case WS_EVENTS.SCENA_UPDATED:
          if (payload?.id) sceneStore.updateScena(payload);
          break;
        case WS_EVENTS.SCENA_DELETED:
          if (payload?.id) sceneStore.removeScena(payload.id);
          break;
        case WS_EVENTS.SCENA_EXECUTED:
          if (payload?.id) sceneStore.markExecuted(payload.id);
          break;

        // DISPOSITIVI
        case WS_EVENTS.DISPOSITIVO_CREATED:
          if (payload?.id) dispositiviStore.addDispositivo(payload);
          break;
        case WS_EVENTS.DISPOSITIVO_UPDATED:
          if (payload?.id) dispositiviStore.updateDispositivo(payload);
          break;
        case WS_EVENTS.DISPOSITIVO_DELETED:
          if (payload?.id) dispositiviStore.removeDispositivo(payload.id);
          break;
        case WS_EVENTS.DISPOSITIVO_STATE_CHANGED:
          if (payload?.id && payload?.power_state !== undefined) {
            dispositiviStore.updatePowerState(payload.id, payload.power_state);
          }
          break;

        // GATEWAY/NODES
        case WS_EVENTS.GATEWAY_UPDATED:
        case WS_EVENTS.GATEWAY_ASSOCIATED:
        case WS_EVENTS.GATEWAY_DISASSOCIATED:
          if (payload) {
            omniapiStore.updateGateway(payload);
            opts.onGatewayUpdate?.(type, payload);
          }
          break;

        case WS_EVENTS.NODE_UPDATED:
          if (payload) {
            if (Array.isArray(payload)) {
              omniapiStore.updateNodes(payload);
              payload.forEach((node: any) => {
                const disp = dispositiviStore.dispositivi.find(d => d.mac_address === node.mac);
                if (disp) dispositiviStore.updatePowerState(disp.id, node.relay1 || node.relay2);
              });
            } else if (payload.mac) {
              omniapiStore.updateNode(payload);
              const disp = dispositiviStore.dispositivi.find(d => d.mac_address === payload.mac);
              if (disp) dispositiviStore.updatePowerState(disp.id, payload.relay1 || payload.relay2);
            }
          }
          break;

        case WS_EVENTS.LED_UPDATED:
          if (payload?.mac) {
            omniapiStore.updateLedDevice(payload);
            dispositiviStore.updateByMac(payload.mac, {
              led_power: payload.power,
              power_state: payload.power,
              led_r: payload.r,
              led_g: payload.g,
              led_b: payload.b,
              led_brightness: payload.brightness,
              led_effect: payload.effect,
              online: payload.online,
              stato: payload.online !== false ? 'online' : 'offline',
            });
          }
          break;

        // CONDIVISIONI - Update store + call callback
        case WS_EVENTS.CONDIVISIONE_CREATED:
        case WS_EVENTS.INVITE_RECEIVED:
          if (payload?.id) {
            useCondivisioniStore.getState().addCondivisione(payload);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.CONDIVISIONE_ACCEPTED:
        case WS_EVENTS.CONDIVISIONE_UPDATED:
        case WS_EVENTS.INVITE_ACCEPTED:
          if (payload?.id) {
            useCondivisioniStore.getState().updateCondivisione(payload);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.CONDIVISIONE_REJECTED:
        case WS_EVENTS.CONDIVISIONE_REMOVED:
        case WS_EVENTS.INVITE_REJECTED:
          if (payload?.id) {
            useCondivisioniStore.getState().removeCondivisione(payload.id);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.KICKED_FROM_IMPIANTO:
          opts.onKickedFromImpianto?.(payload);
          break;

        case WS_EVENTS.PERMESSI_AGGIORNATI:
          opts.onPermessiAggiornati?.(payload);
          break;

        case WS_EVENTS.NOTIFICATION:
          opts.onNotification?.(payload);
          break;

        case WS_EVENTS.FULL_SYNC:
          if (payload) {
            if (payload.stanze) stanzeStore.setStanze(payload.stanze);
            if (payload.scene) sceneStore.setScene(payload.scene);
            if (payload.dispositivi) dispositiviStore.setDispositivi(payload.dispositivi);
          }
          break;
      }
    };

    // Subscribe to events
    const unsubscribe = socketService.onEvent(handleEvent);

    // Cleanup: only unsubscribe, don't leave room
    // Leave is handled by socketService.joinImpianto when switching
    return () => {
      unsubscribe();
    };
  }, [token, impiantoId]);

  // ============================================
  // UTILITIES
  // ============================================
  const reconnect = useCallback(() => {
    if (token) {
      socketService.disconnect();
      socketService.connect(token);
      if (impiantoId) {
        socketService.joinImpianto(impiantoId);
        useStanzeStore.getState().fetchStanze(impiantoId);
        useSceneStore.getState().fetchScene(impiantoId);
        useDispositiviStore.getState().fetchDispositivi(impiantoId);
      }
    }
  }, [token, impiantoId]);

  const refresh = useCallback(() => {
    if (impiantoId) {
      useStanzeStore.getState().fetchStanze(impiantoId);
      useSceneStore.getState().fetchScene(impiantoId);
      useDispositiviStore.getState().fetchDispositivi(impiantoId);
    }
  }, [impiantoId]);

  return { isConnected: socketService.isConnected(), reconnect, refresh };
}

// ============================================
// TYPED EVENT SUBSCRIPTION HOOK
// ============================================
export function useWebSocketEvent<T = any>(
  eventTypes: (typeof WS_EVENTS)[keyof typeof WS_EVENTS] | (typeof WS_EVENTS)[keyof typeof WS_EVENTS][],
  callback: (payload: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (payload: T) => callbackRef.current(payload);
    const unsubscribe = socketService.on(eventTypes, handler);
    return unsubscribe;
  }, [eventTypes]);
}
