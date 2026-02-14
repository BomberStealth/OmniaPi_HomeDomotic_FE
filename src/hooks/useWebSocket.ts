import { useEffect, useRef, useCallback } from 'react';
import { socketService, WS_EVENTS, WSEvent } from '@/services/socket';
import { useStanzeStore } from '@/store/stanzeStore';
import { useSceneStore } from '@/store/sceneStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { useOmniapiStore } from '@/store/omniapiStore';
import { useCondivisioniStore } from '@/store/condivisioniStore';
import { useAuthStore } from '@/store/authStore';
import { useUpdateTrigger } from '@/store/updateTriggerStore';
import { toast } from '@/utils/toast';

// ============================================
// WEBSOCKET HOOK - Simplified Architecture
// ============================================

interface UseWebSocketOptions {
  onNotification?: (notification: any) => void;
  onPermessiAggiornati?: (data: any) => void;
  onKickedFromImpianto?: (data: { impiantoId: number }) => void;
  onCondivisioneUpdate?: (type: string, data: any) => void;
  onCondivisioneRemoved?: () => void;
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
      useCondivisioniStore.getState().fetchCondivisioni(impiantoId);
      // Fetch fresh gateway/nodes status immediately (don't wait for heartbeat)
      useOmniapiStore.getState().fetchGateway();
      useOmniapiStore.getState().fetchNodes();
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
          if (payload?.id) {
            stanzeStore.removeStanza(payload.id);
            // Aggiorna i dispositivi che erano in quella stanza → ora "non assegnati"
            const dispositivi = dispositiviStore.dispositivi;
            dispositivi.forEach(d => {
              if (d.stanza_id === payload.id) {
                dispositiviStore.updateDispositivo({ ...d, stanza_id: null });
              }
            });
          }
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
            useOmniapiStore.getState().updateGateway(payload);
            // Sync dispositivo.stato from heartbeat nodes
            if (payload.nodes && Array.isArray(payload.nodes)) {
              const gwNorm = (m: string) => m.toUpperCase().replace(/[:-]/g, '');
              const onlineMacs = new Set<string>();
              payload.nodes.forEach((n: any) => {
                if (n.mac && n.online) {
                  onlineMacs.add(gwNorm(n.mac));
                }
              });

              if (onlineMacs.size > 0) {
                useDispositiviStore.setState(state => {
                  let changed = false;
                  const next = state.dispositivi.map(d => {
                    if (!d.mac_address) return d;
                    if (onlineMacs.has(gwNorm(d.mac_address)) && d.stato === 'offline') {
                      changed = true;
                      return { ...d, stato: 'online' };
                    }
                    return d;
                  });
                  return changed ? { dispositivi: next } : state;
                });
              }
            }
            opts.onGatewayUpdate?.(type, payload);
          }
          break;

        case WS_EVENTS.NODE_UPDATED:
          if (payload) {
            const normMac = (m: string) => m.toUpperCase().replace(/[:-]/g, '');

            if (Array.isArray(payload)) {
              useOmniapiStore.getState().updateNodes(payload);
              // Collect updates for a single atomic setState
              const nodeUpdates = new Map<string, { online: boolean; powerState: boolean }>();
              payload.forEach((node: any) => {
                if (!node.mac) return;
                useOmniapiStore.getState().clearPending(node.mac);
                nodeUpdates.set(normMac(node.mac), {
                  online: node.online !== false,
                  powerState: !!(node.relay1 || node.relay2),
                });
              });

              // ATOMIC setState — fresh state, no stale snapshot
              useDispositiviStore.setState(state => {
                let changed = false;
                const next = state.dispositivi.map(d => {
                  if (!d.mac_address) return d;
                  const update = nodeUpdates.get(normMac(d.mac_address));
                  if (!update) return d;
                  const newStato = update.online ? 'online' : 'offline';
                  if (d.power_state !== update.powerState || d.stato !== newStato) {
                    changed = true;
                    return { ...d, power_state: update.powerState, stato: newStato };
                  }
                  return d;
                });
                return changed ? { dispositivi: next } : state;
              });

            } else if (payload.mac) {
              useOmniapiStore.getState().updateNode(payload);
              useOmniapiStore.getState().clearPending(payload.mac);
              const payloadMac = normMac(payload.mac);
              const newStato = payload.online === false ? 'offline' : 'online';
              const newPower = !!(payload.relay1 || payload.relay2);

              // ATOMIC setState — fresh state, no stale snapshot
              useDispositiviStore.setState(state => {
                let changed = false;
                const next = state.dispositivi.map(d => {
                  if (!d.mac_address) return d;
                  if (normMac(d.mac_address) !== payloadMac) return d;
                  if (d.power_state !== newPower || d.stato !== newStato) {
                    changed = true;
                    return { ...d, power_state: newPower, stato: newStato };
                  }
                  return d;
                });
                return changed ? { dispositivi: next } : state;
              });
            }
          }
          break;

        // COMMAND TIMEOUT — relay command not confirmed within 5s
        case WS_EVENTS.COMMAND_TIMEOUT:
          if (payload?.mac) {
            console.log(`[WS] COMMAND_TIMEOUT: mac=${payload.mac} ch=${payload.channel}`);
            omniapiStore.clearPending(payload.mac);
            // Rollback optimistic update + mark offline
            const normTimeout = (m: string) => m.toUpperCase().replace(/[:-]/g, '');
            const timeoutMac = normTimeout(payload.mac);
            useDispositiviStore.setState(state => {
              let changed = false;
              const next = state.dispositivi.map(d => {
                if (!d.mac_address || normTimeout(d.mac_address) !== timeoutMac) return d;
                changed = true;
                return { ...d, power_state: !d.power_state, stato: 'offline' };
              });
              return changed ? { dispositivi: next } : state;
            });
            toast.error('Nodo non raggiungibile');
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
          console.log(`[WS] ${type} payload:`, JSON.stringify(payload, null, 2));
          if (payload?.id) {
            useCondivisioniStore.getState().addCondivisione(payload);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.CONDIVISIONE_ACCEPTED:
        case WS_EVENTS.CONDIVISIONE_UPDATED:
        case WS_EVENTS.INVITE_ACCEPTED:
          console.log(`[WS] ${type} payload:`, JSON.stringify(payload, null, 2));
          if (payload?.id) {
            useCondivisioniStore.getState().updateCondivisione(payload);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.CONDIVISIONE_REJECTED:
        case WS_EVENTS.INVITE_REJECTED:
          console.log(`[WS] ${type} payload:`, JSON.stringify(payload, null, 2));
          if (payload?.id) {
            useCondivisioniStore.getState().removeCondivisione(payload.id);
          }
          opts.onCondivisioneUpdate?.(type, payload);
          break;

        case WS_EVENTS.CONDIVISIONE_REMOVED:
          console.log('[WS] CONDIVISIONE_REMOVED — clearing stores and navigating');
          useCondivisioniStore.getState().clear();
          sceneStore.clear();
          stanzeStore.clear();
          dispositiviStore.clear();
          omniapiStore.clear();
          opts.onCondivisioneRemoved?.();
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

      // Forza re-render globale per tutte le pagine che usano useUpdateTrigger
      useUpdateTrigger.getState().forceTrigger();
    };

    // Subscribe to events
    const unsubscribe = socketService.onEvent(handleEvent);

    // Subscribe to reconnection — refetch all data when WS reconnects
    const unsubReconnect = socketService.onReconnect(() => {
      if (impiantoId) {
        console.log('[WS] 🔄 Reconnected — refetching data for impianto', impiantoId);
        useStanzeStore.getState().fetchStanze(impiantoId);
        useSceneStore.getState().fetchScene(impiantoId);
        useDispositiviStore.getState().fetchDispositivi(impiantoId);
        useCondivisioniStore.getState().fetchCondivisioni(impiantoId);
      }
    });

    // Cleanup: only unsubscribe, don't leave room
    // Leave is handled by socketService.joinImpianto when switching
    return () => {
      unsubscribe();
      unsubReconnect();
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
