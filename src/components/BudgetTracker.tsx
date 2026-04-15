// mobile/src/components/BudgetTracker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColors } from '../hooks/useColors';
import { showAlert } from './CustomAlert';

// Função utilitária para formatar valor como Real brasileiro
function formatBRL(value: number | string) {
  let num =
    typeof value === 'string' ? Number(value.toString().replace(/[^\d]/g, '')) / 100 : value;
  if (isNaN(num)) num = 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função para aplicar máscara no input
function maskBRLInput(text: string) {
  const cleaned = text.replace(/\D/g, '');
  const num = Number(cleaned) / 100;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Expense {
  _id: string;
  date: Date | string;
  category: string;
  description: string;
  amount: number;
  currency?: string;
  receipt?: string;
}

interface BudgetTrackerProps {
  itineraryId: string;
  budgetEstimated: number;
  budgetSpent: number;
  currency: string;
  expenses: Expense[];
  readOnly?: boolean; // Modo leitura (sem botões de edição)
  onAddExpense: (expense: {
    category: string;
    description: string;
    amount: number;
    date?: Date;
  }) => Promise<void>;
  onUpdateExpense: (expenseId: string, data: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

const CATEGORIES = [
  { id: 'hospedagem', label: 'Hospedagem', icon: '🏨' },
  { id: 'alimentacao', label: 'Alimentação', icon: '🍽️' },
  { id: 'transporte', label: 'Transporte', icon: '🚗' },
  { id: 'atracao', label: 'Atrações', icon: '🎭' },
  { id: 'compras', label: 'Compras', icon: '🛍️' },
  { id: 'outro', label: 'Outro', icon: '💳' },
];

const getCategoryInfo = (categoryId: string) => {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[5];
};

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  itineraryId,
  budgetEstimated,
  budgetSpent,
  currency,
  expenses,
  readOnly = false,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const colors = useColors();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = budgetEstimated - budgetSpent;
  const percentage = budgetEstimated > 0 ? (budgetSpent / budgetEstimated) * 100 : 0;
  const isOverBudget = budgetSpent > budgetEstimated;

  const getProgressColor = () => {
    if (isOverBudget) return colors.error;
    if (percentage > 80) return colors.warning;
    return colors.success;
  };

  const handleAddExpense = async () => {
    if (!selectedCategory || !description.trim() || !amount) {
      showAlert('Atenção', 'Preencha todos os campos');
      return;
    }

    const numAmount = Number(amount.replace(/[^\d]/g, '')) / 100;
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Atenção', 'Valor inválido');
      return;
    }

    setLoading(true);
    try {
      await onAddExpense({
        category: selectedCategory,
        description: description.trim(),
        amount: numAmount,
      });

      setShowAddModal(false);
      setSelectedCategory('');
      setDescription('');
      setAmount('');
    } catch (error: any) {
      showAlert('Erro', error.message || 'Não foi possível adicionar o gasto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    showAlert(
      'Remover gasto',
      `Tem certeza que deseja remover "${expense.description}"? Essa ação não poderá ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteExpense(expense._id);
              showAlert('Gasto removido', 'O gasto foi removido com sucesso.');
            } catch (error: any) {
              showAlert(
                'Não foi possível remover',
                'Não conseguimos remover esse gasto agora. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  };

  // Calcular total por categoria
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });

  return (
    <View style={styles.container}>
      {/* Resumo do Orçamento */}
      <View
        style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Orçamento</Text>
          {!readOnly && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Adicionar Gasto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: getProgressColor(),
                  width: `${Math.min(percentage, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.percentage, { color: getProgressColor() }]}>
            {percentage.toFixed(0)}%
          </Text>
        </View>

        {/* Valores */}
        <View style={styles.valuesRow}>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Estimado</Text>
            <Text style={[styles.valueAmount, { color: colors.text }]}>
              {formatBRL(budgetEstimated)}
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Gasto</Text>
            <Text style={[styles.valueAmount, { color: getProgressColor() }]}>
              {formatBRL(budgetSpent)}
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Restante</Text>
            <Text
              style={[styles.valueAmount, { color: isOverBudget ? colors.error : colors.success }]}
            >
              {formatBRL(Math.abs(remaining))}
            </Text>
          </View>
        </View>

        {isOverBudget && (
          <Text style={[styles.warningText, { color: colors.error }]}>
            ⚠️ Você excedeu o orçamento em {formatBRL(Math.abs(remaining))}
          </Text>
        )}
      </View>

      {/* Lista de Gastos */}
      {expenses.length > 0 && (
        <View
          style={[
            styles.expensesCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gastos Recentes</Text>
          {expenses.slice(0, 5).map((expense) => {
            const categoryInfo = getCategoryInfo(expense.category);
            return (
              <View
                key={expense._id}
                style={[styles.expenseItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseIcon}>{categoryInfo.icon}</Text>
                  <View style={styles.expenseInfo}>
                    <Text style={[styles.expenseDescription, { color: colors.text }]}>
                      {expense.description}
                    </Text>
                    <Text style={[styles.expenseCategory, { color: colors.textSecondary }]}>
                      {categoryInfo.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={[styles.expenseAmount, { color: colors.text }]}>
                    {formatBRL(expense.amount)}
                  </Text>
                  {!readOnly && (
                    <TouchableOpacity onPress={() => handleDeleteExpense(expense)}>
                      <Text style={[styles.deleteButton, { color: colors.error }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
          {expenses.length > 5 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              + {expenses.length - 5} mais gastos
            </Text>
          )}
        </View>
      )}

      {/* Modal Adicionar Gasto */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Adicionar Gasto</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.closeButton, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Seleção de Categoria */}
                <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
                <View style={styles.categoriesGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            selectedCategory === cat.id ? colors.primary : colors.background,
                          borderColor: selectedCategory === cat.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryLabel,
                          { color: selectedCategory === cat.id ? colors.white : colors.text },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Descrição */}
                <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ex: Jantar no restaurante X"
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={200}
                />

                {/* Valor */}
                <Text style={[styles.label, { color: colors.text }]}>Valor ({currency})</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.textSecondary}
                  value={amount}
                  onChangeText={(text) => setAmount(maskBRLInput(text))}
                  keyboardType="numeric"
                  maxLength={20}
                  returnKeyType="done"
                />
              </ScrollView>

              {/* Botões */}
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddExpense}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={[styles.submitButtonText, { color: colors.white }]}>
                      Adicionar
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentage: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  expensesCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  expenseIcon: {
    fontSize: 24,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 12,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    fontSize: 20,
    fontWeight: '300',
  },
  moreText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {},
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
