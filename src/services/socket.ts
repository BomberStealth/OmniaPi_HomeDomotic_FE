import { io, Socket } from 'socket.io-client';
import { OmniapiGateway, OmniapiNode } from './omniapiApi';

// ============================================
// WEBSOCKET SERVICE
// ============================================

// Se VITE_API_URL è vuoto, usa URL relativo (same-origin)
// Socket.io si connetterà automaticamente allo stesso host del frontend
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connesso');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnesso');
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket errore:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinImpianto(impiantoId: number) {
    this.socket?.emit('join-impianto', impiantoId);
  }

  leaveImpianto(impiantoId: number) {
    this.socket?.emit('leave-impianto', impiantoId);
  }

  onDispositivoUpdate(callback: (dispositivo: any) => void) {
    this.socket?.on('dispositivo-update', callback);
  }

  offDispositivoUpdate() {
    this.socket?.off('dispositivo-update');
  }

  // ============================================
  // OMNIAPI WEBSOCKET EVENTS
  // ============================================

  onOmniapiGatewayUpdate(callback: (gateway: OmniapiGateway) => void) {
    this.socket?.on('omniapi-gateway-update', callback);
  }

  offOmniapiGatewayUpdate() {
    this.socket?.off('omniapi-gateway-update');
  }

  onOmniapiNodeUpdate(callback: (node: OmniapiNode) => void) {
    this.socket?.on('omniapi-node-update', callback);
  }

  offOmniapiNodeUpdate() {
    this.socket?.off('omniapi-node-update');
  }

  onOmniapiNodesUpdate(callback: (nodes: OmniapiNode[]) => void) {
    this.socket?.on('omniapi-nodes-update', callback);
  }

  offOmniapiNodesUpdate() {
    this.socket?.off('omniapi-nodes-update');
  }

  // ============================================
  // NOTIFICATION WEBSOCKET EVENTS
  // ============================================

  onNotification(callback: (notification: NotificationEvent) => void) {
    this.socket?.on('notification', callback);
  }

  offNotification() {
    this.socket?.off('notification');
  }
}

// Notification event type
export interface NotificationEvent {
  id: number;
  impiantoId: number;
  type: string;
  title: string;
  body: string;
  data?: any;
  created_at: string;
}

export const socketService = new SocketService();
