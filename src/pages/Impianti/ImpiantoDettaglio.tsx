import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useImpiantiStore } from '@/store/impiantiStore';
import { useAuthStore } from '@/store/authStore';
import { impiantiApi } from '@/services/api';
import { UserRole, TipoDispositivo } from '@/types';
import { LuceCard } from '@/components/dispositivi/LuceCard';
import { TapparellaCard } from '@/components/dispositivi/TapparellaCard';
import { TermostatoCard } from '@/components/dispositivi/TermostatoCard';
import {
  ArrowLeft,
  Building2,
  Home,
  Plus,
  Settings,
  Lightbulb,
  Blinds,
  Thermometer,
  Trash2
} from 'lucide-react';

// ============================================
// IMPIANTO DETTAGLIO PAGE
// ============================================

export const ImpiantoDettaglio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { impiantoCorrente, fetchImpianto } = useImpiantiStore();
  const [pianoSelezionato, setPianoSelezionato] = useState<number | null>(null);
  const [stanzaSelezionata, setStanzaSelezionata] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canEdit = user?.ruolo === UserRole.INSTALLATORE || user?.ruolo === UserRole.ADMIN;

  const handleDelete = async () => {
    try {
      await impiantiApi.delete(impiantoCorrente!.id);
      navigate('/impianti');
    } catch (error) {
      console.error('Errore durante eliminazione impianto:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchImpianto(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    if (impiantoCorrente?.piani && impiantoCorrente.piani.length > 0) {
      setPianoSelezionato(impiantoCorrente.piani[0].id);
      if (impiantoCorrente.piani[0].stanze && impiantoCorrente.piani[0].stanze.length > 0) {
        setStanzaSelezionata(impiantoCorrente.piani[0].stanze[0].id);
      }
    }
  }, [impiantoCorrente]);

  if (!impiantoCorrente) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-copy-lighter">Caricamento...</p>
        </div>
      </Layout>
    );
  }

  const piano = impiantoCorrente.piani?.find(p => p.id === pianoSelezionato);
  const stanza = piano?.stanze?.find(s => s.id === stanzaSelezionata);
  const dispositivi = stanza?.dispositivi || [];

  const renderDispositivo = (dispositivo: any) => {
    switch (dispositivo.tipo) {
      case TipoDispositivo.LUCE:
        return <LuceCard key={dispositivo.id} dispositivo={dispositivo} />;
      case TipoDispositivo.TAPPARELLA:
        return <TapparellaCard key={dispositivo.id} dispositivo={dispositivo} />;
      case TipoDispositivo.TERMOSTATO:
        return <TermostatoCard key={dispositivo.id} dispositivo={dispositivo} />;
    }
  };

  const countDispositivi = (tipo: TipoDispositivo) => {
    return dispositivi.filter(d => d.tipo === tipo).length;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/impianti')}
              className="p-3 glass rounded-xl hover:bg-opacity-20 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 size={32} className="text-primary" />
                <h1 className="text-4xl font-bold text-copy">{impiantoCorrente.nome}</h1>
              </div>
              <p className="text-copy-lighter">
                {impiantoCorrente.indirizzo}, {impiantoCorrente.citta}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="hidden md:flex gap-3">
              <Button variant="glass" onClick={() => navigate(`/impianti/${id}/settings`)}>
                <Settings size={20} className="mr-2" />
                Gestisci
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 size={20} className="mr-2" />
                Elimina
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-warning bg-opacity-20">
                <Lightbulb size={24} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-copy">{countDispositivi(TipoDispositivo.LUCE)}</p>
                <p className="text-sm text-copy-lighter">Luci</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary bg-opacity-20">
                <Blinds size={24} className="text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-copy">{countDispositivi(TipoDispositivo.TAPPARELLA)}</p>
                <p className="text-sm text-copy-lighter">Tapparelle</p>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success bg-opacity-20">
                <Thermometer size={24} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-copy">{countDispositivi(TipoDispositivo.TERMOSTATO)}</p>
                <p className="text-sm text-copy-lighter">Termostati</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Piani/Stanze */}
          <Card variant="glass-solid" padding={false}>
            <div className="p-4">
              <h3 className="font-bold text-copy mb-4">Piani e Stanze</h3>

              {impiantoCorrente.piani?.filter(p => p !== null && p !== undefined).map((p) => (
                <div key={p.id} className="mb-4">
                  <button
                    onClick={() => setPianoSelezionato(p.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors
                      ${pianoSelezionato === p.id ? 'bg-primary text-white' : 'hover:bg-foreground'}
                    `}
                  >
                    {p.nome}
                  </button>

                  {pianoSelezionato === p.id && p.stanze && (
                    <div className="ml-4 space-y-1">
                      {p.stanze.filter(s => s !== null && s !== undefined).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStanzaSelezionata(s.id)}
                          className={`
                            w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                            ${stanzaSelezionata === s.id
                              ? 'bg-primary-light text-white'
                              : 'text-copy-light hover:bg-foreground'
                            }
                          `}
                        >
                          <Home size={16} />
                          {s.nome}
                        </button>
                      ))}

                      {canEdit && (
                        <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-copy-lighter hover:bg-foreground flex items-center gap-2">
                          <Plus size={16} />
                          Nuova Stanza
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {canEdit && (
                <button className="w-full px-3 py-2 rounded-lg glass hover:bg-opacity-20 flex items-center gap-2">
                  <Plus size={16} />
                  Nuovo Piano
                </button>
              )}
            </div>
          </Card>

          {/* Dispositivi Stanza */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-copy">
                {stanza ? stanza.nome : 'Seleziona una stanza'}
              </h2>

              {canEdit && stanza && (
                <Button variant="primary" size="sm">
                  <Plus size={16} className="mr-2" />
                  Aggiungi Dispositivo
                </Button>
              )}
            </div>

            {dispositivi.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dispositivi.filter(d => d !== null && d !== undefined).map(renderDispositivo)}
              </div>
            ) : (
              <Card variant="glass-solid" className="text-center py-16">
                <Lightbulb size={64} className="mx-auto mb-4 text-copy-lighter" />
                <h3 className="text-xl font-semibold text-copy mb-2">Nessun dispositivo</h3>
                <p className="text-copy-lighter mb-6">
                  {canEdit
                    ? 'Aggiungi il primo dispositivo a questa stanza'
                    : 'Non ci sono dispositivi in questa stanza'}
                </p>
                {canEdit && (
                  <Button variant="primary">
                    <Plus size={20} className="mr-2" />
                    Aggiungi Dispositivo
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal Conferma Eliminazione */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Elimina Impianto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="dark:text-copy light:text-copy-light">
            Sei sicuro di voler eliminare <strong>"{impiantoCorrente?.nome}"</strong>?
          </p>
          <p className="text-error font-semibold">
            ⚠️ Questa azione è irreversibile e eliminerà tutti i dati associati all'impianto (piani, stanze, dispositivi)!
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="glass" onClick={() => setShowDeleteModal(false)}>
              Annulla
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Conferma Eliminazione
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
