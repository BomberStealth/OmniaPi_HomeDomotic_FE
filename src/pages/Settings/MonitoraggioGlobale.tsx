import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSearchLine, RiWifiLine, RiWifiOffLine,
  RiArrowDownSLine, RiCpuLine, RiMapPinLine,
  RiUploadCloud2Line, RiFlashlightLine, RiCloseLine,
  RiCheckLine, RiLoader4Line, RiDeleteBinLine,
  RiHardDriveLine,
} from 'react-icons/ri';
import { useThemeColors } from '@/hooks/useThemeColors';
import { api } from '@/services/api';
import { Layout } from '@/components/layout/Layout';

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

interface FirmwareFile {
  filename: string;
  size: number;
  uploadedAt: string;
  device_type: string;
}

type OtaPhase = 'idle' | 'sending' | 'success' | 'error';

const formatBytes = (n: number) =>
  n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;

export const MonitoraggioGlobale = () => {
  const { colors } = useThemeColors();

  // ── Firmware server ──────────────────────────────────────────
  const [firmwares, setFirmwares] = useState<FirmwareFile[]>([]);
  const [firmwaresLoading, setFirmwaresLoading] = useState(true);
  const [uploadingFw, setUploadingFw] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDeviceType, setUploadDeviceType] = useState<string>('gateway');
  const fwFileRef = useRef<HTMLInputElement>(null);

  const fetchFirmwares = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/firmware');
      setFirmwares(res.data?.files || []);
    } catch (err: any) {
      console.error('[firmware] fetch error:', err?.response?.data || err?.message);
      setFirmwares([]);
    } finally {
      setFirmwaresLoading(false);
    }
  }, []);

  useEffect(() => { fetchFirmwares(); }, [fetchFirmwares]);

  const handleFwUpload = async (file: File) => {
    setUploadingFw(true);
    setUploadError(null);
    try {
      const buf = await file.arrayBuffer();
      await api.post(
        `/api/admin/firmware?name=${encodeURIComponent(file.name)}&device_type=${encodeURIComponent(uploadDeviceType)}`,
        buf,
        { headers: { 'Content-Type': 'application/octet-stream' } }
      );
      await fetchFirmwares();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Errore upload firmware';
      console.error('[firmware] upload error:', msg, err?.response?.status);
      setUploadError(msg);
    } finally {
      setUploadingFw(false);
    }
  };

  const handleFwDelete = async (filename: string) => {
    try {
      await api.delete(`/api/admin/firmware/${encodeURIComponent(filename)}`);
      setFirmwares(prev => prev.filter(f => f.filename !== filename));
    } catch { /* ignore */ }
  };

  // ── Gateway list ─────────────────────────────────────────────
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
      const params = new URLSearchParams({ limit: '50' });
      if (q.trim().length >= 2) params.set('q', q.trim());
      const res = await api.get(`/api/admin/gateways?${params}`);
      setGateways(res.data?.gateways || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nel recupero dei gateway');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGateways(); }, [fetchGateways]);

  const toggleExpand = async (gatewayId: number) => {
    if (expandedId === gatewayId) { setExpandedId(null); return; }
    setExpandedId(gatewayId);
    if (nodes[gatewayId]) return;
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

  // ── OTA gateway modal ──────────────────────────────────────────
  const [otaGateway, setOtaGateway] = useState<GatewayRow | null>(null);
  const [otaSelected, setOtaSelected] = useState('');
  const [otaPhase, setOtaPhase] = useState<OtaPhase>('idle');
  const [otaError, setOtaError] = useState('');

  const gatewayFirmwares = firmwares.filter(f => f.device_type === 'gateway');
  const nodeFirmwares = firmwares.filter(f => f.device_type === 'node');

  const openOta = (gw: GatewayRow) => {
    setOtaGateway(gw);
    setOtaSelected(gatewayFirmwares[0]?.filename || '');
    setOtaPhase('idle');
    setOtaError('');
  };
  const closeOta = () => setOtaGateway(null);

  const triggerOta = async () => {
    if (!otaGateway || !otaSelected) return;
    setOtaPhase('sending');
    setOtaError('');
    try {
      const macNoColon = otaGateway.mac.replace(/[:-]/g, '').toUpperCase();
      await api.post(`/api/admin/gateways/${macNoColon}/ota`, { filename: otaSelected });
      setOtaPhase('success');
    } catch (err: any) {
      setOtaPhase('error');
      setOtaError(err.response?.data?.error || 'Errore invio comando OTA');
    }
  };

  // ── OTA nodo modal ─────────────────────────────────────────────
  const [otaNode, setOtaNode] = useState<NodeRow | null>(null);
  const [otaNodeSelected, setOtaNodeSelected] = useState('');
  const [otaNodePhase, setOtaNodePhase] = useState<OtaPhase>('idle');
  const [otaNodeError, setOtaNodeError] = useState('');

  const openNodeOta = (node: NodeRow) => {
    setOtaNode(node);
    setOtaNodeSelected(nodeFirmwares[0]?.filename || '');
    setOtaNodePhase('idle');
    setOtaNodeError('');
  };
  const closeNodeOta = () => setOtaNode(null);

  const triggerNodeOta = async () => {
    if (!otaNode || !otaNodeSelected) return;
    setOtaNodePhase('sending');
    setOtaNodeError('');
    try {
      await api.post(`/api/admin/nodes/${encodeURIComponent(otaNode.mac)}/ota`, { filename: otaNodeSelected });
      setOtaNodePhase('success');
    } catch (err: any) {
      setOtaNodePhase('error');
      setOtaNodeError(err.response?.data?.error || 'Errore invio OTA nodo');
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div>
          <h1 style={{ color: colors.textPrimary, fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Monitoraggio Globale
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            Tutti i gateway OmniaPi registrati nel sistema
          </p>
        </div>

        {/* ── SEZIONE FIRMWARE SERVER ── */}
        <div style={{
          background: colors.bgCard,
          borderRadius: '1rem',
          border: `1px solid ${colors.border}`,
          padding: '1rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <RiHardDriveLine size={18} color={colors.accent} />
              <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
                Firmware sul server
              </span>
              <span style={{
                fontSize: '0.72rem', padding: '0.1rem 0.5rem',
                background: `${colors.accent}20`, color: colors.accent,
                borderRadius: '1rem', fontWeight: 600,
              }}>
                {firmwares.filter(f => f.device_type === uploadDeviceType).length}
              </span>
            </div>

            {/* Upload: tipo + pulsante */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                value={uploadDeviceType}
                onChange={e => setUploadDeviceType(e.target.value)}
                style={{
                  padding: '0.35rem 0.6rem',
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.5rem',
                  color: colors.textSecondary,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="gateway">Gateway</option>
                <option value="node">Nodo</option>
              </select>
              <input
                ref={fwFileRef}
                type="file"
                accept=".bin"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFwUpload(f); e.target.value = ''; }}
              />
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => fwFileRef.current?.click()}
                disabled={uploadingFw}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.9rem',
                  background: `${colors.accent}15`,
                  border: `1px solid ${colors.accent}30`,
                  borderRadius: '0.625rem',
                  color: colors.accent, fontSize: '0.82rem', fontWeight: 600,
                  cursor: uploadingFw ? 'wait' : 'pointer',
                }}
              >
                {uploadingFw
                  ? <RiLoader4Line size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <RiUploadCloud2Line size={14} />
                }
                Carica .bin
              </motion.button>
            </div>
          </div>

          {uploadError && (
            <div style={{
              padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
              background: '#ff444420', color: '#ff6b6b',
              borderRadius: '0.5rem', fontSize: '0.82rem',
              border: '1px solid #ff444430',
            }}>
              Errore upload: {uploadError}
            </div>
          )}

          {firmwaresLoading ? (
            <p style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Caricamento...</p>
          ) : firmwares.filter(f => f.device_type === uploadDeviceType).length === 0 ? (
            <div style={{
              padding: '0.875rem', textAlign: 'center',
              color: colors.textMuted, fontSize: '0.85rem',
              background: `${colors.textMuted}08`,
              borderRadius: '0.625rem',
              border: `1px dashed ${colors.border}`,
            }}>
              Nessun firmware {uploadDeviceType === 'gateway' ? 'gateway' : 'nodo'} caricato — seleziona il tipo e usa "Carica .bin"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {firmwares.filter(f => f.device_type === uploadDeviceType).map(fw => (
                <div key={fw.filename} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: `${colors.textMuted}06`,
                  borderRadius: '0.625rem',
                  border: `1px solid ${colors.border}`,
                }}>
                  <RiHardDriveLine size={14} color={colors.accent} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 500, wordBreak: 'break-all' }}>
                        {fw.filename}
                      </p>
                      <span style={{
                        fontSize: '0.65rem', padding: '0.1rem 0.4rem',
                        background: fw.device_type === 'gateway' ? `${colors.accent}20` : '#8b5cf620',
                        color: fw.device_type === 'gateway' ? colors.accent : '#8b5cf6',
                        borderRadius: '0.4rem', fontWeight: 600, flexShrink: 0,
                      }}>
                        {fw.device_type === 'gateway' ? 'GW' : fw.device_type === 'node' ? 'Nodo' : fw.device_type}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: colors.textMuted }}>
                      {formatBytes(fw.size)} · {new Date(fw.uploadedAt).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFwDelete(fw.filename)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem', flexShrink: 0 }}
                  >
                    <RiDeleteBinLine size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RICERCA GATEWAY ── */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: colors.bgCard, borderRadius: '0.75rem',
            padding: '0 1rem', border: `1px solid ${colors.border}`,
          }}>
            <RiSearchLine size={18} color={colors.textMuted} />
            <input
              type="text"
              placeholder="Cerca per nome impianto o MAC..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchGateways(searchQuery)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                padding: '0.75rem', color: colors.textPrimary, fontSize: '0.95rem',
              }}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchGateways(searchQuery)}
            disabled={loading}
            style={{
              padding: '0 1.25rem', background: colors.accent, color: 'white',
              border: 'none', borderRadius: '0.75rem', fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '0.9rem',
            }}
          >
            {loading ? '...' : 'Cerca'}
          </motion.button>
        </div>

        {error && (
          <div style={{ padding: '0.875rem', background: '#ef444420', borderRadius: '0.75rem', color: '#ef4444', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {!loading && gateways.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: colors.textMuted }}>
            Nessun gateway trovato
          </div>
        )}

        {/* ── LISTA GATEWAY ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {gateways.map(gw => (
            <div key={gw.id} style={{
              background: colors.bgCard, borderRadius: '1rem',
              border: `1px solid ${colors.border}`, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Row principale (expand) */}
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggleExpand(gw.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem 1rem', background: 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: isOnline(gw) ? '#22c55e' : '#ef4444',
                    boxShadow: isOnline(gw) ? '0 0 6px #22c55e80' : 'none',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
                        {gw.impiantoNome || 'Senza impianto'}
                      </span>
                      <span style={{ color: colors.textMuted, fontSize: '0.75rem' }}>{gw.mac}</span>
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
                        {isOnline(gw)
                          ? <RiWifiLine size={12} color="#22c55e" />
                          : <RiWifiOffLine size={12} color="#ef4444" />}
                        {gw.impiantoId != null ? gw.nodeCount : 0} {(gw.impiantoId != null ? gw.nodeCount : 0) === 1 ? 'nodo' : 'nodi'}
                      </span>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: expandedId === gw.id ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
                    <RiArrowDownSLine size={20} color={colors.textMuted} />
                  </motion.div>
                </motion.button>

                {/* Bottone OTA */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openOta(gw)}
                  disabled={gatewayFirmwares.length === 0}
                  title={gatewayFirmwares.length === 0 ? 'Carica prima un firmware gateway' : 'Aggiorna firmware gateway'}
                  style={{
                    flexShrink: 0, marginRight: '0.75rem',
                    width: 32, height: 32, borderRadius: '0.5rem',
                    background: gatewayFirmwares.length > 0 ? `${colors.accent}15` : `${colors.textMuted}10`,
                    border: `1px solid ${gatewayFirmwares.length > 0 ? `${colors.accent}30` : colors.border}`,
                    color: gatewayFirmwares.length > 0 ? colors.accent : colors.textMuted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: gatewayFirmwares.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  <RiFlashlightLine size={16} />
                </motion.button>
              </div>

              {/* Nodi accordion */}
              <AnimatePresence>
                {expandedId === gw.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      borderTop: `1px solid ${colors.border}`,
                      padding: '0.625rem 1rem 0.75rem 2.5rem',
                      display: 'flex', flexDirection: 'column', gap: '0.375rem',
                    }}>
                      {nodesLoading[gw.id] ? (
                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Caricamento nodi...</span>
                      ) : (nodes[gw.id] || []).length === 0 ? (
                        <span style={{ color: colors.textMuted, fontSize: '0.85rem' }}>Nessun nodo registrato</span>
                      ) : (
                        (nodes[gw.id] || []).map(node => (
                          <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.textMuted, flexShrink: 0 }} />
                            <span style={{ color: colors.textSecondary, fontSize: '0.875rem', flex: 1 }}>
                              {node.nome || node.mac}
                            </span>
                            {node.tipo && (
                              <span style={{
                                fontSize: '0.7rem', color: colors.textMuted,
                                background: `${colors.accent}20`, borderRadius: '0.3rem', padding: '0.1rem 0.4rem',
                              }}>
                                {node.tipo}
                              </span>
                            )}
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openNodeOta(node)}
                              disabled={nodeFirmwares.length === 0}
                              title={nodeFirmwares.length === 0 ? 'Carica prima un firmware nodo' : `OTA nodo ${node.mac}`}
                              style={{
                                width: 24, height: 24, borderRadius: '0.35rem', flexShrink: 0,
                                background: nodeFirmwares.length > 0 ? `${colors.accent}15` : `${colors.textMuted}10`,
                                border: `1px solid ${nodeFirmwares.length > 0 ? `${colors.accent}30` : colors.border}`,
                                color: nodeFirmwares.length > 0 ? colors.accent : colors.textMuted,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: nodeFirmwares.length > 0 ? 'pointer' : 'not-allowed',
                              }}
                            >
                              <RiFlashlightLine size={12} />
                            </motion.button>
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

        {!loading && gateways.length === 50 && (
          <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem' }}>
            Mostrati i primi 50 risultati — usa la ricerca per filtrare
          </p>
        )}
      </div>

      {/* ── OTA MODAL ── */}
      <AnimatePresence>
        {otaGateway && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) closeOta(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{
                background: colors.bgCard, borderRadius: '1.25rem',
                border: `1px solid ${colors.border}`, padding: '1.5rem',
                width: '100%', maxWidth: '420px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Aggiorna Firmware
                  </h2>
                  <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                    {otaGateway.impiantoNome || 'Senza impianto'} · {otaGateway.mac}
                  </p>
                  {otaGateway.version && (
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0.1rem 0 0' }}>
                      Versione attuale: <strong>v{otaGateway.version}</strong>
                    </p>
                  )}
                </div>
                <button onClick={closeOta} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                  <RiCloseLine size={22} />
                </button>
              </div>

              {/* Dropdown firmware */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: colors.textSecondary, fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Firmware disponibile sul server
                </label>
                <select
                  value={otaSelected}
                  onChange={e => setOtaSelected(e.target.value)}
                  disabled={otaPhase === 'sending'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.875rem',
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '0.625rem',
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'auto',
                  }}
                >
                  {gatewayFirmwares.map(fw => (
                    <option key={fw.filename} value={fw.filename}>
                      {fw.filename} ({formatBytes(fw.size)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Feedback */}
              {otaPhase === 'success' && (
                <div style={{
                  padding: '0.75rem', background: '#22c55e15', border: '1px solid #22c55e30',
                  borderRadius: '0.75rem', textAlign: 'center', marginBottom: '1rem',
                }}>
                  <RiCheckLine size={20} color="#22c55e" />
                  <p style={{ margin: '0.25rem 0 0', color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                    Comando inviato!
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: colors.textMuted, fontSize: '0.78rem' }}>
                    Il gateway scarica e si aggiorna automaticamente (~30-60s)
                  </p>
                </div>
              )}
              {otaPhase === 'error' && otaError && (
                <div style={{
                  padding: '0.625rem', background: '#ef444415', border: '1px solid #ef444430',
                  borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem',
                }}>
                  {otaError}
                </div>
              )}

              {/* Azioni */}
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={closeOta}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '0.75rem',
                    background: `${colors.textMuted}12`, border: `1px solid ${colors.border}`,
                    color: colors.textSecondary, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  {otaPhase === 'success' ? 'Chiudi' : 'Annulla'}
                </button>
                {otaPhase !== 'success' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={triggerOta}
                    disabled={!otaSelected || otaPhase === 'sending'}
                    style={{
                      flex: 2, padding: '0.7rem', borderRadius: '0.75rem', border: 'none',
                      background: !otaSelected || otaPhase === 'sending'
                        ? `${colors.accent}40`
                        : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent})`,
                      color: 'white', fontWeight: 600, fontSize: '0.9rem',
                      cursor: !otaSelected || otaPhase === 'sending' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                  >
                    {otaPhase === 'sending'
                      ? <><RiLoader4Line size={16} style={{ animation: 'spin 1s linear infinite' }} /> Invio...</>
                      : <><RiFlashlightLine size={16} /> Aggiorna gateway</>
                    }
                  </motion.button>
                )}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OTA NODO MODAL ── */}
      <AnimatePresence>
        {otaNode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) closeNodeOta(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }} transition={{ duration: 0.18 }}
              style={{
                background: colors.bgCard, borderRadius: '1.25rem',
                border: `1px solid ${colors.border}`, padding: '1.5rem',
                width: '100%', maxWidth: '420px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    OTA Nodo
                  </h2>
                  <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                    {otaNode.nome || otaNode.mac}
                  </p>
                  <p style={{ color: colors.textMuted, fontSize: '0.72rem', margin: '0.1rem 0 0', fontFamily: 'monospace' }}>
                    {otaNode.mac}
                  </p>
                </div>
                <button onClick={closeNodeOta} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted }}>
                  <RiCloseLine size={22} />
                </button>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: colors.textSecondary, fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Firmware nodo disponibile sul server
                </label>
                <select
                  value={otaNodeSelected}
                  onChange={e => setOtaNodeSelected(e.target.value)}
                  disabled={otaNodePhase === 'sending'}
                  style={{
                    width: '100%', padding: '0.65rem 0.875rem',
                    background: colors.bgCard, border: `1px solid ${colors.border}`,
                    borderRadius: '0.625rem', color: colors.textPrimary,
                    fontSize: '0.9rem', outline: 'none', cursor: 'pointer', appearance: 'auto',
                  }}
                >
                  {nodeFirmwares.map(fw => (
                    <option key={fw.filename} value={fw.filename}>
                      {fw.filename} ({formatBytes(fw.size)})
                    </option>
                  ))}
                </select>
              </div>

              {otaNodePhase === 'success' && (
                <div style={{
                  padding: '0.75rem', marginBottom: '1rem', textAlign: 'center',
                  background: '#4ade8015', border: '1px solid #4ade8030', borderRadius: '0.5rem',
                }}>
                  <RiCheckLine size={20} color="#22c55e" />
                  <p style={{ margin: '0.25rem 0 0', color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                    Firmware inviato!
                  </p>
                  <p style={{ margin: '0.2rem 0 0', color: colors.textMuted, fontSize: '0.78rem' }}>
                    Il nodo si aggiorna via mesh (~30-60s)
                  </p>
                </div>
              )}
              {otaNodePhase === 'error' && otaNodeError && (
                <div style={{
                  padding: '0.625rem', background: '#ef444415', border: '1px solid #ef444430',
                  borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem',
                }}>
                  {otaNodeError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={closeNodeOta}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '0.75rem',
                    background: `${colors.textMuted}12`, border: `1px solid ${colors.border}`,
                    color: colors.textSecondary, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                  }}
                >
                  {otaNodePhase === 'success' ? 'Chiudi' : 'Annulla'}
                </button>
                {otaNodePhase !== 'success' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={triggerNodeOta}
                    disabled={!otaNodeSelected || otaNodePhase === 'sending'}
                    style={{
                      flex: 2, padding: '0.7rem', borderRadius: '0.75rem', border: 'none',
                      background: !otaNodeSelected || otaNodePhase === 'sending'
                        ? `${colors.accent}40`
                        : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent})`,
                      color: 'white', fontWeight: 600, fontSize: '0.9rem',
                      cursor: !otaNodeSelected || otaNodePhase === 'sending' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}
                  >
                    {otaNodePhase === 'sending'
                      ? <><RiLoader4Line size={16} style={{ animation: 'spin 1s linear infinite' }} /> Invio...</>
                      : <><RiFlashlightLine size={16} /> Aggiorna nodo</>
                    }
                  </motion.button>
                )}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default MonitoraggioGlobale;
