import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socket';
import { useStanzeStore } from '@/store/stanzeStore';
import { useSceneStore } from '@/store/sceneStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { useOmniapiStore } from '@/store/omniapiStore';
import { useAuthStore } from '@/store/authStore';

// ============================================
// REAL-TIME SYNC HOOK
// Collega WebSocket agli Store Zustand
// ============================================

export const useRealTimeSync = (impiantoId: number | null) => {
  const initialized = useRef(false);
  const currentImpiantoRef = useRef<number | null>(null);
  const token = useAuthStore((state) => state.token);

  // Store actions
  const { addStanza, updateStanza, removeStanza, setStanze, fetchStanze } = useStanzeStore();
  const { addScena, updateScena, removeScena, setScene, fetchScene, markExecuted } = useSceneStore();
  const { addDispositivo, updateDispositivo, removeDispositivo, setDispositivi, updatePowerState, fetchDispositivi } = useDispositiviStore();
  const { updateNode, updateNodes, updateLedDevice } = useOmniapiStore();

  useEffect(() => {
    // Se non c'è impianto o token, non fare nulla
    if (!impiantoId || !token) return;

    // Se l'impianto è cambiato, lascia la room precedente
    if (currentImpiantoRef.current && currentImpiantoRef.current !== impiantoId) {
      socketService.leaveImpianto(currentImpiantoRef.current);
      initialized.current = false;
    }

    // Se già inizializzato per questo impianto, skip
    if (initialized.current && currentImpiantoRef.current === impiantoId) return;

    // Connetti WebSocket se non connesso
    if (!socketService.isConnected()) {
      socketService.connect(token);
    }

    // Join room dell'impianto
    socketService.joinImpianto(impiantoId);
    currentImpiantoRef.current = impiantoId;

    // Carica dati iniziali
    fetchStanze(impiantoId);
    fetchScene(impiantoId);
    fetchDispositivi(impiantoId);

    // === LISTENERS REAL-TIME ===

    // Stanze
    socketService.onStanzaUpdate(({ stanza, action }) => {
      try {
        console.log('[WS] stanza-update received:', { stanza, action });

        if (!stanza || !action) {
          console.error('[WS] stanza-update: invalid data', { stanza, action });
          return;
        }

        switch (action) {
          case 'created':
            addStanza(stanza);
            break;
          case 'updated':
            updateStanza(stanza);
            break;
          case 'deleted':
            if (!stanza.id) {
              console.error('[WS] stanza-update deleted: missing stanza.id!');
              return;
            }
            removeStanza(stanza.id);
            break;
          default:
            console.warn('[WS] stanza-update: unknown action:', action);
        }
      } catch (err) {
        console.error('[WS] stanza-update CRASH:', err, { stanza, action });
      }
    });

    // Scene
    socketService.onScenaUpdate(({ scena, action }) => {
      try {
        console.log('[WS] scena-update received:', { scena, action });

        // Validazione dati ricevuti
        if (!scena) {
          console.error('[WS] scena-update: scena is undefined!');
          return;
        }
        if (!action) {
          console.error('[WS] scena-update: action is undefined!');
          return;
        }

        switch (action) {
          case 'created':
            if (!scena.id) {
              console.error('[WS] scena-update created: missing scena.id!');
              return;
            }
            addScena(scena);
            break;
          case 'updated':
            if (!scena.id) {
              console.error('[WS] scena-update updated: missing scena.id!');
              return;
            }
            updateScena(scena);
            break;
          case 'executed':
            if (!scena.id) {
              console.error('[WS] scena-update executed: missing scena.id!');
              return;
            }
            markExecuted(scena.id);
            break;
          case 'deleted':
            if (!scena.id) {
              console.error('[WS] scena-update deleted: missing scena.id!');
              return;
            }
            removeScena(scena.id);
            break;
          default:
            console.warn('[WS] scena-update: unknown action:', action);
        }
      } catch (err) {
        console.error('[WS] scena-update CRASH:', err, { scena, action });
      }
    });

    // Dispositivi (Tasmota + altri)
    socketService.onDispositivoUpdate(({ dispositivo, action }) => {
      try {
        console.log('[WS] dispositivo-update received:', { dispositivo, action });

        if (!dispositivo || !action) {
          console.error('[WS] dispositivo-update: invalid data', { dispositivo, action });
          return;
        }

        switch (action) {
          case 'created':
            addDispositivo(dispositivo);
            break;
          case 'updated':
            updateDispositivo(dispositivo);
            break;
          case 'deleted':
            if (!dispositivo.id) {
              console.error('[WS] dispositivo-update deleted: missing dispositivo.id!');
              return;
            }
            removeDispositivo(dispositivo.id);
            break;
          case 'state-changed':
            if (!dispositivo.id) {
              console.error('[WS] dispositivo-update state-changed: missing dispositivo.id!');
              return;
            }
            updatePowerState(dispositivo.id, dispositivo.power_state);
            break;
          default:
            console.warn('[WS] dispositivo-update: unknown action:', action);
        }
      } catch (err) {
        console.error('[WS] dispositivo-update CRASH:', err, { dispositivo, action });
      }
    });

    // Gateway updates (associato/disassociato/aggiornato)
    socketService.onGatewayUpdate(({ gateway, action }) => {
      try {
        console.log('[WS] gateway-update received:', { gateway, action });
        // Gateway events sono gestiti a livello di componente (GatewayCard, Settings)
        // Questo log aiuta il debug e i componenti possono ascoltare direttamente
      } catch (err) {
        console.error('[WS] gateway-update CRASH:', err, { gateway, action });
      }
    });

    // OmniaPi Nodes
    socketService.onOmniapiNodeUpdate((node) => {
      updateNode(node);

      // SYNC: Aggiorna anche dispositiviStore per sincronizzare lo slider
      // Trova il dispositivo con questo MAC e aggiorna power_state
      const dispositivo = useDispositiviStore.getState().dispositivi.find(
        (d) => d.mac_address === node.mac
      );
      if (dispositivo) {
        const newPowerState = node.relay1 || node.relay2;
        updatePowerState(dispositivo.id, newPowerState);
      }
    });

    socketService.onOmniapiNodesUpdate((nodes) => {
      updateNodes(nodes);

      // SYNC: Aggiorna anche dispositiviStore per tutti i nodi
      const dispositivi = useDispositiviStore.getState().dispositivi;
      nodes.forEach((node: any) => {
        const dispositivo = dispositivi.find((d) => d.mac_address === node.mac);
        if (dispositivo) {
          const newPowerState = node.relay1 || node.relay2;
          updatePowerState(dispositivo.id, newPowerState);
        }
      });
    });

    // OmniaPi LED Strip
    socketService.onOmniapiLedUpdate((ledDevice) => {
      updateLedDevice(ledDevice);

      // SYNC: Aggiorna anche dispositiviStore per sincronizzare UI
      const dispositivo = useDispositiviStore.getState().dispositivi.find(
        (d) => d.mac_address === ledDevice.mac
      );
      if (dispositivo) {
        // Usa updateByMac per aggiornare tutti i campi LED
        useDispositiviStore.getState().updateByMac(ledDevice.mac, {
          led_power: ledDevice.power,
          power_state: ledDevice.power,
          led_r: ledDevice.r,
          led_g: ledDevice.g,
          led_b: ledDevice.b,
          led_brightness: ledDevice.brightness,
          led_effect: ledDevice.effect,
          online: ledDevice.online,
          stato: ledDevice.online !== false ? 'online' : 'offline'
        });
      }
    });

    // Full Sync (dopo riconnessione)
    socketService.onFullSync(({ stanze, scene, dispositivi }) => {
      if (stanze) setStanze(stanze);
      if (scene) setScene(scene);
      if (dispositivi) setDispositivi(dispositivi);
    });

    initialized.current = true;

    // Cleanup
    return () => {
      socketService.offStanzaUpdate();
      socketService.offScenaUpdate();
      socketService.offDispositivoUpdate();
      socketService.offGatewayUpdate();
      socketService.offOmniapiNodeUpdate();
      socketService.offOmniapiNodesUpdate();
      socketService.offOmniapiLedUpdate();
      socketService.offFullSync();
    };
  }, [impiantoId, token]);

  // Cleanup quando il componente si smonta completamente
  useEffect(() => {
    return () => {
      if (currentImpiantoRef.current) {
        socketService.leaveImpianto(currentImpiantoRef.current);
      }
      initialized.current = false;
      currentImpiantoRef.current = null;
    };
  }, []);

  // Ritorna funzioni utili
  return {
    isConnected: socketService.isConnected(),
    reconnect: () => {
      if (token) {
        socketService.disconnect();
        socketService.connect(token);
        if (impiantoId) {
          socketService.joinImpianto(impiantoId);
          // Ricarica dati dopo riconnessione
          fetchStanze(impiantoId);
          fetchScene(impiantoId);
          fetchDispositivi(impiantoId);
        }
      }
    },
    refresh: () => {
      if (impiantoId) {
        fetchStanze(impiantoId);
        fetchScene(impiantoId);
        fetchDispositivi(impiantoId);
      }
    },
  };
};
