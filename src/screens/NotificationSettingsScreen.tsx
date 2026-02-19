// mobile/src/screens/NotificationSettingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import pushNotificationService, { NotificationSettings } from '../services/pushNotificationService';
import { showAlert } from '../components/CustomAlert';

export const NotificationSettingsScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { toast, hideToast, success, error: showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    tripReminders: true,
    budgetAlerts: true,
    chatMessages: true,
    collaboratorInvites: true,
    travelTips: true,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const saved = await pushNotificationService.loadSettings();
      setSettings(saved);
    } catch (error: any) {
      showError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const checkPermissions = useCallback(async () => {
    const enabled = await pushNotificationService.areNotificationsEnabled();
    setPermissionGranted(enabled);
  }, []);

  const handleToggleEnabled = async (value: boolean) => {
    if (value && !permissionGranted) {
      // Solicitar permissão
      showAlert(
        'Permissão Necessária',
        'Para receber notificações, precisamos da sua permissão.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Permitir',
            onPress: async () => {
              const granted = await pushNotificationService.requestPermissions();
              if (granted) {
                setPermissionGranted(true);
                await handleRegisterToken(true);
                setSettings({ ...settings, enabled: true });
                success('Notificações ativadas!');
              } else {
                showError('Permissão negada. Ative nas configurações do dispositivo.');
              }
            },
          },
        ]
      );
      return;
    }

    if (!value) {
      // Desativar notificações
      showAlert(
        'Desativar Notificações',
        'Você não receberá mais lembretes e alertas do app.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desativar',
            style: 'destructive',
            onPress: async () => {
              await handleRegisterToken(false);
              setSettings({ ...settings, enabled: false });
              success('Notificações desativadas');
            },
          },
        ]
      );
      return;
    }

    await handleRegisterToken(value);
    setSettings({ ...settings, enabled: value });
  };

  const handleRegisterToken = async (shouldRegister: boolean) => {
    try {
      setSaving(true);
      if (shouldRegister) {
        const registered = await pushNotificationService.registerToken();
        if (!registered) {
          throw new Error('Falha ao registrar notificações');
        }
      } else {
        await pushNotificationService.unregisterToken();
      }
    } catch (error: any) {
      showError(error.message || 'Erro ao configurar notificações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await pushNotificationService.saveSettings(newSettings);
    } catch (error: any) {
      showError('Erro ao salvar configuração');
    }
  };

  const handleTestNotification = async () => {
    if (!settings.enabled || !permissionGranted) {
      showAlert(
        'Notificações Desativadas',
        'Ative as notificações para receber o teste.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await pushNotificationService.sendTestNotification();
      success('Notificação de teste enviada!');
    } catch (error: any) {
      showError('Erro ao enviar notificação de teste');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 40 }}>{settings.enabled ? '🔔' : '🔕'}</Text>
          <Text style={[styles.statusText, { color: colors.text }]}>
            {settings.enabled ? 'Notificações Ativadas' : 'Notificações Desativadas'}
          </Text>
          <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
            {permissionGranted
              ? 'Você receberá alertas e lembretes'
              : 'Permita notificações nas configurações'}
          </Text>
        </View>

        {/* Master Toggle */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Ativar Notificações
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Receba lembretes e alertas importantes
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              disabled={saving}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={settings.enabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Individual Settings */}
        {settings.enabled && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tipos de Notificação</Text>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingIcon]}>✈️</Text>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Lembretes de Viagem
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      3 dias antes da viagem
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.tripReminders}
                  onValueChange={(value) => handleToggleSetting('tripReminders', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.tripReminders ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingIcon]}>💰</Text>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Alertas de Orçamento
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      Quando ultrapassar 80% do orçamento
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.budgetAlerts}
                  onValueChange={(value) => handleToggleSetting('budgetAlerts', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.budgetAlerts ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingIcon]}>💬</Text>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Mensagens de Chat
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      Novas mensagens em roteiros colaborativos
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.chatMessages}
                  onValueChange={(value) => handleToggleSetting('chatMessages', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.chatMessages ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingIcon]}>👥</Text>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Convites de Colaboração
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      Quando alguém te adicionar a um roteiro
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.collaboratorInvites}
                  onValueChange={(value) => handleToggleSetting('collaboratorInvites', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.collaboratorInvites ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingIcon]}>💡</Text>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.text }]}>
                      Dicas de Viagem
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                      1 dia antes da viagem
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.travelTips}
                  onValueChange={(value) => handleToggleSetting('travelTips', value)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={settings.travelTips ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>
          </>
        )}

        {/* Test Button */}
        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: settings.enabled && permissionGranted ? colors.primary : colors.border,
            },
          ]}
          onPress={handleTestNotification}
          disabled={!settings.enabled || !permissionGranted}
        >
          <Text
            style={[
              styles.testButtonText,
              {
                color: settings.enabled && permissionGranted ? '#FFF' : colors.textSecondary,
              },
            ]}
          >
            🧪 Enviar Notificação de Teste
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 Dica: Você pode gerenciar notificações nas configurações do seu dispositivo a
            qualquer momento.
          </Text>
        </View>
      </ScrollView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    alignItems: 'center',
    padding: 32,
    margin: 16,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  statusSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 13,
  },
  testButton: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
