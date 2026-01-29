import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiSearchLine, RiAdminLine, RiHome4Line, RiMapPinLine, RiMailLine } from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAdminModeStore } from '@/store/adminModeStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { UserRole } from '@/types';
import { Layout } from '@/components/layout/Layout';

// ============================================
// GESTIONE ADMIN PAGE
// Permette all'admin di cercare e accedere a qualsiasi impianto
// ============================================

interface ImpiantoResult {
  id: number;
  nome: string;
  indirizzo: string;
  citta: string;
  email_proprietario: string;
  creato_il: string;
  proprietario_nome?: string;
  proprietario_cognome?: string;
}

export const GestioneAdmin = () => {
  const { colors } = useThemeColors();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const enterAdminMode = useAdminModeStore((state) => state.enterAdminMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ImpiantoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solo admin può accedere
  if (user?.ruolo !== UserRole.ADMIN) {
    return (
      <Layout>
        <div style={{ padding: '2rem', textAlign: 'center', color: colors.textMuted }}>
          Accesso negato. Solo gli admin possono accedere a questa sezione.
        </div>
      </Layout>
    );
  }

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setError('Inserisci almeno 2 caratteri');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Admin search - Token presente:', !!token);
      console.log('🔍 Admin search - Query:', searchQuery);
      const response = await api.get(`/api/admin/impianti/search?q=${encodeURIComponent(searchQuery)}`);
      console.log('🔍 Admin search - Response:', response.data);
      const impianti = Array.isArray(response.data?.impianti) ? response.data.impianti : [];
      console.log('🔍 Admin search - Impianti trovati:', impianti.length);
      setResults(impianti);
      setSearched(true);
    } catch (err: any) {
      console.error('❌ Admin search error:', err);
      console.error('❌ Response:', err.response);
      console.error('❌ Status:', err.response?.status);
      console.error('❌ Data:', err.response?.data);
      setError(err.response?.data?.error || `Errore: ${err.message || 'Errore nella ricerca'}`);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterAdminMode = async (impianto: ImpiantoResult) => {
    const success = await enterAdminMode(impianto.id, impianto.nome);
    if (success) {
      navigate('/dashboard');
    } else {
      // Usa l'errore dallo store (specifico dal backend) o messaggio generico
      const storeError = useAdminModeStore.getState().error;
      setError(storeError || 'Errore nell\'accesso all\'impianto');
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div>
          <h1 style={{
            color: colors.textPrimary,
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <RiAdminLine size={24} />
            Gestione Admin
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            Cerca e accedi a qualsiasi impianto nel sistema
          </p>
        </div>

        {/* Barra di ricerca */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '0 1rem',
            border: `1px solid ${colors.border}`
          }}>
            <RiSearchLine size={20} color={colors.textMuted} />
            <input
              type="text"
              placeholder="Cerca per nome, ID, email, città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0.875rem 0.75rem',
                color: colors.textPrimary,
                fontSize: '1rem'
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '0 1.5rem',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Cerco...' : 'Cerca'}
          </motion.button>
        </div>

        {/* Errore */}
        {error && (
          <div style={{
            padding: '1rem',
            background: '#ef444420',
            borderRadius: '0.75rem',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* Risultati */}
        {searched && results.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
            Nessun impianto trovato
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map((impianto) => (
            <motion.div
              key={impianto.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: colors.bgCard,
                borderRadius: '1rem',
                padding: '1rem',
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    color: colors.textPrimary,
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <RiHome4Line size={18} />
                    {impianto.nome}
                    <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 400 }}>
                      #{impianto.id}
                    </span>
                  </h3>

                  {(impianto.indirizzo || impianto.citta) && (
                    <p style={{
                      color: colors.textMuted,
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <RiMapPinLine size={14} />
                      {[impianto.indirizzo, impianto.citta].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {impianto.email_proprietario && (
                    <p style={{
                      color: colors.textMuted,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <RiMailLine size={14} />
                      {impianto.email_proprietario}
                      {impianto.proprietario_nome && ` (${impianto.proprietario_nome} ${impianto.proprietario_cognome || ''})`}
                    </p>
                  )}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEnterAdminMode(impianto)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: `${colors.accent}20`,
                    color: colors.accent,
                    border: `1px solid ${colors.accent}40`,
                    borderRadius: '0.5rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Accedi come Admin
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default GestioneAdmin;
