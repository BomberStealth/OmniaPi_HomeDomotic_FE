import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { useThemeColor } from '@/contexts/ThemeColorContext';
import { useImpiantoContext } from '@/contexts/ImpiantoContext';
import { useAuthStore } from '@/store/authStore';
import { useNotificheStore } from '@/store/notificheStore';
import { api } from '@/services/api';
import { socketService } from '@/services/socket';
import { toast } from '@/utils/toast';
import {
  RiNotification3Line,
  RiWifiLine,
  RiWifiOffLine,
  RiPlayCircleLine,
  RiLightbulbLine,
  RiAlertLine,
  RiCheckLine,
  RiCheckDoubleLine,
  RiRefreshLine
} from 'react-icons/ri';

// ============================================
// NOTIFICHE PAGE - Dark Luxury Style
// Storico notifiche push
// ============================================

interface Notification {
  id: number;
  impianto_id: number;
  user_id: number | null;
  user_name: string | null;
  type: 'gateway_offline' | 'gateway_online' | 'device_offline' | 'device_online' | 'scene_executed' | 'relay_changed' | 'system';
  title: string;
  body: string;
  data: any;
  read_by: string | number[] | null;
  created_at: string;
}

// Helper per convertire hex a rgb
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  }
  return '106, 212, 160';
}

export const Notifiche = () => {
  const { colors: themeColors, modeColors } = useThemeColor();
  const { impiantoCorrente } = useImpiantoContext();
  const { user } = useAuthStore();
  const { resetUnreadCount, decrementUnreadCount } = useNotificheStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Colori dinamici basati sul tema
  const colors = {
    ...modeColors,
    accent: themeColors.accent,
    accentLight: themeColors.accentLight,
    accentDark: themeColors.accentDark,
    border: `rgba(${hexToRgb(themeColors.accent)}, 0.15)`,
    borderHover: `rgba(${hexToRgb(themeColors.accent)}, 0.35)`,
  };

  // Stile base card
  const cardStyle = {
    background: colors.bgCardLit,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    boxShadow: colors.cardShadowLit,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  // Carica notifiche
  const loadNotifications = useCallback(async () => {
    if (!impiantoCorrente?.id) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`/api/notifications/history?impiantoId=${impiantoCorrente.id}&limit=100`);
      // Gestisci sia risposta diretta che wrappata
      const notifs = data?.notifications || [];
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setUnreadCount(typeof data?.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      // Non mostrare toast per evitare spam di errori
    } finally {
      setLoading(false);
    }
  }, [impiantoCorrente?.id]);

  // Ref per gestire listener senza conflitti con lo store
  const notificationHandlerRef = useRef<((notification: any) => void) | null>(null);

  useEffect(() => {
    // Carica notifiche e poi segna tutte come lette automaticamente
    const loadAndMarkRead = async () => {
      await loadNotifications();

      // Segna tutte come lette quando si apre la pagina (senza toast)
      if (impiantoCorrente?.id) {
        try {
          await api.post('/api/notifications/read-all', { impiantoId: impiantoCorrente.id });
          setUnreadCount(0);
          resetUnreadCount(); // Aggiorna store globale
        } catch (error) {
          console.error('Error auto-marking as read:', error);
        }
      }
    };

    loadAndMarkRead();

    if (impiantoCorrente?.id) {
      // Join impianto room per ricevere notifiche real-time
      socketService.joinImpianto(impiantoCorrente.id);
    }

    // Listener per nuove notifiche real-time - usa socket direttamente
    // per non interferire con lo store centralizzato
    const handleNewNotification = (notification: any) => {
      // Aggiungi la nuova notifica in cima alla lista
      setNotifications(prev => {
        // Evita duplicati
        if (prev.some(n => n.id === notification.id)) {
          return prev;
        }
        return [notification, ...prev];
      });
      // Incrementa conteggio locale (lo store lo incrementa già separatamente)
      setUnreadCount(prev => prev + 1);
    };

    // Registra listener direttamente sul socket per evitare conflitti
    notificationHandlerRef.current = handleNewNotification;
    socketService.getSocket()?.on('notification', handleNewNotification);

    return () => {
      if (impiantoCorrente?.id) {
        socketService.leaveImpianto(impiantoCorrente.id);
      }
      // Rimuovi SOLO il nostro listener specifico, non tutti
      if (notificationHandlerRef.current) {
        socketService.getSocket()?.off('notification', notificationHandlerRef.current);
        notificationHandlerRef.current = null;
      }
    };
  }, [loadNotifications, impiantoCorrente?.id, resetUnreadCount]);

  // Parse read_by - può arrivare come stringa JSON o array già parsato
  const parseReadBy = (readByField: string | number[] | null): number[] => {
    if (!readByField) return [];
    if (Array.isArray(readByField)) return readByField;
    if (typeof readByField === 'string') {
      try {
        const parsed = JSON.parse(readByField);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Verifica se letta
  const isRead = (notification: Notification): boolean => {
    if (!user?.id) return false;
    const readBy = parseReadBy(notification.read_by);
    return readBy.includes(user.id);
  };

  // Segna come letta
  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => {
        if (n.id === notificationId && user?.id) {
          const readBy = parseReadBy(n.read_by);
          if (!readBy.includes(user.id)) {
            return { ...n, read_by: JSON.stringify([...readBy, user.id]) };
          }
        }
        return n;
      }));
      setUnreadCount(prev => Math.max(0, prev - 1));
      decrementUnreadCount(); // Aggiorna store globale
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Segna tutte come lette
  const markAllAsRead = async () => {
    if (!impiantoCorrente?.id) return;

    try {
      await api.post('/api/notifications/read-all', { impiantoId: impiantoCorrente.id });
      setNotifications(prev => prev.map(n => {
        if (user?.id) {
          const readBy = parseReadBy(n.read_by);
          if (!readBy.includes(user.id)) {
            return { ...n, read_by: JSON.stringify([...readBy, user.id]) };
          }
        }
        return n;
      }));
      setUnreadCount(0);
      resetUnreadCount(); // Aggiorna store globale - IMPORTANTE!
      toast.success('Tutte le notifiche segnate come lette');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Errore');
    }
  };

  // Icona per tipo
  const getIcon = (type: string) => {
    const iconSize = 22;
    switch (type) {
      case 'gateway_offline':
      case 'device_offline':
        return <RiWifiOffLine size={iconSize} color={colors.error} />;
      case 'gateway_online':
      case 'device_online':
        return <RiWifiLine size={iconSize} color={colors.success} />;
      case 'scene_executed':
        return <RiPlayCircleLine size={iconSize} color={colors.info} />;
      case 'relay_changed':
        return <RiLightbulbLine size={iconSize} color={colors.warning} />;
      case 'system':
        return <RiAlertLine size={iconSize} color={colors.warning} />;
      default:
        return <RiNotification3Line size={iconSize} color={colors.accent} />;
    }
  };

  // Filtra notifiche
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !isRead(n);
    return n.type === filter || n.type.startsWith(filter.replace('_offline', '').replace('_online', ''));
  });

  // Formatta data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  const filterOptions = [
    { value: 'all', label: 'Tutte' },
    { value: 'unread', label: 'Non lette' },
    { value: 'gateway', label: 'Gateway' },
    { value: 'scene_executed', label: 'Scene' },
    { value: 'device', label: 'Dispositivi' },
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: '16px', paddingBottom: '100px' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RiNotification3Line size={28} color={colors.accent} />
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: colors.textPrimary,
              margin: 0
            }}>
              Notifiche
            </h1>
            {unreadCount > 0 && (
              <span style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 'bold',
                borderRadius: '12px',
                color: 'white',
                backgroundColor: colors.accent
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={loadNotifications}
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RiRefreshLine size={20} color={colors.textSecondary} />
            </motion.button>
            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={markAllAsRead}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  background: colors.bgCard,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Segna tutte come lette"
              >
                <RiCheckDoubleLine size={20} color={colors.accent} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Filtri */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {filterOptions.map(f => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                backgroundColor: filter === f.value ? colors.accent : colors.bgCard,
                color: filter === f.value ? 'white' : colors.textSecondary,
                border: `1px solid ${filter === f.value ? colors.accent : colors.border}`,
                fontWeight: filter === f.value ? '600' : '400'
              }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Lista Notifiche */}
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '48px 0'
          }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RiRefreshLine size={32} color={colors.accent} />
            </motion.div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 0'
          }}>
            <RiNotification3Line
              size={48}
              color={colors.textMuted}
              style={{ marginBottom: '16px', opacity: 0.5 }}
            />
            <p style={{ color: colors.textSecondary, margin: 0 }}>
              {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.map((notification, index) => {
              const read = isRead(notification);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => !read && markAsRead(notification.id)}
                  style={{
                    ...cardStyle,
                    padding: '16px',
                    cursor: read ? 'default' : 'pointer',
                    borderColor: read ? colors.border : colors.accent,
                    opacity: read ? 0.7 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ marginTop: '2px' }}>
                      {getIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: colors.textPrimary,
                          margin: 0,
                          fontSize: '15px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.title}
                        </h3>
                        {!read && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: colors.accent,
                            flexShrink: 0
                          }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: '14px',
                        marginTop: '4px',
                        marginBottom: 0,
                        color: colors.textSecondary
                      }}>
                        {notification.body}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        marginBottom: 0,
                        color: colors.textMuted
                      }}>
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                    {read && (
                      <RiCheckLine size={16} color={colors.textMuted} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Notifiche;
