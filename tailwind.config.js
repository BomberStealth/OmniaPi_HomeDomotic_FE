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
      colors: {
        // Primary colors
        primary: {
          DEFAULT: "#6b56ff",
          dark: "#3e23ff",
          light: "#9889ff",
          content: "#ffffff",
        },

        // Secondary colors
        secondary: {
          DEFAULT: "#bf56ff",
          dark: "#ac23ff",
          light: "#d289ff",
          content: "#ffffff",
        },

        // Background colors
        background: {
          DEFAULT: "#1a1a1a",   // dark theme
          light: "#f8fafc",     // light theme - slate-50 molto chiaro
        },
        foreground: {
          DEFAULT: "#262626",   // dark theme
          light: "#ffffff",     // light theme - bianco puro
        },
        border: {
          DEFAULT: "#404040",   // dark theme
          light: "#cbd5e1",     // light theme - slate-300 visibile
        },

        // Text colors
        copy: {
          DEFAULT: "#fbfbfb",   // dark theme
          light: "#0f172a",     // light theme - slate-900 MOLTO SCURO
        },
        "copy-light": {
          DEFAULT: "#d9d9d9",   // dark theme
          light: "#1e293b",     // light theme - slate-800 SCURO
        },
        "copy-lighter": {
          DEFAULT: "#a6a6a6",   // dark theme
          light: "#475569",     // light theme - slate-600 medio scuro
        },
        // Semantic text colors for easy use
        "text-primary": {
          DEFAULT: "#fbfbfb",   // dark theme - same as copy
          light: "#0f172a",     // light theme - dark text
        },
        "text-secondary": {
          DEFAULT: "#d9d9d9",   // dark theme - same as copy-light
          light: "#1e293b",     // light theme - dark text
        },
        "text-tertiary": {
          DEFAULT: "#a6a6a6",   // dark theme - same as copy-lighter
          light: "#475569",     // light theme - medium dark text
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
    }
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', '.light &');
    })
  ],
}
