import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// ============================================
// HOOK INVITI PENDENTI
// Carica gli inviti pendenti dell'utente
// ============================================

interface InvitoPendente {
  id: number;
  impianto_id: number;
  impianto_nome: string;
  ruolo_condivisione: 'installatore' | 'ospite';
  invitato_da_nome: string;
  invitato_da_cognome: string;
  creato_il: string;
}

export const useInvitiPendenti = () => {
  const [inviti, setInviti] = useState<InvitoPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const fetchInviti = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/inviti/pendenti');
      if (response.data.success) {
        setInviti(response.data.data || []);
        setCount(response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Errore fetch inviti pendenti:', error);
      setInviti([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const accettaInvito = useCallback(async (id: number) => {
    try {
      const response = await api.post(`/api/condivisioni/${id}/accetta`);
      if (response.data.success) {
        // Rimuovi invito dalla lista locale
        setInviti(prev => prev.filter(i => i.id !== id));
        setCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Errore accetta invito:', error);
      return false;
    }
  }, []);

  const rifiutaInvito = useCallback(async (id: number) => {
    try {
      const response = await api.post(`/api/condivisioni/${id}/rifiuta`);
      if (response.data.success) {
        // Rimuovi invito dalla lista locale
        setInviti(prev => prev.filter(i => i.id !== id));
        setCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Errore rifiuta invito:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchInviti();
  }, [fetchInviti]);

  return {
    inviti,
    count,
    loading,
    fetchInviti,
    accettaInvito,
    rifiutaInvito,
  };
};
