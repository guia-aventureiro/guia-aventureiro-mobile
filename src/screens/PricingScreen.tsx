// mobile/src/screens/PricingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { usePlans, useMySubscription, useUpgrade } from '../hooks/useSubscription';
import { Button } from '../components/Button';
import { PlanBadge } from '../components/PlanBadge';
import { Plan, BillingCycle, PlanDetails } from '../types/subscription';
import { showAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 64;

export const PricingScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { data: plansData, isLoading: loadingPlans } = usePlans();
  const { data: subscriptionData, isLoading: loadingSub } = useMySubscription();
  const upgradeMutation = useUpgrade();

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const currentPlan = subscriptionData?.subscription?.plan || 'free';
  const plans = plansData?.plans || [];

  const handleUpgrade = async (targetPlan: Plan) => {
    if (targetPlan === currentPlan) {
      showAlert('Aviso', 'Você já está neste plano!');
      return;
    }

    // Não permitir downgrade direto (deve cancelar e esperar expirar)
    const planHierarchy = { free: 0, premium: 1, pro: 2 };
    if (planHierarchy[targetPlan] < planHierarchy[currentPlan]) {
      showAlert(
        'Downgrade não permitido',
        'Para fazer downgrade, cancele sua assinatura atual e aguarde o fim do período pago.'
      );
      return;
    }

    try {
      await upgradeMutation.mutateAsync({
        targetPlan,
        billingCycle,
      });

      showAlert('Sucesso!', `Upgrade para ${targetPlan} realizado com sucesso!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      showAlert(
        'Erro',
        error.response?.data?.message || 'Erro ao fazer upgrade. Tente novamente.'
      );
    }
  };

  const renderPlanCard = (plan: PlanDetails) => {
    const isCurrentPlan = plan.id === currentPlan;
    const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    const pricePerMonth = billingCycle === 'yearly' ? price / 12 : price;

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          plan.popular && styles.popularCard,
          isCurrentPlan && [styles.currentPlanCard, { borderColor: colors.primary }],
        ]}
      >
        {/* Popular Badge */}
        {plan.popular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.popularText}>⭐ Mais Popular</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          {isCurrentPlan && <PlanBadge plan={plan.id} size="small" />}
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          {price === 0 ? (
            <Text style={[styles.priceMain, { color: colors.text }]}>Gratuito</Text>
          ) : (
            <>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>R$</Text>
              <Text style={[styles.priceMain, { color: colors.text }]}>
                {Math.floor(price)}
              </Text>
              <Text style={[styles.priceCents, { color: colors.textSecondary }]}>
                ,{(price % 1).toFixed(2).split('.')[1]}
              </Text>
              <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
              </Text>
            </>
          )}
        </View>

        {billingCycle === 'yearly' && price > 0 && plan.savings && (
          <View style={styles.savingsContainer}>
            <Ionicons name="pricetag" size={14} color={colors.success} />
            <Text style={[styles.savingsText, { color: colors.success }]}>
              Economize {plan.savings.percentage}% (R$ {plan.savings.absolute.toFixed(2)})
            </Text>
          </View>
        )}

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {plan.description}
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          {plan.highlights.map((highlight, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>{highlight}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <Button
          title={isCurrentPlan ? 'Plano Atual' : plan.cta}
          onPress={() => handleUpgrade(plan.id)}
          disabled={isCurrentPlan || upgradeMutation.isPending}
          loading={upgradeMutation.isPending}
          variant={plan.popular ? 'primary' : 'outline'}
        />
      </View>
    );
  };

  if (loadingPlans || loadingSub) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Carregando planos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Planos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Billing Cycle Toggle */}
        <View style={styles.cycleContainer}>
          <TouchableOpacity
            style={[
              styles.cycleButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              billingCycle === 'monthly' && [
                styles.cycleButtonActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text
              style={[
                styles.cycleButtonText,
                { color: billingCycle === 'monthly' ? '#FFF' : colors.text },
              ]}
            >
              Mensal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cycleButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              billingCycle === 'yearly' && [
                styles.cycleButtonActive,
                { backgroundColor: colors.primary },
              ],
            ]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text
              style={[
                styles.cycleButtonText,
                { color: billingCycle === 'yearly' ? '#FFF' : colors.text },
              ]}
            >
              Anual
            </Text>
            <View style={[styles.discountBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.discountText}>-17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map(plan => renderPlanCard(plan))}
        </View>

        {/* Footer Info */}
        <View style={[styles.footerInfo, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Você pode cancelar sua assinatura a qualquer momento. O acesso continuará até o fim
            do período pago.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  cycleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  cycleButtonActive: {
    borderWidth: 0,
  },
  cycleButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  discountText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  plansContainer: {
    gap: 20,
  },
  planCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    position: 'relative',
  },
  popularCard: {
    transform: [{ scale: 1.02 }],
  },
  currentPlanCard: {
    borderWidth: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    marginRight: 4,
  },
  priceMain: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 48,
  },
  priceCents: {
    fontSize: 24,
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  footerInfo: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
