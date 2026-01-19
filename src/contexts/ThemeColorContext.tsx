import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

// ============================================
// THEME COLOR CONTEXT - Gestione colori accent + dark/light mode
// 16 temi con gradienti: Classici + Speciali
// ============================================

export type ColorTheme =
  | 'emerald' | 'red' | 'blue' | 'orange' | 'gold' | 'rose' | 'cyan' | 'purple'
  | 'sunset' | 'ocean' | 'aurora' | 'fire' | 'forest' | 'neon' | 'midnight' | 'coral';
export type ThemeMode = 'dark' | 'light';

// Colori base per dark/light mode - NON MODIFICARE
export const themeModeColors = {
  dark: {
    bg: '#0a0a09',
    bgCard: '#1e1c18',
    bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
    bgSecondary: '#141312',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.75)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
    cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    toggleTrack: 'rgba(50, 45, 38, 1)',
    toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
  },
  light: {
    bg: '#f8f9fa',
    bgCard: '#ffffff',
    bgCardLit: 'linear-gradient(165deg, #ffffff 0%, #f5f5f5 50%, #eeeeee 100%)',
    bgSecondary: '#e9ecef',
    textPrimary: '#1a1a1a',
    textSecondary: 'rgba(0, 0, 0, 0.75)',
    textMuted: 'rgba(0, 0, 0, 0.5)',
    border: 'rgba(0, 0, 0, 0.1)',
    cardShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)',
    cardShadowLit: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.05)',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
    info: '#2563eb',
    toggleTrack: 'rgba(200, 200, 200, 1)',
    toggleTrackBorder: 'rgba(180, 180, 180, 0.8)',
  },
};

interface ColorThemeConfig {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryHue: number;
  accent: string;
  accentLight: string;
  accentGlow: string;
  accentDark: string;
  gradient: string;
}

// ============================================
// CONFIGURAZIONE TEMI COLORE - 16 TEMI
// ============================================
export const colorThemes: Record<ColorTheme, ColorThemeConfig> = {
  // === CLASSICI ===
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    primaryHue: 160,
    accent: '#6ad4a0',
    accentLight: '#a0e8c4',
    accentGlow: '#b8f0d4',
    accentDark: '#4aa870',
    gradient: 'linear-gradient(135deg, #6ad4a0, #a0e8c4)',
  },
  red: {
    name: 'Red',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    primaryLight: '#f87171',
    primaryHue: 0,
    accent: '#ef4444',
    accentLight: '#f87171',
    accentGlow: '#fca5a5',
    accentDark: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
  },
  blue: {
    name: 'Blue',
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    primaryHue: 217,
    accent: '#3b82f6',
    accentLight: '#60a5fa',
    accentGlow: '#93c5fd',
    accentDark: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  },
  orange: {
    name: 'Orange',
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    primaryHue: 25,
    accent: '#f97316',
    accentLight: '#fb923c',
    accentGlow: '#fdba74',
    accentDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316, #fb923c)',
  },
  gold: {
    name: 'Gold',
    primary: '#eab308',
    primaryDark: '#ca8a04',
    primaryLight: '#facc15',
    primaryHue: 48,
    accent: '#eab308',
    accentLight: '#facc15',
    accentGlow: '#fde047',
    accentDark: '#ca8a04',
    gradient: 'linear-gradient(135deg, #eab308, #f59e0b)',
  },
  rose: {
    name: 'Rose',
    primary: '#ec4899',
    primaryDark: '#db2777',
    primaryLight: '#f472b6',
    primaryHue: 330,
    accent: '#ec4899',
    accentLight: '#f472b6',
    accentGlow: '#f9a8d4',
    accentDark: '#db2777',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
  },
  cyan: {
    name: 'Cyan',
    primary: '#06b6d4',
    primaryDark: '#0891b2',
    primaryLight: '#22d3ee',
    primaryHue: 188,
    accent: '#06b6d4',
    accentLight: '#22d3ee',
    accentGlow: '#67e8f9',
    accentDark: '#0891b2',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
  },
  purple: {
    name: 'Purple',
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    primaryHue: 262,
    accent: '#8b5cf6',
    accentLight: '#a78bfa',
    accentGlow: '#c4b5fd',
    accentDark: '#7c3aed',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
  },

  // === GRADIENTI SPECIALI ===
  sunset: {
    name: 'Sunset',
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb7185',
    primaryHue: 25,
    accent: '#f97316',
    accentLight: '#fb7185',
    accentGlow: '#fda4af',
    accentDark: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316, #ec4899)',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0ea5e9',
    primaryDark: '#0284c7',
    primaryLight: '#38bdf8',
    primaryHue: 199,
    accent: '#0ea5e9',
    accentLight: '#38bdf8',
    accentGlow: '#7dd3fc',
    accentDark: '#0284c7',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  },
  aurora: {
    name: 'Aurora',
    primary: '#a855f7',
    primaryDark: '#9333ea',
    primaryLight: '#c084fc',
    primaryHue: 271,
    accent: '#a855f7',
    accentLight: '#c084fc',
    accentGlow: '#d8b4fe',
    accentDark: '#9333ea',
    gradient: 'linear-gradient(135deg, #a855f7, #06b6d4)',
  },
  fire: {
    name: 'Fire',
    primary: '#ef4444',
    primaryDark: '#dc2626',
    primaryLight: '#fbbf24',
    primaryHue: 0,
    accent: '#ef4444',
    accentLight: '#fbbf24',
    accentGlow: '#fcd34d',
    accentDark: '#dc2626',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
  },
  forest: {
    name: 'Forest',
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#4ade80',
    primaryHue: 142,
    accent: '#22c55e',
    accentLight: '#4ade80',
    accentGlow: '#86efac',
    accentDark: '#16a34a',
    gradient: 'linear-gradient(135deg, #22c55e, #14b8a6)',
  },
  neon: {
    name: 'Neon',
    primary: '#22d3ee',
    primaryDark: '#06b6d4',
    primaryLight: '#67e8f9',
    primaryHue: 188,
    accent: '#22d3ee',
    accentLight: '#67e8f9',
    accentGlow: '#a5f3fc',
    accentDark: '#06b6d4',
    gradient: 'linear-gradient(135deg, #22d3ee, #a855f7)',
  },
  midnight: {
    name: 'Midnight',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    primaryHue: 239,
    accent: '#6366f1',
    accentLight: '#818cf8',
    accentGlow: '#a5b4fc',
    accentDark: '#4f46e5',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  coral: {
    name: 'Coral',
    primary: '#fb7185',
    primaryDark: '#f43f5e',
    primaryLight: '#fda4af',
    primaryHue: 350,
    accent: '#fb7185',
    accentLight: '#fda4af',
    accentGlow: '#fecdd3',
    accentDark: '#f43f5e',
    gradient: 'linear-gradient(135deg, #fb7185, #f97316)',
  },
};

interface ThemeColorContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  colors: ColorThemeConfig;
  availableThemes: ColorTheme[];
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  modeColors: typeof themeModeColors.dark;
  useGradients: boolean;
  setUseGradients: (use: boolean) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export const ThemeColorProvider = ({ children }: { children: ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('colorTheme');
    // Migra vecchi temi non più esistenti a emerald
    const validThemes = Object.keys(colorThemes);
    if (saved && validThemes.includes(saved)) {
      return saved as ColorTheme;
    }
    return 'emerald';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'dark';
  });

  const [useGradients, setUseGradientsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('useGradients');
    return saved === 'true';
  });

  // Applica le variabili CSS quando cambia il tema colore
  useEffect(() => {
    const colors = colorThemes[colorTheme];
    const modeColors = themeModeColors[themeMode];
    const root = document.documentElement;

    // Aggiorna le variabili CSS per accent
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hue', colors.primaryHue.toString());
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-light', colors.accentLight);
    root.style.setProperty('--color-accent-glow', colors.accentGlow);
    root.style.setProperty('--color-accent-dark', colors.accentDark);
    root.style.setProperty('--color-gradient', colors.gradient);

    // Aggiorna variabili CSS per dark/light mode
    root.style.setProperty('--bg', modeColors.bg);
    root.style.setProperty('--bg-card', modeColors.bgCard);
    root.style.setProperty('--bg-secondary', modeColors.bgSecondary);
    root.style.setProperty('--text-primary', modeColors.textPrimary);
    root.style.setProperty('--text-secondary', modeColors.textSecondary);
    root.style.setProperty('--text-muted', modeColors.textMuted);
    root.style.setProperty('--border', modeColors.border);

    // Toast CSS variables
    root.style.setProperty('--toast-bg', modeColors.bgCard);
    root.style.setProperty('--toast-color', modeColors.textPrimary);
    root.style.setProperty('--accent-color', colors.accent);

    // Applica background al body
    document.body.style.background = modeColors.bg;

    // Aggiorna classe light/dark sul document per Tailwind
    if (themeMode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }

    // Aggiorna meta theme-color per PWA status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeMode === 'dark' ? '#0a0a09' : '#f8f9fa');
    }

    // Salva nel localStorage
    localStorage.setItem('colorTheme', colorTheme);
    localStorage.setItem('themeMode', themeMode);
  }, [colorTheme, themeMode]);

  // Salva useGradients quando cambia
  useEffect(() => {
    localStorage.setItem('useGradients', useGradients.toString());
  }, [useGradients]);

  // Memoizza setColorTheme per evitare re-render inutili
  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const setUseGradients = useCallback((use: boolean) => {
    setUseGradientsState(use);
  }, []);

  // Memoizza availableThemes (è statico)
  const availableThemes = useMemo(() =>
    Object.keys(colorThemes) as ColorTheme[],
  []);

  const isDarkMode = themeMode === 'dark';
  const modeColors = themeModeColors[themeMode];

  // IMPORTANTE: Memoizza il value object per evitare re-render cascade
  const value = useMemo<ThemeColorContextType>(() => ({
    colorTheme,
    setColorTheme,
    colors: colorThemes[colorTheme],
    availableThemes,
    themeMode,
    setThemeMode,
    isDarkMode,
    modeColors,
    useGradients,
    setUseGradients,
  }), [colorTheme, setColorTheme, availableThemes, themeMode, setThemeMode, isDarkMode, modeColors, useGradients, setUseGradients]);

  return (
    <ThemeColorContext.Provider value={value}>
      {children}
    </ThemeColorContext.Provider>
  );
};

export const useThemeColor = () => {
  const context = useContext(ThemeColorContext);
  if (context === undefined) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return context;
};
