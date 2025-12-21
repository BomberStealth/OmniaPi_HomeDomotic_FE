import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { ChevronDown, Building2, Loader } from 'lucide-react';
import { useState } from 'react';

// ============================================
// IMPIANTO SELECTOR - Dropdown Multi-impianto
// ============================================

interface ImpiantoSelectorProps {
  variant?: 'mobile' | 'desktop';
}

export const ImpiantoSelector = ({ variant = 'mobile' }: ImpiantoSelectorProps) => {
  const { impiantoCorrente, setImpiantoCorrente, impianti, loading } = useImpiantoContext();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader size={16} className="animate-spin text-primary" />
        <span className="text-sm dark:text-copy-lighter light:text-copy-lighter">
          Caricamento...
        </span>
      </div>
    );
  }

  if (!impiantoCorrente || impianti.length === 0) {
    return (
      <div className="px-3 py-2 text-sm dark:text-copy-lighter light:text-copy-lighter">
        Nessun impianto disponibile
      </div>
    );
  }

  // Se c'è un solo impianto, mostra solo il nome senza dropdown
  if (impianti.length === 1) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 ${
        variant === 'desktop' ? 'glass rounded-lg' : ''
      }`}>
        <Building2 size={18} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold dark:text-copy light:text-copy-light">
            {impiantoCorrente.nome}
          </p>
          <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
            {impiantoCorrente.citta}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 transition-all ${
          variant === 'desktop'
            ? 'glass rounded-lg hover:bg-opacity-80'
            : 'hover:bg-white hover:bg-opacity-5'
        }`}
      >
        <Building2 size={18} className="text-primary" />
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold dark:text-copy light:text-copy-light">
            {impiantoCorrente.nome}
          </p>
          <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
            {impiantoCorrente.citta}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform dark:text-copy-lighter light:text-copy-lighter ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay per chiudere al click fuori */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute z-50 w-full top-full mt-1 dark:bg-background light:bg-white rounded-lg border dark:border-border light:border-border-light shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {impianti.map((impianto) => (
              <button
                key={impianto.id}
                onClick={() => {
                  setImpiantoCorrente(impianto);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white hover:bg-opacity-10 ${
                  impianto.id === impiantoCorrente.id
                    ? 'bg-primary bg-opacity-20 border-l-2 border-primary'
                    : ''
                }`}
              >
                <Building2 size={16} className={
                  impianto.id === impiantoCorrente.id ? 'text-primary' : 'dark:text-copy-lighter light:text-copy-lighter'
                } />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    impianto.id === impiantoCorrente.id
                      ? 'text-primary'
                      : 'dark:text-copy light:text-copy-light'
                  }`}>
                    {impianto.nome}
                  </p>
                  <p className="text-xs dark:text-copy-lighter light:text-copy-lighter">
                    {impianto.citta}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
