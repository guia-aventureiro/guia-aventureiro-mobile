import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface UserLimits {
  itineraries: { used: number; limit: number; unlimited: boolean };
  aiGenerations: { used: number; limit: number; unlimited: boolean };
  photos: { used: number; limit: number; unlimited: boolean };
  collaborators: { used: number; limit: number; unlimited: boolean };
}

interface UserSubscription {
  plan: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  limits: UserLimits;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

interface UserContextData {
  subscription: UserSubscription | null;
  loading: boolean;
  isPremium: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextData>({} as UserContextData);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = async () => {
    try {
      const { data } = await api.get('/subscriptions/my-subscription');
      setSubscription(data);
    } catch (error: any) {
      // 401 antes do login e durante refresh de token pode acontecer; evitar ruído no log.
      if (error?.response?.status !== 401) {
        console.error('Erro ao carregar assinatura:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    await loadSubscription();
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';

  return (
    <UserContext.Provider value={{ subscription, loading, isPremium, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
