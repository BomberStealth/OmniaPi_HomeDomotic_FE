import { useState, useEffect } from 'react';
import { socketService } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';

// ============================================
// WEBSOCKET DEBUG COMPONENT
// Mostra stato connessione e room in tempo reale
// ============================================

export function WebSocketDebug() {
  const [connected, setConnected] = useState(socketService.isConnected());
  const user = useAuthStore((state) => state.user);
  const { impiantoCorrente } = useImpiantoContext();

  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(socketService.isConnected());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      right: 10,
      background: 'rgba(0,0,0,0.85)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: 8,
      fontSize: 11,
      zIndex: 9999,
      fontFamily: 'monospace',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ marginBottom: 4 }}>
        {connected ? '🟢' : '🔴'} WS: {connected ? 'Connesso' : 'Disconnesso'}
      </div>
      <div style={{ marginBottom: 2, color: '#aaa' }}>
        👤 user_{user?.id || '?'}
      </div>
      <div style={{ color: '#aaa' }}>
        🏠 {impiantoCorrente ? `impianto_${impiantoCorrente.id}` : 'nessuna'}
      </div>
    </div>
  );
}
