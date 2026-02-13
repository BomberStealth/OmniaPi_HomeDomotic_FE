import { io, Socket } from 'socket.io-client';

// ============================================
// WEBSOCKET SERVICE - Refactored Architecture
// Single event channel with typed events
// ============================================

// Event types matching backend WS_EVENTS
export const WS_EVENTS = {
  // Scene
  SCENA_CREATED: 'SCENA_CREATED',
  SCENA_UPDATED: 'SCENA_UPDATED',
  SCENA_DELETED: 'SCENA_DELETED',
  SCENA_EXECUTED: 'SCENA_EXECUTED',

  // Stanze
  STANZA_CREATED: 'STANZA_CREATED',
  STANZA_UPDATED: 'STANZA_UPDATED',
  STANZA_DELETED: 'STANZA_DELETED',

  // Dispositivi
  DISPOSITIVO_CREATED: 'DISPOSITIVO_CREATED',
  DISPOSITIVO_UPDATED: 'DISPOSITIVO_UPDATED',
  DISPOSITIVO_DELETED: 'DISPOSITIVO_DELETED',
  DISPOSITIVO_STATE_CHANGED: 'DISPOSITIVO_STATE_CHANGED',

  // Condivisioni
  CONDIVISIONE_CREATED: 'CONDIVISIONE_CREATED',
  CONDIVISIONE_ACCEPTED: 'CONDIVISIONE_ACCEPTED',
  CONDIVISIONE_REJECTED: 'CONDIVISIONE_REJECTED',
  CONDIVISIONE_REMOVED: 'CONDIVISIONE_REMOVED',
  CONDIVISIONE_UPDATED: 'CONDIVISIONE_UPDATED',

  // User-specific
  INVITE_RECEIVED: 'INVITE_RECEIVED',
  INVITE_ACCEPTED: 'INVITE_ACCEPTED',
  INVITE_REJECTED: 'INVITE_REJECTED',
  KICKED_FROM_IMPIANTO: 'KICKED_FROM_IMPIANTO',
  PERMESSI_AGGIORNATI: 'PERMESSI_AGGIORNATI',

  // Gateway/Nodes
  GATEWAY_ASSOCIATED: 'GATEWAY_ASSOCIATED',
  GATEWAY_DISASSOCIATED: 'GATEWAY_DISASSOCIATED',
  GATEWAY_UPDATED: 'GATEWAY_UPDATED',
  NODE_UPDATED: 'NODE_UPDATED',
  LED_UPDATED: 'LED_UPDATED',

  // Notifications
  NOTIFICATION: 'NOTIFICATION',

  // Sync
  FULL_SYNC: 'FULL_SYNC',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];

// Interface for WebSocket events
export interface WSEvent<T = any> {
  type: WSEventType | string;
  payload: T;
  impiantoId?: number;
  timestamp: string;
}

type EventCallback = (event: WSEvent) => void;

// Socket URL configuration
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

class SocketService {
  private socket: Socket | null = null;
  private eventCallbacks: Set<EventCallback> = new Set();
  private reconnectCallbacks: Set<() => void> = new Set();
  private connectionStateCallbacks: Set<(connected: boolean) => void> = new Set();
  private currentImpiantoId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private connectionPromise: Promise<void> | null = null;
  private wasEverConnected = false;

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    // If already connecting, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      console.log('[WS] Connecting to:', SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('[WS] ✅ Connected:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.connectionPromise = null;

        // Notify connection state listeners
        this.connectionStateCallbacks.forEach(cb => cb(true));

        // Rejoin impianto if we had one
        if (this.currentImpiantoId) {
          this.joinImpianto(this.currentImpiantoId);
        }

        // Trigger reconnection callbacks (data refresh)
        if (this.wasEverConnected) {
          console.log('[WS] 🔄 Reconnected — triggering data refresh');
          this.reconnectCallbacks.forEach(cb => cb());
        }
        this.wasEverConnected = true;

        // Start heartbeat
        this.startHeartbeat();

        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WS] ❌ Disconnected:', reason);
        this.stopHeartbeat();
        // Notify connection state listeners
        this.connectionStateCallbacks.forEach(cb => cb(false));
      });

      this.socket.on('connect_error', (err) => {
        console.log('[WS] ⚠️ Connection error:', err.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.connectionPromise = null;
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      // Unified event listener
      this.socket.on('ws-event', (event: WSEvent) => {
        console.log('[WS] 📨 Event:', event.type);
        this.eventCallbacks.forEach(cb => cb(event));
      });

      // Heartbeat response
      this.socket.on('pong', () => {
        // Heartbeat received
      });
    });

    return this.connectionPromise;
  }

  disconnect() {
    this.stopHeartbeat();
    this.socket?.disconnect();
    this.socket = null;
    this.currentImpiantoId = null;
    this.connectionPromise = null;
    this.eventCallbacks.clear();
    this.reconnectCallbacks.clear();
    this.connectionStateCallbacks.clear();
    this.wasEverConnected = false;
    console.log('[WS] Disconnected');
  }

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  joinImpianto(impiantoId: number) {
    // Evita join duplicati per lo stesso impianto
    if (this.currentImpiantoId === impiantoId) {
      console.log('[WS] Already in impianto:', impiantoId);
      return;
    }

    if (this.currentImpiantoId && this.currentImpiantoId !== impiantoId) {
      this.leaveImpianto(this.currentImpiantoId);
    }

    this.currentImpiantoId = impiantoId;

    if (this.socket?.connected) {
      // Emit in new format
      this.socket.emit('join-impianto', { impiantoId });
      // Also emit in old format for backward compat
      this.socket.emit('join-impianto', impiantoId);
      console.log('[WS] 📍 Joined impianto:', impiantoId);
    } else {
      console.log('[WS] 📍 Will join impianto on connect:', impiantoId);
    }
  }

  leaveImpianto(impiantoId: number) {
    if (this.socket?.connected) {
      this.socket.emit('leave-impianto', { impiantoId });
      this.socket.emit('leave-impianto', impiantoId);
      console.log('[WS] 👋 Left impianto:', impiantoId);
    }
    if (this.currentImpiantoId === impiantoId) {
      this.currentImpiantoId = null;
    }
  }

  getCurrentImpiantoId(): number | null {
    return this.currentImpiantoId;
  }

  // ============================================
  // EVENT SUBSCRIPTION
  // ============================================

  /**
   * Subscribe to all WebSocket events
   * Returns unsubscribe function
   */
  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => this.eventCallbacks.delete(callback);
  }

  /**
   * Subscribe to specific event type(s)
   */
  on(eventTypes: WSEventType | WSEventType[], callback: (payload: any) => void): () => void {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    const handler: EventCallback = (event) => {
      if (types.includes(event.type as WSEventType)) {
        callback(event.payload);
      }
    };

    this.eventCallbacks.add(handler);
    return () => this.eventCallbacks.delete(handler);
  }

  // ============================================
  // HEARTBEAT
  // ============================================

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ============================================
  // STATUS
  // ============================================

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // ============================================
  // RECONNECTION CALLBACK
  // ============================================

  onReconnect(callback: () => void): () => void {
    this.reconnectCallbacks.add(callback);
    return () => this.reconnectCallbacks.delete(callback);
  }

  /**
   * Subscribe to connection state changes (connected/disconnected)
   * Returns unsubscribe function
   */
  onConnectionStateChange(callback: (connected: boolean) => void): () => void {
    this.connectionStateCallbacks.add(callback);
    return () => this.connectionStateCallbacks.delete(callback);
  }
}

// Singleton instance
export const socketService = new SocketService();
