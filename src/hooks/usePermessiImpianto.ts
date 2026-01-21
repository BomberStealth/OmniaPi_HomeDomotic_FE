import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';

// ============================================
// HOOK: usePermessiImpianto
// Gestisce i permessi dell'utente su un impianto
// con aggiornamenti real-time via WebSocket
// ============================================

export interface PermessiImpianto {
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null; // null = tutte
  ruolo_condivisione?: 'installatore' | 'ospite' | 'proprietario';
}

// Permessi di default per proprietari/admin (accesso completo)
const DEFAULT_FULL_PERMISSIONS: PermessiImpianto = {
  puo_controllare_dispositivi: true,
  puo_vedere_stato: true,
  stanze_abilitate: null,
};

export const usePermessiImpianto = (impiantoId: number | null) => {
  const [permessi, setPermessi] = useState<PermessiImpianto>(DEFAULT_FULL_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<number | null>(null);

  // Fetch permessi dal backend
  const fetchPermessi = useCallback(async () => {
    if (!impiantoId) return;

    // Evita fetch duplicati per lo stesso impianto
    if (fetchedRef.current === impiantoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/impianti/${impiantoId}/miei-permessi`);
      if (response.data.success) {
        setPermessi(response.data.data);
        fetchedRef.current = impiantoId;
      }
    } catch (err: any) {
      // Se 403, significa accesso negato - usa permessi di default (nessun accesso)
      if (err.response?.status === 403) {
        setPermessi({
          puo_controllare_dispositivi: false,
          puo_vedere_stato: false,
          stanze_abilitate: [],
        });
      } else {
        console.error('Errore fetch permessi:', err);
        setError(err.message || 'Errore nel recupero permessi');
        // In caso di errore, assume permessi completi (per evitare blocchi UI)
        setPermessi(DEFAULT_FULL_PERMISSIONS);
      }
    } finally {
      setLoading(false);
    }
  }, [impiantoId]);

  // Fetch iniziale quando cambia impianto
  useEffect(() => {
    if (impiantoId) {
      // Reset quando cambia impianto
      if (fetchedRef.current !== impiantoId) {
        fetchedRef.current = null;
        setPermessi(DEFAULT_FULL_PERMISSIONS);
      }
      fetchPermessi();
    }
  }, [impiantoId, fetchPermessi]);

  // Listener WebSocket per aggiornamenti real-time
  // Il backend emette tramite 'notification' con tipo='permessi-aggiornati'
  useEffect(() => {
    const handleNotification = (data: any) => {
      // Filtra solo eventi di tipo permessi-aggiornati per questo impianto
      if (data.tipo === 'permessi-aggiornati' && data.impianto_id === impiantoId) {
        console.log('📡 Permessi aggiornati ricevuti via WS:', data);
        setPermessi(prev => ({
          ...prev,
          puo_controllare_dispositivi: data.puo_controllare_dispositivi,
          puo_vedere_stato: data.puo_vedere_stato,
          stanze_abilitate: data.stanze_abilitate,
        }));
      }
    };

    socketService.onNotification(handleNotification);

    return () => {
      socketService.offNotification();
    };
  }, [impiantoId]);

  // Helper: verifica se utente può controllare una specifica stanza
  const canControlStanza = useCallback((stanzaId: number): boolean => {
    if (!permessi.puo_controllare_dispositivi) return false;
    if (permessi.stanze_abilitate === null) return true; // null = tutte
    return permessi.stanze_abilitate.includes(stanzaId);
  }, [permessi]);

  // Helper: verifica se utente può vedere stato di una specifica stanza
  const canViewStanza = useCallback((stanzaId: number): boolean => {
    if (!permessi.puo_vedere_stato) return false;
    if (permessi.stanze_abilitate === null) return true; // null = tutte
    return permessi.stanze_abilitate.includes(stanzaId);
  }, [permessi]);

  return {
    permessi,
    loading,
    error,
    refetch: fetchPermessi,
    canControlStanza,
    canViewStanza,
    // Shortcut per controlli frequenti
    canControl: permessi.puo_controllare_dispositivi,
    canViewState: permessi.puo_vedere_stato,
  };
};
