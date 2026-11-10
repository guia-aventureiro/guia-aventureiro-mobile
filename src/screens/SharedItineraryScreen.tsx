// mobile/src/screens/SharedItineraryScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useColors } from '../hooks/useColors';
import { useToast } from '../hooks/useToast';
import { itineraryService } from '../services/itineraryService';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';
import { showAlert } from '../components/CustomAlert';

export const SharedItineraryScreen = ({ route, navigation }: any) => {
  const { shareId } = route.params;
  const colors = useColors();
  const { toast, hideToast, success, error: showError } = useToast();
  const { user } = useAuth();

  // Buscar roteiro compartilhado
  const {
    data: itinerary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['shared-itinerary', shareId],
    queryFn: () => itineraryService.getSharedItinerary(shareId),
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Copiar roteiro para conta
  const copyMutation = useMutation({
    mutationFn: () => itineraryService.copySharedItinerary(shareId),
    onSuccess: (data: any) => {
      success('Roteiro copiado com sucesso!');
      // Usar único timer com cleanup adequado
      const timer = setTimeout(() => {
        navigation.navigate('Dashboard', {
          screen: 'DashboardMain',
        });
        // Pequeno delay para garantir que navegação anterior completou
        const detailTimer = setTimeout(() => {
          navigation.navigate('Dashboard', {
            screen: 'ItineraryDetail',
            params: { id: data.itinerary._id },
          });
        }, 300);

        // Cleanup para detailTimer
        return () => clearTimeout(detailTimer);
      }, 500);

      // Retornar cleanup para timer principal
      return () => clearTimeout(timer);
    },
    onError: (err: any) => {
      const errorMsg = err.response?.data?.message || 'Erro ao copiar roteiro';
      showError(errorMsg);
    },
  });

  const handleCopyToAccount = () => {
    if (!user) {
      showAlert(
        'Login Necessário',
        'Você precisa estar logado para copiar este roteiro para sua conta.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Fazer Login',
            onPress: () => navigation.navigate('Auth'),
          },
        ]
      );
      return;
    }

    showAlert(
      'Copiar Roteiro',
      'Deseja copiar este roteiro para sua conta? Uma cópia será criada nos seus roteiros.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Copiar',
          onPress: () => copyMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando roteiro...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !itinerary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorIcon, { color: colors.error }]}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Roteiro não encontrado</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            Este roteiro não existe ou não está mais público.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {itinerary.title}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Badge de roteiro compartilhado */}
        <View style={[styles.sharedBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.sharedBadgeText, { color: colors.primary }]}>
            🌍 Roteiro Compartilhado
          </Text>
        </View>

        {/* Info do criador */}
        <View
          style={[styles.creatorCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>Criado por</Text>
          <Text style={[styles.creatorName, { color: colors.text }]}>
            {itinerary.owner?.name || 'Usuário'}
          </Text>
        </View>

        {/* Informações do roteiro */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📍 Destino</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {typeof itinerary.destination === 'string'
                ? itinerary.destination
                : `${itinerary.destination?.city || ''}, ${itinerary.destination?.country || ''}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📅 Duração</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {itinerary.duration} dias
            </Text>
          </View>
          {itinerary.budget?.estimatedTotal && itinerary.budget.estimatedTotal > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>💰 Orçamento</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                R$ {itinerary.budget.estimatedTotal.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Dias do roteiro */}
        {itinerary.days?.map((day: any, dayIndex: number) => {
          // Payload público pode vir com day.day ou day.dayNumber conforme a origem
          const dayNumber = day.day ?? day.dayNumber ?? dayIndex + 1;
          return (
            <View
              key={`day-${dayNumber}`}
              style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.dayTitle, { color: colors.primary }]}>
                Dia {dayNumber} - {day.title}
              </Text>
              {day.description && (
                <Text style={[styles.dayDescription, { color: colors.textSecondary }]}>
                  {day.description}
                </Text>
              )}
              {day.activities?.map((activity: any, actIndex: number) => (
                <View
                  key={`activity-${dayNumber}-${actIndex}`}
                  style={[styles.activity, { borderTopColor: colors.border }]}
                >
                  <Text style={[styles.activityTime, { color: colors.primary }]}>
                    {activity.time}
                  </Text>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {activity.title}
                  </Text>
                  {activity.description && (
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                      {activity.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        {/* Botão de copiar */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: colors.primary }]}
            onPress={handleCopyToAccount}
            disabled={copyMutation.isPending}
          >
            {copyMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={[styles.copyButtonText, { color: colors.white }]}>
                  📋 Copiar para Minha Conta
                </Text>
                <Text style={[styles.copyButtonSubtext, { color: colors.white }]}>
                  Crie uma cópia deste roteiro que você pode editar
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sharedBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  sharedBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  creatorCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  creatorLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  activity: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  copyButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  copyButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
