// mobile/src/navigation/RootNavigator.tsx
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SplashScreen } from '../components/SplashScreen';
import { SharedItineraryScreen } from '../screens/SharedItineraryScreen';
import { showAlert } from '../components/CustomAlert';
import api from '../services/api';
import analyticsService from '../services/analyticsService';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { user, isLoading, isTransitioning } = useAuth();
  const { refreshUser } = useUser();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const pendingShareIdRef = useRef<string | null>(null);
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationReadyRef = useRef(false);

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
      // Tenta extrair shareId de ambos os formatos:
      // 1. Deep link: guiaaventureiro://shared/{shareId}
      // 2. Universal link: https://landing-page-patrickavilas-projects.vercel.app/r/{shareId}
      let shareId: string | null = null;

      const deepLinkMatch = url.match(/guiaaventureiro:\/\/shared\/([a-f0-9-]+)/i);
      const universalLinkMatch = url.match(
        /https?:\/\/(share\.guiaaventureiro\.app|landing-page.*\.vercel\.app)\/r\/([a-f0-9-]+)/i
      );

      // Web: aceita /r/:shareId no próprio domínio do app web
      const webPathMatch =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? url.match(/\/r\/([a-f0-9-]+)/i)
          : null;

      if (deepLinkMatch && deepLinkMatch[1]) {
        shareId = deepLinkMatch[1];
      } else if (universalLinkMatch && universalLinkMatch[2]) {
        shareId = universalLinkMatch[2];
      } else if (webPathMatch && webPathMatch[1]) {
        shareId = webPathMatch[1];
      }

      if (shareId) {
        // Link compartilhado tem prioridade: marca como pendente para não
        // deixar o onboarding bloquear o NavigationContainer
        pendingShareIdRef.current = shareId;
        setPendingShareId(shareId);
        setShowOnboarding(false);

        // Aguarda a navegação estar pronta (retry por até ~2s; no web o
        // container pode demorar mais que 100ms para montar)
        let attempts = 0;
        const tryNavigate = () => {
          if (navigationRef.current && navigationReadyRef.current) {
            navigationRef.current.navigate('SharedItinerary', { shareId });
          } else if (attempts < 20) {
            attempts += 1;
            setTimeout(tryNavigate, 100);
          }
        };
        tryNavigate();
      }
    };

    // Captura link inicial (quando app foi aberto via deep link)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // No web, a URL inicial vem direto do navegador — Linking.getInitialURL
      // não é confiável nessa plataforma
      handleDeepLink(window.location.href);
    } else {
      Linking.getInitialURL()
        .then((url) => {
          if (url) {
            handleDeepLink(url);
          }
        })
        .catch((error) => {
          console.error('Erro ao obter Initial URL para deep link:', error);
        });
    }

    // Listener para links recebidos enquanto app está aberto
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Web: tratar retorno do Stripe Checkout (?checkout=success|cancel&session_id=...)
  useEffect(() => {
    if (Platform.OS !== 'web' || !user || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');

    if (!checkoutStatus) {
      return;
    }

    // Limpa a URL para não reprocessar em refresh
    window.history.replaceState({}, document.title, window.location.pathname);

    if (checkoutStatus === 'cancel') {
      showAlert(
        'Pagamento cancelado',
        'Você cancelou o processo de upgrade. Tente novamente quando quiser!'
      );
      return;
    }

    if (checkoutStatus === 'success' && sessionId) {
      (async () => {
        try {
          await api.get(`/checkout/verify/${sessionId}`);
          await refreshUser();
          showAlert(
            '🎉 Bem-vindo ao Premium!',
            'Sua assinatura foi ativada com sucesso. Aproveite todos os recursos!'
          );
        } catch {
          // Webhook pode estar processando; apenas atualiza o estado local
          await refreshUser();
        }
      })();
    }
  }, [user]);

  const checkOnboarding = async () => {
    try {
      const skipOnboarding = await AsyncStorage.getItem('@guia_aventureiro:skip_onboarding');
      // Se há um link compartilhado pendente, não bloquear com o onboarding
      if (!pendingShareIdRef.current) {
        setShowOnboarding(!skipOnboarding);
      }
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      setShowOnboarding(true); // Mostrar por padrão em caso de erro
    }
  };

  if (isLoading || showOnboarding === null || isTransitioning) {
    return <SplashScreen />;
  }

  // Se não tem usuário e nunca viu o onboarding, mostrar
  // (exceto quando há um link compartilhado pendente — conteúdo primeiro)
  if (!user && showOnboarding && !pendingShareId) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          navigationReadyRef.current = true;
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
