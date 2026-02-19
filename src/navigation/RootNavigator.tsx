// mobile/src/navigation/RootNavigator.tsx
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashScreen } from '../components/SplashScreen';
import analyticsService from '../services/analyticsService';

export const RootNavigator = () => {
  const { user, isLoading, isTransitioning } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string>();

  useEffect(() => {
    checkOnboarding();
    // Inicializa o serviço de analytics
    analyticsService.initialize();
  }, []);

  // Recarregar onboarding quando usuário faz logout
  useEffect(() => {
    if (!user) {
      checkOnboarding();
    }
  }, [user]);

  // Atualiza o user ID quando o usuário faz login/logout
  useEffect(() => {
    if (user) {
      analyticsService.setUserId(user._id);
      analyticsService.setUserProperty('is_premium', user.isPremium ? 'true' : 'false');
    } else {
      analyticsService.setUserId(null);
    }
  }, [user]);

  const checkOnboarding = async () => {
    try {
      const skipOnboarding = await AsyncStorage.getItem(
        '@guia_aventureiro:skip_onboarding'
      );
      setShowOnboarding(!skipOnboarding);
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      setShowOnboarding(true); // Mostrar por padrão em caso de erro
    }
  };

  if (isLoading || showOnboarding === null || isTransitioning) {
    return <SplashScreen />;
  }

  // Se não tem usuário e nunca viu o onboarding, mostrar
  if (!user && showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        }}
        onStateChange={() => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

          if (previousRouteName !== currentRouteName && currentRouteName) {
            // Registra visualização de tela
            analyticsService.logScreenView(currentRouteName);
          }

          // Salva o nome da rota atual
          routeNameRef.current = currentRouteName;
        }}
      >
        {user ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};