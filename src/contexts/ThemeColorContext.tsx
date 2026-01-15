import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';

// ============================================
// THEME COLOR CONTEXT - Gestione colori accent + dark/light mode
// 5 temi: Gold, Rose, Cyan, Violet, Emerald (default)
// ============================================

export type ColorTheme = 'gold' | 'rose' | 'cyan' | 'violet' | 'emerald' | 'red' | 'orange' | 'yellow' | 'lime' | 'blue' | 'magenta';
export type ThemeMode = 'dark' | 'light';

// Colori base per dark/light mode
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
}

// Configurazione dei 5 temi colore
export const colorThemes: Record<ColorTheme, ColorThemeConfig> = {
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
  },
  gold: {
    name: 'Gold',
    primary: '#d4b56a',
    primaryDark: '#a8894a',
    primaryLight: '#e8d4a0',
    primaryHue: 43,
    accent: '#d4b56a',
    accentLight: '#e8d4a0',
    accentGlow: '#f0d890',
    accentDark: '#a8894a',
  },
  rose: {
    name: 'Rose',
    primary: '#d4a0b5',
    primaryDark: '#a87090',
    primaryLight: '#e8c4d4',
    primaryHue: 340,
    accent: '#d4a0b5',
    accentLight: '#e8c4d4',
    accentGlow: '#f0d8e4',
    accentDark: '#a87090',
  },
  cyan: {
    name: 'Cyan',
    primary: '#6ab5d4',
    primaryDark: '#4a90a8',
    primaryLight: '#a0d4e8',
    primaryHue: 195,
    accent: '#6ab5d4',
    accentLight: '#a0d4e8',
    accentGlow: '#b8e8f0',
    accentDark: '#4a90a8',
  },
  violet: {
    name: 'Violet',
    primary: '#a06ad4',
    primaryDark: '#7040a8',
    primaryLight: '#c4a0e8',
    primaryHue: 270,
    accent: '#a06ad4',
    accentLight: '#c4a0e8',
    accentGlow: '#d8b8f0',
    accentDark: '#7040a8',
  },
  // Logitech Vibrant Colors
  red: {
    name: 'Red',
    primary: '#FF3B30',
    primaryDark: '#CC2F26',
    primaryLight: '#FF6961',
    primaryHue: 4,
    accent: '#FF3B30',
    accentLight: '#FF6961',
    accentGlow: '#FF8A84',
    accentDark: '#CC2F26',
  },
  orange: {
    name: 'Orange',
    primary: '#FF9500',
    primaryDark: '#CC7700',
    primaryLight: '#FFAD33',
    primaryHue: 35,
    accent: '#FF9500',
    accentLight: '#FFAD33',
    accentGlow: '#FFC266',
    accentDark: '#CC7700',
  },
  yellow: {
    name: 'Yellow',
    primary: '#FFCC00',
    primaryDark: '#CCA300',
    primaryLight: '#FFD633',
    primaryHue: 48,
    accent: '#FFCC00',
    accentLight: '#FFD633',
    accentGlow: '#FFE066',
    accentDark: '#CCA300',
  },
  lime: {
    name: 'Lime',
    primary: '#7FFF00',
    primaryDark: '#66CC00',
    primaryLight: '#99FF33',
    primaryHue: 90,
    accent: '#7FFF00',
    accentLight: '#99FF33',
    accentGlow: '#B3FF66',
    accentDark: '#66CC00',
  },
  blue: {
    name: 'Blue',
    primary: '#007AFF',
    primaryDark: '#0062CC',
    primaryLight: '#339AFF',
    primaryHue: 211,
    accent: '#007AFF',
    accentLight: '#339AFF',
    accentGlow: '#66B5FF',
    accentDark: '#0062CC',
  },
  magenta: {
    name: 'Magenta',
    primary: '#E91E8D',
    primaryDark: '#BA1871',
    primaryLight: '#ED4BA4',
    primaryHue: 325,
    accent: '#E91E8D',
    accentLight: '#ED4BA4',
    accentGlow: '#F278BB',
    accentDark: '#BA1871',
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
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export const ThemeColorProvider = ({ children }: { children: ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('colorTheme');
    return (saved as ColorTheme) || 'emerald';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'dark';
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

  // Memoizza setColorTheme per evitare re-render inutili
  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
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
  }), [colorTheme, setColorTheme, availableThemes, themeMode, setThemeMode, isDarkMode, modeColors]);

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
