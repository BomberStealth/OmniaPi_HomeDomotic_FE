import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb, Thermometer, Wind, Tv, Lock,
  Sofa, Bed, ChevronRight, Settings,
  Sun, Moon, Power, Zap, Droplets
} from 'lucide-react';

// ============================================
// STYLE PREVIEW PAGE - Dark Luxury Gold
// Ispirato all'immagine Pinterest
// Accessibile da /style-preview
// ============================================

// Font options per preview
const fontOptions = [
  { name: 'Inter', family: 'Inter, system-ui, sans-serif', style: 'Modern & Clean' },
  { name: 'Poppins', family: 'Poppins, sans-serif', style: 'Friendly & Rounded' },
  { name: 'Outfit', family: 'Outfit, sans-serif', style: 'Geometric & Elegant' },
  { name: 'Plus Jakarta', family: '"Plus Jakarta Sans", sans-serif', style: 'Premium & Soft' },
  { name: 'DM Sans', family: '"DM Sans", sans-serif', style: 'Balanced & Professional' },
];

// Temi colore per preview
const colorThemes = [
  {
    name: 'Gold',
    preview: '#d4b56a',
    accent: '#d4b56a',
    accentLight: '#e8d4a0',
    accentGlow: '#f0d890',
    accentDark: '#a8894a',
  },
  {
    name: 'Rose',
    preview: '#d4a0b5',
    accent: '#d4a0b5',
    accentLight: '#e8c4d4',
    accentGlow: '#f0d4e0',
    accentDark: '#a87089',
  },
  {
    name: 'Cyan',
    preview: '#6ab5d4',
    accent: '#6ab5d4',
    accentLight: '#a0d4e8',
    accentGlow: '#b8e4f0',
    accentDark: '#4a89a8',
  },
  {
    name: 'Emerald',
    preview: '#6ad4a0',
    accent: '#6ad4a0',
    accentLight: '#a0e8c4',
    accentGlow: '#b8f0d4',
    accentDark: '#4aa870',
  },
  {
    name: 'Violet',
    preview: '#a06ad4',
    accent: '#a06ad4',
    accentLight: '#c4a0e8',
    accentGlow: '#d4b8f0',
    accentDark: '#7048a8',
  },
  {
    name: 'Amber',
    preview: '#d4906a',
    accent: '#d4906a',
    accentLight: '#e8b8a0',
    accentGlow: '#f0c8b0',
    accentDark: '#a8684a',
  },
];

// Funzione per generare colori dinamici basati sul tema
const getColors = (theme: typeof colorThemes[0]) => ({
  // Background più scuro per contrasto
  bg: '#0a0a09',
  bgGradient: `radial-gradient(ellipse 80% 50% at 50% -10%, ${theme.accent}14 0%, transparent 60%), linear-gradient(to bottom, #12110f 0%, #0a0a09 100%)`,
  // Card più solide e opache
  bgCard: '#1e1c18',
  bgCardHover: '#262420',
  bgCardSolid: '#1a1816',
  bgCardLit: 'linear-gradient(165deg, #2a2722 0%, #1e1c18 50%, #1a1816 100%)',
  // Colori accent dinamici
  gold: theme.accent,
  goldLight: theme.accentLight,
  goldGlow: theme.accentGlow,
  goldDark: theme.accentDark,
  // Bordi basati sul tema
  border: `${theme.accent}26`,
  borderHover: `${theme.accent}59`,
  borderActive: `${theme.accentLight}80`,
  // Testo più luminoso
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  // Effetti luce e ombre
  ambientGlow: `${theme.accent}10`,
  spotlightGlow: `${theme.accentLight}1F`,
  // Ombre più forti per effetto "staccato"
  cardShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
  cardShadowHover: '0 12px 40px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
  cardShadowLit: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  // Toggle track
  toggleTrack: 'rgba(50, 45, 38, 1)',
  toggleTrackBorder: 'rgba(70, 62, 50, 0.8)',
});

// Border radius values - più morbidi
const radius = {
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
  full: '9999px',
};

// Stile "Dark Luxury Gold" - Illuminated Version
// Dimensioni testo ottimizzate per leggibilità
const typography = {
  // Titoli
  h1: 'text-xl font-semibold',
  h2: 'text-base font-semibold',
  h3: 'text-sm font-semibold',
  // Body
  body: 'text-sm font-medium',
  bodySmall: 'text-[13px] font-medium',
  // Labels e captions - MAI sotto 11px
  label: 'text-xs font-semibold uppercase tracking-wider',
  caption: 'text-[11px] font-medium',
  captionSmall: 'text-[11px] font-medium', // minimo 11px per leggibilità
  // Numeri e valori
  value: 'text-2xl font-semibold',
  valueSmall: 'text-lg font-semibold',
};

const DarkLuxuryGold = () => {
  // Plus Jakarta Sans come default (index 3)
  const [selectedFont, setSelectedFont] = useState(3);
  // Gold come tema di default (index 0)
  const [selectedTheme, setSelectedTheme] = useState(0);

  const currentFont = fontOptions[selectedFont];
  const colors = getColors(colorThemes[selectedTheme]);

  return (
    <div
      className="min-h-screen p-4 sm:p-6 relative"
      style={{
        background: colors.bgGradient,
        fontFamily: currentFont.family
      }}
    >
      {/* Google Fonts Import */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Ambient light overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 40% at 50% 0%, ${colors.gold}10 0%, transparent 70%)`,
        }}
      />

      {/* Font Selector */}
      <div className="mb-4 relative">
        <p className={`${typography.label} mb-2`} style={{ color: colors.textMuted }}>
          Seleziona Font
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {fontOptions.map((font, i) => (
            <motion.button
              key={font.name}
              onClick={() => setSelectedFont(i)}
              className="flex-shrink-0 px-4 py-2.5 text-left relative overflow-hidden"
              style={{
                fontFamily: font.family,
                background: i === selectedFont
                  ? `linear-gradient(165deg, ${colors.gold}15, ${colors.bgCard})`
                  : colors.bgCardLit,
                border: `1px solid ${i === selectedFont ? colors.gold : colors.border}`,
                borderRadius: radius.lg,
                boxShadow: i === selectedFont
                  ? `0 4px 20px ${colors.gold}20, ${colors.cardShadow}`
                  : colors.cardShadow
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={`${typography.body} block`} style={{ color: i === selectedFont ? colors.goldLight : colors.textPrimary }}>
                {font.name}
              </span>
              <span className={typography.captionSmall} style={{ color: colors.textMuted }}>
                {font.style}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Color Theme Selector */}
      <div className="mb-6 relative">
        <p className={`${typography.label} mb-2`} style={{ color: colors.textMuted }}>
          Tonalità Colore
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {colorThemes.map((theme, i) => (
            <motion.button
              key={theme.name}
              onClick={() => setSelectedTheme(i)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Color circle */}
              <div
                className="relative w-10 h-10"
                style={{
                  borderRadius: radius.full,
                }}
              >
                {/* Glow effect for selected */}
                {i === selectedTheme && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      borderRadius: radius.full,
                      boxShadow: `0 0 20px ${theme.accent}80, 0 0 40px ${theme.accent}40`,
                    }}
                  />
                )}
                {/* Main circle */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(145deg, ${theme.accentLight}, ${theme.accent}, ${theme.accentDark})`,
                    borderRadius: radius.full,
                    border: i === selectedTheme ? '2px solid rgba(255,255,255,0.5)' : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                />
                {/* Check mark for selected */}
                {i === selectedTheme && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8L6.5 11.5L13 5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
              {/* Theme name */}
              <span
                className={typography.captionSmall}
                style={{
                  color: i === selectedTheme ? theme.accentLight : colors.textMuted,
                  textShadow: i === selectedTheme ? `0 0 10px ${theme.accent}50` : 'none'
                }}
              >
                {theme.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div>
          <p
            className={typography.label}
            style={{
              color: colors.goldLight,
              textShadow: `0 0 20px ${colors.gold}40`
            }}
          >
            Dashboard
          </p>
          <h1 className={typography.h1} style={{ color: colors.textPrimary }}>
            Buonasera, Edoardo
          </h1>
        </div>
        <motion.button
          className="p-2.5 relative overflow-hidden"
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: colors.cardShadow
          }}
          whileHover={{
            scale: 1.05,
            boxShadow: colors.cardShadowHover,
            y: -1
          }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings size={20} style={{ color: colors.goldLight, filter: `drop-shadow(0 0 3px ${colors.gold}50)` }} />
        </motion.button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative">
        {/* Circular Gauge Card - TEMPERATURA CON EFFETTO */}
        <motion.div
          className="p-4 relative overflow-hidden"
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            boxShadow: colors.cardShadowLit
          }}
          whileHover={{
            borderColor: colors.borderHover,
            boxShadow: colors.cardShadowHover,
            y: -2
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Top highlight */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}4D, transparent)` }}
          />

          {/* Label con icona */}
          <div className="flex items-center gap-1.5 mb-3">
            <Thermometer size={14} style={{ color: colors.gold }} />
            <p className={typography.caption} style={{ color: colors.textMuted }}>Temperatura</p>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-28 h-28">
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${colors.gold}15 0%, transparent 70%)`,
                  filter: 'blur(8px)'
                }}
              />

              {/* Background circle */}
              <svg className="w-full h-full -rotate-90 relative z-10" style={{ filter: 'drop-shadow(0 0 12px rgba(212, 181, 106, 0.4))' }}>
                {/* Track */}
                <circle
                  cx="56" cy="56" r="46"
                  fill="none"
                  stroke={colors.toggleTrack}
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="56" cy="56" r="46"
                  fill="none"
                  stroke={`url(#themeGradient-${selectedTheme})`}
                  strokeWidth="8"
                  strokeDasharray={`${0.7 * 289} 289`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${colors.goldLight}99)` }}
                />
                <defs>
                  <linearGradient id={`themeGradient-${selectedTheme}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={colors.goldDark} />
                    <stop offset="50%" stopColor={colors.goldLight} />
                    <stop offset="100%" stopColor={colors.goldGlow} />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                {/* Icona piccola sopra */}
                <div
                  className="p-1.5 rounded-full mb-1"
                  style={{
                    background: `${colors.gold}20`,
                    boxShadow: `0 0 12px ${colors.gold}30`
                  }}
                >
                  <Thermometer size={14} style={{ color: colors.goldLight }} />
                </div>
                <span
                  className={typography.value}
                  style={{
                    color: colors.textPrimary,
                    textShadow: `0 0 20px ${colors.gold}30`
                  }}
                >
                  22°
                </span>
                <span className={typography.captionSmall} style={{ color: colors.textMuted }}>interno</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Energy Card */}
        <motion.div
          className="p-4 relative overflow-hidden"
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            boxShadow: colors.cardShadowLit
          }}
          whileHover={{
            borderColor: colors.borderHover,
            boxShadow: colors.cardShadowHover,
            y: -2
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Top highlight */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}4D, transparent)` }}
          />
          <div className="flex items-center gap-1.5 mb-3">
            <Zap size={14} style={{ color: colors.gold }} />
            <p className={typography.caption} style={{ color: colors.textMuted }}>Consumo Oggi</p>
          </div>
          <div className="flex items-end gap-1.5 h-20 justify-center">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <motion.div
                key={i}
                className="w-3"
                style={{
                  height: `${h}%`,
                  background: i === 3
                    ? `linear-gradient(to top, ${colors.gold}, ${colors.goldLight})`
                    : `linear-gradient(to top, ${colors.goldDark}60, ${colors.gold}50)`,
                  boxShadow: i === 3 ? `0 0 12px ${colors.gold}80` : 'none',
                  borderRadius: radius.sm
                }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            ))}
          </div>
          <div className="text-center mt-2">
            <span className={typography.valueSmall} style={{ color: colors.goldLight }}>3.2</span>
            <span className={`${typography.caption} ml-1`} style={{ color: colors.textMuted }}>kWh</span>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <p className={`${typography.label} mb-3`} style={{ color: colors.textMuted }}>
          Azioni Rapide
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Sun, label: 'Giorno', active: true },
            { icon: Moon, label: 'Notte', active: false },
            { icon: Power, label: 'Spegni', active: false },
            { icon: Lock, label: 'Sicuro', active: false },
          ].map((action, i) => (
            <motion.button
              key={i}
              className="flex flex-col items-center gap-2 p-3 relative overflow-hidden"
              style={{
                background: action.active
                  ? `linear-gradient(165deg, ${colors.gold}20, ${colors.bgCard})`
                  : colors.bgCardLit,
                border: `1px solid ${action.active ? colors.gold : colors.border}`,
                borderRadius: radius.xl,
                boxShadow: action.active
                  ? `0 6px 24px ${colors.gold}25, ${colors.cardShadow}`
                  : colors.cardShadow
              }}
              whileHover={{
                scale: 1.02,
                borderColor: colors.gold,
                boxShadow: colors.cardShadowHover,
                y: -2
              }}
              whileTap={{ scale: 0.98 }}
            >
              <action.icon
                size={22}
                style={{
                  color: action.active ? colors.goldLight : colors.textSecondary,
                  filter: action.active ? `drop-shadow(0 0 6px ${colors.gold})` : 'none'
                }}
              />
              <span
                className={typography.captionSmall}
                style={{ color: action.active ? colors.goldLight : colors.textMuted }}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Rooms */}
      <div className="mb-6">
        <p className={`${typography.label} mb-3`} style={{ color: colors.textMuted }}>
          Stanze
        </p>
        <div className="space-y-2.5">
          {[
            { name: 'Soggiorno', icon: Sofa, devices: 5, active: 3, temp: 23 },
            { name: 'Camera', icon: Bed, devices: 3, active: 1, temp: 21 },
          ].map((room, i) => (
            <motion.div
              key={i}
              className="p-4 flex items-center justify-between relative overflow-hidden cursor-pointer"
              style={{
                background: colors.bgCardLit,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.xl,
                boxShadow: colors.cardShadowLit
              }}
              whileHover={{
                background: colors.bgCardHover,
                borderColor: colors.borderHover,
                boxShadow: colors.cardShadowHover,
                y: -2
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Top edge highlight */}
              <div
                className="absolute top-0 left-1/4 right-1/4 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}40, transparent)` }}
              />
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5"
                  style={{
                    background: `linear-gradient(145deg, ${colors.gold}20, ${colors.gold}10)`,
                    borderRadius: radius.lg,
                    boxShadow: `0 2px 8px ${colors.gold}20`
                  }}
                >
                  <room.icon size={18} style={{ color: colors.goldLight, filter: `drop-shadow(0 0 3px ${colors.gold}60)` }} />
                </div>
                <div>
                  <h3 className={typography.h3} style={{ color: colors.textPrimary }}>
                    {room.name}
                  </h3>
                  <p className={typography.captionSmall} style={{ color: colors.textMuted }}>
                    {room.active}/{room.devices} attivi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={typography.body} style={{ color: colors.goldLight }}>{room.temp}°</span>
                <ChevronRight size={18} style={{ color: colors.textMuted }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Devices Grid */}
      <div>
        <p className={`${typography.label} mb-3`} style={{ color: colors.textMuted }}>
          Dispositivi
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: 'Luce Soggiorno', icon: Lightbulb, isOn: true },
            { name: 'Termostato', icon: Thermometer, isOn: true, value: '22°' },
            { name: 'Aria Condiz.', icon: Wind, isOn: false },
            { name: 'Smart TV', icon: Tv, isOn: false },
            { name: 'Luce Camera', icon: Lightbulb, isOn: false },
            { name: 'Umidificatore', icon: Droplets, isOn: true },
          ].map((device, i) => (
            <motion.button
              key={i}
              className="p-4 text-left relative overflow-hidden"
              style={{
                background: device.isOn
                  ? `linear-gradient(165deg, ${colors.gold}12, ${colors.bgCard})`
                  : colors.bgCardLit,
                border: `1px solid ${device.isOn ? colors.gold : colors.border}`,
                borderRadius: radius.xl,
                boxShadow: device.isOn
                  ? `0 6px 28px ${colors.gold}20, ${colors.cardShadow}`
                  : colors.cardShadowLit
              }}
              whileHover={{
                scale: 1.02,
                borderColor: colors.gold,
                boxShadow: colors.cardShadowHover,
                y: -2
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Top edge highlight */}
              <div
                className="absolute top-0 left-1/4 right-1/4 h-px"
                style={{
                  background: device.isOn
                    ? `linear-gradient(90deg, transparent, ${colors.goldLight}50, transparent)`
                    : `linear-gradient(90deg, transparent, ${colors.goldLight}33, transparent)`
                }}
              />

              {/* Radiant glow when ON */}
              {device.isOn && (
                <div
                  className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-30"
                  style={{ background: `radial-gradient(circle, ${colors.goldLight}, transparent)` }}
                />
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-2"
                    style={{
                      background: device.isOn
                        ? `linear-gradient(145deg, ${colors.gold}30, ${colors.gold}15)`
                        : `${colors.textMuted}10`,
                      borderRadius: radius.md,
                      boxShadow: device.isOn ? `0 2px 8px ${colors.gold}30` : 'none'
                    }}
                  >
                    <device.icon
                      size={20}
                      style={{
                        color: device.isOn ? colors.goldLight : colors.textMuted,
                        filter: device.isOn ? `drop-shadow(0 0 4px ${colors.gold})` : 'none'
                      }}
                    />
                  </div>

                  {/* Custom Toggle - MIGLIORATO */}
                  <div
                    className="w-11 h-6 p-[3px] transition-all duration-300 relative"
                    style={{
                      background: device.isOn
                        ? `linear-gradient(90deg, ${colors.goldDark}, ${colors.goldLight})`
                        : colors.toggleTrack,
                      borderRadius: radius.full,
                      boxShadow: device.isOn
                        ? `0 0 12px ${colors.gold}50, inset 0 1px 2px rgba(0,0,0,0.1)`
                        : `inset 0 2px 4px rgba(0,0,0,0.3), inset 0 0 0 1px ${colors.toggleTrackBorder}`,
                    }}
                  >
                    {/* Track marks for OFF state */}
                    {!device.isOn && (
                      <>
                        <div
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                          style={{ background: colors.textMuted }}
                        />
                        <div
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full"
                          style={{ background: `${colors.textMuted}60` }}
                        />
                      </>
                    )}
                    <motion.div
                      className="w-[18px] h-[18px] rounded-full relative"
                      style={{
                        background: device.isOn
                          ? `linear-gradient(145deg, #ffffff, #f0f0f0)`
                          : `linear-gradient(145deg, #e0e0e0, #c8c8c8)`,
                        boxShadow: device.isOn
                          ? '0 2px 4px rgba(0,0,0,0.2), 0 0 8px rgba(255,255,255,0.3)'
                          : '0 1px 3px rgba(0,0,0,0.3)'
                      }}
                      animate={{ x: device.isOn ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                <h3 className={typography.h3} style={{ color: colors.textPrimary }}>
                  {device.name}
                </h3>
                <p className={`${typography.captionSmall} mt-0.5`} style={{ color: colors.textMuted }}>
                  {device.value || (device.isOn ? 'Acceso' : 'Spento')}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation Preview */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-10">
        <div
          className="flex items-center justify-around py-3 px-4 mx-auto max-w-md relative overflow-hidden"
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5), 0 -2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          {/* Top edge glow */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}4D, transparent)` }}
          />
          {[
            { icon: Sofa, active: true },
            { icon: Zap, active: false },
            { icon: Thermometer, active: false },
            { icon: Settings, active: false },
          ].map((item, i) => (
            <button
              key={i}
              className="p-2.5 transition-all"
              style={{
                background: item.active ? `${colors.gold}15` : 'transparent',
                borderRadius: radius.lg,
                boxShadow: item.active ? `0 0 12px ${colors.gold}30` : 'none'
              }}
            >
              <item.icon
                size={22}
                style={{
                  color: item.active ? colors.goldLight : colors.textMuted,
                  filter: item.active ? `drop-shadow(0 0 4px ${colors.gold})` : 'none'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Spacing for bottom nav */}
      <div className="h-24" />
    </div>
  );
};

export const StylePreview = () => {
  return <DarkLuxuryGold />;
};
