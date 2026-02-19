// mobile/src/services/pushNotificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar comportamento das notificações quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

export interface NotificationSettings {
  enabled: boolean;
  tripReminders: boolean;
  budgetAlerts: boolean;
  chatMessages: boolean;
  collaboratorInvites: boolean;
  travelTips: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  tripReminders: true,
  budgetAlerts: true,
  chatMessages: true,
  collaboratorInvites: true,
  travelTips: true,
};

const pushNotificationService = {
  /**
   * Solicita permissões para notificações push
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications só funcionam em dispositivos físicos');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permissão de notificações negada');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  },

  /**
   * Obtém o token de push notifications do Expo
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Substituir pelo ID real do projeto Expo
      });
      return token.data;
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  },

  /**
   * Registra o token no backend
   */
  async registerToken(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      const token = await this.getExpoPushToken();
      if (!token) {
        return false;
      }

      const deviceId = Device.osInternalBuildId || 'unknown';
      const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;
      const platform = Platform.OS as 'ios' | 'android' | 'web';

      await api.post('/push/register', {
        token,
        platform,
        deviceId,
        deviceName,
      });

      // Salvar token localmente
      await AsyncStorage.setItem('push_token', token);

      return true;
    } catch (error) {
      console.error('Erro ao registrar token:', error);
      return false;
    }
  },

  /**
   * Remove o registro do token no backend
   */
  async unregisterToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('push_token');
      if (!token) {
        return true;
      }

      await api.post('/push/unregister', { token });
      await AsyncStorage.removeItem('push_token');

      return true;
    } catch (error) {
      console.error('Erro ao desregistrar token:', error);
      return false;
    }
  },

  /**
   * Configura os listeners para notificações
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listener para quando recebe notificação (app em foreground)
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notificação recebida:', notification);
      onNotificationReceived?.(notification);
    });

    // Listener para quando o usuário toca na notificação
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notificação tocada:', response);
      onNotificationTapped?.(response);
    });

    // Retornar função para remover listeners
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  },

  /**
   * Salva configurações de notificações
   */
  async saveSettings(settings: NotificationSettings): Promise<void> {
    await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
  },

  /**
   * Carrega configurações de notificações
   */
  async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem('notification_settings');
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Verifica se as notificações estão habilitadas
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Envia uma notificação de teste local
   */
  async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Notificação de Teste',
        body: 'Suas notificações estão funcionando perfeitamente!',
        data: { type: 'test' },
      },
      trigger: null, // null = enviar imediatamente
    });
  },

  /**
   * Limpa todas as notificações exibidas
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  },

  /**
   * Obtém o badge count atual
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  },

  /**
   * Define o badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },
};

export default pushNotificationService;
