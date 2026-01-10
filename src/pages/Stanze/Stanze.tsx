import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useStanzeStore } from '@/store/stanzeStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { stanzeApi, tasmotaApi } from '@/services/api';
import { motion } from 'framer-motion';
import { RiDoorOpenLine, RiAddLine, RiLoader4Line, RiSettings4Line, RiDeleteBinLine, RiLightbulbLine, RiArrowRightLine, RiEditLine, RiBox3Line } from 'react-icons/ri';
import { toast } from 'sonner';
import { useThemeColor } from '@/contexts/ThemeColorContext';

// ============================================
// STANZE PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

// Colori base (invarianti)
const baseColors = {
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Helper per convertire hex a rgb
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
};

export const Stanze = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { colors: themeColors } = useThemeColor();

  // Store data (real-time via useRealTimeSync nel Layout)
  const { stanze, loading: stanzeLoading } = useStanzeStore();
  const { dispositivi, loading: dispositiviLoading } = useDispositiviStore();

  // Colori dinamici basati sul tema
  const colors = useMemo(() => ({
    ...baseColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors]);

  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deviceListModalOpen, setDeviceListModalOpen] = useState(false);
  const [deviceActionModalOpen, setDeviceActionModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameStanzaModalOpen, setRenameStanzaModalOpen] = useState(false);
  const [selectedStanza, setSelectedStanza] = useState<any | null>(null);
  const [selectedDispositivo, setSelectedDispositivo] = useState<any | null>(null);
  const [isNonAssegnatiMode, setIsNonAssegnatiMode] = useState(false);
  const [newStanza, setNewStanza] = useState({ nome: '', icona: '🚪' });
  const [newDeviceName, setNewDeviceName] = useState('');
  const [editStanza, setEditStanza] = useState({ nome: '', icona: '' });

  const impiantoId = impiantoCorrente?.id || 0;
  const loading = stanzeLoading || dispositiviLoading;

  const handleCreateStanza = async () => {
    if (!newStanza.nome) {
      toast.error('Inserisci il nome della stanza');
      return;
    }
    try {
      setActionLoading(true);
      await stanzeApi.createStanza(impiantoId, newStanza);
      toast.success('Stanza creata!');
      setModalOpen(false);
      setNewStanza({ nome: '', icona: '🚪' });
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStanza = async () => {
    if (!selectedStanza) return;
    try {
      await stanzeApi.deleteStanza(selectedStanza.id);
      toast.success('Stanza eliminata!');
      setSettingsModalOpen(false);
      setSelectedStanza(null);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const handleRenameStanza = async () => {
    if (!selectedStanza || !editStanza.nome.trim()) {
      toast.error('Inserisci un nome valido');
      return;
    }
    try {
      await stanzeApi.updateStanza(selectedStanza.id, { nome: editStanza.nome.trim(), icona: editStanza.icona });
      toast.success('Stanza rinominata!');
      setRenameStanzaModalOpen(false);
      setSettingsModalOpen(false);
      setSelectedStanza(null);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante la rinomina');
    }
  };

  const openRenameStanzaModal = () => {
    setEditStanza({ nome: selectedStanza?.nome || '', icona: selectedStanza?.icona || '🚪' });
    setSettingsModalOpen(false);
    setRenameStanzaModalOpen(true);
  };

  const handleMoveDispositivo = async (stanzaId: number | null) => {
    if (!selectedDispositivo) return;
    try {
      await tasmotaApi.assignToStanza(selectedDispositivo.id, stanzaId);
      toast.success('Dispositivo spostato!');
      setMoveModalOpen(false);
      setDeviceActionModalOpen(false);
      setSelectedDispositivo(null);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante lo spostamento');
    }
  };

  // Assegna velocemente un dispositivo alla stanza corrente
  const handleQuickAssignDispositivo = async (dispositivo: any) => {
    if (!selectedStanza) return;
    try {
      await tasmotaApi.assignToStanza(dispositivo.id, selectedStanza.id);
      toast.success(`${dispositivo.nome} aggiunto!`);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'assegnazione');
    }
  };

  const handleRenameDispositivo = async () => {
    if (!selectedDispositivo || !newDeviceName.trim()) {
      toast.error('Inserisci un nome valido');
      return;
    }
    try {
      await tasmotaApi.renameDispositivo(selectedDispositivo.id, newDeviceName.trim());
      toast.success('Dispositivo rinominato!');
      setRenameModalOpen(false);
      setDeviceActionModalOpen(false);
      setNewDeviceName('');
      setSelectedDispositivo(null);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante la rinomina');
    }
  };

  const handleDeleteDispositivo = async () => {
    if (!selectedDispositivo) return;
    if (!confirm(`Eliminare "${selectedDispositivo.nome}"?`)) return;
    try {
      await tasmotaApi.deleteDispositivo(selectedDispositivo.id);
      toast.success('Dispositivo eliminato!');
      setDeviceActionModalOpen(false);
      setSelectedDispositivo(null);
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante l\'eliminazione');
    }
  };

  const openSettings = (stanza: any) => {
    setSelectedStanza(stanza);
    setIsNonAssegnatiMode(false);
    setSettingsModalOpen(true);
  };

  const openNonAssegnatiSettings = () => {
    setSelectedStanza(null);
    setIsNonAssegnatiMode(true);
    setDeviceListModalOpen(true);
  };

  const openDeviceList = () => {
    setSettingsModalOpen(false);
    setDeviceListModalOpen(true);
  };

  const openDeviceAction = (dispositivo: any) => {
    setSelectedDispositivo(dispositivo);
    setDeviceActionModalOpen(true);
  };

  const openMoveModal = () => {
    setDeviceActionModalOpen(false);
    setMoveModalOpen(true);
  };

  const openRenameModal = () => {
    setNewDeviceName(selectedDispositivo?.nome || '');
    setDeviceActionModalOpen(false);
    setRenameModalOpen(true);
  };

  const stanzeValide = stanze.filter(s => s !== null && s !== undefined);
  const dispositiviValidi = dispositivi.filter(d => d !== null && d !== undefined);
  const getDispositiviByStanza = (stanzaId: number) => dispositiviValidi.filter(d => d.stanza_id === stanzaId);
  const dispositiviNonAssegnati = dispositiviValidi.filter(d => !d.stanza_id);

  const getCurrentDeviceList = () => {
    if (isNonAssegnatiMode) return dispositiviNonAssegnati;
    return selectedStanza ? getDispositiviByStanza(selectedStanza.id) : [];
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Stanze</h1>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '4px 0 0 0' }}>
              {stanzeValide.length} stanze, {dispositiviValidi.length} dispositivi
            </p>
          </div>
          <motion.button
            onClick={() => setModalOpen(true)}
            disabled={!impiantoId}
            style={{
              padding: '10px',
              borderRadius: '16px',
              background: `linear-gradient(165deg, ${colors.accent}, #4aa870)`,
              border: 'none',
              cursor: !impiantoId ? 'not-allowed' : 'pointer',
              opacity: !impiantoId ? 0.5 : 1,
              boxShadow: `0 4px 16px ${colors.accent}40`,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RiAddLine size={20} style={{ color: '#0a0a0c' }} />
          </motion.button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <RiLoader4Line size={32} className="animate-spin" style={{ color: colors.accent }} />
          </div>
        ) : !impiantoId ? (
          <div
            style={{
              background: colors.bgCardLit,
              border: `1px solid ${colors.border}`,
              borderRadius: '24px',
              boxShadow: colors.cardShadowLit,
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0 }}>
              Seleziona un impianto per vedere le stanze
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Dispositivi Non Assegnati */}
            {dispositiviNonAssegnati.length > 0 && (
              <motion.div
                style={{
                  background: colors.bgCardLit,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  boxShadow: colors.cardShadowLit,
                  padding: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                whileHover={{ borderColor: colors.borderHover }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '25%',
                    right: '25%',
                    height: '1px',
                    background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RiBox3Line size={18} style={{ color: colors.warning }} />
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Non assegnati</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>{dispositiviNonAssegnati.length}</span>
                    <motion.button
                      onClick={openNonAssegnatiSettings}
                      style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                      whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <RiSettings4Line size={16} style={{ color: colors.textMuted }} />
                    </motion.button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {dispositiviNonAssegnati.slice(0, 6).map((disp) => (
                    <div
                      key={disp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.05)',
                        border: disp.power_state ? `1px solid ${colors.success}` : '1px solid transparent',
                      }}
                    >
                      <RiLightbulbLine size={12} style={{ color: disp.power_state ? colors.success : colors.textMuted }} />
                      <span style={{ fontSize: '11px', color: colors.textPrimary, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {disp.nome}
                      </span>
                    </div>
                  ))}
                  {dispositiviNonAssegnati.length > 6 && (
                    <span style={{ fontSize: '11px', color: colors.textMuted, alignSelf: 'center' }}>+{dispositiviNonAssegnati.length - 6} altri</span>
                  )}
                </div>
              </motion.div>
            )}

            {/* Lista Stanze */}
            {stanzeValide.length === 0 ? (
              <div
                style={{
                  background: colors.bgCardLit,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '24px',
                  boxShadow: colors.cardShadowLit,
                  padding: '32px',
                  textAlign: 'center',
                }}
              >
                <RiDoorOpenLine size={32} style={{ color: colors.textMuted, marginBottom: '8px' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>Nessuna stanza</h3>
                <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '12px' }}>Crea la tua prima stanza</p>
                <Button variant="primary" onClick={() => setModalOpen(true)}>
                  <RiAddLine size={14} style={{ marginRight: '4px' }} />
                  Nuova Stanza
                </Button>
              </div>
            ) : (
              stanzeValide.map((stanza) => {
                const dispositiviStanza = getDispositiviByStanza(stanza.id);
                return (
                  <motion.div
                    key={stanza.id}
                    style={{
                      background: colors.bgCardLit,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '20px',
                      boxShadow: colors.cardShadowLit,
                      padding: '12px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    whileHover={{ borderColor: colors.borderHover }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '25%',
                        right: '25%',
                        height: '1px',
                        background: `linear-gradient(90deg, transparent, ${colors.accentLight}4D, transparent)`,
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{stanza.icona || '🚪'}</span>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{stanza.nome}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: colors.textMuted }}>{dispositiviStanza.length}</span>
                        <motion.button
                          onClick={() => openSettings(stanza)}
                          style={{ padding: '6px', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                          whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                          <RiSettings4Line size={16} style={{ color: colors.textMuted }} />
                        </motion.button>
                      </div>
                    </div>
                    {dispositiviStanza.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {dispositiviStanza.slice(0, 6).map((disp) => (
                          <div
                            key={disp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,0.05)',
                              border: disp.power_state ? `1px solid ${colors.success}` : '1px solid transparent',
                            }}
                          >
                            <RiLightbulbLine size={12} style={{ color: disp.power_state ? colors.success : colors.textMuted }} />
                            <span style={{ fontSize: '11px', color: colors.textPrimary, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {disp.nome}
                            </span>
                          </div>
                        ))}
                        {dispositiviStanza.length > 6 && (
                          <span style={{ fontSize: '11px', color: colors.textMuted, alignSelf: 'center' }}>+{dispositiviStanza.length - 6} altri</span>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: colors.textMuted, fontStyle: 'italic', margin: 0 }}>Nessun dispositivo</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal Nuova Stanza */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nuova Stanza" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nome Stanza" value={newStanza.nome} onChange={(e) => setNewStanza({ ...newStanza, nome: e.target.value })} placeholder="es. Soggiorno" />
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Icona</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {['🚪', '🛋️', '🍳', '🛏️', '🚿', '🏢', '🏠', '📺', '💻', '🌳', '🚗', '🎮'].map((icon) => (
                <motion.button
                  key={icon}
                  onClick={() => setNewStanza({ ...newStanza, icona: icon })}
                  style={{
                    padding: '10px',
                    fontSize: '20px',
                    borderRadius: '12px',
                    border: newStanza.icona === icon ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                    background: newStanza.icona === icon ? `${colors.accent}20` : 'transparent',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleCreateStanza} fullWidth disabled={actionLoading}>{actionLoading ? 'Creazione...' : 'Crea'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Impostazioni Stanza */}
      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title={`${selectedStanza?.icona || '🚪'} ${selectedStanza?.nome || ''}`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <motion.button
            onClick={openDeviceList}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiLightbulbLine size={18} style={{ color: colors.accent }} />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>Gestisci dispositivi</span>
            </div>
            <RiArrowRightLine size={16} style={{ color: colors.textMuted }} />
          </motion.button>
          <motion.button
            onClick={openRenameStanzaModal}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiEditLine size={18} style={{ color: colors.warning }} />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>Rinomina stanza</span>
            </div>
            <RiArrowRightLine size={16} style={{ color: colors.textMuted }} />
          </motion.button>
          <motion.button
            onClick={handleDeleteStanza}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
            whileHover={{ background: `${colors.error}20` }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiDeleteBinLine size={18} style={{ color: colors.error }} />
              <span style={{ fontSize: '14px', color: colors.error }}>Elimina stanza</span>
            </div>
          </motion.button>
          <Button variant="ghost" onClick={() => setSettingsModalOpen(false)} fullWidth style={{ marginTop: '8px' }}>Chiudi</Button>
        </div>
      </Modal>

      {/* Modal Lista Dispositivi */}
      <Modal isOpen={deviceListModalOpen} onClose={() => { setDeviceListModalOpen(false); setIsNonAssegnatiMode(false); }} title={isNonAssegnatiMode ? '📦 Non assegnati' : `${selectedStanza?.icona || ''} ${selectedStanza?.nome || ''}`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isNonAssegnatiMode ? (
            /* Modal per Non Assegnati - comportamento originale */
            <>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>Clicca su un dispositivo per assegnarlo a una stanza</p>
              {dispositiviNonAssegnati.length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textMuted, padding: '24px 0' }}>Nessun dispositivo</p>
              ) : (
                <div style={{ maxHeight: '256px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {dispositiviNonAssegnati.map((disp) => (
                    <motion.button
                      key={disp.id}
                      onClick={() => openDeviceAction(disp)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
                      whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RiLightbulbLine size={16} style={{ color: disp.power_state ? colors.success : colors.textMuted }} />
                        <span style={{ fontSize: '14px', color: colors.textPrimary }}>{disp.nome}</span>
                      </div>
                      <RiArrowRightLine size={14} style={{ color: colors.textMuted }} />
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Modal per Stanza - mostra dispositivi della stanza + non assegnati con + */
            <>
              <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>Clicca su un dispositivo per gestirlo</p>
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* Dispositivi nella stanza */}
                {getCurrentDeviceList().length === 0 ? (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: colors.textMuted, padding: '16px 0' }}>Nessun dispositivo in questa stanza</p>
                ) : (
                  getCurrentDeviceList().map((disp) => (
                    <motion.button
                      key={disp.id}
                      onClick={() => openDeviceAction(disp)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
                      whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RiLightbulbLine size={16} style={{ color: disp.power_state ? colors.success : colors.textMuted }} />
                        <span style={{ fontSize: '14px', color: colors.textPrimary }}>{disp.nome}</span>
                      </div>
                      <RiArrowRightLine size={14} style={{ color: colors.textMuted }} />
                    </motion.button>
                  ))
                )}
                {/* Sezione Non Assegnati */}
                {dispositiviNonAssegnati.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '4px' }}>
                      <RiBox3Line size={14} style={{ color: colors.warning }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textMuted }}>Non assegnati</span>
                      <div style={{ flex: 1, height: '1px', background: colors.border }} />
                    </div>
                    {dispositiviNonAssegnati.map((disp) => (
                      <motion.button
                        key={disp.id}
                        onClick={() => handleQuickAssignDispositivo(disp)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px dashed ${colors.border}`, cursor: 'pointer' }}
                        whileHover={{ background: 'rgba(255,255,255,0.08)', borderColor: colors.accent }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <RiLightbulbLine size={16} style={{ color: colors.textMuted }} />
                          <span style={{ fontSize: '14px', color: colors.textMuted }}>{disp.nome}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: `${colors.accent}20` }}>
                          <RiAddLine size={14} style={{ color: colors.accent }} />
                        </div>
                      </motion.button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
          <Button variant="ghost" onClick={() => { setDeviceListModalOpen(false); setIsNonAssegnatiMode(false); }} fullWidth style={{ marginTop: '12px' }}>Chiudi</Button>
        </div>
      </Modal>

      {/* Modal Azioni Dispositivo */}
      <Modal isOpen={deviceActionModalOpen} onClose={() => setDeviceActionModalOpen(false)} title={selectedDispositivo?.nome || ''} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <motion.button onClick={openMoveModal} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }} whileHover={{ background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiArrowRightLine size={18} style={{ color: colors.accent }} />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>Sposta in altra stanza</span>
            </div>
          </motion.button>
          <motion.button onClick={openRenameModal} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }} whileHover={{ background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiEditLine size={18} style={{ color: colors.warning }} />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>Rinomina dispositivo</span>
            </div>
          </motion.button>
          <motion.button onClick={handleDeleteDispositivo} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }} whileHover={{ background: `${colors.error}20` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RiDeleteBinLine size={18} style={{ color: colors.error }} />
              <span style={{ fontSize: '14px', color: colors.error }}>Elimina dispositivo</span>
            </div>
          </motion.button>
          <Button variant="ghost" onClick={() => setDeviceActionModalOpen(false)} fullWidth style={{ marginTop: '8px' }}>Annulla</Button>
        </div>
      </Modal>

      {/* Modal Sposta Dispositivo */}
      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title={`Sposta "${selectedDispositivo?.nome || ''}"`} size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>Seleziona la stanza di destinazione</p>
          <motion.button
            onClick={() => handleMoveDispositivo(null)}
            disabled={!selectedDispositivo?.stanza_id}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: !selectedDispositivo?.stanza_id ? `${colors.accent}20` : 'rgba(255,255,255,0.05)', border: !selectedDispositivo?.stanza_id ? `1px solid ${colors.accent}` : 'none', cursor: !selectedDispositivo?.stanza_id ? 'default' : 'pointer' }}
            whileHover={selectedDispositivo?.stanza_id ? { background: 'rgba(255,255,255,0.1)' } : undefined}
          >
            <RiBox3Line size={18} style={{ color: colors.warning }} />
            <span style={{ fontSize: '14px', color: colors.textPrimary, flex: 1, textAlign: 'left' }}>Non assegnato</span>
            {!selectedDispositivo?.stanza_id && <span style={{ fontSize: '12px', color: colors.accent }}>Attuale</span>}
          </motion.button>
          <div style={{ maxHeight: '192px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {stanzeValide.map((stanza) => (
              <motion.button
                key={stanza.id}
                onClick={() => handleMoveDispositivo(stanza.id)}
                disabled={selectedDispositivo?.stanza_id === stanza.id}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: selectedDispositivo?.stanza_id === stanza.id ? `${colors.accent}20` : 'rgba(255,255,255,0.05)', border: selectedDispositivo?.stanza_id === stanza.id ? `1px solid ${colors.accent}` : 'none', cursor: selectedDispositivo?.stanza_id === stanza.id ? 'default' : 'pointer' }}
                whileHover={selectedDispositivo?.stanza_id !== stanza.id ? { background: 'rgba(255,255,255,0.1)' } : undefined}
              >
                <span style={{ fontSize: '18px' }}>{stanza.icona || '🚪'}</span>
                <span style={{ fontSize: '14px', color: colors.textPrimary, flex: 1, textAlign: 'left' }}>{stanza.nome}</span>
                {selectedDispositivo?.stanza_id === stanza.id && <span style={{ fontSize: '12px', color: colors.accent }}>Attuale</span>}
              </motion.button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setMoveModalOpen(false)} fullWidth style={{ marginTop: '12px' }}>Annulla</Button>
        </div>
      </Modal>

      {/* Modal Rinomina Dispositivo */}
      <Modal isOpen={renameModalOpen} onClose={() => setRenameModalOpen(false)} title="Rinomina dispositivo" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nuovo nome" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} placeholder="es. Luce Soggiorno" autoFocus />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setRenameModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleRenameDispositivo} fullWidth disabled={!newDeviceName.trim()}>Salva</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rinomina Stanza */}
      <Modal isOpen={renameStanzaModalOpen} onClose={() => setRenameStanzaModalOpen(false)} title="Rinomina stanza" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Nome Stanza" value={editStanza.nome} onChange={(e) => setEditStanza({ ...editStanza, nome: e.target.value })} placeholder="es. Soggiorno" autoFocus />
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '8px' }}>Icona</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {['🚪', '🛋️', '🍳', '🛏️', '🚿', '🏢', '🏠', '📺', '💻', '🌳', '🚗', '🎮'].map((icon) => (
                <motion.button
                  key={icon}
                  onClick={() => setEditStanza({ ...editStanza, icona: icon })}
                  style={{
                    padding: '10px',
                    fontSize: '20px',
                    borderRadius: '12px',
                    border: editStanza.icona === icon ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                    background: editStanza.icona === icon ? `${colors.accent}20` : 'transparent',
                    cursor: 'pointer',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setRenameStanzaModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleRenameStanza} fullWidth disabled={!editStanza.nome.trim()}>Salva</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
