import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { SkeletonList } from '@/components/common/Skeleton';
import { DeviceToggleNeon } from '@/components/dispositivi/DeviceToggleNeon';
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold dark:text-copy light:text-copy-light">
              Dispositivi Tasmota
            </h1>
            <p className="text-sm sm:text-base dark:text-copy-lighter light:text-copy-lighter">
              Gestisci i tuoi dispositivi smart
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="glass"
              onClick={handleScanRete}
              disabled={scanning || !impiantoId}
              className="flex-1 sm:flex-none"
            >
              {scanning ? (
                <>
                  <Loader size={18} className="mr-2 animate-spin" />
                  Scansione...
                </>
              ) : (
                <>
                  <Search size={18} className="mr-2" />
                  Scan Rete
                </>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={() => setModalOpen(true)}
              disabled={!impiantoId}
              className="flex-1 sm:flex-none"
            >
              <Plus size={18} className="mr-2" />
              Aggiungi
            </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {dispositivi.filter(d => d !== null && d !== undefined).map((dispositivo) => (
              <Card key={dispositivo.id} variant="glass" hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      dispositivo.stato === 'online' ? 'bg-success' : 'bg-error'
                    } bg-opacity-20`}>
                      <Lightbulb size={24} className={
                        dispositivo.stato === 'online' ? 'text-success' : 'text-error'
                      } />
                    </div>
                    <div>
                      <h3 className="font-bold dark:text-copy light:text-copy-light">
                        {dispositivo.nome}
                      </h3>
                      <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                        {dispositivo.ip_address}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => handleDeleteDispositivo(dispositivo.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="mt-4">
                  {/* Usa il nuovo toggle neon con colori del tema */}
                  <DeviceToggleNeon
                    isOn={dispositivo.power_state || false}
                    disabled={dispositivo.bloccato}
                    onChange={(isOn) => {
                      handleControlDispositivo(dispositivo.id, isOn ? 'ON' : 'OFF');
                    }}
                  />
                </div>

                {isAdmin && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                      <p>Tipo: {dispositivo.tipo}</p>
                      <p>Topic: {dispositivo.topic_mqtt}</p>
                    </div>

                    <div className="flex items-center justify-between p-2 glass rounded-lg">
                      <span className="text-xs font-medium dark:text-copy light:text-copy-light">
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
                        className={`w-10 h-5 rounded-full transition-colors ${
                          dispositivo.bloccato ? 'bg-warning' : 'bg-success'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            dispositivo.bloccato ? 'translate-x-1' : 'translate-x-5'
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
