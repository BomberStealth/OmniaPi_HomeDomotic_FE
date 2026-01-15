// ============================================
// ROOM ICONS CONFIG - Lucide Icons
// Mappa icone stanze (sostituisce emoji)
// ============================================

import {
  DoorOpen,
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  Building2,
  Home,
  Tv,
  Monitor,
  TreePine,
  Car,
  Gamepad2,
  LucideIcon
} from 'lucide-react';

// Mappa ID icona -> Componente Lucide
export const ROOM_ICONS: Record<string, LucideIcon> = {
  door: DoorOpen,
  sofa: Sofa,
  kitchen: UtensilsCrossed,
  bed: Bed,
  bath: Bath,
  office: Building2,
  home: Home,
  tv: Tv,
  computer: Monitor,
  garden: TreePine,
  garage: Car,
  games: Gamepad2,
};

// Lista icone disponibili per selettore
export const ROOM_ICON_OPTIONS = [
  { id: 'door', label: 'Porta' },
  { id: 'sofa', label: 'Soggiorno' },
  { id: 'kitchen', label: 'Cucina' },
  { id: 'bed', label: 'Camera' },
  { id: 'bath', label: 'Bagno' },
  { id: 'office', label: 'Ufficio' },
  { id: 'home', label: 'Casa' },
  { id: 'tv', label: 'TV' },
  { id: 'computer', label: 'Computer' },
  { id: 'garden', label: 'Giardino' },
  { id: 'garage', label: 'Garage' },
  { id: 'games', label: 'Giochi' },
];

// Default icon se non trovata
export const DEFAULT_ROOM_ICON = 'door';

// Helper per ottenere il componente icona
export const getRoomIcon = (iconId: string | undefined): LucideIcon => {
  return ROOM_ICONS[iconId || DEFAULT_ROOM_ICON] || ROOM_ICONS[DEFAULT_ROOM_ICON];
};
