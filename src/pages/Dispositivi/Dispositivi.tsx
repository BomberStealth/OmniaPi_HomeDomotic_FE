import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SkeletonList } from '@/components/common/Skeleton';
import { DeviceToggleNeonUnified } from '@/components/dispositivi/DeviceToggleNeonUnified';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { tasmotaApi } from '@/services/api';
import { Lightbulb, Plus, Trash2, Loader, Search } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/types';

// ============================================
// DISPOSITIVI TASMOTA PAGE
// ============================================

export const Dispositivi = () => {
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const [dispositivi, setDispositivi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [dispositiviScansionati, setDispositiviScansionati] = useState<any[]>([]);
  const [newDevice, setNewDevice] = useState({ ip_address: '', nome: '', tipo: 'generico' });

  const impiantoId = impiantoCorrente?.id || 0;
  const isAdmin = user?.ruolo === UserRole.ADMIN;

  // Ricarica dati quando cambia impianto
  useEffect(() => {
    if (impiantoId) {
      loadDispositivi();
    }
  }, [impiantoId]);

  const loadDispositivi = async () => {
    if (!impiantoId) return;

    try {
      setLoading(true);
      const data = await tasmotaApi.getDispositivi(impiantoId);
      // Fix: assicurati che sia un array
      setDispositivi(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Errore caricamento dispositivi:', error);
      setDispositivi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScanRete = async () => {
    if (!impiantoId) return;

    try {
      setScanning(true);
      const result = await tasmotaApi.scanRete(impiantoId);

      if (result.success && result.dispositivi) {
        setDispositiviScansionati(result.dispositivi);
        setScanModalOpen(true);
        toast.success(`Trovati ${result.dispositivi.length} dispositivi Tasmota`);
      } else {
        toast.warning('Nessun dispositivo trovato');
      }
    } catch (error: any) {
      console.error('Errore scan rete:', error);
      toast.error(error.response?.data?.error || 'Errore durante la scansione della rete');
    } finally {
      setScanning(false);
    }
  };

  const handleAggiungiDaScan = async (device: any) => {
    try {
      await tasmotaApi.addDispositivo(impiantoId, {
        ip_address: device.ip_address,
        nome: device.nome,
        tipo: 'luce' // Default, può essere personalizzato
      });
      await loadDispositivi();

      // Rimuovi dalla lista scansionati
      setDispositiviScansionati(prev => prev.filter(d => d.ip_address !== device.ip_address));

      toast.success(`Dispositivo ${device.nome} aggiunto con successo!`);
    } catch (error: any) {
      console.error('Errore aggiunta dispositivo:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiunta del dispositivo');
    }
  };

  const handleAddDispositivo = async () => {
    if (!newDevice.ip_address || !newDevice.nome) {
      toast.error('IP e nome sono richiesti');
      return;
    }

    try {
      setLoading(true);
      await tasmotaApi.addDispositivo(impiantoId, newDevice);
      setModalOpen(false);
      setNewDevice({ ip_address: '', nome: '', tipo: 'generico' });
      await loadDispositivi();
      toast.success('Dispositivo aggiunto con successo!');
    } catch (error: any) {
      console.error('Errore add dispositivo:', error);
      toast.error(error.response?.data?.error || 'Errore durante l\'aggiunta del dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const handleControlDispositivo = async (id: number, comando: string) => {
    try {
      // Optimistic update - aggiorna lo stato immediatamente
      const newPowerState = comando === 'ON';
      setDispositivi(prev => prev.map(d =>
        d.id === id ? { ...d, power_state: newPowerState } : d
      ));

      await tasmotaApi.controlDispositivo(id, comando);
      toast.success(`Comando ${comando} inviato!`);
    } catch (error: any) {
      console.error('Errore controllo dispositivo:', error);
      const errorMessage = error.response?.data?.error || 'Errore durante il controllo del dispositivo';
      toast.error(errorMessage);

      // Rollback in caso di errore
      await loadDispositivi();
    }
  };

  const handleDeleteDispositivo = async (id: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questo dispositivo?')) return;

    try {
      await tasmotaApi.deleteDispositivo(id);
      await loadDispositivi();
    } catch (error) {
      console.error('Errore delete dispositivo:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header Compatto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold dark:text-copy light:text-copy-light">
              Dispositivi
            </h1>
            <p className="text-xs sm:text-sm dark:text-copy-lighter light:text-copy-lighter">
              {dispositivi.length} dispositivi
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleScanRete}
              disabled={scanning || !impiantoId}
              className="p-2 rounded-xl glass hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors disabled:opacity-50"
              title="Scan Rete"
            >
              {scanning ? (
                <Loader size={20} className="animate-spin dark:text-copy light:text-copy-light" />
              ) : (
                <Search size={20} className="dark:text-copy light:text-copy-light" />
              )}
            </button>

            <button
              onClick={() => setModalOpen(true)}
              disabled={!impiantoId}
              className="p-2 rounded-xl bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
              title="Aggiungi Dispositivo"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Dispositivi Grid */}
        {loading ? (
          <SkeletonList count={6} />
        ) : dispositivi.length === 0 ? (
          <Card variant="glass-dark">
            <div className="text-center py-12">
              <Lightbulb size={48} className="mx-auto mb-4 dark:text-copy-lighter light:text-copy-lighter" />
              <h3 className="text-xl font-semibold dark:text-copy light:text-copy-light mb-2">
                Nessun dispositivo
              </h3>
              <p className="dark:text-copy-lighter light:text-copy-lighter mb-6">
                Aggiungi dispositivi Tasmota alla tua rete
              </p>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                <Plus size={18} className="mr-2" />
                Aggiungi Dispositivo
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {dispositivi.filter(d => d !== null && d !== undefined).map((dispositivo) => (
              <Card key={dispositivo.id} variant="glass" hover className="!p-2.5 sm:!p-3 overflow-hidden">
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className={`p-1 sm:p-1.5 rounded-lg flex-shrink-0 ${
                      dispositivo.stato === 'online' ? 'bg-success' : 'bg-error'
                    } bg-opacity-20`}>
                      <Lightbulb size={14} className={
                        dispositivo.stato === 'online' ? 'text-success' : 'text-error'
                      } />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm dark:text-copy light:text-copy-light leading-tight truncate">
                        {dispositivo.nome}
                      </h3>
                      <p className="text-[9px] sm:text-[10px] dark:text-copy-lighter light:text-copy-lighter truncate">
                        {dispositivo.ip_address}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => handleDeleteDispositivo(dispositivo.id)}
                    className="!p-1 flex-shrink-0"
                  >
                    <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </Button>
                </div>

                <div className="mt-2" style={{ fontSize: '12px' }}>
                  {/* Usa il nuovo toggle neon con colori del tema */}
                  <DeviceToggleNeonUnified
                    isOn={dispositivo.power_state || false}
                    disabled={dispositivo.bloccato}
                    onChange={(isOn) => {
                      handleControlDispositivo(dispositivo.id, isOn ? 'ON' : 'OFF');
                    }}
                  />
                </div>

                {isAdmin && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[9px] sm:text-[10px] dark:text-copy-lighter light:text-copy-lighter leading-tight">
                      <p className="truncate">Tipo: {dispositivo.tipo}</p>
                      <p className="truncate" title={dispositivo.topic_mqtt}>Topic: {dispositivo.topic_mqtt}</p>
                    </div>

                    <div className="flex items-center justify-between p-1 sm:p-1.5 glass rounded-lg gap-1">
                      <span className="text-[9px] sm:text-[10px] font-medium dark:text-copy light:text-copy-light truncate">
                        {dispositivo.bloccato ? '🔒 Bloccato' : '🔓 Sbloccato'}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            await tasmotaApi.toggleBlocco(dispositivo.id, !dispositivo.bloccato);
                            await loadDispositivi();
                            toast.success(dispositivo.bloccato ? 'Dispositivo sbloccato' : 'Dispositivo bloccato');
                          } catch (error: any) {
                            toast.error(error.response?.data?.error || 'Errore durante il blocco/sblocco');
                          }
                        }}
                        className={`w-7 sm:w-8 h-3.5 sm:h-4 rounded-full transition-colors flex-shrink-0 ${
                          dispositivo.bloccato ? 'bg-warning' : 'bg-success'
                        }`}
                      >
                        <div
                          className={`w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full shadow transform transition-transform ${
                            dispositivo.bloccato ? 'translate-x-0.5' : 'translate-x-[10px] sm:translate-x-[11px]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Aggiungi Dispositivo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Aggiungi Dispositivo Tasmota"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Indirizzo IP"
            value={newDevice.ip_address}
            onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
            placeholder="es. 192.168.1.100"
          />

          <Input
            label="Nome Dispositivo"
            value={newDevice.nome}
            onChange={(e) => setNewDevice({ ...newDevice, nome: e.target.value })}
            placeholder="es. Luce Soggiorno"
          />

          <div>
            <label className="block text-sm font-medium dark:text-copy light:text-copy-light mb-2">
              Tipo Dispositivo
            </label>
            <select
              value={newDevice.tipo}
              onChange={(e) => setNewDevice({ ...newDevice, tipo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg dark:bg-foreground light:bg-white border dark:border-border light:border-border-light dark:text-copy light:text-copy-light"
            >
              <option value="generico">Generico</option>
              <option value="luce">Luce</option>
              <option value="tapparella">Tapparella</option>
              <option value="termostato">Termostato</option>
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setModalOpen(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="primary" onClick={handleAddDispositivo} fullWidth disabled={loading}>
              {loading ? 'Aggiunta...' : 'Aggiungi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Risultati Scan */}
      <Modal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        title="Dispositivi Tasmota Trovati"
        size="lg"
      >
        <div className="space-y-3">
          {dispositiviScansionati.length === 0 ? (
            <p className="text-center dark:text-copy-lighter light:text-copy-lighter py-8">
              Nessun dispositivo trovato
            </p>
          ) : (
            <>
              <p className="text-sm dark:text-copy-lighter light:text-copy-lighter mb-4">
                Trovati {dispositiviScansionati.length} dispositivi Tasmota
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dispositiviScansionati.filter(d => d !== null && d !== undefined).map((device) => (
                  <Card key={device.ip_address} variant="glass" className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold dark:text-copy light:text-copy-light">
                          {device.nome}
                        </h4>
                        <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mt-1">
                          IP: {device.ip_address}
                        </p>
                        <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                          MAC: {device.mac}
                        </p>
                        <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                          Firmware: {device.firmware}
                        </p>
                        {device.tasmota_model && (
                          <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                            Modello: {device.tasmota_model}
                          </p>
                        )}
                      </div>

                      {device.gia_aggiunto ? (
                        <span className="px-3 py-1 bg-success bg-opacity-20 text-success rounded text-xs">
                          Già aggiunto
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAggiungiDaScan(device)}
                        >
                          <Plus size={14} className="mr-1" />
                          Aggiungi
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="glass" onClick={() => setScanModalOpen(false)}>
                  Chiudi
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
