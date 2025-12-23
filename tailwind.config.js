const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Plus Jakarta Sans font
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Primary colors - Emerald (gestito anche da CSS vars)
        primary: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#34d399",
          content: "#ffffff",
        },

        // Secondary colors - Emerald variants
        secondary: {
          DEFAULT: "#34d399",
          dark: "#10b981",
          light: "#6ee7b7",
          content: "#ffffff",
        },

        // Accent colors - per tema dinamico
        accent: {
          DEFAULT: "var(--color-accent)",
          light: "var(--color-accent-light)",
          glow: "var(--color-accent-glow)",
          dark: "var(--color-accent-dark)",
        },

        // Dark Luxury Background colors
        background: {
          DEFAULT: "#0a0a0c",   // dark theme - molto scuro
          light: "#f8fafc",     // light theme - slate-50
          elevated: "#12121a",  // card elevata
          card: "#18182a",      // sfondo card
          hover: "#1f1f35",     // stato hover
        },
        foreground: {
          DEFAULT: "#12121a",   // dark theme
          light: "#ffffff",     // light theme - bianco puro
        },
        border: {
          DEFAULT: "#2a2a40",   // dark theme - più morbido
          light: "#cbd5e1",     // light theme - slate-300
          accent: "rgba(106, 212, 160, 0.2)", // bordo accent
        },

        // Text colors - Dark Luxury
        copy: {
          DEFAULT: "#f8fafc",   // dark theme - molto chiaro
          light: "#0f172a",     // light theme - slate-900
        },
        "copy-light": {
          DEFAULT: "#cbd5e1",   // dark theme - slate-300
          light: "#1e293b",     // light theme - slate-800
        },
        "copy-lighter": {
          DEFAULT: "#64748b",   // dark theme - slate-500
          light: "#475569",     // light theme - slate-600
        },
        // Semantic text colors
        "text-primary": {
          DEFAULT: "#f8fafc",   // dark theme
          light: "#0f172a",     // light theme
        },
        "text-secondary": {
          DEFAULT: "#cbd5e1",   // dark theme
          light: "#1e293b",     // light theme
        },
        "text-tertiary": {
          DEFAULT: "#64748b",   // dark theme
          light: "#475569",     // light theme
        },

        // Status colors
        success: {
          DEFAULT: "#10b981",
          dark: "#059669",
          light: "#34d399",
          content: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          light: "#fbbf24",
          content: "#ffffff",
        },
        error: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          light: "#f87171",
          content: "#ffffff",
        },
      },
      // Box shadows Dark Luxury
      boxShadow: {
        'glow': '0 0 20px var(--color-accent)',
        'glow-sm': '0 0 10px var(--color-accent)',
        'luxury': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'luxury-lg': '0 16px 48px rgba(0, 0, 0, 0.5)',
      },
    }
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', '.light &');
    })
  ],
}
