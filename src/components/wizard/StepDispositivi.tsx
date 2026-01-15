import { useState, useEffect } from 'react';
import { toast } from '@/utils/toast';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { omniapiApi, OmniapiNode } from '@/services/omniapiApi';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { spacing, fontSize, radius } from '@/styles/responsive';
import {
  RiDeviceLine,
  RiLoader4Line,
  RiRefreshLine,
  RiCheckLine,
  RiSignalWifiLine,
  RiFlashlightLine,
} from 'react-icons/ri';
import { Plus } from 'lucide-react';

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
  const [testingMac, setTestingMac] = useState<string | null>(null);
  const { modeColors, isDarkMode, colors } = useThemeColor();

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

  // TEST dispositivo - fa toggle 3 volte
  const handleTest = async (node: OmniapiNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (testingMac) return;

    setTestingMac(node.mac);
    try {
      await omniapiApi.testDevice(node.mac);
      toast.success('Test inviato!');
    } catch (err) {
      toast.error('Errore test');
    } finally {
      setTimeout(() => setTestingMac(null), 3000);
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
      <Card variant="glass" style={{ padding: spacing.lg }}>
        <div className="flex flex-col items-center justify-center py-12">
          <RiLoader4Line size={48} className="text-primary animate-spin mb-4" />
          <p style={{ color: modeColors.textSecondary, fontSize: fontSize.sm }}>
            Ricerca dispositivi in corso...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="glass" style={{ padding: spacing.md }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: spacing.md }}
      >
        <div className="flex items-center" style={{ gap: spacing.sm }}>
          <div
            style={{
              padding: spacing.sm,
              borderRadius: radius.md,
              background: 'rgba(234, 179, 8, 0.2)',
            }}
          >
            <RiDeviceLine size={24} className="text-warning" />
          </div>
          <div>
            <h2
              style={{
                fontSize: fontSize.lg,
                fontWeight: 'bold',
                color: modeColors.textPrimary,
              }}
            >
              Aggiungi Dispositivi
            </h2>
            <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
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

      {/* Lista dispositivi già aggiunti - compatta */}
      {dispositivi.length > 0 && (
        <div style={{ marginBottom: spacing.md }}>
          <p
            style={{
              fontSize: fontSize.xs,
              color: modeColors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Dispositivi aggiunti ({dispositivi.length}):
          </p>
          <div>
            {dispositivi.map((d) => (
              <div
                key={d.mac}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: spacing.sm,
                  borderRadius: radius.md,
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  marginBottom: spacing.xs,
                  gap: spacing.sm,
                }}
              >
                <RiCheckLine size={16} className="text-success flex-shrink-0" />
                <span
                  style={{
                    flex: 1,
                    fontSize: fontSize.sm,
                    color: modeColors.textPrimary,
                  }}
                >
                  {d.nome}
                </span>
                <span
                  style={{
                    fontSize: fontSize.xs,
                    color: modeColors.textMuted,
                  }}
                >
                  {d.stanza_nome || '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form aggiunta nodo */}
      {selectedNode ? (
        <Card variant="glass-dark" style={{ padding: spacing.md, marginBottom: spacing.sm }}>
          <div
            className="flex items-center"
            style={{ gap: spacing.sm, marginBottom: spacing.md }}
          >
            <div
              style={{
                padding: spacing.xs,
                borderRadius: radius.sm,
                background: `${colors.accent}20`,
              }}
            >
              <RiDeviceLine size={18} style={{ color: colors.accent }} />
            </div>
            <div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: fontSize.sm,
                  color: modeColors.textPrimary,
                }}
              >
                Configura: {selectedNode.mac.slice(-8)}
              </p>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textSecondary }}>
                RSSI: {selectedNode.rssi} dBm
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <Input
              label="Nome Dispositivo"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              placeholder="es. Luce Soggiorno"
            />

            {/* Nome stanza */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: fontSize.xs,
                  color: modeColors.textSecondary,
                  marginBottom: spacing.xs,
                }}
              >
                Stanza (opzionale)
              </label>
              <input
                type="text"
                list="stanze-list"
                value={stanzaName}
                onChange={(e) => setStanzaName(e.target.value)}
                placeholder="es. Soggiorno"
                style={{
                  width: '100%',
                  height: 'clamp(38px, 9vw, 44px)',  // Altezza RIDOTTA
                  padding: '0 clamp(10px, 2.5vw, 14px)',  // Padding ridotto
                  borderRadius: radius.sm,
                  background: isDarkMode ? modeColors.bgSecondary : '#f0f0f0',
                  border: `1px solid ${modeColors.border}`,
                  color: modeColors.textPrimary,
                  fontSize: 'clamp(13px, 3.2vw, 15px)',  // Font ridotto
                }}
              />
              <datalist id="stanze-list">
                {stanzeGiaInserite.map((nome) => (
                  <option key={nome} value={nome} />
                ))}
              </datalist>
            </div>

            {error && (
              <p style={{ color: '#ef4444', fontSize: fontSize.xs }}>{error}</p>
            )}

            <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
              <Button variant="glass" onClick={handleCancelSelection}>
                Annulla
              </Button>
              <button
                onClick={handleAddNode}
                style={{
                  flex: 1,
                  height: 'clamp(38px, 9vw, 44px)',  // Altezza RIDOTTA (stessa del form)
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  padding: '0 clamp(10px, 2.5vw, 14px)',
                  borderRadius: radius.sm,
                  background: colors.accent,
                  border: 'none',
                  color: '#fff',
                  fontSize: 'clamp(13px, 3.2vw, 15px)',  // Font ridotto
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span style={{ lineHeight: 1 }}>+</span>
                <span>Aggiungi</span>
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Lista nodi disponibili - CARD COMPATTE */
        <div style={{ marginBottom: spacing.sm }}>
          {availableNodes.length === 0 ? (
            <div className="text-center" style={{ padding: `${spacing.lg} 0` }}>
              <RiSignalWifiLine
                size={40}
                className="mx-auto"
                style={{ color: modeColors.textMuted, marginBottom: spacing.sm }}
              />
              <p style={{ color: modeColors.textSecondary, fontSize: fontSize.sm }}>
                Nessun nuovo dispositivo rilevato
              </p>
              <p style={{ fontSize: fontSize.xs, color: modeColors.textMuted }}>
                Accendi i nodi OmniaPi e attendi qualche secondo
              </p>
            </div>
          ) : (
            availableNodes.map((node) => (
              <div
                key={node.mac}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'clamp(6px, 1.5vw, 10px)',  // Padding RIDOTTO
                  borderRadius: radius.sm,  // Radius più piccolo
                  background: modeColors.bgCard,
                  marginBottom: spacing.xs,
                  border: `1px solid ${modeColors.border}`,
                }}
              >
                {/* Nome dispositivo - font ridotto */}
                <span
                  style={{
                    fontSize: 'clamp(12px, 3vw, 14px)',  // Font PIÙ PICCOLO
                    flex: 1,
                    color: modeColors.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  Nodo {node.mac.slice(-5)}
                </span>

                {/* Tasto TEST - più compatto */}
                <button
                  onClick={(e) => handleTest(node, e)}
                  disabled={testingMac === node.mac}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    height: 'clamp(28px, 7vw, 34px)',  // Altezza RIDOTTA
                    padding: '0 clamp(6px, 1.5vw, 10px)',  // Padding ridotto
                    marginRight: spacing.xs,
                    borderRadius: radius.sm,
                    background: testingMac === node.mac ? colors.accent : 'transparent',
                    border: `1px solid ${colors.accent}`,
                    fontSize: 'clamp(10px, 2.5vw, 12px)',  // Font più piccolo
                    fontWeight: 500,
                    color: testingMac === node.mac ? '#fff' : colors.accent,
                    cursor: testingMac === node.mac ? 'not-allowed' : 'pointer',
                  }}
                >
                  <RiFlashlightLine size={12} />
                  TEST
                </button>

                {/* Tasto + quadrato - più compatto */}
                <button
                  onClick={() => handleSelectNode(node)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'clamp(28px, 7vw, 34px)',  // Larghezza RIDOTTA
                    height: 'clamp(28px, 7vw, 34px)',  // Altezza RIDOTTA
                    padding: 0,
                    borderRadius: radius.sm,
                    background: colors.accent,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottoni navigazione */}
      <div
        className="flex flex-wrap justify-between"
        style={{ gap: spacing.sm, paddingTop: spacing.sm }}
      >
        <Button variant="glass" onClick={onBack}>
          Indietro
        </Button>
        <div className="flex flex-wrap" style={{ gap: spacing.sm }}>
          <Button variant="glass" onClick={onSkip}>
            Salta
          </Button>
          {dispositivi.length > 0 && (
            <Button variant="primary" onClick={onNext}>
              Avanti
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
