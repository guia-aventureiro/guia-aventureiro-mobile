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
  // Adicionar timestamp para evitar cache
  const { data } = await api.get(`/subscriptions/my-subscription?_t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
  });
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
  // Adicionar timestamp para evitar cache
  const { data } = await api.get(`/subscriptions/usage?_t=${Date.now()}`, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    }
  });
  console.log('📊 getUsage response:', data);
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

// ========================================
// STRIPE INTEGRATION
// ========================================

/**
 * Criar sessão de checkout Stripe
 * Retorna URL para abrir no browser nativo
 */
export const createCheckoutSession = async (): Promise<{
  sessionId: string;
  url: string;
}> => {
  const { data } = await api.post('/subscriptions/create-checkout');
  return data;
};

/**
 * Obter URL do Customer Portal (gerenciar assinatura)
 */
export const getCustomerPortalUrl = async (): Promise<{
  url: string;
}> => {
  const { data } = await api.post('/subscriptions/customer-portal');
  return data;
};

/**
 * Cancelar assinatura Stripe
 */
export const cancelStripeSubscription = async (
  immediately: boolean = false,
  reason?: string
): Promise<{
  success: boolean;
  message: string;
  endsAt?: string;
}> => {
  const { data } = await api.post('/subscriptions/cancel-stripe', {
    immediately,
    reason,
  });
  return data;
};

/**
 * Obter status detalhado da assinatura Stripe
 */
export const getStripeSubscriptionStatus = async (): Promise<{
  plan: string;
  status: string;
  paymentStatus: string;
  renewsAt?: string;
  cancelledAt?: string;
  hasStripeSubscription: boolean;
  usage: any;
  features: any;
}> => {
  const { data } = await api.get('/subscriptions/stripe-status');
  return data;
};

