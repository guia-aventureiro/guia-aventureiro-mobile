// mobile/src/services/subscriptionService.ts
import api from './api';
import {
  Subscription,
  PlanDetails,
  UsageInfo,
  Plan,
  BillingCycle,
} from '../types/subscription';

/**
 * Serviço para gerenciar assinaturas
 */

/**
 * Listar todos os planos disponíveis
 */
export const getPlans = async (): Promise<{ plans: PlanDetails[] }> => {
  const { data } = await api.get('/subscriptions/plans');
  return data;
};

/**
 * Obter assinatura atual do usuário
 */
export const getMySubscription = async (): Promise<{
  subscription: Subscription & { planDetails: PlanDetails };
}> => {
  const { data } = await api.get('/subscriptions/my-subscription');
  return data;
};

/**
 * Obter estatísticas de uso
 */
export const getUsage = async (): Promise<{
  usage: UsageInfo;
  plan: Plan;
  planDetails: PlanDetails;
}> => {
  const { data } = await api.get('/subscriptions/usage');
  return data;
};

/**
 * Iniciar processo de upgrade
 */
export const initiateUpgrade = async (
  targetPlan: Plan,
  billingCycle: BillingCycle
): Promise<{
  message: string;
  redirectUrl: string;
  plan: {
    id: Plan;
    name: string;
    price: number;
    billingCycle: BillingCycle;
  };
}> => {
  const { data } = await api.post('/subscriptions/upgrade', {
    targetPlan,
    billingCycle,
  });
  return data;
};

/**
 * Confirmar upgrade (temporário até integrar Stripe)
 */
export const confirmUpgrade = async (
  targetPlan: Plan,
  billingCycle: BillingCycle
): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  const { data } = await api.post('/subscriptions/confirm-upgrade', {
    targetPlan,
    billingCycle,
  });
  return data;
};

/**
 * Cancelar assinatura
 */
export const cancelSubscription = async (reason?: string): Promise<{
  message: string;
  subscription: Subscription;
  accessUntil: string;
}> => {
  const { data } = await api.post('/subscriptions/cancel', { reason });
  return data;
};

/**
 * Reativar assinatura cancelada
 */
export const reactivateSubscription = async (): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  const { data } = await api.post('/subscriptions/reactivate');
  return data;
};
