// mobile/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotificationsContext } from '../contexts/NotificationsContext';

export const useNotifications = () => {
  const { unreadCount, setUnreadCount } = useNotificationsContext();
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      if (__DEV__) {
        console.log('[Notifications] Não foi possível buscar contagem');
      }
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();

    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchUnreadCount, 120000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount,
  };
};
