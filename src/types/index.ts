// ============================================
// TIPI CONDIVISI CON BACKEND
// ============================================

export enum UserRole {
  CLIENTE = 'cliente',
  INSTALLATORE = 'installatore',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  creato_il: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export enum TipoDispositivo {
  LUCE = 'luce',
  TAPPARELLA = 'tapparella',
  TERMOSTATO = 'termostato'
}

export enum StatoDispositivo {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERRORE = 'errore'
}

export interface Dispositivo {
  id: number;
  stanza_id: number;
  tipo: TipoDispositivo;
  nome: string;
  topic_mqtt: string;
  stato: StatoDispositivo;
  configurazione: ConfigLuce | ConfigTapparella | ConfigTermostato;
  creato_il: string;
  aggiornato_il: string;
}

export interface ConfigLuce {
  dimmerabile: boolean;
  livello_corrente?: number;
  accesa: boolean;
}

export interface ConfigTapparella {
  posizione_corrente: number;
  in_movimento: boolean;
}

export interface ConfigTermostato {
  temperatura_corrente: number;
  temperatura_target: number;
  modalita: 'riscaldamento' | 'raffreddamento' | 'auto' | 'spento';
  acceso: boolean;
}

export interface Stanza {
  id: number;
  piano_id: number;
  nome: string;
  icona?: string;
  ordine: number;
  dispositivi?: Dispositivo[];
}

export interface Piano {
  id: number;
  impianto_id: number;
  nome: string;
  ordine: number;
  stanze?: Stanza[];
}

export interface Impianto {
  id: number;
  nome: string;
  indirizzo: string;
  citta: string;
  cap: string;
  cliente_id: number;
  installatore_id: number;
  creato_il: string;
  piani?: Piano[];
}

export interface Scena {
  id: number;
  impianto_id: number;
  nome: string;
  icona: string;
  azioni: any[];
  creato_il: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
