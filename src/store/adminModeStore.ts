import { create } from 'zustand';
import { useImpiantiStore } from './impiantiStore';
import { useDispositiviStore } from './dispositiviStore';
import { useStanzeStore } from './stanzeStore';
import { useSceneStore } from './sceneStore';
import { api } from '@/services/api';
import { Impianto } from '@/types';

// ============================================
// ADMIN MODE STORE
// Gestisce la modalità admin per accesso temporaneo agli impianti
// Utilizza condivisioni temporanee nel database
// ============================================

interface AdminModeState {
  // Stato
  isAdminMode: boolean;
  adminImpiantoId: number | null;
  adminImpiantoNome: string | null;
  adminImpianto: Impianto | null;
  isLoading: boolean;
  error: string | null;

  // Azioni
  enterAdminMode: (impiantoId: number, impiantoNome: string) => Promise<boolean>;
  exitAdminMode: () => Promise<void>;
  clear: () => void;
}

export const useAdminModeStore = create<AdminModeState>((set) => ({
  isAdminMode: false,
  adminImpiantoId: null,
  adminImpiantoNome: null,
  adminImpianto: null,
  isLoading: false,
  error: null,

  enterAdminMode: async (impiantoId, impiantoNome) => {
    set({ isLoading: true, error: null });

    try {
      // Debug: verifica che il token sia presente
      const token = localStorage.getItem('token');
      console.log('🔑 enterAdminMode - token presente:', !!token, token ? token.substring(0, 20) + '...' : 'NESSUNO');

      // 1. Chiama backend per creare condivisione temporanea
      const response = await api.post(`/api/admin/enter-impianto/${impiantoId}`);
      const impiantoCompleto = response.data?.impianto;

      if (!impiantoCompleto) {
        throw new Error('Impianto non trovato nella risposta');
      }

      // 2. Setta l'impianto corrente nello store impianti
      useImpiantiStore.getState().setImpiantoCorrente(impiantoCompleto);

      // 3. Aggiorna stato admin
      set({
        isAdminMode: true,
        adminImpiantoId: impiantoId,
        adminImpiantoNome: impiantoNome,
        adminImpianto: impiantoCompleto,
        isLoading: false,
        error: null,
      });

      console.log(`✅ Admin mode entered for impianto ${impiantoId}`);
      return true;
    } catch (error: any) {
      console.error('Errore enterAdminMode:', error);
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Errore accesso admin',
      });
      return false;
    }
  },

  exitAdminMode: async () => {
    console.log('🚪 Exiting admin mode...');

    // 1. Reset stato admin PRIMA di tutto per evitare fetch con ID vecchio
    set({
      isAdminMode: false,
      adminImpiantoId: null,
      adminImpiantoNome: null,
      adminImpianto: null,
      isLoading: true,
      error: null,
    });

    // 2. Resetta impiantoCorrente a null per evitare fetch con ID vecchio
    useImpiantiStore.getState().setImpiantoCorrente(null);

    // 3. Pulisci TUTTI gli store dati
    console.log('🚪 Clearing all stores...');
    useDispositiviStore.getState().clear();
    useStanzeStore.getState().clear();
    useSceneStore.getState().clear();

    // 4. Chiama API per eliminare sessione admin dal DB
    try {
      await api.post('/api/admin/exit-impianto');
      console.log('🚪 Admin session deleted from DB');
    } catch (error) {
      console.error('Errore exitAdminMode API:', error);
    }

    // 5. Re-fetch impianti dell'utente (questo auto-seleziona il primo)
    console.log('🚪 Fetching user impianti...');
    await useImpiantiStore.getState().fetchImpianti();

    set({ isLoading: false });
    console.log('🚪 Admin mode exited');
  },

  clear: () => {
    set({
      isAdminMode: false,
      adminImpiantoId: null,
      adminImpiantoNome: null,
      adminImpianto: null,
      isLoading: false,
      error: null,
    });
  },
}));
