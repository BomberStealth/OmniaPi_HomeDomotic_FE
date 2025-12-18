import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Sunrise,
  Sunset,
  Moon,
  Home,
  DoorOpen,
  Tv,
  Plus,
  Play
} from 'lucide-react';

// ============================================
// SCENE/SHORTCUTS PAGE
// ============================================

const scenePresets = [
  { id: 1, nome: 'Buongiorno', icona: Sunrise, colore: 'warning', descrizione: 'Apri tapparelle, accendi luci bagno' },
  { id: 2, nome: 'Buonanotte', icona: Moon, colore: 'primary', descrizione: 'Spegni tutte le luci, chiudi tapparelle' },
  { id: 3, nome: 'Esco', icona: DoorOpen, colore: 'error', descrizione: 'Spegni tutto, abbassa termostati' },
  { id: 4, nome: 'Torno a casa', icona: Home, colore: 'success', descrizione: 'Accendi luci ingresso, alza termostati' },
  { id: 5, nome: 'Cinema', icona: Tv, colore: 'secondary', descrizione: 'Luci al 10%, chiudi tapparelle' },
  { id: 6, nome: 'Relax', icona: Sunset, colore: 'primary-light', descrizione: 'Luci soffuse, temperatura comfort' }
];

export const Scene = () => {
  const { t } = useTranslation();
  const [executing, setExecuting] = useState<number | null>(null);

  const executeScene = async (scenaId: number) => {
    setExecuting(scenaId);
    // Simula esecuzione
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExecuting(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-copy mb-2">{t('nav.scene')}</h1>
            <p className="text-copy-lighter">Automazioni e scorciatoie personalizzate</p>
          </div>

          <Button variant="primary">
            <Plus size={20} className="mr-2" />
            Nuova Scena
          </Button>
        </div>

        {/* Scene Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenePresets.map((scena) => (
            <Card key={scena.id} variant="glass" padding={false}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-xl bg-${scena.colore} bg-opacity-20`}>
                    <scena.icona size={32} className={`text-${scena.colore}`} />
                  </div>
                  <div className="text-xs text-copy-lighter">ID: {scena.id}</div>
                </div>

                <h3 className="text-xl font-bold text-copy mb-2">{scena.nome}</h3>
                <p className="text-sm text-copy-lighter mb-4">{scena.descrizione}</p>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => executeScene(scena.id)}
                  disabled={executing !== null}
                >
                  {executing === scena.id ? (
                    <>
                      <div className="animate-spin mr-2">⚙️</div>
                      Esecuzione...
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Esegui
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Create Custom Scene */}
        <Card variant="glass-dark">
          <div className="text-center py-12">
            <Plus size={64} className="mx-auto mb-4 text-copy-lighter" />
            <h3 className="text-xl font-semibold text-copy mb-2">Crea la tua scena</h3>
            <p className="text-copy-lighter mb-6">
              Combina azioni su più dispositivi per creare automazioni personalizzate
            </p>
            <Button variant="primary">Crea Scena Personalizzata</Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};
