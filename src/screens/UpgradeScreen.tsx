import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../hooks/useColors';

interface BenefitItemProps {
  icon: string;
  text: string;
  iconColor?: string;
  textColor?: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon, text, iconColor, textColor }) => (
  <View style={styles.benefitItem}>
    <Text style={[styles.benefitIcon, iconColor ? { color: iconColor } : null]}>{icon}</Text>
    <Text style={[styles.benefitText, textColor ? { color: textColor } : null]}>{text}</Text>
  </View>
);

export default function UpgradeScreen() {
  const colors = useColors();
  const navigation = useNavigation();

  const handleContinue = () => {
    navigation.navigate('UpgradeWebview' as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.success }]}>
          <Text style={styles.title}>Premium</Text>
          <View style={styles.priceBox}>
            <Text style={[styles.price, { color: colors.white }]}>R$ 19,90</Text>
            <Text style={styles.period}>por mês</Text>
          </View>
        </View>

        <View style={[styles.benefitsBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.benefitTitle, { color: colors.text }]}>O que você ganha:</Text>
          <BenefitItem
            icon="✓"
            text="50 roteiros de viagem"
            iconColor={colors.success}
            textColor={colors.textSecondary}
          />
          <BenefitItem
            icon="✓"
            text="Gerações de IA ilimitadas"
            iconColor={colors.success}
            textColor={colors.textSecondary}
          />
          <BenefitItem
            icon="✓"
            text="Upload de até 20 fotos por roteiro"
            iconColor={colors.success}
            textColor={colors.textSecondary}
          />
          <BenefitItem
            icon="✓"
            text="Compartilhamento público de roteiros"
            iconColor={colors.success}
            textColor={colors.textSecondary}
          />
          <BenefitItem
            icon="✓"
            text="Planejador de orçamento avançado"
            iconColor={colors.success}
            textColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.success }]}
          onPress={handleContinue}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            Ir para o checkout seguro
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textLight }]}>
          {
            '✓ Cancele a qualquer momento\n✓ Sem taxas de cancelamento\n✓ Pagamento seguro via checkout hospedado'
          }
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
