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
      console.log('🏠 Real-time stanza:', action, stanza);
      switch (action) {
        case 'created':
          addStanza(stanza);
          break;
        case 'updated':
          updateStanza(stanza);
          break;
        case 'deleted':
          removeStanza(stanza.id);
          break;
      }
    });

    // Scene
    socketService.onScenaUpdate(({ scena, action }) => {
      console.log('🎬 Real-time scena:', action, scena);
      switch (action) {
        case 'created':
          addScena(scena);
          break;
        case 'updated':
          updateScena(scena);
          break;
        case 'executed':
          markExecuted(scena.id);
          break;
        case 'deleted':
          removeScena(scena.id);
          break;
      }
    });

    // Dispositivi (Tasmota + altri)
    socketService.onDispositivoUpdate(({ dispositivo, action }) => {
      console.log('💡 [DEBUG] Real-time dispositivo:', action, JSON.stringify(dispositivo));
      console.log(`   → ID=${dispositivo.id}, power_state=${dispositivo.power_state}`);
      switch (action) {
        case 'created':
          addDispositivo(dispositivo);
          break;
        case 'updated':
          updateDispositivo(dispositivo);
          break;
        case 'deleted':
          removeDispositivo(dispositivo.id);
          break;
        case 'state-changed':
          console.log(`   → Updating power state: id=${dispositivo.id}, state=${dispositivo.power_state}`);
          updatePowerState(dispositivo.id, dispositivo.power_state);
          break;
      }
    });

    // OmniaPi Nodes
    socketService.onOmniapiNodeUpdate((node) => {
      console.log('📡 [DEBUG] Real-time OmniaPi node update received:', JSON.stringify(node));
      console.log(`   → MAC=${node.mac}, relay1=${node.relay1}, relay2=${node.relay2}, online=${node.online}`);
      updateNode(node);

      // SYNC: Aggiorna anche dispositiviStore per sincronizzare lo slider
      // Trova il dispositivo con questo MAC e aggiorna power_state
      const dispositivo = useDispositiviStore.getState().dispositivi.find(
        (d) => d.mac_address === node.mac
      );
      if (dispositivo) {
        const newPowerState = node.relay1 || node.relay2;
        console.log(`   → Syncing to dispositiviStore: id=${dispositivo.id}, power_state=${newPowerState}`);
        updatePowerState(dispositivo.id, newPowerState);
      }
    });

    socketService.onOmniapiNodesUpdate((nodes) => {
      console.log('📡 [DEBUG] Real-time OmniaPi nodes update received:', nodes.length, 'nodes');
      nodes.forEach((n: any) => console.log(`   → ${n.mac}: relay1=${n.relay1}, relay2=${n.relay2}`));
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
      console.log('🌈 [DEBUG] Real-time LED update received:', JSON.stringify(ledDevice));
      console.log(`   → MAC=${ledDevice.mac}, power=${ledDevice.power}, RGB=(${ledDevice.r},${ledDevice.g},${ledDevice.b}), brightness=${ledDevice.brightness}`);
      updateLedDevice(ledDevice);
    });

    // Full Sync (dopo riconnessione)
    socketService.onFullSync(({ stanze, scene, dispositivi }) => {
      console.log('🔄 Full sync received');
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
