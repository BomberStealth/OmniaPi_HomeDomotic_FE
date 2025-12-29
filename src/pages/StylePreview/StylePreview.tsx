import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

// ======= REACT-ICONS - Diverse librerie con stili unici =======

// 1. Lucide (via react-icons) - Outline elegante
import {
  LuZap, LuSun, LuMoon, LuHouse, LuFlame, LuSnowflake, LuCoffee, LuMusic,
  LuShield, LuHeart, LuTv, LuBed, LuSunrise, LuSunset, LuLightbulb, LuPartyPopper,
  LuLamp, LuGamepad2
} from 'react-icons/lu';

// 2. Phosphor Bold - Linee spesse e moderne
import {
  PiLightningBold, PiSunBold, PiMoonBold, PiHouseBold, PiFireBold, PiSnowflakeBold,
  PiCoffeeBold, PiMusicNoteBold, PiShieldBold, PiHeartBold, PiTelevisionBold,
  PiBedBold, PiSunHorizonBold, PiLampBold, PiLightbulbBold, PiConfettiBold,
  PiGameControllerBold, PiMoonStarsBold
} from 'react-icons/pi';

// 3. Phosphor Fill - Icone piene/solide
import {
  PiLightningFill, PiSunFill, PiMoonFill, PiHouseFill, PiFireFill, PiSnowflakeFill,
  PiCoffeeFill, PiMusicNoteFill, PiShieldFill, PiHeartFill, PiTelevisionFill,
  PiBedFill, PiSunHorizonFill, PiLampFill, PiLightbulbFill, PiConfettiFill,
  PiGameControllerFill, PiMoonStarsFill
} from 'react-icons/pi';

// 4. Phosphor Duotone - Due tonalità, effetto moderno
import {
  PiLightningDuotone, PiSunDuotone, PiMoonDuotone, PiHouseDuotone, PiFireDuotone,
  PiSnowflakeDuotone, PiCoffeeDuotone, PiMusicNoteDuotone, PiShieldDuotone,
  PiHeartDuotone, PiTelevisionDuotone, PiBedDuotone, PiSunHorizonDuotone,
  PiLampDuotone, PiLightbulbDuotone, PiConfettiDuotone, PiGameControllerDuotone,
  PiMoonStarsDuotone
} from 'react-icons/pi';

// 5. Remix Icons - Stile cinese moderno (+ icone usate in preview)
import {
  RiFlashlightLine, RiSunLine, RiMoonLine, RiHome4Line, RiFireLine,
  RiSnowflakeLine, RiCupLine, RiMusic2Line, RiShieldLine, RiHeartLine,
  RiTvLine, RiHotelBedLine, RiSunFoggyLine, RiFlashlightFill, RiLightbulbLine,
  RiGamepadLine, RiMoonClearLine, RiGiftLine,
  RiTempHotLine, RiWindyLine, RiLockLine, RiSofaLine, RiArrowRightSLine,
  RiSettings4Line, RiShutDownLine, RiDropLine
} from 'react-icons/ri';

// 6. Bootstrap Icons - Classiche e professionali
import {
  BsLightningCharge, BsSun, BsMoon, BsHouse, BsFire, BsSnow, BsCup,
  BsMusicNote, BsShield, BsHeart, BsTv, BsLamp, BsSunrise, BsLightbulb,
  BsController, BsMoonStars, BsBalloon, BsHouseDoor
} from 'react-icons/bs';

// 7. Ionicons - Stile iOS/Apple
import {
  IoFlashOutline, IoSunnyOutline, IoMoonOutline, IoHomeOutline, IoFlameOutline,
  IoSnowOutline, IoCafeOutline, IoMusicalNotesOutline, IoShieldOutline,
  IoHeartOutline, IoTvOutline, IoBedOutline, IoSunnySharp, IoBulbOutline,
  IoGameControllerOutline, IoMoonSharp, IoSparklesOutline, IoHomeSharp
} from 'react-icons/io5';

// 8. Tabler Icons - Linee spesse e bold
import {
  TbBolt, TbSun, TbMoon, TbHome, TbFlame, TbSnowflake, TbCoffee, TbMusic,
  TbShield, TbHeart, TbDeviceTv, TbBed, TbSunrise, TbBulb, TbDeviceGamepad,
  TbMoonStars, TbConfetti, TbLamp
} from 'react-icons/tb';

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

// ============================================
// ICON SETS - Diversi stili da librerie diverse
// ============================================
interface IconSetItem {
  id: string;
  icon: IconType;
  label: string;
}

interface IconSet {
  name: string;
  description: string;
  style: string;
  library: string;
  icons: IconSetItem[];
}

const iconSets: IconSet[] = [
  {
    name: 'Lucide',
    description: 'Linee sottili ed eleganti - Stile attuale dell\'app',
    style: 'Outline Elegante',
    library: 'lucide-react',
    icons: [
      { id: 'zap', icon: LuZap, label: 'Energia' },
      { id: 'sun', icon: LuSun, label: 'Giorno' },
      { id: 'moon', icon: LuMoon, label: 'Notte' },
      { id: 'home', icon: LuHouse, label: 'Casa' },
      { id: 'flame', icon: LuFlame, label: 'Fuoco' },
      { id: 'snow', icon: LuSnowflake, label: 'Freddo' },
      { id: 'coffee', icon: LuCoffee, label: 'Caffè' },
      { id: 'music', icon: LuMusic, label: 'Musica' },
      { id: 'shield', icon: LuShield, label: 'Sicurezza' },
      { id: 'heart', icon: LuHeart, label: 'Amore' },
      { id: 'tv', icon: LuTv, label: 'TV' },
      { id: 'bed', icon: LuBed, label: 'Letto' },
      { id: 'sunrise', icon: LuSunrise, label: 'Alba' },
      { id: 'sunset', icon: LuSunset, label: 'Tramonto' },
      { id: 'lightbulb', icon: LuLightbulb, label: 'Luce' },
      { id: 'party', icon: LuPartyPopper, label: 'Party' },
      { id: 'lamp', icon: LuLamp, label: 'Lampada' },
      { id: 'gamepad', icon: LuGamepad2, label: 'Gaming' },
    ]
  },
  {
    name: 'Phosphor Bold',
    description: 'Linee spesse e moderne - Più visibilità',
    style: 'Bold Moderno',
    library: 'phosphor-icons',
    icons: [
      { id: 'zap', icon: PiLightningBold, label: 'Energia' },
      { id: 'sun', icon: PiSunBold, label: 'Giorno' },
      { id: 'moon', icon: PiMoonBold, label: 'Notte' },
      { id: 'home', icon: PiHouseBold, label: 'Casa' },
      { id: 'flame', icon: PiFireBold, label: 'Fuoco' },
      { id: 'snow', icon: PiSnowflakeBold, label: 'Freddo' },
      { id: 'coffee', icon: PiCoffeeBold, label: 'Caffè' },
      { id: 'music', icon: PiMusicNoteBold, label: 'Musica' },
      { id: 'shield', icon: PiShieldBold, label: 'Sicurezza' },
      { id: 'heart', icon: PiHeartBold, label: 'Amore' },
      { id: 'tv', icon: PiTelevisionBold, label: 'TV' },
      { id: 'bed', icon: PiBedBold, label: 'Letto' },
      { id: 'sunrise', icon: PiSunHorizonBold, label: 'Alba' },
      { id: 'moonstar', icon: PiMoonStarsBold, label: 'Notte+' },
      { id: 'lightbulb', icon: PiLightbulbBold, label: 'Luce' },
      { id: 'party', icon: PiConfettiBold, label: 'Party' },
      { id: 'lamp', icon: PiLampBold, label: 'Lampada' },
      { id: 'gamepad', icon: PiGameControllerBold, label: 'Gaming' },
    ]
  },
  {
    name: 'Phosphor Fill',
    description: 'Icone piene e solide - Massimo impatto',
    style: 'Solid Fill',
    library: 'phosphor-icons',
    icons: [
      { id: 'zap', icon: PiLightningFill, label: 'Energia' },
      { id: 'sun', icon: PiSunFill, label: 'Giorno' },
      { id: 'moon', icon: PiMoonFill, label: 'Notte' },
      { id: 'home', icon: PiHouseFill, label: 'Casa' },
      { id: 'flame', icon: PiFireFill, label: 'Fuoco' },
      { id: 'snow', icon: PiSnowflakeFill, label: 'Freddo' },
      { id: 'coffee', icon: PiCoffeeFill, label: 'Caffè' },
      { id: 'music', icon: PiMusicNoteFill, label: 'Musica' },
      { id: 'shield', icon: PiShieldFill, label: 'Sicurezza' },
      { id: 'heart', icon: PiHeartFill, label: 'Amore' },
      { id: 'tv', icon: PiTelevisionFill, label: 'TV' },
      { id: 'bed', icon: PiBedFill, label: 'Letto' },
      { id: 'sunrise', icon: PiSunHorizonFill, label: 'Alba' },
      { id: 'moonstar', icon: PiMoonStarsFill, label: 'Notte+' },
      { id: 'lightbulb', icon: PiLightbulbFill, label: 'Luce' },
      { id: 'party', icon: PiConfettiFill, label: 'Party' },
      { id: 'lamp', icon: PiLampFill, label: 'Lampada' },
      { id: 'gamepad', icon: PiGameControllerFill, label: 'Gaming' },
    ]
  },
  {
    name: 'Phosphor Duotone',
    description: 'Due tonalità - Effetto premium moderno',
    style: 'Duotone Premium',
    library: 'phosphor-icons',
    icons: [
      { id: 'zap', icon: PiLightningDuotone, label: 'Energia' },
      { id: 'sun', icon: PiSunDuotone, label: 'Giorno' },
      { id: 'moon', icon: PiMoonDuotone, label: 'Notte' },
      { id: 'home', icon: PiHouseDuotone, label: 'Casa' },
      { id: 'flame', icon: PiFireDuotone, label: 'Fuoco' },
      { id: 'snow', icon: PiSnowflakeDuotone, label: 'Freddo' },
      { id: 'coffee', icon: PiCoffeeDuotone, label: 'Caffè' },
      { id: 'music', icon: PiMusicNoteDuotone, label: 'Musica' },
      { id: 'shield', icon: PiShieldDuotone, label: 'Sicurezza' },
      { id: 'heart', icon: PiHeartDuotone, label: 'Amore' },
      { id: 'tv', icon: PiTelevisionDuotone, label: 'TV' },
      { id: 'bed', icon: PiBedDuotone, label: 'Letto' },
      { id: 'sunrise', icon: PiSunHorizonDuotone, label: 'Alba' },
      { id: 'moonstar', icon: PiMoonStarsDuotone, label: 'Notte+' },
      { id: 'lightbulb', icon: PiLightbulbDuotone, label: 'Luce' },
      { id: 'party', icon: PiConfettiDuotone, label: 'Party' },
      { id: 'lamp', icon: PiLampDuotone, label: 'Lampada' },
      { id: 'gamepad', icon: PiGameControllerDuotone, label: 'Gaming' },
    ]
  },
  {
    name: 'Remix',
    description: 'Stile cinese moderno - Pulito e minimal',
    style: 'Chinese Modern',
    library: 'remix-icons',
    icons: [
      { id: 'zap', icon: RiFlashlightLine, label: 'Energia' },
      { id: 'sun', icon: RiSunLine, label: 'Giorno' },
      { id: 'moon', icon: RiMoonLine, label: 'Notte' },
      { id: 'home', icon: RiHome4Line, label: 'Casa' },
      { id: 'flame', icon: RiFireLine, label: 'Fuoco' },
      { id: 'snow', icon: RiSnowflakeLine, label: 'Freddo' },
      { id: 'coffee', icon: RiCupLine, label: 'Caffè' },
      { id: 'music', icon: RiMusic2Line, label: 'Musica' },
      { id: 'shield', icon: RiShieldLine, label: 'Sicurezza' },
      { id: 'heart', icon: RiHeartLine, label: 'Amore' },
      { id: 'tv', icon: RiTvLine, label: 'TV' },
      { id: 'bed', icon: RiHotelBedLine, label: 'Letto' },
      { id: 'sunrise', icon: RiSunFoggyLine, label: 'Alba' },
      { id: 'moonstar', icon: RiMoonClearLine, label: 'Notte+' },
      { id: 'lightbulb', icon: RiLightbulbLine, label: 'Luce' },
      { id: 'party', icon: RiGiftLine, label: 'Party' },
      { id: 'flash', icon: RiFlashlightFill, label: 'Flash' },
      { id: 'gamepad', icon: RiGamepadLine, label: 'Gaming' },
    ]
  },
  {
    name: 'Bootstrap',
    description: 'Classiche e professionali - Stile web tradizionale',
    style: 'Classic Pro',
    library: 'bootstrap-icons',
    icons: [
      { id: 'zap', icon: BsLightningCharge, label: 'Energia' },
      { id: 'sun', icon: BsSun, label: 'Giorno' },
      { id: 'moon', icon: BsMoon, label: 'Notte' },
      { id: 'home', icon: BsHouse, label: 'Casa' },
      { id: 'flame', icon: BsFire, label: 'Fuoco' },
      { id: 'snow', icon: BsSnow, label: 'Freddo' },
      { id: 'coffee', icon: BsCup, label: 'Caffè' },
      { id: 'music', icon: BsMusicNote, label: 'Musica' },
      { id: 'shield', icon: BsShield, label: 'Sicurezza' },
      { id: 'heart', icon: BsHeart, label: 'Amore' },
      { id: 'tv', icon: BsTv, label: 'TV' },
      { id: 'home2', icon: BsHouseDoor, label: 'Porta' },
      { id: 'sunrise', icon: BsSunrise, label: 'Alba' },
      { id: 'moonstar', icon: BsMoonStars, label: 'Notte+' },
      { id: 'lightbulb', icon: BsLightbulb, label: 'Luce' },
      { id: 'party', icon: BsBalloon, label: 'Party' },
      { id: 'lamp', icon: BsLamp, label: 'Lampada' },
      { id: 'gamepad', icon: BsController, label: 'Gaming' },
    ]
  },
  {
    name: 'Ionicons',
    description: 'Stile iOS/Apple - Elegante e arrotondato',
    style: 'iOS Style',
    library: 'ionicons',
    icons: [
      { id: 'zap', icon: IoFlashOutline, label: 'Energia' },
      { id: 'sun', icon: IoSunnyOutline, label: 'Giorno' },
      { id: 'moon', icon: IoMoonOutline, label: 'Notte' },
      { id: 'home', icon: IoHomeOutline, label: 'Casa' },
      { id: 'flame', icon: IoFlameOutline, label: 'Fuoco' },
      { id: 'snow', icon: IoSnowOutline, label: 'Freddo' },
      { id: 'coffee', icon: IoCafeOutline, label: 'Caffè' },
      { id: 'music', icon: IoMusicalNotesOutline, label: 'Musica' },
      { id: 'shield', icon: IoShieldOutline, label: 'Sicurezza' },
      { id: 'heart', icon: IoHeartOutline, label: 'Amore' },
      { id: 'tv', icon: IoTvOutline, label: 'TV' },
      { id: 'bed', icon: IoBedOutline, label: 'Letto' },
      { id: 'sunsharp', icon: IoSunnySharp, label: 'Sole+' },
      { id: 'moonsharp', icon: IoMoonSharp, label: 'Luna+' },
      { id: 'lightbulb', icon: IoBulbOutline, label: 'Luce' },
      { id: 'sparkle', icon: IoSparklesOutline, label: 'Magic' },
      { id: 'homesharp', icon: IoHomeSharp, label: 'Casa+' },
      { id: 'gamepad', icon: IoGameControllerOutline, label: 'Gaming' },
    ]
  },
  {
    name: 'Tabler',
    description: 'Linee spesse e bold - Alta leggibilità',
    style: 'Bold Thick',
    library: 'tabler-icons',
    icons: [
      { id: 'zap', icon: TbBolt, label: 'Energia' },
      { id: 'sun', icon: TbSun, label: 'Giorno' },
      { id: 'moon', icon: TbMoon, label: 'Notte' },
      { id: 'home', icon: TbHome, label: 'Casa' },
      { id: 'flame', icon: TbFlame, label: 'Fuoco' },
      { id: 'snow', icon: TbSnowflake, label: 'Freddo' },
      { id: 'coffee', icon: TbCoffee, label: 'Caffè' },
      { id: 'music', icon: TbMusic, label: 'Musica' },
      { id: 'shield', icon: TbShield, label: 'Sicurezza' },
      { id: 'heart', icon: TbHeart, label: 'Amore' },
      { id: 'tv', icon: TbDeviceTv, label: 'TV' },
      { id: 'bed', icon: TbBed, label: 'Letto' },
      { id: 'sunrise', icon: TbSunrise, label: 'Alba' },
      { id: 'moonstar', icon: TbMoonStars, label: 'Notte+' },
      { id: 'lightbulb', icon: TbBulb, label: 'Luce' },
      { id: 'party', icon: TbConfetti, label: 'Party' },
      { id: 'lamp', icon: TbLamp, label: 'Lampada' },
      { id: 'gamepad', icon: TbDeviceGamepad, label: 'Gaming' },
    ]
  },
];

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
  // Icon set selezionato (index 0 = Standard)
  const [selectedIconSet, setSelectedIconSet] = useState(0);

  const currentFont = fontOptions[selectedFont];
  const colors = getColors(colorThemes[selectedTheme]);
  const currentIconSet = iconSets[selectedIconSet];

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
          <RiSettings4Line size={20} style={{ color: colors.goldLight, filter: `drop-shadow(0 0 3px ${colors.gold}50)` }} />
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
            <RiTempHotLine size={14} style={{ color: colors.gold }} />
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
                  <RiTempHotLine size={14} style={{ color: colors.goldLight }} />
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
            <RiFlashlightLine size={14} style={{ color: colors.gold }} />
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
            { icon: RiSunLine, label: 'Giorno', active: true },
            { icon: RiMoonLine, label: 'Notte', active: false },
            { icon: RiShutDownLine, label: 'Spegni', active: false },
            { icon: RiLockLine, label: 'Sicuro', active: false },
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
            { name: 'Soggiorno', icon: RiSofaLine, devices: 5, active: 3, temp: 23 },
            { name: 'Camera', icon: RiHotelBedLine, devices: 3, active: 1, temp: 21 },
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
                <RiArrowRightSLine size={18} style={{ color: colors.textMuted }} />
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
            { name: 'Luce Soggiorno', icon: RiLightbulbLine, isOn: true },
            { name: 'Termostato', icon: RiTempHotLine, isOn: true, value: '22°' },
            { name: 'Aria Condiz.', icon: RiWindyLine, isOn: false },
            { name: 'Smart TV', icon: RiTvLine, isOn: false },
            { name: 'Luce Camera', icon: RiLightbulbLine, isOn: false },
            { name: 'Umidificatore', icon: RiDropLine, isOn: true },
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

      {/* ============================================ */}
      {/* ICON SETS PREVIEW SECTION */}
      {/* ============================================ */}
      <div className="mb-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className={`${typography.label}`} style={{ color: colors.textMuted }}>
            Set Icone Scene
          </p>
          <span
            className={typography.captionSmall}
            style={{
              color: colors.goldLight,
              background: `${colors.gold}15`,
              padding: '4px 12px',
              borderRadius: radius.full,
              border: `1px solid ${colors.gold}30`
            }}
          >
            {currentIconSet.style}
          </span>
        </div>

        {/* Icon Set Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {iconSets.map((set, i) => (
            <motion.button
              key={set.name}
              onClick={() => setSelectedIconSet(i)}
              className="flex-shrink-0 px-4 py-2.5 text-left relative overflow-hidden"
              style={{
                background: i === selectedIconSet
                  ? `linear-gradient(165deg, ${colors.gold}20, ${colors.bgCard})`
                  : colors.bgCardLit,
                border: `1px solid ${i === selectedIconSet ? colors.gold : colors.border}`,
                borderRadius: radius.lg,
                boxShadow: i === selectedIconSet
                  ? `0 4px 20px ${colors.gold}25, ${colors.cardShadow}`
                  : colors.cardShadow,
                minWidth: '100px'
              }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Top highlight for selected */}
              {i === selectedIconSet && (
                <div
                  className="absolute top-0 left-1/4 right-1/4 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}60, transparent)` }}
                />
              )}
              <span
                className={`${typography.body} block`}
                style={{ color: i === selectedIconSet ? colors.goldLight : colors.textPrimary }}
              >
                {set.name}
              </span>
              <span className={typography.captionSmall} style={{ color: colors.textMuted }}>
                {set.style}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Set Description */}
        <div className="mb-4">
          <p
            className={`${typography.bodySmall}`}
            style={{ color: colors.textSecondary }}
          >
            {currentIconSet.description}
          </p>
          <p
            className={`${typography.captionSmall} mt-1`}
            style={{ color: colors.textMuted }}
          >
            Libreria: <span style={{ color: colors.goldLight }}>{currentIconSet.library}</span>
          </p>
        </div>

        {/* Icons Grid Preview */}
        <motion.div
          key={selectedIconSet}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 relative overflow-hidden"
          style={{
            background: colors.bgCardLit,
            border: `1px solid ${colors.border}`,
            borderRadius: radius['2xl'],
            boxShadow: colors.cardShadowLit
          }}
        >
          {/* Top highlight */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}4D, transparent)` }}
          />

          <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
            {currentIconSet.icons.map(({ id, icon: IconComponent, label }, index) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="flex flex-col items-center gap-1 p-2 cursor-pointer group"
                style={{
                  borderRadius: radius.md,
                }}
                whileHover={{
                  background: `${colors.gold}15`,
                  scale: 1.1,
                }}
              >
                <div
                  className="p-2 transition-all duration-200"
                  style={{
                    background: `${colors.gold}10`,
                    borderRadius: radius.md,
                    boxShadow: `0 2px 8px ${colors.gold}10`
                  }}
                >
                  <IconComponent
                    size={20}
                    style={{
                      color: colors.goldLight,
                      filter: `drop-shadow(0 0 4px ${colors.gold}40)`,
                    }}
                  />
                </div>
                <span
                  className={typography.captionSmall}
                  style={{
                    color: colors.textMuted,
                    textAlign: 'center',
                    fontSize: '9px',
                    lineHeight: 1.2
                  }}
                >
                  {label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Sample Scene Cards with current icon set */}
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <p className={`${typography.caption} mb-3`} style={{ color: colors.textMuted }}>
              Preview Scene
            </p>
            <div className="grid grid-cols-3 gap-2">
              {currentIconSet.icons.slice(0, 3).map(({ id, icon: IconComponent, label }) => (
                <motion.div
                  key={`scene-${id}`}
                  className="p-3 text-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(165deg, ${colors.gold}12, ${colors.bgCard})`,
                    border: `1px solid ${colors.gold}40`,
                    borderRadius: radius.xl,
                    boxShadow: `0 4px 16px ${colors.gold}15`
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Top glow */}
                  <div
                    className="absolute top-0 left-1/4 right-1/4 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${colors.goldLight}50, transparent)` }}
                  />
                  <div
                    className="mx-auto mb-2 p-2.5 w-fit"
                    style={{
                      background: `linear-gradient(145deg, ${colors.gold}25, ${colors.gold}10)`,
                      borderRadius: radius.lg,
                      boxShadow: `0 2px 12px ${colors.gold}30`
                    }}
                  >
                    <IconComponent
                      size={24}
                      style={{
                        color: colors.goldLight,
                        filter: `drop-shadow(0 0 6px ${colors.gold})`
                      }}
                    />
                  </div>
                  <p className={typography.bodySmall} style={{ color: colors.textPrimary }}>
                    {label}
                  </p>
                  <p className={typography.captionSmall} style={{ color: colors.textMuted }}>
                    Tap to run
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
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
            { icon: RiSofaLine, active: true },
            { icon: RiFlashlightLine, active: false },
            { icon: RiTempHotLine, active: false },
            { icon: RiSettings4Line, active: false },
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
