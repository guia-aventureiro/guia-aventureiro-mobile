// mobile/src/screens/UsageScreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import {
  useMySubscription,
  useUsage,
  useCancelSubscription,
  useReactivateSubscription,
} from '../hooks/useSubscription';
import { UsageBar } from '../components/UsageBar';
import { PlanBadge } from '../components/PlanBadge';
import { Button } from '../components/Button';
import { showAlert } from '../components/CustomAlert';

export const UsageScreen = ({ navigation }: any) => {
  const colors = useColors();
  const {
    data: subscriptionData,
    isLoading: loadingSub,
    refetch: refetchSub,
    isFetching: fetchingSub,
  } = useMySubscription();
  const {
    data: usageData,
    isLoading: loadingUsage,
    refetch: refetchUsage,
    isFetching: fetchingUsage,
  } = useUsage();
  const cancelMutation = useCancelSubscription();
  const reactivateMutation = useReactivateSubscription();

  const [refreshing, setRefreshing] = useState(false);

  const subscription = subscriptionData?.subscription;
  const usage = usageData?.usage;
  const planDetails = subscriptionData?.subscription?.planDetails;

  // Refetch ao montar pela primeira vez
  useEffect(() => {
    const doRefetch = async () => {
      try {
        await Promise.all([refetchSub(), refetchUsage()]);
      } catch (error) {
        console.error('Erro ao carregar dados de subscription na montagem:', error);
        // Loading states continuam, mostram estado de erro ao usuário
      }
    };
    doRefetch();
  }, [refetchSub, refetchUsage]);

  // Refetch ao ganhar foco para sempre mostrar dados atualizados
  useFocusEffect(
    useCallback(() => {
      const doRefetch = async () => {
        try {
          await Promise.all([refetchSub(), refetchUsage()]);
        } catch (err) {
          console.error('❌ Erro no refetch:', err);
        }
      };
      doRefetch();
    }, [refetchSub, refetchUsage])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSub(), refetchUsage()]);
    setRefreshing(false);
  };

  const handleUpgrade = () => {
    navigation.navigate('Pricing');
  };

  const handleCancelSubscription = () => {
    showAlert(
      'Cancelar Assinatura',
      'Tem certeza que deseja cancelar? Você terá acesso até o fim do período pago.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(undefined);
              showAlert('Sucesso', 'Assinatura cancelada com sucesso.');
            } catch (error: any) {
              showAlert('Erro', error.response?.data?.message || 'Erro ao cancelar assinatura.');
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    try {
      await reactivateMutation.mutateAsync();
      showAlert('Sucesso', 'Assinatura reativada com sucesso!');
    } catch (error: any) {
      showAlert('Erro', error.response?.data?.message || 'Erro ao reativar assinatura.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  if (loadingSub || loadingUsage) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando dados...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCancelled = subscription?.status === 'cancelled';
  const isExpired = subscription?.status === 'expired';
  const isTrial = subscription?.isTrial;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Uso & Assinatura</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Current Plan Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plano Atual</Text>

          <View style={styles.planHeader}>
            <PlanBadge plan={subscription?.plan || 'free'} size="large" />
            {isTrial && (
              <View style={[styles.trialBadge, { backgroundColor: colors.info }]}>
                <Ionicons name="time" size={14} color={colors.white} />
                <Text style={[styles.trialText, { color: colors.white }]}>Trial</Text>
              </View>
            )}
            {isCancelled && (
              <View style={[styles.cancelledBadge, { backgroundColor: colors.warning }]}>
                <Ionicons name="alert-circle" size={14} color={colors.white} />
                <Text style={[styles.cancelledText, { color: colors.white }]}>Cancelado</Text>
              </View>
            )}
          </View>

          <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
            {planDetails?.description}
          </Text>

          {/* Billing Info */}
          {subscription?.plan !== 'free' && (
            <View style={styles.billingInfo}>
              <View style={styles.billingRow}>
                <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>
                  Ciclo de cobrança:
                </Text>
                <Text style={[styles.billingValue, { color: colors.text }]}>
                  {subscription?.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
                </Text>
              </View>

              {subscription?.nextBillingDate && !isCancelled && (
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>
                    Próxima cobrança:
                  </Text>
                  <Text style={[styles.billingValue, { color: colors.text }]}>
                    {formatDate(subscription.nextBillingDate)}
                  </Text>
                </View>
              )}

              {isCancelled && subscription?.endDate && (
                <View style={styles.billingRow}>
                  <Text style={[styles.billingLabel, { color: colors.textSecondary }]}>
                    Acesso até:
                  </Text>
                  <Text style={[styles.billingValue, { color: colors.warning }]}>
                    {formatDate(subscription.endDate)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {subscription?.plan === 'free' && (
            <Button title="Fazer Upgrade" onPress={handleUpgrade} variant="primary" />
          )}

          {isCancelled && (
            <Button
              title="Reativar Assinatura"
              onPress={handleReactivate}
              loading={reactivateMutation.isPending}
              variant="primary"
            />
          )}

          {subscription?.plan !== 'free' && !isCancelled && (
            <TouchableOpacity onPress={handleCancelSubscription} style={styles.cancelButton}>
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancelar Assinatura
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Usage Stats Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Estatísticas de Uso</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.usageList}>
            <UsageBar
              key={`itineraries-${usage?.itineraries?.current || 0}`}
              label="Roteiros"
              current={usage?.itineraries.current || 0}
              limit={usage?.itineraries.limit || 0}
              unlimited={usage?.itineraries.unlimited}
              icon="map"
              showUpgrade={subscription?.plan === 'free'}
              onUpgrade={handleUpgrade}
            />

            <UsageBar
              key={`ai-${usage?.aiGenerations?.current || 0}`}
              label="Criações Mensais"
              current={usage?.aiGenerations.current || 0}
              limit={usage?.aiGenerations.limit || 0}
              unlimited={usage?.aiGenerations.unlimited}
              icon="sparkles"
              showUpgrade={subscription?.plan === 'free'}
              onUpgrade={handleUpgrade}
            />

            {subscription?.plan !== 'free' && (
              <UsageBar
                key={`photos-${usage?.photos?.current || 0}`}
                label="Fotos"
                current={usage?.photos.current || 0}
                limit={usage?.photos.limit || 0}
                icon="image"
                showUpgrade={false}
                onUpgrade={handleUpgrade}
              />
            )}
          </View>

          {/* AI Reset Info */}
          {usage?.aiGenerations && !usage.aiGenerations.unlimited && (
            <View style={[styles.resetInfo, { backgroundColor: colors.background }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                Seu limite de IA reseta em {formatDate(usage.aiGenerations.resetsAt)}
              </Text>
            </View>
          )}
        </View>

        {/* Features Section */}
        {planDetails && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recursos Disponíveis</Text>

            <View style={styles.featuresList}>
              {Object.entries(planDetails.features)
                .filter(([_, enabled]) => enabled)
                .map(([key, _]) => (
                  <View key={key} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.text }]}>
                      {getFeatureLabel(key)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function
const getFeatureLabel = (key: string): string => {
  const labels: Record<string, string> = {
    createItineraries: 'Criar roteiros',
    aiGeneration: 'Geração com IA',
    publicSharing: 'Compartilhar roteiros',
    photoUpload: 'Upload de fotos',
    offlineMode: 'Modo offline',
    exportPDF: 'Exportar PDF',
    prioritySupport: 'Suporte prioritário',
    removeAds: 'Sem anúncios',
    earlyAccess: 'Acesso antecipado',
  };
  return labels[key] || key;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  trialText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cancelledText: {
    fontSize: 12,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  billingInfo: {
    gap: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    fontSize: 14,
  },
  billingValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  usageList: {
    gap: 24,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  resetText: {
    fontSize: 13,
    flex: 1,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
});
