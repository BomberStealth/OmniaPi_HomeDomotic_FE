// ============================================
// VERSION CONFIG
// ============================================

export const APP_VERSION = 'v1.3.85';
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
