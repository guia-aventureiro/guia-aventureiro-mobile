// mobile/src/platform/UpgradeCheckout.web.tsx
// Checkout de upgrade — versão web.
// Em vez de hospedar o Stripe Checkout numa WebView, redireciona o navegador
// diretamente para a URL segura retornada pelo backend.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../hooks/useColors';
import { createCheckoutSession } from '../services/subscriptionService';

export default function UpgradeCheckoutWeb() {
  const navigation = useNavigation();
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Evita dupla execução em React StrictMode / remounts
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    (async () => {
      try {
        const { url } = await createCheckoutSession();
        if (!url) {
          throw new Error('URL de checkout não recebida');
        }
        window.location.assign(url);
      } catch (err: any) {
        const message =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Erro ao iniciar o pagamento. Tente novamente.';
        setError(message);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? (
        <>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Não foi possível abrir o pagamento
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.buttonText, { color: colors.white }]}>Voltar</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Redirecionando para o pagamento seguro...
          </Text>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
