// mobile/src/screens/ExploreScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useColors } from '../hooks/useColors';
import { Toast } from '../components/Toast';
import exploreService, { PublicItinerary, ExploreFilters } from '../services/exploreService';
import { useToast } from '../hooks/useToast';
import analyticsService from '../services/analyticsService';
import { Tooltip } from '../components/Tooltip';
import { useTooltip } from '../hooks/useTooltip';

// ========== DADOS MOCKADOS TEMPORÁRIOS ==========
const MOCK_ITINERARIES: PublicItinerary[] = [
  {
    _id: 'mock-1',
    title: 'Explorando Paris em 5 Dias',
    description:
      'Um roteiro completo pela Cidade Luz, incluindo Torre Eiffel, Louvre, Versalhes e os melhores cafés parisienses.',
    destination: {
      city: 'Paris',
      country: 'França',
      coverImage:
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop',
    },
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    duration: 5,
    owner: {
      _id: 'user-1',
      name: 'Ana Silva',
      email: 'ana.silva@email.com',
      isPremium: false,
      createdAt: '2025-01-01T00:00:00Z',
    },
    budget: {
      level: 'medio',
      estimatedTotal: 5000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['cultura', 'gastronomia'],
      travelStyle: 'casal',
      pace: 'moderado',
    },
    days: [],
    collaborators: [],
    status: 'confirmado',
    generatedByAI: false,
    isPublic: true,
    isFeatured: true,
    tags: ['Europa', 'Romance', 'Cultura'],
    likesCount: 127,
    savesCount: 89,
    views: 1543,
    rating: { score: 4.8 },
    likes: [],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-08T14:30:00Z',
  },
  {
    _id: 'mock-2',
    title: 'Aventura na Patagônia',
    description:
      'Trekking pelas geleiras e lagos cristalinos do fim do mundo. Inclui Torres del Paine e El Calafate.',
    destination: {
      city: 'El Calafate',
      country: 'Argentina',
      coverImage:
        'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=400&h=200&fit=crop',
    },
    startDate: '2026-07-10',
    endDate: '2026-07-17',
    duration: 7,
    owner: {
      _id: 'user-2',
      name: 'Carlos Mendes',
      email: 'carlos.mendes@email.com',
      isPremium: true,
      createdAt: '2025-02-01T00:00:00Z',
    },
    budget: {
      level: 'medio',
      estimatedTotal: 8000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['aventura', 'natureza'],
      travelStyle: 'amigos',
      pace: 'intenso',
    },
    days: [],
    collaborators: [],
    status: 'planejando',
    generatedByAI: true,
    isPublic: true,
    isFeatured: true,
    tags: ['Aventura', 'Natureza', 'Trekking'],
    likesCount: 203,
    savesCount: 156,
    views: 2891,
    rating: { score: 4.9 },
    likes: [],
    createdAt: '2026-01-20T08:15:00Z',
    updatedAt: '2026-02-09T11:20:00Z',
  },
  {
    _id: 'mock-3',
    title: 'Roteiro Gastronômico em Tóquio',
    description:
      'Descubra os melhores restaurantes, mercados e experiências culinárias da capital japonesa.',
    destination: {
      city: 'Tóquio',
      country: 'Japão',
      coverImage:
        'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop',
    },
    startDate: '2026-05-01',
    endDate: '2026-05-06',
    duration: 5,
    owner: {
      _id: 'user-3',
      name: 'Marina Kobayashi',
      email: 'marina.k@email.com',
      isPremium: false,
      createdAt: '2025-03-01T00:00:00Z',
    },
    budget: {
      level: 'medio',
      estimatedTotal: 6000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['gastronomia', 'cultura'],
      travelStyle: 'solo',
      pace: 'moderado',
    },
    days: [],
    collaborators: [],
    status: 'confirmado',
    generatedByAI: false,
    isPublic: true,
    isFeatured: false,
    tags: ['Gastronomia', 'Cultura', 'Ásia'],
    likesCount: 98,
    savesCount: 67,
    views: 1234,
    rating: { score: 4.7 },
    likes: ['user'],
    createdAt: '2026-02-01T12:00:00Z',
    updatedAt: '2026-02-09T16:45:00Z',
  },
  {
    _id: 'mock-4',
    title: 'Praias Paradisíacas do Caribe',
    description:
      'Roteiro relaxante por Cancún, Playa del Carmen e Tulum com as melhores praias e cenotes.',
    destination: {
      city: 'Tulum',
      country: 'México',
      coverImage:
        'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=200&fit=crop',
    },
    startDate: '2026-08-20',
    endDate: '2026-08-27',
    duration: 7,
    owner: {
      _id: 'user-4',
      name: 'Pedro Santos',
      email: 'pedro.santos@email.com',
      isPremium: true,
      createdAt: '2024-12-01T00:00:00Z',
    },
    budget: {
      level: 'luxo',
      estimatedTotal: 12000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['praia', 'mergulho'],
      travelStyle: 'casal',
      pace: 'relaxado',
    },
    days: [],
    collaborators: [],
    status: 'confirmado',
    generatedByAI: false,
    isPublic: true,
    isFeatured: true,
    tags: ['Praia', 'Relaxamento', 'Mergulho'],
    likesCount: 312,
    savesCount: 234,
    views: 4567,
    rating: { score: 4.9 },
    likes: [],
    createdAt: '2026-01-10T09:30:00Z',
    updatedAt: '2026-02-10T08:15:00Z',
  },
  {
    _id: 'mock-5',
    title: 'Machu Picchu e Vale Sagrado',
    description:
      'Aventura histórica pelo Peru, incluindo Cusco, Vale Sagrado, Águas Calientes e a cidadela inca.',
    destination: {
      city: 'Cusco',
      country: 'Peru',
      coverImage:
        'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=400&h=200&fit=crop',
    },
    startDate: '2026-09-05',
    endDate: '2026-09-11',
    duration: 6,
    owner: {
      _id: 'user-5',
      name: 'Juliana Costa',
      email: 'juliana.costa@email.com',
      isPremium: false,
      createdAt: '2025-01-15T00:00:00Z',
    },
    budget: {
      level: 'medio',
      estimatedTotal: 7000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['história', 'cultura'],
      travelStyle: 'familia',
      pace: 'moderado',
    },
    days: [],
    collaborators: [],
    status: 'planejando',
    generatedByAI: true,
    isPublic: true,
    isFeatured: false,
    tags: ['História', 'Cultura', 'Aventura'],
    likesCount: 187,
    savesCount: 142,
    views: 2345,
    rating: { score: 4.8 },
    likes: ['user'],
    createdAt: '2026-01-25T14:20:00Z',
    updatedAt: '2026-02-07T10:30:00Z',
  },
  {
    _id: 'mock-6',
    title: 'Safári na África do Sul',
    description:
      'Experiência única observando os Big Five no Kruger Park, com hospedagem em lodges de luxo.',
    destination: {
      city: 'Kruger Park',
      country: 'África do Sul',
      coverImage:
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=200&fit=crop',
    },
    startDate: '2026-10-15',
    endDate: '2026-10-22',
    duration: 7,
    owner: {
      _id: 'user-6',
      name: 'Roberto Lima',
      email: 'roberto.lima@email.com',
      isPremium: true,
      createdAt: '2024-11-01T00:00:00Z',
    },
    budget: {
      level: 'luxo',
      estimatedTotal: 15000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['fotografia', 'natureza'],
      travelStyle: 'solo',
      pace: 'moderado',
    },
    days: [],
    collaborators: [],
    status: 'confirmado',
    generatedByAI: false,
    isPublic: true,
    isFeatured: true,
    tags: ['Safari', 'Natureza', 'Fotografia'],
    likesCount: 256,
    savesCount: 198,
    views: 3456,
    rating: { score: 5.0 },
    likes: [],
    createdAt: '2026-01-18T11:45:00Z',
    updatedAt: '2026-02-09T15:00:00Z',
  },
  {
    _id: 'mock-7',
    title: 'Nordeste Brasileiro Completo',
    description:
      'De Salvador a Jericoacoara, passando por Maceió, Maragogi, Porto de Galinhas e Natal.',
    destination: {
      city: 'Salvador',
      country: 'Brasil',
      coverImage:
        'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=200&fit=crop',
    },
    startDate: '2026-12-20',
    endDate: '2027-01-03',
    duration: 14,
    owner: {
      _id: 'user-7',
      name: 'Fernanda Oliveira',
      email: 'fernanda.oliveira@email.com',
      isPremium: false,
      createdAt: '2025-02-01T00:00:00Z',
    },
    budget: {
      level: 'economico',
      estimatedTotal: 4000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['praia', 'cultura'],
      travelStyle: 'familia',
      pace: 'relaxado',
    },
    days: [],
    collaborators: [],
    status: 'planejando',
    generatedByAI: false,
    isPublic: true,
    isFeatured: false,
    tags: ['Praia', 'Brasil', 'Cultura'],
    likesCount: 143,
    savesCount: 101,
    views: 1876,
    rating: { score: 4.6 },
    likes: [],
    createdAt: '2026-02-03T13:30:00Z',
    updatedAt: '2026-02-10T09:00:00Z',
  },
  {
    _id: 'mock-8',
    title: 'Islândia: Terra de Fogo e Gelo',
    description:
      'Círculo Dourado, Aurora Boreal, Blue Lagoon e cachoeiras impressionantes em 8 dias.',
    destination: {
      city: 'Reykjavik',
      country: 'Islândia',
      coverImage:
        'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=400&h=200&fit=crop',
    },
    startDate: '2026-11-10',
    endDate: '2026-11-18',
    duration: 8,
    owner: {
      _id: 'user-8',
      name: 'Lucas Ferreira',
      email: 'lucas.ferreira@email.com',
      isPremium: true,
      createdAt: '2025-01-20T00:00:00Z',
    },
    budget: {
      level: 'luxo',
      estimatedTotal: 18000,
      currency: 'BRL',
    },
    preferences: {
      interests: ['fotografia', 'aurora'],
      travelStyle: 'casal',
      pace: 'moderado',
    },
    days: [],
    collaborators: [],
    status: 'confirmado',
    generatedByAI: false,
    isPublic: true,
    isFeatured: true,
    tags: ['Natureza', 'Fotografia', 'Aurora'],
    likesCount: 289,
    savesCount: 213,
    views: 3987,
    rating: { score: 4.9 },
    likes: ['user'],
    createdAt: '2026-01-28T16:00:00Z',
    updatedAt: '2026-02-09T12:45:00Z',
  },
];
// ================================================

export const ExploreScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { toast, hideToast, error: showError } = useToast();
  const { shouldShowTooltip, markTooltipAsShown } = useTooltip();
  const [activeTab, setActiveTab] = useState<'discover' | 'featured' | 'saved'>('discover');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showExploreTooltip, setShowExploreTooltip] = useState(false);

  // Descobrir
  const [itineraries, setItineraries] = useState<PublicItinerary[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, hasNext: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ExploreFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Em Destaque
  const [featuredItineraries, setFeaturedItineraries] = useState<PublicItinerary[]>([]);

  // Salvos
  const [savedItineraries, setSavedItineraries] = useState<PublicItinerary[]>([]);
  const [savedPagination, setSavedPagination] = useState<any>({ page: 1, hasNext: false });
  const [savedInitialized, setSavedInitialized] = useState(false);

  const loadDiscoverItineraries = useCallback(
    async (page: number) => {
      try {
        // ========== USANDO DADOS MOCKADOS ==========
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simula delay da API

        let filteredData = [...MOCK_ITINERARIES];

        // Aplicar busca se houver
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredData = filteredData.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              item.description?.toLowerCase().includes(query) ||
              `${item.destination?.city ?? ''} ${item.destination?.country ?? ''}`
                .toLowerCase()
                .includes(query) ||
              item.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        if (page === 1) {
          setItineraries(filteredData);
        } else {
          setItineraries((prev) => [...prev, ...filteredData]);
        }
        setPagination({ page, hasNext: false, total: filteredData.length });
        // ===========================================

        /* CÓDIGO REAL - DESCOMENTAR QUANDO TIVER DADOS NO BACKEND
      const data = await exploreService.getPublicItineraries({
        ...filters,
        search: searchQuery || undefined,
        page,
        limit: 20,
      });

      if (page === 1) {
        setItineraries(data.itineraries);
      } else {
        setItineraries(prev => [...prev, ...data.itineraries]);
      }
      setPagination(data.pagination);
      */
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          showError('Erro ao carregar roteiros');
        }
        throw error;
      } finally {
        setLoadingMore(false);
      }
    },
    [filters, searchQuery, showError]
  );

  const loadFeaturedItineraries = useCallback(async () => {
    try {
      // ========== USANDO DADOS MOCKADOS ==========
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simula delay da API
      const featuredData = MOCK_ITINERARIES.filter((item) => item.isFeatured)
        // Ordena por popularidade: views + likes (com peso maior para likes)
        .sort((a, b) => {
          const scoreA = (a.views || 0) + (a.likesCount || 0) * 2;
          const scoreB = (b.views || 0) + (b.likesCount || 0) * 2;
          return scoreB - scoreA; // Ordem decrescente (maior primeiro)
        });
      setFeaturedItineraries(featuredData);
      // ===========================================

      /* CÓDIGO REAL - DESCOMENTAR QUANDO TIVER DADOS NO BACKEND
      const data = await exploreService.getFeatured(20);
      setFeaturedItineraries(data);
      */
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showError('Erro ao carregar destaques');
      }
    }
  }, [showError]);

  const loadSavedItineraries = useCallback(
    async (page: number) => {
      try {
        // ========== USANDO DADOS MOCKADOS ==========
        // Apenas inicializar na primeira vez, depois manter o estado em memória
        if (!savedInitialized) {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simula delay da API
          // Inicializar vazio - usuário vai salvando conforme interage
          setSavedItineraries([]);
          setSavedPagination({ page: 1, hasNext: false, total: 0 });
          setSavedInitialized(true);
        }
        // Depois da primeira carga, não recarregar - manter estado
        // ===========================================

        /* CÓDIGO REAL - DESCOMENTAR QUANDO TIVER DADOS NO BACKEND
      const data = await exploreService.getSaved(page, 20);

      if (page === 1) {
        setSavedItineraries(data.itineraries);
      } else {
        setSavedItineraries(prev => [...prev, ...data.itineraries]);
      }
      setSavedPagination(data.pagination);
      */
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          showError('Erro ao carregar salvos');
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [savedInitialized, showError]
  );

  const loadData = useCallback(async () => {
    try {
      if (activeTab === 'discover') {
        await loadDiscoverItineraries(1);
      } else if (activeTab === 'featured') {
        await loadFeaturedItineraries();
      } else if (activeTab === 'saved') {
        await loadSavedItineraries(1);
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showError('Erro ao carregar roteiros');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    activeTab,
    loadDiscoverItineraries,
    loadFeaturedItineraries,
    loadSavedItineraries,
    showError,
  ]);

  // Carregar dados quando a tela ganhar foco ou mudar de aba
  useFocusEffect(
    useCallback(() => {
      // Só recarregar se for a primeira vez ou se mudou de aba
      if (activeTab === 'discover' && itineraries.length === 0) {
        setLoading(true);
        loadData();
      } else if (activeTab === 'featured' && featuredItineraries.length === 0) {
        setLoading(true);
        loadData();
      } else if (activeTab === 'saved' && !savedInitialized) {
        setLoading(true);
        loadData();
      }
    }, [activeTab, itineraries.length, featuredItineraries.length, savedInitialized, loadData])
  );

  // Tooltip para explorar
  useFocusEffect(
    useCallback(() => {
      if (shouldShowTooltip('explore')) {
        const timer = setTimeout(() => {
          setShowExploreTooltip(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [shouldShowTooltip])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;

    if (activeTab === 'discover' && pagination.hasNext) {
      setLoadingMore(true);
      loadDiscoverItineraries(pagination.page + 1);
    } else if (activeTab === 'saved' && savedPagination.hasNext) {
      setLoadingMore(true);
      loadSavedItineraries(savedPagination.page + 1);
    }
  }, [
    loadingMore,
    activeTab,
    pagination.hasNext,
    pagination.page,
    savedPagination.hasNext,
    loadDiscoverItineraries,
    loadSavedItineraries,
  ]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Analytics: busca de destino
      if (searchQuery.trim()) {
        await analyticsService.logDestinationSearch(searchQuery.trim(), itineraries.length);
      }

      await loadDiscoverItineraries(1);
    } catch (error) {
      // Erro já tratado em loadDiscoverItineraries
    } finally {
      setLoading(false);
    }
  }, [searchQuery, itineraries.length, loadDiscoverItineraries]);

  const handleToggleLike = useCallback(
    async (id: string) => {
      try {
        // ========== USANDO APENAS ESTADO LOCAL (MOCK) ==========
        // await exploreService.toggleLike(id);

        // Atualizar localmente
        const updateItineraries = (items: PublicItinerary[]) =>
          items.map((item) => {
            if (item._id === id) {
              const isLiked = item.likes?.includes('user');
              return {
                ...item,
                likes: isLiked
                  ? item.likes.filter((l) => l !== 'user')
                  : [...(item.likes || []), 'user'],
                likesCount: isLiked ? (item.likesCount || 0) - 1 : (item.likesCount || 0) + 1,
              };
            }
            return item;
          });

        setItineraries(updateItineraries);
        setFeaturedItineraries(updateItineraries);
        setSavedItineraries(updateItineraries);
        // =======================================================

        /* CÓDIGO REAL - DESCOMENTAR QUANDO TIVER BACKEND
      await exploreService.toggleLike(id);
      */
      } catch (error) {
        showError('Erro ao curtir roteiro');
      }
    },
    [showError]
  );

  const handleToggleSave = useCallback(
    async (id: string) => {
      try {
        // ========== USANDO APENAS ESTADO LOCAL (MOCK) ==========
        // Atualiza contador de saves
        const updateSaved = (items: PublicItinerary[], isSaving: boolean) =>
          items.map((item) => {
            if (item._id === id) {
              return {
                ...item,
                savesCount: isSaving
                  ? (item.savesCount || 0) + 1
                  : Math.max((item.savesCount || 0) - 1, 0),
              };
            }
            return item;
          });

        // Verifica se já está salvo
        const isSaved = savedItineraries.some((i) => i._id === id);

        if (!isSaved) {
          // Adiciona aos salvos
          const itemToSave = [...itineraries, ...featuredItineraries, ...savedItineraries].find(
            (i) => i._id === id
          );
          if (itemToSave) {
            const updatedItem = { ...itemToSave, savesCount: (itemToSave.savesCount || 0) + 1 };
            setSavedItineraries((prev) => [...prev, updatedItem]);
            // Atualiza contador nas outras abas
            setItineraries((prev) => updateSaved(prev, true));
            setFeaturedItineraries((prev) => updateSaved(prev, true));
          }
        } else {
          // Remove dos salvos
          setSavedItineraries((prev) => prev.filter((i) => i._id !== id));
          // Atualiza contador nas outras abas
          setItineraries((prev) => updateSaved(prev, false));
          setFeaturedItineraries((prev) => updateSaved(prev, false));
        }
        // =======================================================

        /* CÓDIGO REAL - DESCOMENTAR QUANDO TIVER BACKEND
      const result = await exploreService.toggleSave(id);

      if (!result.saved && activeTab === 'saved') {
        setSavedItineraries(prev => prev.filter(i => i._id !== id));
      }
      */
      } catch (error) {
        showError('Erro ao salvar roteiro');
      }
    },
    [savedItineraries, itineraries, featuredItineraries, showError]
  );

  const currentData = useMemo(() => {
    if (activeTab === 'discover') return itineraries;
    if (activeTab === 'featured') return featuredItineraries;
    return savedItineraries;
  }, [activeTab, itineraries, featuredItineraries, savedItineraries]);

  const renderItineraryCard = useCallback(
    ({ item }: { item: PublicItinerary }) => {
      const startDate = format(new Date(item.startDate), 'dd MMM', { locale: ptBR });
      const endDate = format(new Date(item.endDate), 'dd MMM yyyy', { locale: ptBR });

      // Verificar se já está curtido/salvo
      const isLiked = item.likes?.includes('user') || false;
      const isSaved = savedItineraries.some((i) => i._id === item._id);

      return (
        <TouchableOpacity
          onPress={() => navigation.navigate('ItineraryDetail', { id: item._id })}
          style={[styles.exploreCard, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          {/* Imagem */}
          <Image
            source={{
              uri:
                item.destination?.coverImage ||
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop',
            }}
            style={styles.cardImage}
          />

          {/* Conteúdo */}
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardDestination, { color: colors.textSecondary }]}>
              {item.destination
                ? `${item.destination.city || 'N/A'}, ${item.destination.country || 'N/A'}`
                : 'Destino não informado'}
            </Text>
            <Text style={[styles.cardDates, { color: colors.textSecondary }]}>
              {startDate} - {endDate} • {item.duration} dias
            </Text>

            {/* Footer integrado com stats e ações */}
            <View style={styles.cardFooter}>
              <View style={styles.stats}>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  👁️ {item.views || 0}
                </Text>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  ❤️ {item.likesCount || 0}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleLike(item._id);
                  }}
                  style={[
                    styles.actionButton,
                    { backgroundColor: isLiked ? colors.primary : colors.background },
                  ]}
                >
                  <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleSave(item._id);
                  }}
                  style={[
                    styles.actionButton,
                    { backgroundColor: isSaved ? colors.primary : colors.background },
                  ]}
                >
                  <Text style={styles.actionIcon}>{isSaved ? '🔖' : '📑'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [savedItineraries, navigation, colors, handleToggleLike, handleToggleSave]
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>🌍 Explorar</Text>
      </View>

      {/* Tabs */}
      <View
        style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('discover')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'discover' ? colors.primary : colors.textSecondary },
            ]}
          >
            Descobrir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'featured' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('featured')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'featured' ? colors.primary : colors.textSecondary },
            ]}
          >
            Em Destaque
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('saved')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'saved' ? colors.primary : colors.textSecondary },
            ]}
          >
            Salvos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search (apenas em Descobrir) */}
      {activeTab === 'discover' && (
        <>
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.card, borderBottomColor: colors.border },
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Buscar destino, país..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.primary }]}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.infoBar, { backgroundColor: colors.card }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 Exibindo apenas roteiros públicos de usuários com perfil público
            </Text>
          </View>
        </>
      )}

      {/* Lista */}
      <FlatList
        data={currentData}
        renderItem={renderItineraryCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'discover' ? '🌍' : activeTab === 'featured' ? '⭐' : '🔖'}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'discover'
                ? 'Nenhum roteiro encontrado'
                : activeTab === 'featured'
                  ? 'Nenhum destaque disponível'
                  : 'Você ainda não salvou roteiros'}
            </Text>
          </View>
        }
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <Tooltip
        visible={showExploreTooltip}
        message="🌍 Descubra roteiros incríveis criados por outros viajantes e inspire-se para sua próxima aventura!"
        position="center"
        onClose={() => {
          setShowExploreTooltip(false);
          markTooltipAsShown('explore');
        }}
        buttonText="Vamos explorar!"
      />
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  list: {
    padding: 16,
  },
  exploreCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDestination: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardDates: {
    fontSize: 14,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 13,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
