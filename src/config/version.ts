// ============================================
// VERSION CONFIG
// ============================================

export const APP_VERSION = 'v2.11.1';

// Changelog v2.11.1:
// - FIX: Backend marca nodo offline in memoria su COMMAND_TIMEOUT
// - FIX: GATEWAY_UPDATED include lista nodi per clearing unreachable
// - Backup: GATEWAY_UPDATED handler controlla nodi online e cancella unreachable
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
