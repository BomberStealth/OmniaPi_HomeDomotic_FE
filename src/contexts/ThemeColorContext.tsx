import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// THEME COLOR CONTEXT - Gestione colori accent
// 5 temi: Gold, Rose, Cyan, Violet, Emerald (default)
// ============================================

export type ColorTheme = 'gold' | 'rose' | 'cyan' | 'violet' | 'emerald';

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
};

interface ThemeColorContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  colors: ColorThemeConfig;
  availableThemes: ColorTheme[];
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export const ThemeColorProvider = ({ children }: { children: ReactNode }) => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem('colorTheme');
    return (saved as ColorTheme) || 'emerald';
  });

  // Applica le variabili CSS quando cambia il tema colore
  useEffect(() => {
    const colors = colorThemes[colorTheme];
    const root = document.documentElement;

    // Aggiorna le variabili CSS
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hue', colors.primaryHue.toString());
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-accent-light', colors.accentLight);
    root.style.setProperty('--color-accent-glow', colors.accentGlow);
    root.style.setProperty('--color-accent-dark', colors.accentDark);

    // Salva nel localStorage
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
  };

  const value: ThemeColorContextType = {
    colorTheme,
    setColorTheme,
    colors: colorThemes[colorTheme],
    availableThemes: Object.keys(colorThemes) as ColorTheme[],
  };

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
