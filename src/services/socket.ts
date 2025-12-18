import { io, Socket } from 'socket.io-client';

// ============================================
// WEBSOCKET SERVICE
// ============================================

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://192.168.1.11:3000';

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
}

export const socketService = new SocketService();
