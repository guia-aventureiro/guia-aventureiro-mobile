// mobile/src/hooks/useSubscription.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlans,
  getMySubscription,
  getUsage,
  confirmUpgrade,
  cancelSubscription,
  reactivateSubscription,
} from '../services/subscriptionService';
import { Plan, BillingCycle } from '../types/subscription';

/**
 * Hook para listar todos os planos
 */
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 60, // 1 hora (planos mudam raramente)
  });
};

/**
 * Hook para obter assinatura atual
 */
export const useMySubscription = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getMySubscription,
    staleTime: 1000 * 60, // 1 minuto
  });
};

/**
 * Hook para obter estatísticas de uso
 */
export const useUsage = () => {
  return useQuery({
    queryKey: ['usage'],
    queryFn: getUsage,
    staleTime: 1000 * 30, // 30 segundos
  });
};

/**
 * Hook para fazer upgrade
 */
export const useUpgrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      targetPlan,
      billingCycle,
    }: {
      targetPlan: Plan;
      billingCycle: BillingCycle;
    }) => confirmUpgrade(targetPlan, billingCycle),
    onSuccess: () => {
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['usage'] });
    },
  });
};

/**
 * Hook para cancelar assinatura
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => cancelSubscription(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};

/**
 * Hook para reativar assinatura
 */
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};

/**
 * Hook utilitário para verificar se pode executar ação
 */
export const useCanPerformAction = () => {
  const { data } = useUsage();

  const canCreateItinerary = () => {
    if (!data) return null;
    return data.usage.itineraries.unlimited || 
           data.usage.itineraries.current < data.usage.itineraries.limit;
  };

  const canUseAI = () => {
    if (!data) return null;
    return data.usage.aiGenerations.unlimited || 
           data.usage.aiGenerations.current < data.usage.aiGenerations.limit;
  };

  const canUploadPhoto = () => {
    if (!data) return null;
    return data.usage.photos.current < data.usage.photos.limit;
  };

  const itinerariesLeft = () => {
    if (!data) return 0;
    if (data.usage.itineraries.unlimited) return Infinity;
    return data.usage.itineraries.limit - data.usage.itineraries.current;
  };

  const aiGenerationsLeft = () => {
    if (!data) return 0;
    if (data.usage.aiGenerations.unlimited) return Infinity;
    return data.usage.aiGenerations.limit - data.usage.aiGenerations.current;
  };

  return {
    canCreateItinerary,
    canUseAI,
    canUploadPhoto,
    itinerariesLeft,
    aiGenerationsLeft,
    usage: data?.usage,
    plan: data?.plan,
  };
};
