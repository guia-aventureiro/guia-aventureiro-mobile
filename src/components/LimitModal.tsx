// mobile/src/components/LimitModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { LimitError, Plan } from '../types/subscription';
import { Button } from './Button';
import { PlanBadge } from './PlanBadge';

const { width } = Dimensions.get('window');

interface LimitModalProps {
  visible: boolean;
  onClose: () => void;
  limitError: LimitError;
  onUpgrade: () => void;
  currentPlan: Plan;
}

export const LimitModal: React.FC<LimitModalProps> = ({
  visible,
  onClose,
  limitError,
  onUpgrade,
  currentPlan,
}) => {
  const colors = useColors();

  const getResourceIcon = () => {
    if (limitError.message.includes('roteiro')) return 'map';
    if (limitError.message.includes('IA')) return 'sparkles';
    if (limitError.message.includes('foto')) return 'image';
    if (limitError.message.includes('colaborador')) return 'people';
    return 'alert-circle';
  };

  const getFriendlyMessage = () => {
    const isMonthlyLimit = limitError.error === 'monthly_limit_reached';
    
    if (isMonthlyLimit) {
      return `Você já criou ${limitError.currentUsage} roteiros este mês! Isso mostra que você está adorando planejar viagens. Faça upgrade para continuar criando sem limites! 🚀`;
    }
    
    if (limitError.message.includes('roteiro')) {
      return `Você aproveitou bem seus ${limitError.limit} roteiros do plano Gratuito! Pronto para criar ainda mais viagens incríveis? 🗺️`;
    }
    
    if (limitError.message.includes('foto')) {
      return 'Upload de fotos está disponível no plano Premium! Eternize suas memórias de viagem com fotos lindas. 📸';
    }
    
    return limitError.message;
  };

  const getNextPlanBenefits = () => {
    const benefits = {
      free: {
        premium: [
          '50 roteiros ativos (vs 5)',
          'Criações ilimitadas (vs 15/mês)',
          'Upload de 20 fotos por roteiro',
          'Compartilhar roteiros individualmente',
          'Modo offline',
          'Exportar PDF',
          'Sem anúncios',
        ],
      },
      premium: {
        // Caso haja upgrade de Premium para Pro no futuro
      },
    };

    const nextPlan = limitError.upgrade.availablePlans[0];
    return (benefits as any)[currentPlan]?.[nextPlan] || [];
  };

  const renderProgress = () => {
    if (!limitError.currentUsage || !limitError.limit) return null;

    const percentage = (limitError.currentUsage / limitError.limit) * 100;
    const isAtLimit = percentage >= 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Você já usou:
          </Text>
          <Text style={[styles.progressValue, { color: isAtLimit ? colors.warning : colors.primary }]}>
            {limitError.currentUsage}/{limitError.limit} {isAtLimit ? '✨' : ''}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: isAtLimit ? colors.warning : colors.primary },
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={80} style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.warning}15` }]}>
                <Ionicons name={getResourceIcon()} size={40} color={colors.warning} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {limitError.error === 'limit_reached' ? 'Você está indo bem! 🎉' : 'Recurso Premium'}
            </Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {getFriendlyMessage()}
            </Text>

            {/* Progress Bar */}
            {renderProgress()}

            {/* Current Plan */}
            <View style={styles.currentPlanContainer}>
              <Text style={[styles.currentPlanLabel, { color: colors.textSecondary }]}>
                Seu plano atual:
              </Text>
              <PlanBadge plan={currentPlan} size="large" />
            </View>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitsHeader}>
                <Ionicons name="rocket" size={20} color={colors.primary} />
                <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                  Desbloqueie mais recursos:
                </Text>
              </View>

              <View style={styles.benefitsList}>
                {getNextPlanBenefits().map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={[styles.benefitText, { color: colors.text }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="Ver Planos"
                onPress={() => {
                  onClose();
                  onUpgrade();
                }}
                variant="primary"
              />
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Agora não
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 24,
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  currentPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  currentPlanLabel: {
    fontSize: 14,
  },
  benefitsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
