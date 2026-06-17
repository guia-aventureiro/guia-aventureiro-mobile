// mobile/src/screens/ExploreScreen.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import exploreService, { PublicItinerary } from '../services/exploreService';
import { useToast } from '../hooks/useToast';
import analyticsService from '../services/analyticsService';
import { Tooltip } from '../components/Tooltip';
import { useTooltip } from '../hooks/useTooltip';
import { useAuth } from '../contexts/AuthContext';
import { SmartImage } from '../components/SmartImage';

const isMockId = (id: string) => id.startsWith('mock-');

const normalizeSearchText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const filterItinerariesByQuery = (items: PublicItinerary[], query: string): PublicItinerary[] => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const fields = [item.title, item.destination?.city, item.destination?.country];

    return fields.some((field) => normalizeSearchText(field).includes(normalizedQuery));
  });
};

export const ExploreScreen = ({ navigation }: any) => {
  const colors = useColors();
  const { user } = useAuth();
  const { toast, hideToast, error: showError } = useToast();
  const { shouldShowTooltip, markTooltipAsShown } = useTooltip();
  const showErrorRef = useRef(showError);
  const loadInProgressRef = useRef(false);
  const likeToggleLockRef = useRef<Set<string>>(new Set());
  const [, setLikeToggleRenderTick] = useState(0);

  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);
  const [activeTab, setActiveTab] = useState<'discover' | 'featured' | 'saved'>('discover');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showExploreTooltip, setShowExploreTooltip] = useState(false);

  // Descobrir
  const [itineraries, setItineraries] = useState<PublicItinerary[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, hasNext: false });
  const [searchQuery, setSearchQuery] = useState('');

  // Em Destaque
  const [featuredItineraries, setFeaturedItineraries] = useState<PublicItinerary[]>([]);

  // Salvos
  const [savedItineraries, setSavedItineraries] = useState<PublicItinerary[]>([]);
  const [savedPagination, setSavedPagination] = useState<any>({ page: 1, hasNext: false });
  const [savedInitialized, setSavedInitialized] = useState(false);

  const applyMockLocalInteraction = useCallback(
    (id: string, type: 'like' | 'save') => {
      if (type === 'like') {
        const localUserId = user?._id || '__mock_local_user__';
        const update = (items: PublicItinerary[]) =>
          items.map((item) =>
            item._id === id
              ? (() => {
                  const likes = Array.isArray(item.likes) ? item.likes : [];
                  const alreadyLiked = likes.some(
                    (likeId) => String(likeId) === String(localUserId)
                  );
                  const nextLikes = alreadyLiked
                    ? likes.filter((likeId) => String(likeId) !== String(localUserId))
                    : [...likes, localUserId];
                  const nextLikesCount = alreadyLiked
                    ? Math.max((item.likesCount || 0) - 1, 0)
                    : (item.likesCount || 0) + 1;

                  return {
                    ...item,
                    likes: nextLikes,
                    likesCount: nextLikesCount,
                  };
                })()
              : item
          );

        setItineraries((prev) => update(prev));
        setFeaturedItineraries((prev) => update(prev));
        setSavedItineraries((prev) => update(prev));
        return;
      }

      const source = [...itineraries, ...featuredItineraries, ...savedItineraries];
      const found = source.find((item) => item._id === id);
      if (!found) return;

      const alreadySaved = savedItineraries.some((item) => item._id === id);
      if (alreadySaved) {
        setSavedItineraries((prev) => prev.filter((item) => item._id !== id));
      } else {
        setSavedItineraries((prev) => [
          { ...found, savesCount: (found.savesCount || 0) + 1 },
          ...prev,
        ]);
      }
    },
    [itineraries, featuredItineraries, savedItineraries, user?._id]
  );

  const loadDiscoverItineraries = useCallback(
    async (page: number) => {
      try {
        const data = await exploreService.getPublicItineraries({
          search: searchQuery || undefined,
          page,
          limit: 20,
        });
        const filteredApiItineraries = filterItinerariesByQuery(
          data.itineraries || [],
          searchQuery
        );

        if (page === 1) {
          setItineraries(filteredApiItineraries);
          setPagination(data.pagination);
        } else {
          setItineraries((prev) => [...prev, ...filteredApiItineraries]);
          setPagination(data.pagination);
        }
      } catch (error: any) {
        if (page === 1) {
          setItineraries([]);
          setPagination({ page: 1, hasNext: false });
          if (error?.response?.status !== 401) {
            showErrorRef.current('Explorar indisponível no momento. Tente novamente em instantes.');
          }
          return;
        }

        if (error?.response?.status !== 401) {
          showErrorRef.current('Erro ao carregar roteiros');
        }
      } finally {
        setLoadingMore(false);
      }
    },
    [searchQuery]
  );

  const loadFeaturedItineraries = useCallback(async () => {
    try {
      const data = await exploreService.getFeatured(20);
      setFeaturedItineraries(data);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showErrorRef.current('Erro ao carregar destaques');
      }
    }
  }, []);

  const loadSavedItineraries = useCallback(async (page: number) => {
    try {
      const data = await exploreService.getSaved(page, 20);

      if (page === 1) {
        setSavedItineraries(data.itineraries);
        setSavedInitialized(true);
      } else {
        setSavedItineraries((prev) => [...prev, ...data.itineraries]);
      }
      setSavedPagination(data.pagination);
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        showErrorRef.current('Erro ao carregar salvos');
      }
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (loadInProgressRef.current) {
      return;
    }

    loadInProgressRef.current = true;

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
        showErrorRef.current('Erro ao carregar roteiros');
      }
    } finally {
      loadInProgressRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, loadDiscoverItineraries, loadFeaturedItineraries, loadSavedItineraries]);

  // Carregar dados quando a tela ganhar foco ou mudar de aba
  useFocusEffect(
    useCallback(() => {
      // Só recarregar se for a primeira vez ou se mudou de aba
      if (activeTab === 'discover' && itineraries.length === 0) {
        setLoading(true);
        void loadData();
      } else if (activeTab === 'featured' && featuredItineraries.length === 0) {
        setLoading(true);
        void loadData();
      } else if (activeTab === 'saved' && !savedInitialized) {
        setLoading(true);
        void loadData();
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
    void loadData();
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
        if (likeToggleLockRef.current.has(id)) {
          return;
        }

        likeToggleLockRef.current.add(id);

        if (isMockId(id)) {
          applyMockLocalInteraction(id, 'like');
          return;
        }

        const result = await exploreService.toggleLike(id);

        const syncLikeState = (items: PublicItinerary[]) =>
          items.map((item) => {
            if (item._id === id) {
              const likes = Array.isArray(item.likes) ? item.likes : [];
              const normalizedLikes = Array.from(new Set(likes.map((likeId) => String(likeId))));
              const nextLikes = result.liked
                ? user?._id && !normalizedLikes.includes(String(user._id))
                  ? [...normalizedLikes, String(user._id)]
                  : normalizedLikes
                : normalizedLikes.filter((likeId) => likeId !== String(user?._id));

              return {
                ...item,
                likes: nextLikes,
                likesCount:
                  typeof result.likesCount === 'number' ? result.likesCount : nextLikes.length,
              };
            }
            return item;
          });

        setItineraries(syncLikeState);
        setFeaturedItineraries(syncLikeState);
        setSavedItineraries(syncLikeState);
      } catch (error) {
        showErrorRef.current('Erro ao curtir roteiro');
      } finally {
        likeToggleLockRef.current.delete(id);
        setLikeToggleRenderTick((value) => value + 1);
      }
    },
    [user?._id, applyMockLocalInteraction]
  );

  const handleToggleSave = useCallback(
    async (id: string) => {
      try {
        if (isMockId(id)) {
          applyMockLocalInteraction(id, 'save');
          return;
        }

        const result = await exploreService.toggleSave(id);

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

        const wasSaved = savedItineraries.some((i) => i._id === id);

        setItineraries((prev) => updateSaved(prev, result.saved));
        setFeaturedItineraries((prev) => updateSaved(prev, result.saved));

        if (!result.saved) {
          setSavedItineraries((prev) => prev.filter((i) => i._id !== id));
        } else if (!wasSaved) {
          const itemToSave = [...itineraries, ...featuredItineraries, ...savedItineraries].find(
            (i) => i._id === id
          );

          if (itemToSave) {
            const updatedItem = {
              ...itemToSave,
              savesCount: (itemToSave.savesCount || 0) + 1,
            };
            setSavedItineraries((prev) => [updatedItem, ...prev]);
          } else {
            await loadSavedItineraries(1);
          }
        } else if (activeTab === 'saved') {
          await loadSavedItineraries(1);
        }
      } catch (error) {
        showErrorRef.current('Erro ao salvar roteiro');
      }
    },
    [
      savedItineraries,
      itineraries,
      featuredItineraries,
      loadSavedItineraries,
      activeTab,
      applyMockLocalInteraction,
    ]
  );

  const currentData = useMemo(() => {
    if (activeTab === 'discover') return itineraries;
    if (activeTab === 'featured') return featuredItineraries;
    return savedItineraries;
  }, [activeTab, itineraries, featuredItineraries, savedItineraries]);

  useEffect(() => {
    const topImageUris = currentData
      .map((item) => item.destination?.coverImage)
      .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0)
      .slice(0, 8);

    topImageUris.forEach((uri) => {
      void Image.prefetch(uri);
    });
  }, [currentData]);

  const renderItineraryCard = useCallback(
    ({ item }: { item: PublicItinerary }) => {
      const startDate = format(new Date(item.startDate), 'dd MMM', { locale: ptBR });
      const endDate = format(new Date(item.endDate), 'dd MMM yyyy', { locale: ptBR });

      // Verificar se já está curtido/salvo
      const isLiked = user?._id
        ? (item.likes || []).some((likeId) => String(likeId) === String(user._id))
        : false;
      const isSaved = savedItineraries.some((i) => i._id === item._id);
      const likesCount =
        typeof item.likesCount === 'number' ? item.likesCount : (item.likes || []).length;

      return (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ItineraryDetail', {
              id: item._id,
              mockData: isMockId(item._id) ? item : undefined,
            })
          }
          style={[styles.exploreCard, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
        >
          {/* Imagem */}
          <SmartImage
            uri={item.destination?.coverImage}
            fallbackUri="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=200&fit=crop"
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
                  ❤️ {likesCount}
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
                    {
                      backgroundColor: isLiked ? colors.primary : colors.background,
                      opacity: likeToggleLockRef.current.has(item._id) ? 0.6 : 1,
                    },
                  ]}
                  disabled={likeToggleLockRef.current.has(item._id)}
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
    [savedItineraries, navigation, colors, handleToggleLike, handleToggleSave, user?._id]
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
