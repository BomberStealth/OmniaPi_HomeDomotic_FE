import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { ConfirmPopup } from '@/components/ui/ConfirmPopup';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useStanzeStore } from '@/store/stanzeStore';
import { useDispositiviStore } from '@/store/dispositiviStore';
import { useUpdateTrigger } from '@/store/updateTriggerStore';
import { usePermessiImpianto } from '@/hooks/usePermessiImpianto';
import { stanzeApi, tasmotaApi } from '@/services/api';
import { motion } from 'framer-motion';
import { RiDoorOpenLine, RiAddLine, RiLoader4Line, RiSettings4Line, RiDeleteBinLine, RiLightbulbLine, RiArrowRightLine, RiEditLine, RiBox3Line } from 'react-icons/ri';
import { Trash2 } from 'lucide-react';
import { toast } from '@/utils/toast';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { ROOM_ICON_OPTIONS, getRoomIcon, DEFAULT_ROOM_ICON } from '@/config/roomIcons';

// ============================================
// STANZE PAGE - Dark Luxury Style
// Con supporto tema dinamico
// ============================================

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
  const { colors: themeColors, modeColors } = useThemeColor();

  // Store data (real-time via useRealTimeSync nel Layout)
  const { stanze, loading: stanzeLoading } = useStanzeStore();
  const { dispositivi, loading: dispositiviLoading } = useDispositiviStore();

  // Trigger globale per forzare re-render su eventi WebSocket
  useUpdateTrigger((state) => state.trigger);

  // Permessi utente - filtra stanze in base a stanze_abilitate
  const { permessi, loading: permessiLoading } = usePermessiImpianto(impiantoCorrente?.id || null);

  // Colori dinamici basati sul tema (usa modeColors per dark/light)
  const colors = useMemo(() => ({
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  }), [themeColors, modeColors]);

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
  const [newStanza, setNewStanza] = useState({ nome: '', icona: DEFAULT_ROOM_ICON });
  const [newDeviceName, setNewDeviceName] = useState('');
  const [editStanza, setEditStanza] = useState({ nome: '', icona: '' });
  const [showDeleteDeviceConfirm, setShowDeleteDeviceConfirm] = useState(false);
  const [dispositivoIdToDelete, setDispositivoIdToDelete] = useState<number | null>(null);
  const [showDeleteStanzaConfirm, setShowDeleteStanzaConfirm] = useState(false);
  const [stanzaIdToDelete, setStanzaIdToDelete] = useState<number | null>(null);

  const impiantoId = impiantoCorrente?.id || 0;
  // IMPORTANTE: include permessiLoading per evitare race condition (mostrare tutte le stanze prima che i permessi siano caricati)
  const loading = stanzeLoading || dispositiviLoading || permessiLoading;

  const handleCreateStanza = async () => {
    if (!newStanza.nome) {
      toast.error('Inserisci il nome della stanza');
      return;
    }
    // Validazione nome duplicato
    const nomeNormalizzato = newStanza.nome.trim().toLowerCase();
    const esisteGia = stanze.some((s: any) => s.nome.toLowerCase() === nomeNormalizzato);
    if (esisteGia) {
      toast.error('Esiste già una stanza con questo nome');
      return;
    }
    try {
      setActionLoading(true);
      await stanzeApi.createStanza(impiantoId, newStanza);
      toast.success('Stanza creata!');
      setModalOpen(false);
      setNewStanza({ nome: '', icona: DEFAULT_ROOM_ICON });
      // WebSocket aggiornerà automaticamente lo store
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Errore durante la creazione');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStanza = () => {
    if (!selectedStanza?.id) return;
    // Cattura l'ID PRIMA di aprire il popup per evitare race condition
    setStanzaIdToDelete(selectedStanza.id);
    setShowDeleteStanzaConfirm(true);
  };

  const confirmDeleteStanza = async () => {
    if (!stanzaIdToDelete) return;
    try {
      await stanzeApi.deleteStanza(stanzaIdToDelete);
      toast.success('Stanza eliminata!');
      setSettingsModalOpen(false);
      setSelectedStanza(null);
      setStanzaIdToDelete(null);
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
    // Validazione nome duplicato (escludendo la stanza corrente)
    const nomeNormalizzato = editStanza.nome.trim().toLowerCase();
    const esisteGia = stanze.some((s: any) => s.id !== selectedStanza.id && s.nome.toLowerCase() === nomeNormalizzato);
    if (esisteGia) {
      toast.error('Esiste già una stanza con questo nome');
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
    setEditStanza({ nome: selectedStanza?.nome || '', icona: selectedStanza?.icona || DEFAULT_ROOM_ICON });
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

  const handleDeleteDispositivo = () => {
    if (!selectedDispositivo?.id) return;
    // Cattura l'ID PRIMA di aprire il popup per evitare race condition
    setDispositivoIdToDelete(selectedDispositivo.id);
    setShowDeleteDeviceConfirm(true);
  };

  const confirmDeleteDispositivo = async () => {
    if (!dispositivoIdToDelete) return;
    try {
      await tasmotaApi.deleteDispositivo(dispositivoIdToDelete);
      toast.success('Dispositivo eliminato!');
      setDeviceActionModalOpen(false);
      setSelectedDispositivo(null);
      setDispositivoIdToDelete(null);
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

  // Filtra stanze: solo quelle a cui l'utente ha accesso
  // stanze_abilitate = null significa accesso a TUTTE le stanze
  // stanze_abilitate = [1,2,3] significa accesso solo a quelle specifiche
  const stanzeValide = stanze.filter(s => {
    if (!s) return false;
    // Se stanze_abilitate è null, l'utente ha accesso a tutte le stanze
    if (permessi.stanze_abilitate === null) return true;
    // Altrimenti, mostra solo le stanze a cui ha accesso
    return permessi.stanze_abilitate.includes(s.id);
  });
  const dispositiviValidi = dispositivi.filter(d => d !== null && d !== undefined);
  const getDispositiviByStanza = (stanzaId: number) => dispositiviValidi.filter(d => d.stanza_id === stanzaId);
  const dispositiviNonAssegnati = dispositiviValidi.filter(d => !d.stanza_id);

  const getCurrentDeviceList = () => {
    if (isNonAssegnatiMode) return dispositiviNonAssegnati;
    return selectedStanza ? getDispositiviByStanza(selectedStanza.id) : [];
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', viewTransitionName: 'page-content' as any }}>
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
              width: '44px',
              height: '44px',
              padding: 0,
              borderRadius: '16px',
              background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.accentDark})`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !impiantoId ? 'not-allowed' : 'pointer',
              opacity: !impiantoId ? 0.5 : 1,
              boxShadow: `0 4px 20px ${themeColors.accent}50`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 6px 24px ${themeColors.accent}60` }}
            whileTap={{ scale: 0.95 }}
          >
            <RiAddLine size={20} style={{ color: modeColors.bg, display: 'block' }} />
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
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: '24px',
              boxShadow: colors.cardShadow,
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
              <div
                style={{
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  boxShadow: colors.cardShadow,
                  padding: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
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
                      style={{ padding: '8px', background: `${colors.accent}15`, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer' }}
                      whileHover={{ background: `${colors.accent}25`, borderColor: colors.accent }}
                    >
                      <RiSettings4Line size={18} style={{ color: colors.accent }} />
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
              </div>
            )}

            {/* Lista Stanze */}
            {stanzeValide.length === 0 ? (
              <div
                style={{
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '24px',
                  boxShadow: colors.cardShadow,
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
                  <div
                    key={stanza.id}
                    style={{
                      background: colors.bgCard,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '20px',
                      boxShadow: colors.cardShadow,
                      padding: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
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
                        {(() => { const Icon = getRoomIcon(stanza.icona); return <Icon size={18} style={{ color: colors.accent }} />; })()}
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{stanza.nome}</h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: colors.textMuted }}>{dispositiviStanza.length}</span>
                        <motion.button
                          onClick={() => openSettings(stanza)}
                          style={{ padding: '8px', background: `${colors.accent}15`, border: `1px solid ${colors.border}`, borderRadius: '10px', cursor: 'pointer' }}
                          whileHover={{ background: `${colors.accent}25`, borderColor: colors.accent }}
                        >
                          <RiSettings4Line size={18} style={{ color: colors.accent }} />
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
                  </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
              {ROOM_ICON_OPTIONS.map((opt) => {
                const Icon = getRoomIcon(opt.id);
                // Lista nomi predefiniti per auto-aggiornamento
                const predefinedNames = ROOM_ICON_OPTIONS.map(o => o.label);
                const shouldUpdateName = !newStanza.nome || predefinedNames.includes(newStanza.nome);
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => setNewStanza({ nome: shouldUpdateName ? opt.label : newStanza.nome, icona: opt.id })}
                    style={{
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '12px',
                      border: newStanza.icona === opt.id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                      background: newStanza.icona === opt.id ? `${colors.accent}20` : 'transparent',
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={22} style={{ color: newStanza.icona === opt.id ? colors.accent : colors.textMuted }} />
                    <span style={{ fontSize: '10px', color: newStanza.icona === opt.id ? colors.accent : colors.textMuted }}>{opt.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleCreateStanza} fullWidth disabled={actionLoading}>{actionLoading ? 'Creazione...' : 'Crea'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Impostazioni Stanza */}
      <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title={selectedStanza?.nome || 'Stanza'} size="sm">
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
      <Modal isOpen={deviceListModalOpen} onClose={() => { setDeviceListModalOpen(false); setIsNonAssegnatiMode(false); }} title={isNonAssegnatiMode ? 'Non assegnati' : (selectedStanza?.nome || '')} size="sm">
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
            {stanzeValide.map((stanza) => {
              const StanzaIcon = getRoomIcon(stanza.icona);
              return (
                <motion.button
                  key={stanza.id}
                  onClick={() => handleMoveDispositivo(stanza.id)}
                  disabled={selectedDispositivo?.stanza_id === stanza.id}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: selectedDispositivo?.stanza_id === stanza.id ? `${colors.accent}20` : 'rgba(255,255,255,0.05)', border: selectedDispositivo?.stanza_id === stanza.id ? `1px solid ${colors.accent}` : 'none', cursor: selectedDispositivo?.stanza_id === stanza.id ? 'default' : 'pointer' }}
                  whileHover={selectedDispositivo?.stanza_id !== stanza.id ? { background: 'rgba(255,255,255,0.1)' } : undefined}
                >
                  <StanzaIcon size={18} style={{ color: selectedDispositivo?.stanza_id === stanza.id ? colors.accent : colors.textMuted }} />
                  <span style={{ fontSize: '14px', color: colors.textPrimary, flex: 1, textAlign: 'left' }}>{stanza.nome}</span>
                  {selectedDispositivo?.stanza_id === stanza.id && <span style={{ fontSize: '12px', color: colors.accent }}>Attuale</span>}
                </motion.button>
              );
            })}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {ROOM_ICON_OPTIONS.map((opt) => {
                const Icon = getRoomIcon(opt.id);
                // Lista nomi predefiniti per auto-aggiornamento
                const predefinedNames = ROOM_ICON_OPTIONS.map(o => o.label);
                const shouldUpdateName = !editStanza.nome || predefinedNames.includes(editStanza.nome);
                return (
                  <motion.button
                    key={opt.id}
                    onClick={() => setEditStanza({ nome: shouldUpdateName ? opt.label : editStanza.nome, icona: opt.id })}
                    style={{
                      padding: '12px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '12px',
                      border: editStanza.icona === opt.id ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                      background: editStanza.icona === opt.id ? `${colors.accent}20` : 'transparent',
                      cursor: 'pointer',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={22} style={{ color: editStanza.icona === opt.id ? colors.accent : colors.textMuted }} />
                    <span style={{ fontSize: '10px', color: editStanza.icona === opt.id ? colors.accent : colors.textMuted }}>{opt.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setRenameStanzaModalOpen(false)} fullWidth>Annulla</Button>
            <Button variant="primary" onClick={handleRenameStanza} fullWidth disabled={!editStanza.nome.trim()}>Salva</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dispositivo */}
      <ConfirmPopup
        isOpen={showDeleteDeviceConfirm}
        onClose={() => { setShowDeleteDeviceConfirm(false); setDispositivoIdToDelete(null); }}
        onConfirm={confirmDeleteDispositivo}
        title="Elimina Dispositivo"
        message={`Sei sicuro di voler eliminare "${selectedDispositivo?.nome}"? L'azione non può essere annullata.`}
        confirmText="Elimina"
        confirmVariant="danger"
        icon={<Trash2 size={20} />}
      />

      {/* Confirm Delete Stanza */}
      <ConfirmPopup
        isOpen={showDeleteStanzaConfirm}
        onClose={() => { setShowDeleteStanzaConfirm(false); setStanzaIdToDelete(null); }}
        onConfirm={confirmDeleteStanza}
        title="Elimina Stanza"
        message={`Sei sicuro di voler eliminare "${selectedStanza?.nome}"? L'azione non può essere annullata.`}
        confirmText="Elimina"
        confirmVariant="danger"
        icon={<RiDeleteBinLine size={20} />}
      />
    </Layout>
  );
};
