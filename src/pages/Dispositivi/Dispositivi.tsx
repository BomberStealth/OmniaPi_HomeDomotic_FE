import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/common/Card';
import { LuceCard } from '@/components/dispositivi/LuceCard';
import { TapparellaCard } from '@/components/dispositivi/TapparellaCard';
import { TermostatoCard } from '@/components/dispositivi/TermostatoCard';
import { TipoDispositivo, Dispositivo } from '@/types';
import { Lightbulb, Blinds, Thermometer } from 'lucide-react';

// ============================================
// DISPOSITIVI PAGE
// ============================================

export const Dispositivi = () => {
  const { t } = useTranslation();
  const [filtro, setFiltro] = useState<TipoDispositivo | 'tutti'>('tutti');

  // Mock data - da sostituire con dati reali
  const dispositivi: Dispositivo[] = [];

  const filtri = [
    { tipo: 'tutti', label: 'Tutti', icon: null },
    { tipo: TipoDispositivo.LUCE, label: t('dispositivi.luci'), icon: Lightbulb },
    { tipo: TipoDispositivo.TAPPARELLA, label: t('dispositivi.tapparelle'), icon: Blinds },
    { tipo: TipoDispositivo.TERMOSTATO, label: t('dispositivi.termostati'), icon: Thermometer }
  ];

  const dispositiviFiltrati = filtro === 'tutti'
    ? dispositivi
    : dispositivi.filter(d => d.tipo === filtro);

  const renderDispositivo = (dispositivo: Dispositivo) => {
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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-copy mb-2">Dispositivi</h1>
          <p className="text-copy-lighter">{dispositivi.length} dispositivi totali</p>
        </div>

        {/* Filtri */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filtri.map((f) => (
            <button
              key={f.tipo}
              onClick={() => setFiltro(f.tipo as any)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all
                ${filtro === f.tipo
                  ? 'bg-primary text-white shadow-lg shadow-primary/50'
                  : 'glass hover:bg-opacity-20'
                }
              `}
            >
              {f.icon && <f.icon size={18} />}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Dispositivi Grid */}
        {dispositiviFiltrati.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dispositiviFiltrati.map(renderDispositivo)}
          </div>
        ) : (
          <Card variant="glass-solid" className="text-center py-16">
            <Lightbulb size={64} className="mx-auto mb-4 text-copy-lighter" />
            <h3 className="text-xl font-semibold text-copy mb-2">
              Nessun dispositivo trovato
            </h3>
            <p className="text-copy-lighter">
              Seleziona un impianto per vedere i dispositivi
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};
