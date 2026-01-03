import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { omniapiApi, OmniapiNode } from '@/services/omniapiApi';
import {
  RiDeviceLine,
  RiLoader4Line,
  RiRefreshLine,
  RiAddLine,
  RiCheckLine,
  RiSignalWifiLine,
} from 'react-icons/ri';

// ============================================
// STEP 4: AGGIUNGI DISPOSITIVI (solo salvataggio locale)
// La registrazione nel DB avviene a Step 5
// ============================================

interface StepDispositiviProps {
  dispositivi: Array<{
    mac: string;
    nome: string;
    stanza_nome?: string;
  }>;
  onAddDispositivo: (dispositivo: {
    mac: string;
    nome: string;
    stanza_nome?: string;
  }) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const StepDispositivi = ({
  dispositivi,
  onAddDispositivo,
  onNext,
  onSkip,
  onBack,
}: StepDispositiviProps) => {
  const [loading, setLoading] = useState(true);
  const [availableNodes, setAvailableNodes] = useState<OmniapiNode[]>([]);
  const [error, setError] = useState('');

  // Form per aggiungere nodo
  const [selectedNode, setSelectedNode] = useState<OmniapiNode | null>(null);
  const [nodeName, setNodeName] = useState('');
  const [stanzaName, setStanzaName] = useState('');

  // Stanze già inserite (per autocompletamento)
  const stanzeGiaInserite = [...new Set(dispositivi.map(d => d.stanza_nome).filter(Boolean))];

  // Carica nodi disponibili
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Triggera discovery per richiedere i nodi al Gateway
      await omniapiApi.discover();

      // Attendi che i nodi rispondano via MQTT (1.5 secondi)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Carica tutti i nodi dal gateway (cache MQTT)
      const nodesRes = await omniapiApi.getNodes();

      // Filtra nodi già aggiunti in questa sessione
      const addedMacs = dispositivi.map((d) => d.mac);
      const available = (nodesRes.nodes || []).filter(
        (n: OmniapiNode) => !addedMacs.includes(n.mac)
      );

      setAvailableNodes(available);
    } catch (err) {
      console.error('Errore caricamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNode = (node: OmniapiNode) => {
    setSelectedNode(node);
    setNodeName(`Interruttore ${node.mac.slice(-5)}`);
    setStanzaName('');
  };

  const handleAddNode = () => {
    if (!selectedNode || !nodeName.trim()) {
      setError('Inserisci un nome per il dispositivo');
      return;
    }

    setError('');

    // Salva solo in locale - la registrazione avverrà a Step 5
    onAddDispositivo({
      mac: selectedNode.mac,
      nome: nodeName.trim(),
      stanza_nome: stanzaName.trim() || undefined,
    });

    // Rimuovi dalla lista disponibili
    setAvailableNodes((prev) =>
      prev.filter((n) => n.mac !== selectedNode.mac)
    );

    // Reset form
    setSelectedNode(null);
    setNodeName('');
    setStanzaName('');
  };

  const handleCancelSelection = () => {
    setSelectedNode(null);
    setNodeName('');
    setStanzaName('');
    setError('');
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <Card variant="glass" className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <RiLoader4Line size={48} className="text-primary animate-spin mb-4" />
          <p className="text-copy-lighter">Ricerca dispositivi in corso...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/20">
            <RiDeviceLine size={28} className="text-warning" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-copy">
              Aggiungi Dispositivi
            </h2>
            <p className="text-copy-lighter text-sm">
              {availableNodes.length > 0
                ? `${availableNodes.length} nod${availableNodes.length === 1 ? 'o' : 'i'} disponibil${availableNodes.length === 1 ? 'e' : 'i'}`
                : 'Nessun nodo rilevato'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RiRefreshLine size={18} />
        </Button>
      </div>

      {/* Lista dispositivi gia aggiunti */}
      {dispositivi.length > 0 && (
        <div className="mb-6">
          <p className="text-copy-lighter text-sm mb-2">Dispositivi aggiunti:</p>
          <div className="space-y-2">
            {dispositivi.map((d) => (
              <div
                key={d.mac}
                className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20"
              >
                <RiCheckLine size={20} className="text-success" />
                <div>
                  <p className="text-copy font-medium">{d.nome}</p>
                  <p className="text-copy-lighter text-xs">
                    {d.stanza_nome || 'Senza stanza'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form aggiunta nodo */}
      {selectedNode ? (
        <Card variant="glass-dark" className="p-4 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <RiDeviceLine size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-copy font-medium">
                Configura: {selectedNode.mac.slice(-8)}
              </p>
              <p className="text-copy-lighter text-xs">
                RSSI: {selectedNode.rssi} dBm
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nome Dispositivo"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="es. Luce Soggiorno"
            />

            {/* Nome stanza */}
            <div>
              <label className="block text-sm text-copy-lighter mb-2">
                Stanza (opzionale)
              </label>
              <input
                type="text"
                list="stanze-list"
                value={stanzaName}
                onChange={(e) => setStanzaName(e.target.value)}
                placeholder="es. Soggiorno"
                className="w-full p-3 rounded-xl bg-foreground border border-border text-copy placeholder:text-copy-lighter"
              />
              <datalist id="stanze-list">
                {stanzeGiaInserite.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
              {stanzeGiaInserite.length > 0 && (
                <p className="text-copy-lighter text-xs mt-1">
                  Suggerimenti: {stanzeGiaInserite.join(', ')}
                </p>
              )}
            </div>

            {error && <p className="text-error text-sm">{error}</p>}

            <div className="flex flex-wrap gap-3">
              <Button variant="glass" onClick={handleCancelSelection} className="flex-shrink-0">
                Annulla
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNode}
                className="flex-1 min-w-[120px] flex-shrink-0"
              >
                <RiAddLine size={18} className="mr-2 flex-shrink-0" />
                <span>Aggiungi</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        /* Lista nodi disponibili */
        <div className="space-y-3 mb-4">
          {availableNodes.length === 0 ? (
            <div className="text-center py-8">
              <RiSignalWifiLine size={48} className="text-copy-lighter mx-auto mb-4" />
              <p className="text-copy-lighter">
                Nessun nuovo dispositivo rilevato
              </p>
              <p className="text-copy-lighter text-sm">
                Accendi i nodi OmniaPi e attendi qualche secondo
              </p>
            </div>
          ) : (
            availableNodes.map((node) => (
              <Card
                key={node.mac}
                variant="glass"
                hover
                className="p-4 cursor-pointer"
                onClick={() => handleSelectNode(node)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        node.online ? 'bg-success/20' : 'bg-copy-lighter/20'
                      }`}
                    >
                      <RiDeviceLine
                        size={20}
                        className={node.online ? 'text-success' : 'text-copy-lighter'}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-copy font-medium truncate">
                        Nodo {node.mac.slice(-5)}
                      </p>
                      <p className="text-copy-lighter text-xs truncate">
                        MAC: {node.mac} | RSSI: {node.rssi} dBm
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <RiAddLine size={18} />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Bottoni navigazione */}
      <div className="flex flex-wrap justify-between gap-3 pt-4">
        <Button variant="glass" onClick={onBack} className="flex-shrink-0">
          Indietro
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button variant="glass" onClick={onSkip} className="flex-shrink-0">
            Salta
          </Button>
          {dispositivi.length > 0 && (
            <Button variant="primary" onClick={onNext} className="flex-shrink-0">
              Avanti
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
