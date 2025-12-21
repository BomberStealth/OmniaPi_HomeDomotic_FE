import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { ChevronDown, MapPin, Home } from 'lucide-react';
import { getWeatherByCoordinates, getWeatherEmoji } from '@/services/weatherApi';
import type { Impianto } from '@/types';

// ============================================
// IMPIANTO CARD - Card Meteo Home
// ============================================

interface ImpiantoCardProps {
  impianto: Impianto;
  allImpianti?: Impianto[];
  onSelectImpianto?: (impianto: Impianto) => void;
}

export const ImpiantoCard = ({ impianto, allImpianti, onSelectImpianto }: ImpiantoCardProps) => {
  const [weather, setWeather] = useState<{
    temp: number;
    icon: string;
    emoji: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch meteo se ci sono coordinate
    if (impianto.latitudine && impianto.longitudine) {
      fetchWeather(impianto.latitudine, impianto.longitudine);
    }
  }, [impianto.id]);

  const fetchWeather = async (lat: number, lon: number) => {
    const data = await getWeatherByCoordinates(lat, lon);
    if (data) {
      setWeather({
        temp: data.temp,
        icon: data.icon,
        emoji: getWeatherEmoji(data.icon)
      });
    }
  };

  const hasMultipleImpianti = allImpianti && allImpianti.length > 1;

  return (
    <div className="relative">
      <Card
        variant="glass"
        hover={hasMultipleImpianti}
        className="cursor-pointer"
        onClick={() => hasMultipleImpianti && setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="p-3 rounded-xl bg-primary bg-opacity-20 flex-shrink-0">
              <Home size={24} className="text-primary" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold dark:text-copy light:text-copy-light truncate">
                  {impianto.nome}
                </h3>
                {hasMultipleImpianti && (
                  <ChevronDown
                    size={20}
                    className={`transition-transform dark:text-copy-lighter light:text-copy-lighter ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </div>
              <div className="flex items-center gap-1 text-sm dark:text-copy-lighter light:text-copy-lighter">
                <MapPin size={14} />
                <span className="truncate">
                  {impianto.indirizzo}, {impianto.citta}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Weather */}
          {weather && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-3xl">{weather.emoji}</span>
              <span className="text-2xl font-bold dark:text-copy light:text-copy-light">
                {weather.temp}°C
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Dropdown Menu - Altri Impianti */}
      {showDropdown && hasMultipleImpianti && (
        <div className="absolute top-full left-0 right-0 mt-2 z-10">
          <Card variant="glass-solid" padding={false}>
            {allImpianti!.map((imp) => (
              <button
                key={imp.id}
                onClick={() => {
                  onSelectImpianto?.(imp);
                  setShowDropdown(false);
                }}
                className={`
                  w-full text-left p-4 border-b dark:border-border light:border-border-light last:border-b-0
                  hover:bg-primary hover:bg-opacity-10 transition-colors
                  ${imp.id === impianto.id ? 'bg-primary bg-opacity-5' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold dark:text-copy light:text-copy-light truncate">
                      {imp.nome}
                    </p>
                    <p className="text-xs dark:text-copy-lighter light:text-copy-lighter truncate">
                      {imp.indirizzo}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};
