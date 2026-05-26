// ============================================
// VERSION CONFIG
// ============================================

export const APP_VERSION = 'v2.18.0';

// Changelog v2.18.0:
// - Firmware: batch commissioning - un solo switch mesh per tutti i nodi
//   (da ~90s a ~15-20s per 3 nodi)
// - Firmware: verifica nodi su production mesh via routing table dopo batch
// - Firmware: nuovo MQTT topic commission/batch e commission/batch/result
//
// Changelog v2.17.1:
// - Fix: scan wizard non mostra più nodi già registrati in altri impianti
// - Fix: wizard non si blocca su timeout commissioning, tenta registrazione comunque
// - Perf: commissioning da ~90s a ~15s (polling mesh parallelo invece di commission/result)
// - Admin: pulsante elimina impianto direttamente da Gestione Admin (per impianti rotti)
//
// Changelog v2.17.0:
// - Admin: pagina Monitoraggio Globale con lista mondiale gateway e accordion nodi
// - Firmware: factory reset via GPIO4 (hold 5s), fix MQTT buffer, rimosso gateway legacy
//
// Changelog v2.16.0:
// - Infra: base path spostato a /domotica/ (landing page hub a /)
// - PWA scope e start_url aggiornati a /domotica/
//
// Changelog v2.15.3:
// - Fix: contatore "X dispositivi" delle scene mostrava la lunghezza
//   della stringa JSON invece del numero di azioni (sceneStore normalizza
//   azioni/scheduling/conditions all'ingresso)
//
// Changelog v2.15.2:
// - Fix: Dashboard apriva solo 2 stanze per riga quando la grid ne mostrava 3+
//
// Changelog v2.15.1:
// - Test deploy automatico via GitHub webhook
//
// Changelog v2.15.0:
// - Bump versione di test
//
// Changelog v2.14.0:
// - Feature: MQTT config via custom BLE endpoint durante provisioning
// - Auto-detect broker URL dal hostname corrente
export const APP_NAME = 'OmniaPi Home Domotica';

// Svuota tutte le cache e ricarica (solo manuale da Settings)
export const clearAllCache = async (): Promise<void> => {
  // Svuota cache
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }

  // Unregister SW
  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(reg => reg.unregister()));
  }

  // Reload
  window.location.reload();
};

// Check versione locale all'avvio - SOLO LOG, NESSUN RELOAD AUTOMATICO
export const checkVersion = (): void => {
  const storedVersion = localStorage.getItem('omniapi-version');
  if (storedVersion !== APP_VERSION) {
    localStorage.setItem('omniapi-version', APP_VERSION);
    // NO reload automatico - causa loop infiniti
  }
};

// Check versione dal backend - DISABILITATO per evitare loop
export const checkVersionFromServer = async (): Promise<void> => {
  // Disabilitato - il check versione causa problemi di loop
  // L'aggiornamento avviene naturalmente con il deploy
  return;
};
