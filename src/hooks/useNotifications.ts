// mobile/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNotificationsContext } from '../contexts/NotificationsContext';

// ========== DADOS MOCKADOS TEMPORÁRIOS ==========
// Mesmos dados do NotificationsScreen
const MOCK_NOTIFICATIONS = [
  { read: false }, // itinerary_shared
  { read: false }, // itinerary_reminder
  { read: false }, // budget_alert
  { read: true },  // collaboration
  { read: true },  // ai_suggestion
  { read: true },  // premium
  { read: true },  // system
];
// ================================================

export const useNotifications = () => {
  const { unreadCount, setUnreadCount } = useNotificationsContext();
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      
      // ========== USANDO DADOS MOCKADOS ==========
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Conta notificações não lidas
      const count = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
      setUnreadCount(count);
      // ==========================================
      
      // Código original comentado:
      // const response = await api.get('/notifications/unread-count');
      // setUnreadCount(response.data.count || 0);
    } catch (error) {
      // Silenciar erro em dev - não crítico
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
