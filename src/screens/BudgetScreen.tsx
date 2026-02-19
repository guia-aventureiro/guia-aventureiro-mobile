// mobile/src/screens/BudgetScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useColors } from '../hooks/useColors';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import budgetService from '../services/budgetService';
import { showAlert } from '../components/CustomAlert';

const { width } = Dimensions.get('window');

interface Expense {
  _id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  receipt?: string;
}

interface BudgetSummary {
  budget: {
    estimated: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    currency: string;
    level: 'economico' | 'moderado' | 'confortavel' | 'luxo';
  };
  expenses: {
    total: number;
    byCategory: { [key: string]: { count: number; total: number; items: Expense[] } };
    recent: Expense[];
  };
  dailyAverage: number;
}

const CATEGORIES = [
  { id: 'hospedagem', label: 'Hospedagem', icon: '🏨', color: '#FF6B6B' },
  { id: 'alimentacao', label: 'Alimentação', icon: '🍽️', color: '#4ECDC4' },
  { id: 'transporte', label: 'Transporte', icon: '🚗', color: '#FFE66D' },
  { id: 'passeios', label: 'Passeios', icon: '🎫', color: '#95E1D3' },
  { id: 'compras', label: 'Compras', icon: '🛍️', color: '#F38181' },
  { id: 'outros', label: 'Outros', icon: '💰', color: '#AA96DA' },
];

function formatBRL(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export const BudgetScreen = ({ route, navigation }: any) => {
  const { itineraryId, title } = route.params;
  const colors = useColors();
  const { toast, hideToast, success, error: showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      const data = await budgetService.getBudgetSummary(itineraryId);
      setSummary(data);
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar orçamento');
    } finally {
      setLoading(false);
    }
  }, [itineraryId]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const handleAddExpense = useCallback(async () => {
    if (!category || !description || !amount) {
      showError('Preencha todos os campos');
      return;
    }

    try {
      setSubmitting(true);
      await budgetService.addExpense(itineraryId, {
        category,
        description,
        amount: parseFloat(amount),
        currency: summary?.budget.currency || 'BRL',
        date: new Date(),
      });
      
      success('Gasto adicionado!');
      setShowAddModal(false);
      setCategory('');
      setDescription('');
      setAmount('');
      await loadSummary();
    } catch (error: any) {
      showError(error.message || 'Erro ao adicionar gasto');
    } finally {
      setSubmitting(false);
    }
  }, [category, description, amount, showError, itineraryId, summary?.budget.currency, success, loadSummary]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    showAlert(
      'Remover Gasto',
      'Tem certeza que deseja remover este gasto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await budgetService.deleteExpense(itineraryId, expenseId);
              success('Gasto removido!');
              await loadSummary();
            } catch (error: any) {
              showError(error.message || 'Erro ao remover gasto');
            }
          },
        },
      ]
    );
  }, [itineraryId, success, loadSummary, showError]);

  const renderPieChart = useMemo(() => {
    if (!summary || !summary.expenses.byCategory) return null;

    const total = summary.budget.spent;
    if (total === 0) return null;

    const data = Object.entries(summary.expenses.byCategory).map(([key, value]) => ({
      category: key,
      amount: value.total,
      percentage: ((value.total / total) * 100).toFixed(1),
      color: CATEGORIES.find(c => c.id === key)?.color || '#999',
      icon: CATEGORIES.find(c => c.id === key)?.icon || '💰',
      label: CATEGORIES.find(c => c.id === key)?.label || key,
    })).sort((a, b) => b.amount - a.amount);

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>Gastos por Categoria</Text>
        <View style={styles.legendContainer}>
          {data.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendIcon]}>{item.icon}</Text>
              <Text style={[styles.legendLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                {item.percentage}% ({formatBRL(item.amount)})
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [summary, colors]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!summary) {
    return null;
  }

  const percentage = summary.budget.percentageUsed || 0;
  const isOverBudget = percentage > 100;
  const isWarning = percentage > 80 && percentage <= 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Orçamento</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryRow}>
            <View key="estimated" style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Orçamento
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatBRL(summary.budget.estimated)}
              </Text>
            </View>
            <View key="spent" style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                Gasto
              </Text>
              <Text style={[styles.summaryValue, { color: isOverBudget ? '#F44336' : colors.text }]}>
                {formatBRL(summary.budget.spent)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressContainer, { backgroundColor: colors.backgroundLight }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: isOverBudget ? '#F44336' : isWarning ? '#FF9800' : '#4CAF50',
                },
              ]}
            />
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.percentageText, { color: isOverBudget ? '#F44336' : colors.text }]}>
              {percentage.toFixed(1)}% utilizado
            </Text>
            <Text style={[styles.remainingText, { color: isOverBudget ? '#F44336' : '#4CAF50' }]}>
              {isOverBudget ? 'Excedido: ' : 'Restante: '}
              {formatBRL(Math.abs(summary.budget.remaining))}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              💰 Média diária: {formatBRL(summary.dailyAverage)}
            </Text>
          </View>
        </View>

        {/* Charts */}
        {renderPieChart}

        {/* Recent Expenses */}
        <View style={styles.expensesSection}>
          <View style={styles.expensesHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Gastos Recentes ({summary.expenses.total})
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>

          {summary.expenses.recent.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhum gasto registrado
              </Text>
            </View>
          ) : (
            summary.expenses.recent.map((expense) => {
              const cat = CATEGORIES.find(c => c.id === expense.category);
              return (
                <View
                  key={expense._id}
                  style={[styles.expenseCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.expenseLeft}>
                    <Text style={styles.expenseIcon}>{cat?.icon || '💰'}</Text>
                    <View style={styles.expenseInfo}>
                      <Text style={[styles.expenseDescription, { color: colors.text }]}>
                        {expense.description}
                      </Text>
                      <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
                        {cat?.label || expense.category} • {formatDate(expense.date)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={[styles.expenseAmount, { color: colors.text }]}>
                      {formatBRL(expense.amount)}
                    </Text>
                    {expense._id && (
                      <TouchableOpacity
                        onPress={() => handleDeleteExpense(expense._id)}
                        style={styles.deleteButton}
                      >
                        <Text style={{ color: '#F44336', fontSize: 16 }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Gasto</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: category === cat.id ? colors.primary : colors.backgroundLight,
                        borderColor: category === cat.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: category === cat.id ? '#FFF' : colors.text },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundLight, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Ex: Almoço no restaurante"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={[styles.label, { color: colors.text }]}>Valor (R$)</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundLight, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.backgroundLight }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Adicionar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  chartContainer: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendIcon: {
    fontSize: 18,
  },
  legendLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
  },
  expensesSection: {
    marginBottom: 20,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 13,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
