// mobile/src/screens/RecommendationsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface Destination {
  city: string;
  country: string;
  coverImage?: string;
  popularity?: number;
}

interface Itinerary {
  _id: string;
  title: string;
  destination: {
    city: string;
    country: string;
    coverImage?: string;
  };
  duration: number;
  rating?: number;
  views?: number;
  likes?: string[];
  shareCount?: number;
  createdAt: string;
}

export const RecommendationsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'for-you' | 'trending'>('for-you');
  
  const [forYouRecommendations, setForYouRecommendations] = useState<any[]>([]);
  const [trendingItineraries, setTrendingItineraries] = useState<Itinerary[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);

      // Carregar recomendações "Para Você"
      const forYouRes = await api.get('/recommendations/for-you');
      setForYouRecommendations(forYouRes.data.recommendations || []);

      // Carregar destinos recomendados
      const destRes = await api.get('/recommendations/destinations', {
        params: { limit: 5 },
      });
      setDestinations(destRes.data || []);

      // Carregar roteiros em alta
      const trendingRes = await api.get('/recommendations/trending', {
        params: { limit: 10 },
      });
      setTrendingItineraries(trendingRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecommendations();
  }, [loadRecommendations]);

  const renderDestinationCard = useCallback((destination: Destination, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.destinationCard}
      onPress={() => {
        // Navegar para criar roteiro com destino pré-selecionado
        navigation.navigate('Generate', {
          preselectedDestination: {
            city: destination.city,
            country: destination.country,
          },
        });
      }}
    >
      {destination.coverImage ? (
        <Image source={{ uri: destination.coverImage }} style={styles.destinationImage} />
      ) : (
        <View style={[styles.destinationImage, styles.placeholderImage]}>
          <Ionicons name="location" size={32} color="#CCC" />
        </View>
      )}
      <View style={styles.destinationInfo}>
        <Text style={styles.destinationCity}>{destination.city}</Text>
        <Text style={styles.destinationCountry}>{destination.country}</Text>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderItineraryCard = useCallback((itinerary: Itinerary) => (
    <TouchableOpacity
      key={itinerary._id}
      style={styles.itineraryCard}
      onPress={() => navigation.navigate('ItineraryDetail', { id: itinerary._id })}
    >
      {itinerary.destination.coverImage ? (
        <Image
          source={{ uri: itinerary.destination.coverImage }}
          style={styles.itineraryImage}
        />
      ) : (
        <View style={[styles.itineraryImage, styles.placeholderImage]}>
          <Ionicons name="map" size={32} color="#CCC" />
        </View>
      )}
      <View style={styles.itineraryContent}>
        <Text style={styles.itineraryTitle} numberOfLines={1}>
          {itinerary.title}
        </Text>
        <Text style={styles.itineraryDestination}>
          {itinerary.destination.city}, {itinerary.destination.country}
        </Text>
        <View style={styles.itineraryMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{itinerary.duration} dias</Text>
          </View>
          {itinerary.rating && typeof itinerary.rating === 'number' && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.metaText}>{itinerary.rating.toFixed(1)}</Text>
            </View>
          )}
          {itinerary.views && (
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#666" />
              <Text style={styles.metaText}>{itinerary.views}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Descubra</Text>
        <Text style={styles.headerSubtitle}>Roteiros personalizados para você</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'for-you' && styles.tabActive]}
          onPress={() => setActiveTab('for-you')}
        >
          <Text style={[styles.tabText, activeTab === 'for-you' && styles.tabTextActive]}>
            Para Você
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.tabActive]}
          onPress={() => setActiveTab('trending')}
        >
          <Text style={[styles.tabText, activeTab === 'trending' && styles.tabTextActive]}>
            Em Alta
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'for-you' ? (
          <>
            {/* Destinos Recomendados */}
            {destinations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Destinos para Você</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {destinations.map(renderDestinationCard)}
                </ScrollView>
              </View>
            )}

            {/* Recomendações Personalizadas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recomendados</Text>
              {forYouRecommendations.length > 0 ? (
                forYouRecommendations.map((item) => {
                  // Pode ser destino ou roteiro
                  if (item._id) {
                    return renderItineraryCard(item);
                  }
                  return null;
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="compass-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>
                    Nenhuma recomendação disponível
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Explore roteiros para receber recomendações personalizadas
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Trending Tab */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Roteiros em Alta</Text>
            <Text style={styles.sectionSubtitle}>Últimos 7 dias</Text>
            {trendingItineraries.length > 0 ? (
              trendingItineraries.map(renderItineraryCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="trending-up-outline" size={64} color="#CCC" />
                <Text style={styles.emptyText}>Nenhum roteiro em alta</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 12,
  },
  destinationCard: {
    width: 140,
    marginHorizontal: 4,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationImage: {
    width: '100%',
    height: 100,
  },
  placeholderImage: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInfo: {
    padding: 12,
  },
  destinationCity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  destinationCountry: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itineraryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itineraryImage: {
    width: 100,
    height: 100,
  },
  itineraryContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  itineraryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itineraryDestination: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itineraryMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
});
