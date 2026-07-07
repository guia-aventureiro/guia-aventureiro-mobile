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
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useColors } from '../hooks/useColors';
import {
  NOTIFICATION_PRIORITY_COLORS,
  NOTIFICATION_TYPE_COLORS,
  OVERLAY_COLORS,
} from '../constants/colors';
import { useNotificationsContext } from '../contexts/NotificationsContext';
import { showAlert } from '../components/CustomAlert';

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

export const NotificationsScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { setUnreadCount: setContextUnreadCount } = useNotificationsContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const params = filter === 'unread' ? { unreadOnly: 'true' } : {};
      const response = await api.get('/notifications', { params });

      const nextNotifications: Notification[] = response.data.notifications || [];
      const nextUnreadCount: number = response.data.unreadCount || 0;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      setContextUnreadCount(nextUnreadCount);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
      showAlert(
        'Não foi possível carregar',
        'Não conseguimos carregar seus alertas agora. Tente novamente em instantes.'
      );
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
      await api.put(`/notifications/${id}/read`);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await loadNotifications();

      showAlert('Tudo certo', 'Todos os alertas foram marcados como lidos.');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      showAlert(
        'Não foi possível concluir',
        'Não conseguimos marcar todos os alertas como lidos agora. Tente novamente.'
      );
    }
  };

  const deleteNotification = async (id: string) => {
    showAlert(
      'Excluir alerta',
      'Deseja realmente excluir este alerta? Essa ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/notifications/${id}`);
              await loadNotifications();

              showAlert('Alerta excluído', 'O alerta foi removido com sucesso.');
            } catch (error) {
              console.error('Erro ao excluir alerta:', error);
              showAlert(
                'Não foi possível excluir',
                'Não conseguimos excluir este alerta agora. Tente novamente.'
              );
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
    if (type && NOTIFICATION_TYPE_COLORS[type]) {
      return NOTIFICATION_TYPE_COLORS[type];
    }

    if (priority && NOTIFICATION_PRIORITY_COLORS[priority]) {
      return NOTIFICATION_PRIORITY_COLORS[priority];
    }

    return colors.primary;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: colors.card },
        !item.read && { backgroundColor: colors.backgroundLight },
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => deleteNotification(item._id)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(item.priority, item.type) },
        ]}
      >
        <Ionicons name={getNotificationIcon(item.type) as any} size={24} color={colors.white} />
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
      <SafeAreaView
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>🔔 Alertas</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Marcar todas como lidas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View
        style={[
          styles.filterContainer,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'all' ? colors.white : colors.textSecondary },
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && { backgroundColor: colors.primary }]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'unread' ? colors.white : colors.textSecondary },
            ]}
          >
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
        <View style={[styles.modalOverlay, { backgroundColor: OVERLAY_COLORS.modalBackdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Header do Modal */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
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
                  <View
                    style={[
                      styles.modalIconContainer,
                      {
                        backgroundColor: getNotificationColor(
                          selectedNotification.priority,
                          selectedNotification.type
                        ),
                      },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(selectedNotification.type) as any}
                      size={32}
                      color={colors.white}
                    />
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
                    {format(new Date(selectedNotification.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </Text>
                </View>

                {/* Botão de Ação */}
                {selectedNotification.actionUrl && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={handleNavigateToAction}
                  >
                    <Ionicons name="arrow-forward" size={20} color={colors.white} />
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
