// mobile/src/navigation/RootNavigator.tsx
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashScreen } from '../components/SplashScreen';
import { SharedItineraryScreen } from '../screens/SharedItineraryScreen';
import analyticsService from '../services/analyticsService';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { user, isLoading, isTransitioning } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

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

  // Tratar deep links e universal links
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      console.log('Link recebido:', url);

      // Tenta extrair shareId de ambos os formatos:
      // 1. Deep link: guiaaventureiro://shared/{shareId}
      // 2. Universal link: https://landing-page-patrickavilas-projects.vercel.app/r/{shareId}
      let shareId: string | null = null;

      const deepLinkMatch = url.match(/guiaaventureiro:\/\/shared\/([a-f0-9-]+)/i);
      const universalLinkMatch = url.match(
        /https?:\/\/(share\.guiaaventureiro\.app|landing-page.*\.vercel\.app)\/r\/([a-f0-9-]+)/i
      );

      if (deepLinkMatch && deepLinkMatch[1]) {
        shareId = deepLinkMatch[1];
      } else if (universalLinkMatch && universalLinkMatch[2]) {
        shareId = universalLinkMatch[2];
      }

      if (shareId) {
        console.log('ShareId extraído:', shareId);
        // Aguarda a navegação estar pronta
        setTimeout(() => {
          navigationRef.current?.navigate('SharedItinerary', { shareId });
        }, 100);
      }
    };

    // Captura link inicial (quando app foi aberto via deep link)
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      })
      .catch((error) => {
        console.error('Erro ao obter Initial URL para deep link:', error);
      });

    // Listener para links recebidos enquanto app está aberto
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkOnboarding = async () => {
    try {
      const skipOnboarding = await AsyncStorage.getItem('@guia_aventureiro:skip_onboarding');
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
        <Stack.Navigator id="Root" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main">
            {() => (user ? <MainNavigator /> : <AuthNavigator />)}
          </Stack.Screen>
          <Stack.Screen
            name="SharedItinerary"
            component={SharedItineraryScreen}
            options={{
              presentation: 'card',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
