// mobile/src/screens/EditItineraryScreen.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itineraryService } from '../services/itineraryService';
import { Itinerary } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DateInput } from '../components/DateInput';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useColors } from '../hooks/useColors';
import { format, differenceInDays, addDays, parseISO, parse, isValid, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EditItineraryScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const { toast, hideToast, success, error: showError } = useToast();
  const colors = useColors();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLevel, setBudgetLevel] = useState<'economico' | 'medio' | 'luxo'>('medio');
  const [status, setStatus] = useState<'rascunho' | 'planejando' | 'confirmado' | 'em_andamento' | 'concluido'>('rascunho');

  // Validação de datas
  const [dateErrors, setDateErrors] = useState({ start: '', end: '' });

  const loadItinerary = useCallback(async () => {
    try {
      const data = await itineraryService.getById(id);
      setItinerary(data);

      // Preencher form - converter de ISO para DD/MM/AAAA
      setTitle(data.title);
      setCity(data.destination?.city || '');
      setCountry(data.destination?.country || '');
      
      // Converter datas de ISO para DD/MM/AAAA
      const startISO = parseISO(data.startDate);
      const endISO = parseISO(data.endDate);
      setStartDate(format(startISO, 'dd/MM/yyyy'));
      setEndDate(format(endISO, 'dd/MM/yyyy'));
      
      setBudgetLevel(data.budget?.level || 'medio');
      setStatus(data.status);
    } catch (error) {
      showAlert('Erro', 'Não foi possível carregar o roteiro.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    loadItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Carregar apenas no mount

  // Converte DD/MM/AAAA para ISO com timezone seguro (meio-dia UTC para evitar mudança de dia)
  const convertToISO = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('/');
    // Criar data com meio-dia UTC para evitar problemas de timezone
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0));
    return isValid(date) ? date.toISOString() : null;
  };

  const validateDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(dateString)) return false;

    try {
      const date = parse(dateString, 'dd/MM/yyyy', new Date());
      return isValid(date);
    } catch {
      return false;
    }
  };

  const validateDates = (): boolean => {
    const errors = { start: '', end: '' };
    let isValidForm = true;

    // Validar data de início
    if (!startDate) {
      errors.start = 'Data de início é obrigatória';
      isValidForm = false;
    } else if (!validateDate(startDate)) {
      errors.start = 'Formato inválido (use DD/MM/AAAA)';
      isValidForm = false;
    }

    // Validar data de término
    if (!endDate) {
      errors.end = 'Data de término é obrigatória';
      isValidForm = false;
    } else if (!validateDate(endDate)) {
      errors.end = 'Formato inválido (use DD/MM/AAAA)';
      isValidForm = false;
    } else if (startDate && validateDate(startDate)) {
      const start = parse(startDate, 'dd/MM/yyyy', new Date());
      const end = parse(endDate, 'dd/MM/yyyy', new Date());

      if (isBefore(end, start)) {
        errors.end = 'Data de término deve ser após a data de início';
        isValidForm = false;
      } else {
        const duration = differenceInDays(end, start) + 1;
        if (duration > 365) {
          errors.end = 'Duração máxima: 365 dias';
          isValidForm = false;
        }
      }
    }

    setDateErrors(errors);
    return isValidForm;
  };

  const calculatedDuration = useMemo(() => {
    if (!startDate || !endDate || !validateDate(startDate) || !validateDate(endDate)) {
      return null;
    }

    try {
      const start = parse(startDate, 'dd/MM/yyyy', new Date());
      const end = parse(endDate, 'dd/MM/yyyy', new Date());
      return differenceInDays(end, start) + 1;
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);

    // Auto-ajustar data de fim se necessário
    if (value && endDate && validateDate(value) && validateDate(endDate)) {
      const start = parse(value, 'dd/MM/yyyy', new Date());
      const end = parse(endDate, 'dd/MM/yyyy', new Date());

      if (isBefore(end, start)) {
        // Sugerir 7 dias após a data de início
        const suggestedEnd = addDays(start, 6);
        setEndDate(format(suggestedEnd, 'dd/MM/yyyy'));
      }
    }
  }, [endDate]);

  const handleSave = useCallback(async () => {
    if (!title || !city || !country) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!validateDates()) {
      showError('Corrija os erros nas datas');
      return;
    }

    // Converter datas para formato ISO antes de enviar
    const startISO = convertToISO(startDate);
    const endISO = convertToISO(endDate);

    if (!startISO || !endISO) {
      showError('Erro ao processar datas');
      return;
    }

    setSaving(true);
    try {
      // Atualizar apenas os campos editados
      const updateData: any = {
        title,
        destination: { 
          city, 
          country,
          coverImage: itinerary?.destination?.coverImage // preservar imagem
        },
        startDate: startISO,
        endDate: endISO,
        budget: {
          level: budgetLevel,
          currency: itinerary?.budget?.currency || 'BRL',
          estimatedTotal: itinerary?.budget?.estimatedTotal || 0,
          spent: itinerary?.budget?.spent || 0, // preservar gastos
        },
        status,
      };

      const updated = await itineraryService.update(id, updateData);

      success('Roteiro atualizado com sucesso!');
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (err: any) {
      console.error('❌ Erro ao salvar:', err);
      showError(err.response?.data?.message || 'Erro ao salvar roteiro.');
    } finally {
      setSaving(false);
    }
  }, [title, city, country, validateDates, startDate, endDate, showError, budgetLevel, itinerary, status, id, success, navigation]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const budgetOptions = useMemo(() => [
    { value: 'economico', label: 'Econômico', icon: '💰' },
    { value: 'medio', label: 'Médio', icon: '💳' },
    { value: 'luxo', label: 'Luxo', icon: '💎' },
  ], []);

  const statusOptions = [
    { value: 'rascunho', label: 'Rascunho', icon: '📝' },
    { value: 'planejando', label: 'Planejando', icon: '🗓️' },
    { value: 'confirmado', label: 'Confirmado', icon: '✅' },
    { value: 'em_andamento', label: 'Em andamento', icon: '✈️' },
    { value: 'concluido', label: 'Concluído', icon: '🎉' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={[styles.backArrow, { color: colors.text }]}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.title, { color: colors.text }]}>✏️ Editar Roteiro</Text>
                </View>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Atualize as informações do seu roteiro de viagem</Text>
              </View>
              {/* Conteúdo do formulário */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Destino</Text>
                <Input
                  label="Título do roteiro"
                  placeholder="Ex: Viagem para Paris"
                  value={title}
                  onChangeText={setTitle}
                />
                <PlaceAutocomplete
                  label="Buscar destino"
                  placeholder="Digite uma cidade... (Ex: Paris, Rio de Janeiro)"
                  initialValue={city && country ? `${city}, ${country}` : ''}
                  onPlaceSelected={(details) => {
                    setCity(details.city);
                    setCountry(details.country);
                  }}
                />
                <View style={styles.manualInputs}>
                  <Input
                    label="Cidade"
                    placeholder="Selecione um destino acima"
                    value={city}
                    onChangeText={setCity}
                    containerStyle={styles.halfInput}
                    editable={false}
                  />
                  <Input
                    label="País"
                    placeholder="Selecione um destino acima"
                    value={country}
                    onChangeText={setCountry}
                    containerStyle={styles.halfInput}
                    editable={false}
                  />
                </View>
              </View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Datas</Text>
                <DateInput
                  label="Data de início"
                  placeholder="DD/MM/AAAA"
                  value={startDate}
                  onChangeText={handleStartDateChange}
                  error={dateErrors.start}
                />
                <DateInput
                  label="Data de término"
                  placeholder="DD/MM/AAAA"
                  value={endDate}
                  onChangeText={setEndDate}
                  error={dateErrors.end}
                />
                {/* Preview de duração */}
                {calculatedDuration !== null && calculatedDuration > 0 && !dateErrors.start && !dateErrors.end && (
                  <View style={[styles.durationPreview, { backgroundColor: colors.primary + '15' }]}> 
                    <Text style={styles.durationIcon}>📅</Text>
                    <View style={styles.durationTextContainer}>
                      <Text style={[styles.durationText, { color: colors.primary }]}> 
                        {calculatedDuration} {calculatedDuration === 1 ? 'dia' : 'dias'} de viagem
                      </Text>
                      {startDate && endDate && validateDate(startDate) && validateDate(endDate) && (
                        <Text style={[styles.durationDates, { color: colors.textSecondary }]}> 
                          {format(parse(startDate, 'dd/MM/yyyy', new Date()), "dd 'de' MMM", { locale: ptBR })} até{' '}
                          {format(parse(endDate, 'dd/MM/yyyy', new Date()), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Orçamento</Text>
                <View style={styles.optionsRow}>
                  {budgetOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionCard,
                        { backgroundColor: colors.card, borderColor: budgetLevel === option.value ? colors.primary : colors.border },
                        budgetLevel === option.value && { backgroundColor: colors.primary + '10' },
                      ]}
                      onPress={() => setBudgetLevel(option.value as any)}
                    >
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: budgetLevel === option.value ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Status da Viagem</Text>
                <View style={styles.optionsRow}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusCard,
                        { backgroundColor: colors.card, borderColor: status === option.value ? colors.primary : colors.border },
                        status === option.value && { backgroundColor: colors.primary + '10' },
                      ]}
                      onPress={() => setStatus(option.value as any)}
                    >
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: status === option.value ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <Button
                title="Salvar alterações"
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
              <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
              />
            </ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    // flex: 1, // Removido para evitar conflito de rolagem
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  backArrow: {
    fontSize: 36,
    fontWeight: '300',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  manualInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  halfInput: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: 100,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    flex: 1,
    minWidth: 100,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  durationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  durationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  durationTextContainer: {
    flex: 1,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  durationDates: {
    fontSize: 14,
  },
  saveButton: {
    marginTop: 16,
  },
});