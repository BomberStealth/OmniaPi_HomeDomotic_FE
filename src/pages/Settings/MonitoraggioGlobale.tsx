import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiSearchLine, RiWifiLine, RiWifiOffLine,
  RiArrowDownSLine, RiCpuLine, RiMapPinLine,
  RiUploadCloud2Line, RiFlashlightLine, RiCloseLine,
  RiCheckLine, RiLoader4Line, RiDeleteBinLine,
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

interface FirmwareFile {
  filename: string;
  size: number;
  uploadedAt: string;
}

type OtaPhase = 'idle' | 'sending' | 'success' | 'error';

interface OtaModalState {
  gateway: GatewayRow;
  firmwares: FirmwareFile[];
  selectedFirmware: string;
  phase: OtaPhase;
  errorMsg: string;
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

  // OTA modal
  const [otaModal, setOtaModal] = useState<OtaModalState | null>(null);
  const [uploadingFirmware, setUploadingFirmware] = useState(false);
  const firmwareFileRef = useRef<HTMLInputElement>(null);

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

  // ============================================
  // OTA Modal
  // ============================================

  const openOtaModal = async (gw: GatewayRow) => {
    try {
      const res = await api.get('/api/admin/firmware');
      const firmwares: FirmwareFile[] = res.data?.files || [];
      setOtaModal({
        gateway: gw,
        firmwares,
        selectedFirmware: firmwares[0]?.filename || '',
        phase: 'idle',
        errorMsg: '',
      });
    } catch {
      setOtaModal({
        gateway: gw,
        firmwares: [],
        selectedFirmware: '',
        phase: 'idle',
        errorMsg: '',
      });
    }
  };

  const closeOtaModal = () => setOtaModal(null);

  const handleFirmwareUpload = async (file: File) => {
    if (!otaModal) return;
    setUploadingFirmware(true);
    try {
      const buf = await file.arrayBuffer();
      const res = await api.post(
        `/api/admin/firmware?name=${encodeURIComponent(file.name)}`,
        buf,
        { headers: { 'Content-Type': 'application/octet-stream' } }
      );
      const newFile: FirmwareFile = {
        filename: res.data.filename,
        size: res.data.size,
        uploadedAt: new Date().toISOString(),
      };
      setOtaModal(prev => prev ? {
        ...prev,
        firmwares: [newFile, ...prev.firmwares],
        selectedFirmware: newFile.filename,
      } : null);
    } catch (err: any) {
      setOtaModal(prev => prev ? {
        ...prev,
        errorMsg: err.response?.data?.error || 'Errore upload firmware',
      } : null);
    } finally {
      setUploadingFirmware(false);
    }
  };

  const handleDeleteFirmware = async (filename: string) => {
    if (!otaModal) return;
    try {
      await api.delete(`/api/admin/firmware/${encodeURIComponent(filename)}`);
      const updated = otaModal.firmwares.filter(f => f.filename !== filename);
      setOtaModal(prev => prev ? {
        ...prev,
        firmwares: updated,
        selectedFirmware: prev.selectedFirmware === filename ? (updated[0]?.filename || '') : prev.selectedFirmware,
      } : null);
    } catch { /* ignore */ }
  };

  const handleTriggerOta = async () => {
    if (!otaModal || !otaModal.selectedFirmware) return;
    setOtaModal(prev => prev ? { ...prev, phase: 'sending', errorMsg: '' } : null);
    try {
      const macNoColon = otaModal.gateway.mac.replace(/[:-]/g, '').toUpperCase();
      await api.post(`/api/admin/gateways/${macNoColon}/ota`, {
        filename: otaModal.selectedFirmware,
      });
      setOtaModal(prev => prev ? { ...prev, phase: 'success' } : null);
    } catch (err: any) {
      setOtaModal(prev => prev ? {
        ...prev,
        phase: 'error',
        errorMsg: err.response?.data?.error || 'Errore invio comando OTA',
      } : null);
    }
  };

  const formatBytes = (n: number) => n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(2)} MB`
    : `${Math.round(n / 1024)} KB`;

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div>
          <h1 style={{ color: colors.textPrimary, fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Monitoraggio Globale
          </h1>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            Tutti i gateway OmniaPi registrati nel sistema
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggleExpand(gw.id)}
                  style={{
                    flex: 1,
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

                {/* OTA button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => openOtaModal(gw)}
                  title="Aggiorna firmware"
                  style={{
                    flexShrink: 0,
                    marginRight: '0.75rem',
                    width: 32,
                    height: 32,
                    borderRadius: '0.5rem',
                    background: `${colors.accent}15`,
                    border: `1px solid ${colors.accent}30`,
                    color: colors.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <RiFlashlightLine size={16} />
                </motion.button>
              </div>

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

        {!loading && gateways.length === 50 && (
          <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '0.8rem' }}>
            Mostrati i primi 50 risultati — usa la ricerca per filtrare
          </p>
        )}
      </div>

      {/* ==================== OTA MODAL ==================== */}
      <AnimatePresence>
        {otaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) closeOtaModal(); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                background: colors.bgCard,
                borderRadius: '1.25rem',
                border: `1px solid ${colors.border}`,
                padding: '1.5rem',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Aggiorna Firmware
                  </h2>
                  <p style={{ color: colors.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                    {otaModal.gateway.impiantoNome || 'Senza impianto'} · {otaModal.gateway.mac}
                  </p>
                  {otaModal.gateway.version && (
                    <p style={{ color: colors.textMuted, fontSize: '0.75rem', margin: '0.15rem 0 0' }}>
                      Versione attuale: v{otaModal.gateway.version}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeOtaModal}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: colors.textMuted, padding: '0.25rem',
                  }}
                >
                  <RiCloseLine size={22} />
                </button>
              </div>

              {/* Firmware list */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: colors.textSecondary, fontSize: '0.85rem', fontWeight: 600 }}>
                    Firmware disponibili
                  </span>
                  {/* Upload button */}
                  <input
                    ref={firmwareFileRef}
                    type="file"
                    accept=".bin"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFirmwareUpload(file);
                      e.target.value = '';
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    onClick={() => firmwareFileRef.current?.click()}
                    disabled={uploadingFirmware}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.35rem 0.75rem',
                      background: `${colors.accent}15`,
                      border: `1px solid ${colors.accent}30`,
                      borderRadius: '0.5rem',
                      color: colors.accent,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: uploadingFirmware ? 'wait' : 'pointer',
                    }}
                  >
                    {uploadingFirmware
                      ? <RiLoader4Line size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <RiUploadCloud2Line size={14} />
                    }
                    Carica .bin
                  </motion.button>
                </div>

                {otaModal.firmwares.length === 0 ? (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: colors.textMuted,
                    fontSize: '0.85rem',
                    background: `${colors.textMuted}08`,
                    borderRadius: '0.75rem',
                    border: `1px dashed ${colors.border}`,
                  }}>
                    Nessun firmware caricato — usa "Carica .bin" per aggiungerne uno
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {otaModal.firmwares.map(fw => (
                      <div
                        key={fw.filename}
                        onClick={() => setOtaModal(prev => prev ? { ...prev, selectedFirmware: fw.filename } : null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.625rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.75rem',
                          border: `1px solid ${otaModal.selectedFirmware === fw.filename ? colors.accent : colors.border}`,
                          background: otaModal.selectedFirmware === fw.filename
                            ? `${colors.accent}10`
                            : `${colors.textMuted}05`,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 18, height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${otaModal.selectedFirmware === fw.filename ? colors.accent : colors.border}`,
                          background: otaModal.selectedFirmware === fw.filename ? colors.accent : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {otaModal.selectedFirmware === fw.filename && <RiCheckLine size={10} color="white" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 500, wordBreak: 'break-all' }}>
                            {fw.filename}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: colors.textMuted }}>
                            {formatBytes(fw.size)} · {new Date(fw.uploadedAt).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFirmware(fw.filename); }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#ef4444', padding: '0.2rem', flexShrink: 0,
                          }}
                        >
                          <RiDeleteBinLine size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {otaModal.errorMsg && (
                <div style={{
                  padding: '0.625rem', background: '#ef444415', border: '1px solid #ef444430',
                  borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem',
                }}>
                  {otaModal.errorMsg}
                </div>
              )}

              {/* Phase feedback */}
              {otaModal.phase === 'success' && (
                <div style={{
                  padding: '0.75rem', background: '#22c55e15', border: '1px solid #22c55e30',
                  borderRadius: '0.75rem', textAlign: 'center', marginBottom: '0.75rem',
                }}>
                  <RiCheckLine size={20} color="#22c55e" style={{ marginBottom: '0.25rem' }} />
                  <p style={{ margin: 0, color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                    Comando OTA inviato!
                  </p>
                  <p style={{ margin: '0.25rem 0 0', color: colors.textMuted, fontSize: '0.78rem' }}>
                    Il gateway scaricherà il firmware e si aggiornerà automaticamente.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={closeOtaModal}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: '0.75rem',
                    background: `${colors.textMuted}12`,
                    border: `1px solid ${colors.border}`,
                    color: colors.textSecondary,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  {otaModal.phase === 'success' ? 'Chiudi' : 'Annulla'}
                </button>
                {otaModal.phase !== 'success' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTriggerOta}
                    disabled={!otaModal.selectedFirmware || otaModal.phase === 'sending' || uploadingFirmware}
                    style={{
                      flex: 2,
                      padding: '0.7rem',
                      borderRadius: '0.75rem',
                      background: !otaModal.selectedFirmware || otaModal.phase === 'sending'
                        ? `${colors.accent}40`
                        : `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark || colors.accent})`,
                      border: 'none',
                      color: 'white',
                      fontWeight: 600,
                      cursor: !otaModal.selectedFirmware || otaModal.phase === 'sending' ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {otaModal.phase === 'sending'
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
    </Layout>
  );
};

export default MonitoraggioGlobale;
