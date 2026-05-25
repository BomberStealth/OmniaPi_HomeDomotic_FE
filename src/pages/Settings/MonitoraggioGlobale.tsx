import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSearchLine, RiWifiLine, RiWifiOffLine,
  RiArrowDownSLine, RiCpuLine, RiMapPinLine,
} from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/services/api';
import { Layout } from '@/components/layout/Layout';

// ============================================
// MONITORAGGIO GLOBALE GATEWAY
// Sezione admin: lista mondiale di tutti i gateway
// ============================================

interface GatewayRow {
  id: number;
  mac: string;
  ip: string | null;
  version: string | null;
  status: string;
  lastSeen: string | null;
  mqttConnected: boolean;
  impiantoId: number | null;
  impiantoNome: string | null;
  nodeCount: number;
}

interface NodeRow {
  id: number;
  mac: string;
  nome: string | null;
  tipo: string | null;
}

export const MonitoraggioGlobale = () => {
  const { colors } = useThemeColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [gateways, setGateways] = useState<GatewayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<Record<number, NodeRow[]>>({});
  const [nodesLoading, setNodesLoading] = useState<Record<number, boolean>>({});

  const fetchGateways = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '10' });
      if (q.trim().length >= 2) params.set('q', q.trim());
      const res = await api.get(`/api/admin/gateways?${params}`);
      setGateways(res.data?.gateways || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nel recupero dei gateway');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const handleSearch = () => fetchGateways(searchQuery);

  const toggleExpand = async (gatewayId: number) => {
    if (expandedId === gatewayId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(gatewayId);
    if (nodes[gatewayId]) return; // già caricati

    setNodesLoading(prev => ({ ...prev, [gatewayId]: true }));
    try {
      const res = await api.get(`/api/admin/gateways/${gatewayId}/nodes`);
      setNodes(prev => ({ ...prev, [gatewayId]: res.data?.nodes || [] }));
    } catch {
      setNodes(prev => ({ ...prev, [gatewayId]: [] }));
    } finally {
      setNodesLoading(prev => ({ ...prev, [gatewayId]: false }));
    }
  };

  const isOnline = (gw: GatewayRow) => gw.status === 'online' || gw.mqttConnected;

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ color: colors.textPrimary, fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Monitoraggio Globale
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            Tutti i gateway OmniaPi connessi al sistema
          </p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: colors.bgCard,
            borderRadius: '0.75rem',
            padding: '0 1rem',
            border: `1px solid ${colors.border}`,
          }}>
            <RiSearchLine size={18} color={colors.textMuted} />
            <input
              type="text"
              placeholder="Cerca per nome impianto o MAC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '0.75rem',
                color: colors.textPrimary,
                fontSize: '0.95rem',
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '0 1.25rem',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontSize: '0.9rem',
            }}
          >
            {loading ? '...' : 'Cerca'}
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '0.875rem', background: '#ef444420', borderRadius: '0.75rem', color: '#ef4444', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Lista */}
        {!loading && gateways.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
            Nessun gateway trovato
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {gateways.map(gw => (
            <div
              key={gw.id}
              style={{
                background: colors.bgCard,
                borderRadius: '1rem',
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
              }}
            >
              {/* Gateway row */}
              <motion.button
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleExpand(gw.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: isOnline(gw) ? '#22c55e' : '#ef4444',
                  boxShadow: isOnline(gw) ? '0 0 6px #22c55e80' : 'none',
                }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
                      {gw.impiantoNome || 'Senza impianto'}
                    </span>
                    <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>
                      {gw.mac}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    {gw.ip && (
                      <span style={{ color: colors.textMuted, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RiMapPinLine size={12} /> {gw.ip}
                      </span>
                    )}
                    {gw.version && (
                      <span style={{ color: colors.textMuted, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RiCpuLine size={12} /> v{gw.version}
                      </span>
                    )}
                    <span style={{ color: colors.textMuted, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {isOnline(gw) ? <RiWifiLine size={12} color="#22c55e" /> : <RiWifiOffLine size={12} color="#ef4444" />}
                      {gw.nodeCount} {gw.nodeCount === 1 ? 'nodo' : 'nodi'}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <motion.div
                  animate={{ rotate: expandedId === gw.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0 }}
                >
                  <RiArrowDownSLine size={20} color={colors.textMuted} />
                </motion.div>
              </motion.button>

              {/* Nodi accordion */}
              <AnimatePresence>
                {expandedId === gw.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      borderTop: `1px solid ${colors.border}`,
                      padding: '0.625rem 1rem 0.75rem 2.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.375rem',
                    }}>
                      {nodesLoading[gw.id] ? (
                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Caricamento nodi...</span>
                      ) : (nodes[gw.id] || []).length === 0 ? (
                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Nessun nodo registrato</span>
                      ) : (
                        (nodes[gw.id] || []).map(node => (
                          <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.textMuted, flexShrink: 0 }} />
                            <span style={{ color: colors.textSecondary, fontSize: '0.875rem' }}>
                              {node.nome || node.mac}
                            </span>
                            {node.tipo && (
                              <span style={{
                                fontSize: '0.7rem', color: colors.textMuted,
                                background: `${colors.accent}20`, borderRadius: '0.3rem',
                                padding: '0.1rem 0.4rem',
                              }}>
                                {node.tipo}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {!loading && gateways.length === 10 && (
          <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem' }}>
            Mostrati i primi 10 risultati — usa la ricerca per filtrare
          </p>
        )}
      </div>
    </Layout>
  );
};

export default MonitoraggioGlobale;
