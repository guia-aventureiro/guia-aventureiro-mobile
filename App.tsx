// mobile/App.tsx
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogBox, ActivityIndicator, View } from 'react-native';
// import { StripeProvider } from '@stripe/stripe-react-native'; // Desabilitado: usando Webview Checkout
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { NotificationsProvider } from './src/contexts/NotificationsContext';
import { UserProvider } from './src/contexts/UserContext';
import { AlertProvider } from './src/components/AlertProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
// import api from './src/services/api'; // Não precisa buscar key do Stripe

// Desabilitar avisos/erros visuais no app (mantém nos logs do console)
LogBox.ignoreAllLogs(true);

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 0, // Sempre buscar dados frescos (as queries individuais podem sobrescrever)
      gcTime: 1000 * 60 * 5, // Manter em cache por 5 minutos
      refetchOnMount: true, // Sempre refetch ao montar
      refetchOnWindowFocus: true, // Refetch ao voltar para o app
    },
  },
});

// Componente interno que acessa o tema
const AppContent = () => {
  const { theme } = useTheme();

  return (
    <>
      <RootNavigator />
      {/* Inverte: tema escuro = ícones claros, tema claro = ícones escuros */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
};

export default function App() {
  // STRIPE SDK DESABILITADO - Usando Webview Checkout ao invés de SDK nativo

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <UserProvider>
                <NotificationsProvider>
                  <AlertProvider>
                    <AppContent />
                  </AlertProvider>
                </NotificationsProvider>
              </UserProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
