// mobile/src/screens/DashboardScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { itineraryService } from '../services/itineraryService';
import { offlineService } from '../services/offlineService';
import { ItineraryCard } from '../components/ItineraryCard';
import { SkeletonItineraryCard } from '../components/SkeletonLoader';
import { ErrorState } from '../components/ErrorState';
import { Toast } from '../components/Toast';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { useToast } from '../hooks/useToast';
import { useTooltip } from '../hooks/useTooltip';
import { useColors } from '../hooks/useColors';
import { formatBRL } from '../components/Input';
import { Tooltip } from '../components/Tooltip';
import { LimitModal } from '../components/LimitModal';
import { AdBanner } from '../components/AdBanner';
import { useCanPerformAction, useMySubscription } from '../hooks/useSubscription';
import { LimitError } from '../types/subscription';
import { Itinerary } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = useColors();
  const { toast, showToast, hideToast, success, error } = useToast();
  const { shouldShowTooltip, markTooltipAsShown } = useTooltip();
  const { canCreateItinerary, usage, plan } = useCanPerformAction();
  const { data: subscriptionData } = useMySubscription();
  
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isLoadingRef = useRef(false);
  const lastLoadTime = useRef(0);

  // Limit Modal
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<LimitError | null>(null);

  // Tooltip
  const [showCreateTooltip, setShowCreateTooltip] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'date'>('recent');
  const [showSortModal, setShowSortModal] = useState(false);


  // Carregar no mount e sempre que voltar ao foco
  const loadItineraries = useCallback(async () => {
    try {
      setHasError(false);
      
      // Verificar se está online
      const isOnline = await offlineService.checkConnection();
      
      if (isOnline) {
        // Online: buscar da API
        const response = await itineraryService.getAll();
        
        // Normalizar resposta (pode ser array ou objeto paginado)
        let data: Itinerary[];
        if (Array.isArray(response)) {
          data = response;
        } else if (response && 'itineraries' in response) {
          data = response.itineraries;
        } else {
          data = [];
        }
        
        console.log('📥 Roteiros carregados:', data.length, 'itens');
        setItineraries(data);
        
        // Salvar offline para acesso futuro
        await offlineService.saveItinerariesOffline(data);
      } else {
        // Offline: buscar do cache
        const cachedData = await offlineService.getOfflineItineraries();
        setItineraries(cachedData);
      }
    } catch (err: any) {
      // Se for erro 401, sessão já foi tratada pelo interceptor (não logar)
      if (err.response?.status === 401) {
        // Tentar carregar do cache sem mostrar erro (usuário já viu "Sessão Expirada")
        const cachedData = await offlineService.getOfflineItineraries();
        if (cachedData.length > 0) {
          setItineraries(cachedData);
        }
      } else {
        // Outros erros: logar e tentar carregar do cache
        console.error('Erro ao carregar roteiros:', err);
        
        const cachedData = await offlineService.getOfflineItineraries();
        if (cachedData.length > 0) {
          setItineraries(cachedData);
          error('Sem conexão. Mostrando roteiros salvos.');
        } else {
          setHasError(true);
          error('Erro ao carregar roteiros');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // Sem dependências para evitar recriação

  // Recarregar sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadItineraries();
      }
    }, [user, loadItineraries])
  );

  // Mostrar tooltip para criar primeiro roteiro
  useEffect(() => {
    if (!loading && itineraries.length === 0 && shouldShowTooltip('createItinerary')) {
      const timer = setTimeout(() => {
        setShowCreateTooltip(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, itineraries.length, shouldShowTooltip]);

  const applyFilters = useCallback(() => {
    let filtered = [...itineraries];

    // Busca por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.destination?.city?.toLowerCase().includes(query)) ||
          (item.destination?.country?.toLowerCase().includes(query))
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Ordenação
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }

    setFilteredItineraries(filtered);
  }, [itineraries, searchQuery, statusFilter, sortBy]);

  // Aplicar filtros quando dados mudarem
  useEffect(() => {
    applyFilters();
  }, [itineraries, searchQuery, statusFilter, sortBy]); // Dependências diretas

  const handleCreateItinerary = () => {
    // Verificar limite antes de navegar
    const can = canCreateItinerary();
    
    if (can === false) {
      setLimitError({
        error: 'limit_reached',
        message: `Você atingiu o limite de ${usage?.itineraries.limit} roteiros do plano ${plan?.toUpperCase()}`,
        currentUsage: usage?.itineraries.current || 0,
        limit: usage?.itineraries.limit || 0,
        plan: plan || 'free',
        upgrade: {
          message: 'Faça upgrade para criar mais roteiros',
          availablePlans: plan === 'free' ? ['premium', 'pro'] : ['pro'],
        },
      });
      setShowLimitModal(true);
      return;
    }
    
    // Prosseguir com criação
    navigation.navigate('Generate');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadItineraries();
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🗺️</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery || statusFilter ? 'Nenhum roteiro encontrado' : 'Nenhum roteiro ainda'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery || statusFilter
          ? 'Tente ajustar os filtros de busca'
          : 'Crie seu primeiro roteiro e comece a planejar sua aventura!'}
      </Text>
      {!searchQuery && !statusFilter && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateItinerary}
        >
          <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>Criar roteiro</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const statusOptions = [
    { value: null, label: 'Todos', icon: '📋' },
    { value: 'rascunho', label: 'Rascunho', icon: '📝' },
    { value: 'planejando', label: 'Planejando', icon: '🗓️' },
    { value: 'confirmado', label: 'Confirmado', icon: '✅' },
    { value: 'em_andamento', label: 'Em andamento', icon: '✈️' },
    { value: 'concluido', label: 'Concluído', icon: '🎉' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Mais recentes', icon: '📅' },
    { value: 'oldest', label: 'Mais antigos', icon: '📅' },
    { value: 'date', label: 'Data da viagem', icon: '🗓️' },
  ];

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Mais recentes';

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
            <Text style={styles.subtitle}>Carregando roteiros...</Text>
          </View>
        </View>
        <View style={styles.listContent}>
          <SkeletonItineraryCard />
          <SkeletonItineraryCard />
          <SkeletonItineraryCard />
        </View>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
            <Text style={styles.subtitle}>Seus roteiros de viagem</Text>
          </View>
        </View>
        <ErrorState
          title="Erro ao carregar roteiros"
          message="Não foi possível carregar seus roteiros. Verifique sua conexão e tente novamente."
          onRetry={() => {
            setLoading(true);
            loadItineraries();
          }}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <OfflineIndicator />
      
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.greeting, { color: colors.text }]}>Olá, {user?.name}! 👋</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {filteredItineraries.length} {filteredItineraries.length === 1 ? 'roteiro' : 'roteiros'}
              </Text>
            </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Buscar por título, cidade ou país..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtros e Ordenação - Header Fixo */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {/* Filtro por Status */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={String(option.value)}
              style={[
                styles.filterChip,
                { backgroundColor: statusFilter === option.value ? colors.primary : colors.card, borderColor: statusFilter === option.value ? colors.primary : colors.border },
              ]}
              onPress={() => setStatusFilter(option.value)}
            >
              <Text style={styles.filterIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  { color: statusFilter === option.value ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ordenação */}
        <View style={styles.sortContainer}>
          <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Ordenar por:</Text>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={[styles.sortButtonText, { color: colors.primary }]}>{currentSortLabel}</Text>
            <Text style={[styles.sortArrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredItineraries}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ItineraryCard
            itinerary={item}
            onPress={() => {
              console.log('🔗 Navegando para roteiro:', item._id, 'Título:', item.title);
              navigation.navigate('ItineraryDetail', {
                id: item._id
              });
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        indicatorStyle={theme === 'dark' ? 'white' : 'black'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* Modal de Ordenação */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSortModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ordenar por</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  sortBy === option.value && { backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => {
                  setSortBy(option.value as any);
                  setShowSortModal(false);
                }}
              >
                <Text style={styles.modalOptionIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.modalOptionText,
                    { color: sortBy === option.value ? colors.primary : colors.text },
                    sortBy === option.value && { fontWeight: '600' },
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Text style={[styles.checkIcon, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* Tooltip para criar primeiro roteiro */}
      <Tooltip
        visible={showCreateTooltip}
        message="👋 Toque em 'Criar' para gerar seu primeiro roteiro com IA em segundos!"
        position="center"
        onClose={() => {
          setShowCreateTooltip(false);
          markTooltipAsShown('createItinerary');
        }}
        buttonText="Entendi!"
      />

      {/* Modal de Limite Atingido */}
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
          </View>
        </TouchableWithoutFeedback>
      </View>
      
      <AdBanner onUpgradePress={() => navigation.navigate('Pricing')} />
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
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 26,
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 32,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  filtersScroll: {
    flexGrow: 0,
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterLabelActive: {
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortLabel: {
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortArrow: {
    fontSize: 10,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionActive: {
  },
  modalOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
  },
  modalOptionTextActive: {
    fontWeight: '600',
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});