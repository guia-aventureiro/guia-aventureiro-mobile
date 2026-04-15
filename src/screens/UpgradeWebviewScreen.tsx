// mobile/src/screens/UpgradeWebviewScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../hooks/useColors';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';
import { showAlert } from '../components/CustomAlert';

export default function UpgradeWebviewScreen() {
  const navigation = useNavigation();
  const colors = useColors();
  const { refreshUser } = useUser();

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    createCheckoutSession();
  }, []);

  const createCheckoutSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await api.post('/checkout/create-session');

      if (data.successUrl && data.successUrl.includes('localhost')) {
        throw new Error(
          'Backend retornou successUrl com localhost. Gere novo tunnel (localtunnel/ngrok) e tente novamente.'
        );
      }

      if (data.url) {
        setCheckoutUrl(data.url);
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (err: any) {
      console.error('Erro ao criar checkout session:', err);

      const errorMessage = err.response?.data?.error || 'Erro ao criar sessão de pagamento';
      setError(errorMessage);

      showAlert('Erro', errorMessage, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    // Don't log URLs containing sensitive data in production
    if (__DEV__ && !url?.includes('sessionId') && !url?.includes('session_id')) {
      // Safe to log navigation
    }
    await processUrl(url);
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      // Don't log payment messages containing sensitive data

      if (message.type === 'PAYMENT_SUCCESS') {
        handlePaymentSuccess(message.sessionId);
      } else if (message.type === 'PAYMENT_CANCELLED') {
        handlePaymentCancel();
      }
    } catch (err) {
      // Don't log parsing errors with full message content
      if (__DEV__) {
        console.error('❌ Erro ao processar mensagem');
      }
    }
  };

  const handlePaymentSuccess = async (sessionId: string) => {
    if (!sessionId) return;

    // Don't log session IDs or payment details
    if (__DEV__) {
      // Safe to log in dev: payment step completed
    }

    try {
      // Retry curto para cobrir eventual atraso entre checkout completo e processamento final da assinatura.
      let verified = false;
      let lastError: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await api.get(`/checkout/verify/${sessionId}`);
          verified = true;
          break;
        } catch (error: any) {
          lastError = error;
          if (attempt < 3) {
            await wait(1200 * attempt);
          }
        }
      }

      if (!verified) {
        throw lastError || new Error('Falha ao verificar pagamento');
      }

      await refreshUser();

      showAlert(
        '🎉 Bem-vindo ao Premium!',
        'Sua assinatura foi ativada com sucesso. Aproveite todos os recursos!',
        [
          {
            text: 'Começar',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err) {
      // Don't log payment verification errors
      if (__DEV__) {
        console.error('❌ Erro ao verificar pagamento');
      }
      await refreshUser();
      navigation.goBack();
    }
  };

  const handlePaymentCancel = () => {
    // Payment cancellation noted but not logged with details
    if (__DEV__) {
      // Internal tracking: payment cancelled
    }

    showAlert(
      'Pagamento Cancelado',
      'Você cancelou o processo de upgrade. Tente novamente quando quiser!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const processUrl = async (url: string) => {
    // Fallback: detectar sucesso pela URL caso postMessage não funcione
    if (url.includes('/checkout/success') || url.includes('/payment/success')) {
      const sessionIdMatch = url.match(/session_id=([^&]+)/);
      const sessionId = sessionIdMatch ? sessionIdMatch[1] : null;

      if (sessionId) {
        handlePaymentSuccess(sessionId);
      }
    }

    // Detectar cancelamento pela URL
    if (url.includes('/checkout/cancel') || url.includes('/payment/cancel')) {
      handlePaymentCancel();
    }
  };

  const shouldStartLoad = (url: string) => {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      showAlert(
        'Redirecionamento inválido',
        'A sessão de checkout foi criada com localhost. Gere uma nova sessão após atualizar a URL pública do backend.'
      );
      return false;
    }

    if (
      url.includes('/checkout/success') ||
      url.includes('/checkout/cancel') ||
      url.includes('/payment/success') ||
      url.includes('/payment/cancel')
    ) {
      processUrl(url);
      return false;
    }

    return true;
  };

  const handleError = () => {
    showAlert(
      'Erro de Conexão',
      'Não foi possível carregar a página de pagamento. Verifique sua conexão.',
      [
        { text: 'Tentar Novamente', onPress: createCheckoutSession },
        { text: 'Voltar', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upgrade Premium</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Preparando checkout seguro...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upgrade Premium</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={createCheckoutSession}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backButton, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Checkout Seguro</Text>
        <View style={{ width: 60 }} />
      </View>

      {checkoutUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={(request) => shouldStartLoad(request.url)}
          onMessage={handleMessage}
          onError={handleError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          style={styles.webview}
          // Configurações de segurança
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
