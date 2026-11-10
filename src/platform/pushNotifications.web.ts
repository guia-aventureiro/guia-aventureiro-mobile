// mobile/src/platform/pushNotifications.web.ts
// Push notifications — stub web (no-op).
// Push de navegador fica para uma fase futura; na web MVP as notificações
// aparecem apenas na central (API), sem registro de dispositivo.

export interface NotificationSettings {
  enabled: boolean;
  tripReminders: boolean;
  budgetAlerts: boolean;
  chatMessages: boolean;
  collaboratorInvites: boolean;
  travelTips: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  tripReminders: false,
  budgetAlerts: false,
  chatMessages: false,
  collaboratorInvites: false,
  travelTips: false,
};

const pushNotificationService = {
  async requestPermissions(): Promise<boolean> {
    return false;
  },

  async areNotificationsEnabled(): Promise<boolean> {
    return false;
  },

  async registerToken(): Promise<string | null> {
    return null;
  },

  async unregisterToken(): Promise<void> {},

  async saveSettings(_settings: NotificationSettings): Promise<void> {},

  async loadSettings(): Promise<NotificationSettings> {
    return { ...DEFAULT_SETTINGS };
  },

  async sendTestNotification(): Promise<void> {},
};

export default pushNotificationService;
