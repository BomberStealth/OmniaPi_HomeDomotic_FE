// ============================================
// WEATHER API SERVICE - Open-Meteo (FREE)
// ============================================

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  city: string;
}

const WEATHER_CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuti

/**
 * Ottiene i dati meteo da Open-Meteo basandosi su coordinate GPS
 * Open-Meteo è completamente gratuito e non richiede API key
 */
export const getWeatherByCoordinates = async (
  lat: number,
  lon: number
): Promise<WeatherData | null> => {
  // Controllo cache
  const cached = getCachedWeather(lat, lon);
  if (cached) {
    return cached;
  }

  try {
    // Open-Meteo API - completamente gratuito
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );

    if (!response.ok) {
      console.error('Errore API meteo:', response.status);
      return null;
    }

    const data = await response.json();

    // Nome città generico (reverse geocoding causava CORS)
    let city = 'Posizione';

    // Mappa WMO Weather Code a descrizione italiana
    const weatherCode = data.current.weather_code;
    const description = getWeatherDescription(weatherCode);
    const icon = getWeatherIconCode(weatherCode);

    const weatherData: WeatherData = {
      temp: Math.round(data.current.temperature_2m),
      feels_like: Math.round(data.current.apparent_temperature),
      temp_min: Math.round(data.daily.temperature_2m_min[0]),
      temp_max: Math.round(data.daily.temperature_2m_max[0]),
      humidity: data.current.relative_humidity_2m,
      description,
      icon,
      city
    };

    // Salva in cache
    cacheWeather(lat, lon, weatherData);

    return weatherData;
  } catch (error) {
    console.error('Errore durante fetch meteo:', error);
    return null;
  }
};

/**
 * Mappa WMO Weather Code a descrizione italiana
 */
const getWeatherDescription = (code: number): string => {
  const descriptions: { [key: number]: string } = {
    0: 'Cielo sereno',
    1: 'Prevalentemente sereno',
    2: 'Parzialmente nuvoloso',
    3: 'Nuvoloso',
    45: 'Nebbia',
    48: 'Nebbia con brina',
    51: 'Pioggerella leggera',
    53: 'Pioggerella moderata',
    55: 'Pioggerella intensa',
    61: 'Pioggia leggera',
    63: 'Pioggia moderata',
    65: 'Pioggia intensa',
    71: 'Neve leggera',
    73: 'Neve moderata',
    75: 'Neve intensa',
    77: 'Grandine',
    80: 'Rovesci leggeri',
    81: 'Rovesci moderati',
    82: 'Rovesci violenti',
    85: 'Rovesci di neve leggeri',
    86: 'Rovesci di neve intensi',
    95: 'Temporale',
    96: 'Temporale con grandine leggera',
    99: 'Temporale con grandine intensa'
  };
  return descriptions[code] || 'Condizioni variabili';
};

/**
 * Mappa WMO Weather Code a codice icona compatibile con getWeatherEmoji
 */
const getWeatherIconCode = (code: number): string => {
  if (code === 0) return '01d';
  if (code === 1 || code === 2) return '02d';
  if (code === 3) return '03d';
  if (code === 45 || code === 48) return '50d';
  if (code >= 51 && code <= 55) return '09d';
  if (code >= 61 && code <= 65) return '10d';
  if (code >= 71 && code <= 77) return '13d';
  if (code >= 80 && code <= 82) return '09d';
  if (code >= 85 && code <= 86) return '13d';
  if (code >= 95 && code <= 99) return '11d';
  return '02d';
};

/**
 * Ottiene icona emoji basata sul codice icona
 */
export const getWeatherEmoji = (iconCode: string): string => {
  const emojiMap: { [key: string]: string } = {
    '01d': '☀️', // cielo sereno giorno
    '01n': '🌙', // cielo sereno notte
    '02d': '⛅', // poche nuvole giorno
    '02n': '☁️', // poche nuvole notte
    '03d': '☁️', // nuvole sparse
    '03n': '☁️',
    '04d': '☁️', // nuvoloso
    '04n': '☁️',
    '09d': '🌧️', // pioggia
    '09n': '🌧️',
    '10d': '🌦️', // pioggia leggera giorno
    '10n': '🌧️', // pioggia leggera notte
    '11d': '⛈️', // temporale
    '11n': '⛈️',
    '13d': '❄️', // neve
    '13n': '❄️',
    '50d': '🌁', // nebbia (icona più visibile)
    '50n': '🌁'
  };

  return emojiMap[iconCode] || '🌤️';
};

// ============================================
// CACHE HELPERS
// ============================================

interface CachedWeatherData {
  lat: number;
  lon: number;
  data: WeatherData;
  timestamp: number;
}

const getCachedWeather = (lat: number, lon: number): WeatherData | null => {
  try {
    const cached = localStorage.getItem(WEATHER_CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CachedWeatherData = JSON.parse(cached);

    // Verifica se coordinate corrispondono e cache non scaduta
    if (
      parsedCache.lat === lat &&
      parsedCache.lon === lon &&
      Date.now() - parsedCache.timestamp < CACHE_DURATION
    ) {
      return parsedCache.data;
    }

    return null;
  } catch {
    return null;
  }
};

const cacheWeather = (lat: number, lon: number, data: WeatherData): void => {
  try {
    const cacheData: CachedWeatherData = {
      lat,
      lon,
      data,
      timestamp: Date.now()
    };

    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Errore durante salvataggio cache meteo:', error);
  }
};
