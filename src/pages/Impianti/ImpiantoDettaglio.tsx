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
  RiArrowLeftLine,
  RiArrowDownSLine,
  RiHome4Line,
  RiAddLine,
  RiSettings4Line,
  RiLightbulbLine,
  RiDeleteBinLine
} from 'react-icons/ri';

// ============================================
// IMPIANTO DETTAGLIO - Redesign Mobile-First
// ============================================

export const ImpiantoDettaglio = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { impiantoCorrente, fetchImpianto } = useImpiantiStore();
  const [pianoSelezionato, setPianoSelezionato] = useState<number | null>(null);
  const [stanzaSelezionata, setStanzaSelezionata] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPianoDropdown, setShowPianoDropdown] = useState(false);

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
        <div className="flex items-center justify-center h-64" style={{ viewTransitionName: 'page-content' } as React.CSSProperties}>
          <p className="dark:text-copy-lighter light:text-copy-lighter">Caricamento...</p>
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

  return (
    <Layout>
      <div className="space-y-3 sm:space-y-4" style={{ viewTransitionName: 'page-content' } as React.CSSProperties}>
        {/* Header Compatto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => navigate('/impianti')}
              className="p-2 glass rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <RiArrowLeftLine size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold dark:text-copy light:text-copy-light truncate">
                {impiantoCorrente.nome}
              </h1>
              <p className="text-[10px] sm:text-xs dark:text-copy-lighter light:text-copy-lighter truncate">
                {impiantoCorrente.indirizzo}, {impiantoCorrente.citta}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => navigate(`/impianti/${id}/settings`)}
                className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
                title="Impostazioni"
              >
                <RiSettings4Line size={18} className="dark:text-copy light:text-copy-light" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 rounded-lg hover:bg-error/20 transition-colors"
                title="Elimina"
              >
                <RiDeleteBinLine size={18} className="text-error" />
              </button>
            </div>
          )}
        </div>

        {/* Piano Dropdown */}
        {impiantoCorrente.piani && impiantoCorrente.piani.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowPianoDropdown(!showPianoDropdown)}
              className="w-full flex items-center justify-between p-3 glass rounded-xl"
            >
              <span className="font-medium dark:text-copy light:text-copy-light">
                {piano?.nome || 'Seleziona piano'}
              </span>
              <RiArrowDownSLine size={18} className={`transition-transform ${showPianoDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPianoDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl overflow-hidden z-20">
                {impiantoCorrente.piani.filter(p => p !== null).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPianoSelezionato(p.id);
                      setShowPianoDropdown(false);
                      // Seleziona prima stanza del piano
                      if (p.stanze && p.stanze.length > 0) {
                        setStanzaSelezionata(p.stanze[0].id);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      pianoSelezionato === p.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-white/10 dark:text-copy light:text-copy-light'
                    }`}
                  >
                    {p.nome}
                  </button>
                ))}
                {canEdit && (
                  <button className="w-full text-left px-4 py-3 border-t dark:border-border light:border-border-light dark:text-copy-lighter light:text-copy-lighter hover:bg-white/10 flex items-center gap-2">
                    <RiAddLine size={14} />
                    Nuovo Piano
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stanze Chip Scrollabili */}
        {piano?.stanze && piano.stanze.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {piano.stanze.filter(s => s !== null).map((s) => (
              <button
                key={s.id}
                onClick={() => setStanzaSelezionata(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm transition-colors flex-shrink-0 ${
                  stanzaSelezionata === s.id
                    ? 'bg-primary text-white'
                    : 'glass dark:text-copy light:text-copy-light'
                }`}
              >
                <RiHome4Line size={14} />
                {s.nome}
              </button>
            ))}
            {canEdit && (
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-sm glass dark:text-copy-lighter light:text-copy-lighter flex-shrink-0">
                <RiAddLine size={14} />
                Nuova
              </button>
            )}
          </div>
        )}

        {/* Dispositivi Grid */}
        {dispositivi.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {dispositivi.filter(d => d !== null && d !== undefined).map(renderDispositivo)}
          </div>
        ) : (
          <Card variant="glass" className="text-center py-8">
            <RiLightbulbLine size={32} className="mx-auto mb-2 dark:text-copy-lighter light:text-copy-lighter" />
            <h3 className="text-sm font-semibold dark:text-copy light:text-copy-light mb-1">
              Nessun dispositivo
            </h3>
            <p className="text-xs dark:text-copy-lighter light:text-copy-lighter mb-3">
              {stanza ? `Aggiungi dispositivi a ${stanza.nome}` : 'Seleziona una stanza'}
            </p>
            {canEdit && stanza && (
              <button className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">
                <RiAddLine size={14} className="inline mr-1" />
                Aggiungi
              </button>
            )}
          </Card>
        )}
      </div>

      {/* Modal Conferma Eliminazione */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Elimina Impianto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="dark:text-copy light:text-copy-light text-sm">
            Sei sicuro di voler eliminare <strong>"{impiantoCorrente?.nome}"</strong>?
          </p>
          <p className="text-error text-xs">
            Questa azione eliminerà tutti i dati associati.
          </p>
          <div className="flex gap-2">
            <Button variant="glass" onClick={() => setShowDeleteModal(false)} fullWidth>
              Annulla
            </Button>
            <Button variant="danger" onClick={handleDelete} fullWidth>
              Elimina
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
