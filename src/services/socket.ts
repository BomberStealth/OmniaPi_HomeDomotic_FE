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
  private currentImpiantoId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private connectionPromise: Promise<void> | null = null;

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

        // Rejoin impianto if we had one
        if (this.currentImpiantoId) {
          this.joinImpianto(this.currentImpiantoId);
        }

        // Start heartbeat
        this.startHeartbeat();

        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[WS] ❌ Disconnected:', reason);
        this.stopHeartbeat();
      });

      this.socket.on('connect_error', (err) => {
        console.log('[WS] ⚠️ Connection error:', err.message);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.connectionPromise = null;
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      // NEW: Unified event listener for new architecture
      this.socket.on('ws-event', (event: WSEvent) => {
        console.log('[WS] 📨 Event:', event.type);
        this.eventCallbacks.forEach(cb => cb(event));
      });

      // LEGACY: Keep old listeners for backward compatibility during migration
      this.setupLegacyListeners();

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
  // LEGACY LISTENERS (for backward compatibility)
  // Will be removed after full migration
  // ============================================

  private setupLegacyListeners() {
    if (!this.socket) return;

    // Convert legacy events to new format
    const legacyMappings: Array<{ event: string; type: WSEventType | string }> = [
      // Stanze
      { event: 'stanza-update', type: 'LEGACY_STANZA_UPDATE' },
      // Scene
      { event: 'scena-update', type: 'LEGACY_SCENA_UPDATE' },
      // Dispositivi
      { event: 'dispositivo-update', type: 'LEGACY_DISPOSITIVO_UPDATE' },
      // Condivisioni - RIMOSSO: ora usa ws-event, legacy causava duplicati
      // { event: 'condivisione-update', type: 'LEGACY_CONDIVISIONE_UPDATE' },
      // Gateway
      { event: 'gateway-update', type: 'LEGACY_GATEWAY_UPDATE' },
      // Omniapi nodes
      { event: 'omniapi-node-update', type: WS_EVENTS.NODE_UPDATED },
      { event: 'omniapi-nodes-update', type: WS_EVENTS.NODE_UPDATED },
      { event: 'omniapi-led-update', type: WS_EVENTS.LED_UPDATED },
      { event: 'omniapi-gateway-update', type: WS_EVENTS.GATEWAY_UPDATED },
      // Notifications
      { event: 'notification', type: WS_EVENTS.NOTIFICATION },
      // Permessi
      { event: 'permessi-aggiornati', type: WS_EVENTS.PERMESSI_AGGIORNATI },
      { event: 'condivisione-rimossa', type: WS_EVENTS.KICKED_FROM_IMPIANTO },
      // Full sync
      { event: 'full-sync', type: WS_EVENTS.FULL_SYNC },
      // Device update
      { event: 'device-update', type: WS_EVENTS.DISPOSITIVO_STATE_CHANGED },
    ];

    legacyMappings.forEach(({ event, type }) => {
      this.socket?.on(event, (data: any) => {
        // Convert legacy format to new format
        let payload = data;

        // Handle legacy {action, data} format
        if (data && typeof data === 'object' && 'action' in data) {
          // Map legacy action to specific event type
          const actionMap: Record<string, string> = {
            created: type.replace('LEGACY_', '').replace('_UPDATE', '_CREATED'),
            updated: type.replace('LEGACY_', '').replace('_UPDATE', '_UPDATED'),
            deleted: type.replace('LEGACY_', '').replace('_UPDATE', '_DELETED'),
            executed: type.replace('LEGACY_', '').replace('_UPDATE', '_EXECUTED'),
            accepted: type.replace('LEGACY_', '').replace('_UPDATE', '_ACCEPTED'),
            removed: type.replace('LEGACY_', '').replace('_UPDATE', '_REMOVED'),
            'state-changed': type.replace('LEGACY_', '').replace('_UPDATE', '_STATE_CHANGED'),
          };

          const mappedType = actionMap[data.action] || type;
          payload = data.stanza || data.scena || data.dispositivo || data.condivisione || data.gateway || data;

          const wsEvent: WSEvent = {
            type: mappedType,
            payload,
            timestamp: new Date().toISOString()
          };

          console.log('[WS] 📨 Legacy event converted:', event, '->', mappedType);
          this.eventCallbacks.forEach(cb => cb(wsEvent));
        } else {
          // Just forward as-is
          const wsEvent: WSEvent = {
            type,
            payload,
            timestamp: new Date().toISOString()
          };

          console.log('[WS] 📨 Legacy event:', event);
          this.eventCallbacks.forEach(cb => cb(wsEvent));
        }
      });
    });
  }

  // ============================================
  // LEGACY COMPATIBILITY METHODS
  // Keep these for components not yet migrated
  // ============================================

  // Scene
  onScenaUpdate(callback: (data: { scena: any; action: string }) => void) {
    this.socket?.on('scena-update', callback);
  }
  offScenaUpdate() {
    this.socket?.off('scena-update');
  }

  // Stanze
  onStanzaUpdate(callback: (data: { stanza: any; action: string }) => void) {
    this.socket?.on('stanza-update', callback);
  }
  offStanzaUpdate() {
    this.socket?.off('stanza-update');
  }

  // Dispositivi
  onDispositivoUpdate(callback: (data: { dispositivo: any; action: string }) => void) {
    this.socket?.on('dispositivo-update', callback);
  }
  offDispositivoUpdate() {
    this.socket?.off('dispositivo-update');
  }

  // Full Sync
  onFullSync(callback: (data: { stanze?: any[]; scene?: any[]; dispositivi?: any[] }) => void) {
    this.socket?.on('full-sync', callback);
  }
  offFullSync() {
    this.socket?.off('full-sync');
  }

  // Gateway
  onGatewayUpdate(callback: (data: { gateway: any; action: string }) => void) {
    this.socket?.on('gateway-update', callback);
  }
  offGatewayUpdate() {
    this.socket?.off('gateway-update');
  }

  // Omniapi
  onOmniapiGatewayUpdate(callback: (gateway: any) => void) {
    this.socket?.on('omniapi-gateway-update', callback);
  }
  offOmniapiGatewayUpdate() {
    this.socket?.off('omniapi-gateway-update');
  }

  onOmniapiNodeUpdate(callback: (node: any) => void) {
    this.socket?.on('omniapi-node-update', callback);
  }
  offOmniapiNodeUpdate() {
    this.socket?.off('omniapi-node-update');
  }

  onOmniapiNodesUpdate(callback: (nodes: any[]) => void) {
    this.socket?.on('omniapi-nodes-update', callback);
  }
  offOmniapiNodesUpdate() {
    this.socket?.off('omniapi-nodes-update');
  }

  onOmniapiLedUpdate(callback: (ledDevice: any) => void) {
    this.socket?.on('omniapi-led-update', callback);
  }
  offOmniapiLedUpdate() {
    this.socket?.off('omniapi-led-update');
  }

  // Device update
  onDeviceUpdate(callback: (payload: any) => void) {
    this.socket?.on('device-update', callback);
  }
  offDeviceUpdate() {
    this.socket?.off('device-update');
  }

  // Notifications
  onNotification(callback: (notification: any) => void) {
    this.socket?.on('notification', callback);
  }
  offNotification() {
    this.socket?.off('notification');
  }

  // Permessi
  onPermessiAggiornati(callback: (data: any) => void) {
    this.socket?.on('permessi-aggiornati', callback);
  }
  offPermessiAggiornati() {
    this.socket?.off('permessi-aggiornati');
  }

  // Condivisione rimossa
  onCondivisioneRimossa(callback: (data: any) => void) {
    this.socket?.on('condivisione-rimossa', callback);
  }
  offCondivisioneRimossa() {
    this.socket?.off('condivisione-rimossa');
  }

  // Condivisione update
  onCondivisioneUpdate(callback: (data: CondivisioneUpdateEvent) => void) {
    this.socket?.on('condivisione-update', callback);
  }
  offCondivisioneUpdate() {
    this.socket?.off('condivisione-update');
  }
}

// Legacy type exports for backward compatibility
export interface NotificationEvent {
  id: number;
  impiantoId: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  created_at: string;
}

export interface PermessiAggiornatoEvent {
  tipo: 'permessi-aggiornati';
  impianto_id: number;
  puo_controllare_dispositivi: boolean;
  puo_vedere_stato: boolean;
  stanze_abilitate: number[] | null;
}

export interface CondivisioneRimossaEvent {
  tipo: 'condivisione-rimossa';
  impianto_id: number;
}

export interface CondivisioneUpdateEvent {
  condivisione: any;
  action: 'created' | 'accepted' | 'removed';
}

// Singleton instance
export const socketService = new SocketService();
