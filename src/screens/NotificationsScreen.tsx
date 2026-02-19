// mobile/src/screens/NotificationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useColors } from '../hooks/useColors';
import { useNotificationsContext } from '../contexts/NotificationsContext';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  priority?: 'high' | 'medium' | 'low';
}

// ========== DADOS MOCKADOS TEMPORÁRIOS ==========
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: 'notif-1',
    type: 'itinerary_shared',
    title: '🎉 Novo roteiro compartilhado',
    message: 'Marina Kobayashi compartilhou o roteiro "Roteiro Gastronômico em Tóquio" com você',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    actionUrl: '/itinerary/mock-3',
    priority: 'high',
  },
  {
    _id: 'notif-2',
    type: 'itinerary_reminder',
    title: '✈️ Seu roteiro começa em breve!',
    message: 'Preparado para "Explorando Paris em 5 Dias"? A viagem começa em 3 dias!',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
    actionUrl: '/itinerary/mock-1',
    priority: 'high',
  },
  {
    _id: 'notif-3',
    type: 'budget_alert',
    title: '💰 Atenção ao orçamento',
    message: 'Você já gastou 80% do orçamento previsto em "Praias Paradisíacas do Caribe"',
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    actionUrl: '/itinerary/mock-4',
    priority: 'medium',
  },
  {
    _id: 'notif-4',
    type: 'collaboration',
    title: '👥 Convite de colaboração',
    message: 'Carlos Mendes te convidou para colaborar no roteiro "Aventura na Patagônia"',
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias atrás
    actionUrl: '/itinerary/mock-2',
    priority: 'medium',
  },
  {
    _id: 'notif-5',
    type: 'ai_suggestion',
    title: '✨ Sugestão da IA',
    message: 'Novos pontos turísticos foram adicionados ao seu roteiro de Paris baseado nas suas preferências',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias atrás
    actionUrl: '/itinerary/mock-1',
    priority: 'low',
  },
  {
    _id: 'notif-6',
    type: 'premium',
    title: '⭐ Descubra o Premium',
    message: 'Obtenha roteiros ilimitados, integração com Google Maps e muito mais! 30% de desconto hoje.',
    read: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias atrás
    priority: 'low',
  },
  {
    _id: 'notif-7',
    type: 'system',
    title: '🔄 Atualização disponível',
    message: 'Uma nova versão do aplicativo está disponível com melhorias de desempenho',
    read: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias atrás
    priority: 'low',
  },
];
// ================================================

export const NotificationsScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { decrementUnreadCount, resetUnreadCount, setUnreadCount: setContextUnreadCount } = useNotificationsContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      // ========== USANDO DADOS MOCKADOS ==========
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filtra notificações conforme o filtro selecionado
      const filteredNotifications = filter === 'unread' 
        ? MOCK_NOTIFICATIONS.filter(n => !n.read)
        : MOCK_NOTIFICATIONS;
      
      // Calcula notificações não lidas
      const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;
      
      setNotifications(filteredNotifications);
      setUnreadCount(unread);
      setContextUnreadCount(unread); // Atualiza o contexto global
      // ==========================================
      
      // Código original comentado (substituir quando backend estiver pronto):
      // const params = filter === 'unread' ? { unreadOnly: 'true' } : {};
      // const response = await api.get('/notifications', { params });
      // setNotifications(response.data.notifications);
      // setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, setContextUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      // ========== USANDO DADOS MOCKADOS ==========
      // Atualiza estado local
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      decrementUnreadCount(); // Atualiza o contexto global
      
      // Atualiza array mock (para persistir entre renders)
      const notifIndex = MOCK_NOTIFICATIONS.findIndex(n => n._id === id);
      if (notifIndex !== -1) {
        MOCK_NOTIFICATIONS[notifIndex].read = true;
      }
      // ==========================================
      
      // Código original comentado:
      // await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // ========== USANDO DADOS MOCKADOS ==========
      // Atualiza estado local
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      resetUnreadCount(); // Atualiza o contexto global
      
      // Atualiza array mock
      MOCK_NOTIFICATIONS.forEach(n => n.read = true);
      
      Alert.alert('Sucesso', 'Todos os alertas foram marcados como lidos');
      // ==========================================
      
      // Código original comentado:
      // await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      Alert.alert('Erro', 'Não foi possível marcar todas como lidas');
    }
  };

  const deleteNotification = async (id: string) => {
    Alert.alert(
      'Excluir Alerta',
      'Deseja realmente excluir este alerta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // ========== USANDO DADOS MOCKADOS ==========
              // Atualiza estado local
              setNotifications((prev) => prev.filter((n) => n._id !== id));
              
              // Remove do array mock
              const notifIndex = MOCK_NOTIFICATIONS.findIndex(n => n._id === id);
              if (notifIndex !== -1) {
                MOCK_NOTIFICATIONS.splice(notifIndex, 1);
              }
              // ==========================================
              
              // Código original comentado:
              // await api.delete(`/notifications/${id}`);
            } catch (error) {
              console.error('Erro ao excluir alerta:', error);
              Alert.alert('Erro', 'Não foi possível excluir o alerta');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Abre modal com detalhes completos da notificação
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleNavigateToAction = () => {
    if (selectedNotification?.actionUrl) {
      setModalVisible(false);
      
      // Parse actionUrl e navega (ex: /itinerary/123 -> ItineraryDetail)
      const match = selectedNotification.actionUrl.match(/\/itinerary\/(.+)/);
      if (match) {
        navigation.navigate('ItineraryDetail', { id: match[1] });
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      itinerary_shared: 'share-social',
      itinerary_reminder: 'airplane',
      budget_alert: 'wallet',
      collaboration: 'people',
      ai_suggestion: 'sparkles',
      premium: 'star',
      system: 'refresh-circle',
      trip_reminder: 'calendar',
      collaboration_invite: 'person-add',
      new_follower: 'person-add',
      like_notification: 'heart',
      comment_notification: 'chatbubble',
      achievement_unlocked: 'trophy',
      weather_alert: 'cloud',
      activity_reminder: 'time',
      system_update: 'download',
      promotion: 'megaphone',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (priority?: string, type?: string) => {
    // Cores específicas por tipo de notificação
    const typeColors: Record<string, string> = {
      itinerary_shared: '#34C759',      // Verde (compartilhamento)
      itinerary_reminder: '#007AFF',    // Azul (lembrete)
      budget_alert: '#FF9500',          // Laranja (alerta)
      collaboration: '#5856D6',         // Roxo (colaboração)
      ai_suggestion: '#AF52DE',         // Lilás (IA)
      premium: '#FFD700',               // Dourado (premium)
      system: '#8E8E93',                // Cinza (sistema)
    };
    
    // Se tiver cor específica para o tipo, usa ela
    if (type && typeColors[type]) {
      return typeColors[type];
    }
    
    // Senão, usa por prioridade
    if (priority === 'high') return '#FF3B30';
    if (priority === 'medium') return '#FF9500';
    return '#007AFF';
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: colors.card }, !item.read && { backgroundColor: colors.backgroundLight }]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item._id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.priority, item.type) }]}>
        <Ionicons name={getNotificationIcon(item.type) as any} size={24} color="#FFF" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.textLight }]}>
          {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🔔 Alertas</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={[styles.filterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: filter === 'all' ? '#FFF' : colors.textSecondary }]}>
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, { color: filter === 'unread' ? '#FFF' : colors.textSecondary }]}>
            Não lidas ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum alerta</Text>
          </View>
        }
      />

      {/* Modal de Detalhes da Notificação */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Alerta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Conteúdo */}
            {selectedNotification && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Ícone e Título */}
                <View style={styles.modalIconRow}>
                  <View style={[styles.modalIconContainer, { backgroundColor: getNotificationColor(selectedNotification.priority, selectedNotification.type) }]}>
                    <Ionicons name={getNotificationIcon(selectedNotification.type) as any} size={32} color="#FFF" />
                  </View>
                  <Text style={[styles.modalNotificationTitle, { color: colors.text }]}>
                    {selectedNotification.title}
                  </Text>
                </View>

                {/* Mensagem Completa */}
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  {selectedNotification.message}
                </Text>

                {/* Data/Hora */}
                <View style={styles.modalTimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.textLight} />
                  <Text style={[styles.modalTime, { color: colors.textLight }]}>
                    {format(new Date(selectedNotification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </Text>
                </View>

                {/* Botão de Ação */}
                {selectedNotification.actionUrl && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleNavigateToAction}
                  >
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Ver Roteiro</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  markAllButton: {
    marginTop: 8,
  },
  markAllText: {
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalNotificationTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTime: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
