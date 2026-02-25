// mobile/src/screens/GenerateScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { itineraryService } from '../services/itineraryService';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DateInput } from '../components/DateInput';
import { PlaceAutocomplete } from '../components/PlaceAutocomplete';
import { Toast } from '../components/Toast';
import { Tooltip } from '../components/Tooltip';
import { LimitModal } from '../components/LimitModal';
import { useToast } from '../hooks/useToast';
import { useTooltip } from '../hooks/useTooltip';
import { useColors } from '../hooks/useColors';
import { useCanPerformAction, useMySubscription } from '../hooks/useSubscription';
import { LimitError } from '../types/subscription';
import { format, differenceInDays, addDays, parse, isValid, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para gerar URL de imagem do Unsplash baseada no destino
const getCoverImageForDestination = (city: string, country: string): string => {
  // Encode para URL
  const searchQuery = encodeURIComponent(`${city} ${country} travel landmark`);
  return `https://source.unsplash.com/800x400/?${searchQuery}`;
};

export const GenerateScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { toast, hideToast, success, error: showError } = useToast();
  const { shouldShowTooltip, markTooltipAsShown } = useTooltip();
  const { canUseAI, usage, plan } = useCanPerformAction();
  const { data: subscriptionData } = useMySubscription();
  const queryClient = useQueryClient();
  
  const [showAITooltip, setShowAITooltip] = useState(false);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetLevel, setBudgetLevel] = useState<'economico' | 'medio' | 'luxo'>('medio');
  const [travelStyle, setTravelStyle] = useState<'solo' | 'casal' | 'familia' | 'amigos' | 'mochileiro'>('solo');
  const [loading, setLoading] = useState(false);

  // Limit Modal
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<LimitError | null>(null);

  // Validação de datas
  const [dateErrors, setDateErrors] = useState({ start: '', end: '' });
  const [resetKey, setResetKey] = useState(0);

  // Limpar campos quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      setCity('');
      setCountry('');
      setCoverImage('');
      setStartDate('');
      setEndDate('');
      setBudgetLevel('medio');
      setTravelStyle('solo');
      setDateErrors({ start: '', end: '' });
      setResetKey(prev => prev + 1); // Força recriação do PlaceAutocomplete
      
      // Mostrar tooltip IA na primeira vez
      if (shouldShowTooltip('useAI')) {
        const timer = setTimeout(() => setShowAITooltip(true), 1500);
        return () => clearTimeout(timer);
      }
    }, [shouldShowTooltip])
  );

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
    const today = startOfDay(new Date());

    // Validar data de início
    if (!startDate) {
      errors.start = 'Data de início é obrigatória';
      isValidForm = false;
    } else if (!validateDate(startDate)) {
      errors.start = 'Formato inválido (use DD/MM/AAAA)';
      isValidForm = false;
    } else {
      const start = parse(startDate, 'dd/MM/yyyy', new Date());

      if (isBefore(startOfDay(start), today)) {
        errors.start = 'Data não pode ser no passado';
        isValidForm = false;
      }
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

      if (isBefore(startOfDay(end), today)) {
        errors.end = 'Data não pode ser no passado';
        isValidForm = false;
      } else if (isBefore(end, start)) {
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

  const handleGenerate = useCallback(async () => {
    if (loading) {
      console.log('⏳ Já está gerando, ignorando clique duplicado');
      return;
    }

    if (!city || !country) {
      showError('Preencha o destino');
      return;
    }

    if (!validateDates()) {
      showError('Corrija os erros nas datas');
      return;
    }

    // Verificar limite de IA ANTES de tentar gerar
    const can = canUseAI();
    if (can === false) {
      setLimitError({
        error: 'limit_reached',
        message: `Você atingiu o limite de ${usage?.aiGenerations.limit} criações de roteiros por mês do plano ${plan?.toUpperCase()}`,
        currentUsage: usage?.aiGenerations.current || 0,
        limit: usage?.aiGenerations.limit || 0,
        plan: plan || 'free',
        upgrade: {
          message: 'Faça upgrade para o Premium e tenha gerações ilimitadas',
          availablePlans: ['premium'],
        },
      });
      setShowLimitModal(true);
      return;
    }

    // Converter datas para formato ISO antes de enviar
    const startISO = convertToISO(startDate);
    const endISO = convertToISO(endDate);

    if (!startISO || !endISO) {
      showError('Erro ao processar datas');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Chamando API para gerar roteiro...');
      const itinerary = await itineraryService.generateWithAI({
        destination: { 
          city, 
          country,
          coverImage: coverImage || getCoverImageForDestination(city, country)
        },
        startDate: startISO,
        endDate: endISO,
        budget: { level: budgetLevel, currency: 'BRL' },
        preferences: { travelStyle, interests: [], pace: 'moderado' },
      });

      console.log('✅ Roteiro recebido da API:', itinerary._id);
      success('Roteiro criado com sucesso!');
      
      // Forçar reset completo das queries
      await queryClient.resetQueries({ queryKey: ['usage'] });
      await queryClient.resetQueries({ queryKey: ['subscription'] });
      await queryClient.resetQueries({ queryKey: ['itineraries'] });
      
      // Navegar para o Dashboard (aba principal) e depois para o detalhe
      // Isso evita duplicação porque reseta o stack da aba Generate
      setTimeout(() => {
        navigation.navigate('Dashboard', {
          screen: 'ItineraryDetail',
          params: { id: itinerary._id }
        });
      }, 500);
    } catch (err: any) {
      // Capturar erro 403 de limite atingido (não é um erro crítico, é parte do fluxo de negócio)
      if (err.response?.status === 403 && err.response?.data?.error === 'limit_reached') {
        console.log('ℹ️ Limite de plano atingido:', err.response.data);
        setLimitError(err.response.data);
        setShowLimitModal(true);
      } else {
        // Apenas erros técnicos vão para console.error
        console.error('❌ Erro ao gerar roteiro:', err);
        console.error('Response:', err.response?.data);
        showError(err.response?.data?.message || 'Erro ao gerar roteiro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, city, country, validateDates, startDate, endDate, budgetLevel, travelStyle, coverImage, success, navigation, showError, canUseAI, usage, plan]);

  const budgetOptions = useMemo(() => [
    { value: 'economico', label: 'Econômico', icon: '💰' },
    { value: 'medio', label: 'Médio', icon: '💳' },
    { value: 'luxo', label: 'Luxo', icon: '💎' },
  ], []);

  const styleOptions = useMemo(() => [
    { value: 'solo', label: 'Solo', icon: '🚶' },
    { value: 'casal', label: 'Casal', icon: '💑' },
    { value: 'familia', label: 'Família', icon: '👨‍👩‍👧‍👦' },
    { value: 'amigos', label: 'Amigos', icon: '👥' },
    { value: 'mochileiro', label: 'Mochileiro', icon: '🎒' },
  ], []);

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
            <Text style={[styles.title, { color: colors.text }]}>✨ Criar Roteiro com IA</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Preencha as informações e deixe a IA criar um roteiro personalizado para você!</Text>
          </View>
          {/* Conteúdo do formulário abaixo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Destino</Text>
            <PlaceAutocomplete
              key={resetKey}
              label="Buscar destino"
              placeholder="Digite uma cidade... (Ex: Paris, Rio de Janeiro)"
              onPlaceSelected={(details) => {
                setCity(details.city);
                setCountry(details.country);
                // Usar photo do Google Places se disponível, senão Unsplash
                const image = details.photoUrl || getCoverImageForDestination(details.city, details.country);
                setCoverImage(image);
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Estilo de viagem</Text>
            <View style={styles.optionsRow}>
              {styleOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.card, borderColor: travelStyle === option.value ? colors.primary : colors.border },
                    travelStyle === option.value && { backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => setTravelStyle(option.value as any)}
                >
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: travelStyle === option.value ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Button
            title="Gerar roteiro com IA"
            onPress={handleGenerate}
            loading={loading}
            style={styles.generateButton}
          />
          <Toast
            message={toast.message}
            type={toast.type}
            visible={toast.visible}
            onHide={hideToast}
          />
          <Tooltip
            visible={showAITooltip}
            message="🤖 Preencha os dados da viagem e clique em 'Gerar roteiro com IA' para criar um roteiro completo em segundos!"
            position="center"
            onClose={() => {
              setShowAITooltip(false);
              markTooltipAsShown('useAI');
            }}
            buttonText="Entendi!"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Limite de IA Atingido */}
      {limitError && (
        <LimitModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limitError={limitError}
          onUpgrade={() => {
            setShowLimitModal(false);
            navigation.navigate('Pricing');
          }}
          currentPlan={plan || 'free'}
        />
      )}
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
  header: {
    marginBottom: 32,
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
  optionCardSelected: {
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionLabelSelected: {
  },
  generateButton: {
    marginTop: 16,
  },
  manualInputs: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  halfInput: {
    flex: 1,
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
});