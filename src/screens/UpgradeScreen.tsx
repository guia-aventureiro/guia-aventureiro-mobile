import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import api from '../services/api';

interface BenefitItemProps {
  icon: string;
  text: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <Text style={styles.benefitIcon}>{icon}</Text>
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

export default function UpgradeScreen() {
  const navigation = useNavigation();
  const { refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmSetupIntent } = useConfirmSetupIntent();

  const handleUpgrade = async () => {
    if (!cardComplete) {
      Alert.alert('Atenção', 'Por favor, preencha os dados do cartão.');
      return;
    }

    try {
      setLoading(true);

      // PASSO 1: Criar SetupIntent no backend
      console.log('🔄 Criando SetupIntent...');
      const { data: setupData } = await api.post('/subscriptions/create-setup-intent');
      const { clientSecret } = setupData;

      // PASSO 2: Confirmar cartão com Stripe SDK
      console.log('💳 Processando cartão com Stripe...');
      const { setupIntent, error } = await confirmSetupIntent(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Erro no Pagamento', error.message);
        setLoading(false);
        return;
      }

      if (!setupIntent?.paymentMethodId) {
        Alert.alert('Erro', 'Não foi possível processar o pagamento.');
        setLoading(false);
        return;
      }

      // PASSO 3: Criar subscription no backend
      const { data: subscriptionData } = await api.post('/subscriptions/confirm-payment', {
        paymentMethodId: setupIntent.paymentMethodId,
      });

      // PASSO 4: Recarregar dados do usuário
      await refreshUser();

      // PASSO 5: Mostrar sucesso e voltar
      setLoading(false);
      Alert.alert(
        '🎉 Bem-vindo ao Premium!',
        'Seu pagamento foi confirmado com sucesso. Aproveite todos os benefícios Premium!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro no upgrade:', error);
      setLoading(false);

      const errorMessage = error.response?.data?.message || error.message || 'Erro desconhecido';

      if (error.response?.data?.error === 'already_premium') {
        Alert.alert('Atenção', 'Você já possui plano Premium ativo!');
      } else {
        Alert.alert('Erro', `Não foi possível processar o pagamento: ${errorMessage}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💎 Premium</Text>
          <View style={styles.priceBox}>
            <Text style={styles.price}>R$ 9,90</Text>
            <Text style={styles.period}>por mês</Text>
          </View>
        </View>

        {/* Benefícios */}
        <View style={styles.benefitsBox}>
          <Text style={styles.benefitTitle}>O que você ganha:</Text>
          <BenefitItem icon="✓" text="50 roteiros de viagem" />
          <BenefitItem icon="✓" text="Gerações de IA ilimitadas" />
          <BenefitItem icon="✓" text="Upload ilimitado de fotos" />
          <BenefitItem icon="✓" text="Colaboradores ilimitados" />
          <BenefitItem icon="✓" text="Planejador de orçamento avançado" />
          <BenefitItem icon="✓" text="Suporte prioritário" />
        </View>

        {/* Campo de Cartão */}
        <View style={styles.cardSection}>
          <Text style={styles.cardLabel}>Dados do Cartão</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
              borderWidth: 1,
              borderColor: '#DDDDDD',
              borderRadius: 8,
            }}
            style={styles.cardField}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>

        {/* Botão de Assinatura */}
        <TouchableOpacity
          style={[styles.button, (loading || !cardComplete) && styles.buttonDisabled]}
          onPress={handleUpgrade}
          disabled={loading || !cardComplete}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.buttonText}>  Processando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Assinar Premium</Text>
          )}
        </TouchableOpacity>

        {/* Informações */}
        <Text style={styles.disclaimer}>
          ✓ Cancele a qualquer momento{'\n'}
          ✓ Sem taxas de cancelamento{'\n'}
          ✓ Pagamento seguro via Stripe
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  priceBox: {
    alignItems: 'center',
  },
  price: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  period: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  benefitsBox: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  benefitIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 10,
    fontWeight: 'bold',
  },
  benefitText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  cardSection: {
    margin: 20,
    marginTop: 0,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    lineHeight: 20,
  },
});
