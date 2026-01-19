import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';
import { checkVersion, checkVersionFromServer } from './config/version';

// Check versione locale all'avvio - forza refresh se cambiata
checkVersion();

// Check versione dal backend ogni 60 secondi (auto-update)
checkVersionFromServer();
setInterval(checkVersionFromServer, 60 * 1000);

// Registra Service Worker con auto-update aggressivo
const updateSW = registerSW({
  onNeedRefresh() {
    // Nuova versione disponibile - refresh automatico IMMEDIATO
    updateSW(true);
  },
  onOfflineReady() {
    // App ready for offline use
  },
  onRegisteredSW(_swUrl, registration) {
    // Controlla aggiornamenti ogni 30 secondi
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 30 * 1000);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
