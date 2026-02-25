// mobile/src/types/subscription.ts

export type Plan = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanLimits {
  itineraries: number;
  aiGenerations: number;
  photos: number;
  collaborators: number;
  storageGB: number;
}

export interface PlanFeatures {
  createItineraries: boolean;
  aiGeneration: boolean;
  publicSharing: boolean; // compartilhar roteiros individuais
  photoUpload: boolean;
  offlineMode: boolean;
  exportPDF: boolean;
  prioritySupport: boolean;
  removeAds: boolean;
  earlyAccess: boolean; // acesso antecipado a novidades
}

export interface PlanDetails {
  id: Plan;
  name: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: PlanLimits;
  features: PlanFeatures;
  description: string;
  highlights: string[];
  cta: string;
  popular?: boolean;
  enterprise?: boolean;
  savings?: {
    absolute: number;
    percentage: number;
  };
}

export interface UsageStats {
  current: number;
  limit: number;
}

export interface AIUsageStats extends UsageStats {
  lastReset: string;
}

export interface Subscription {
  _id: string;
  user: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  billingCycle: BillingCycle;
  paymentMethod: 'stripe' | 'paypal' | 'pix' | 'none';
  lastPaymentDate?: string;
  nextBillingDate?: string;
  usage: {
    itineraries: UsageStats;
    aiGenerations: AIUsageStats;
    photos: UsageStats;
    collaborators: UsageStats;
  };
  features: PlanFeatures;
  history: {
    plan: Plan;
    action: 'upgrade' | 'downgrade' | 'cancelled' | 'renewed';
    date: string;
    reason?: string;
  }[];
  metadata?: {
    couponCode?: string;
    referralSource?: string;
    cancelReason?: string;
  };
  isActive?: boolean;
  isTrial?: boolean;
  daysUntilExpiry?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageInfo {
  itineraries: {
    current: number;
    limit: number;
    percentage: number;
    unlimited: boolean;
  };
  aiGenerations: {
    current: number;
    limit: number;
    percentage: number;
    unlimited: boolean;
    resetsAt: string;
  };
  photos: {
    current: number;
    limit: number;
    percentage: number;
  };
  collaborators: {
    current: number;
    limit: number;
    unlimited: boolean;
  };
}

export interface LimitError {
  error: 'limit_reached' | 'feature_locked';
  message: string;
  currentUsage?: number;
  limit?: number;
  plan: Plan;
  upgrade: {
    message: string;
    availablePlans: Plan[];
  };
}
