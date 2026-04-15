// mobile/src/services/exploreService.ts
import api from './api';
import { Itinerary } from '../types';

export interface PublicItinerary extends Itinerary {
  likes: string[];
  views: number;
  description?: string;
  tags?: string[];
  isFeatured?: boolean;
  likesCount?: number;
  savesCount?: number;
}

export interface PopularDestination {
  city: string;
  country: string;
  coverImage?: string;
  itineraryCount: number;
  averageRating: number;
  averageBudget: number;
}

export interface ExploreFilters {
  country?: string;
  city?: string;
  budgetLevel?: 'economico' | 'moderado' | 'confortavel' | 'luxo';
  minDuration?: number;
  maxDuration?: number;
  minRating?: number;
  completed?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'rating.score' | 'views' | 'duration';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const exploreService = {
  /**
   * Busca feed de roteiros públicos
   */
  getPublicItineraries: async (
    filters: ExploreFilters = {}
  ): Promise<{
    itineraries: PublicItinerary[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const response = await api.get('/explore/itineraries', { params: filters });
    return response.data;
  },

  /**
   * Busca roteiros em destaque
   */
  getFeatured: async (limit: number = 10): Promise<PublicItinerary[]> => {
    const response = await api.get('/explore/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Busca destinos populares
   */
  getPopularDestinations: async (limit: number = 10): Promise<PopularDestination[]> => {
    const response = await api.get('/explore/popular-destinations', { params: { limit } });
    return response.data;
  },

  /**
   * Curtir/descurtir roteiro
   */
  toggleLike: async (id: string): Promise<{ liked: boolean; likesCount: number }> => {
    const response = await api.post(`/explore/like/${id}`);
    return response.data;
  },

  /**
   * Salvar/dessalvar roteiro
   */
  toggleSave: async (id: string): Promise<{ saved: boolean; savedCount: number }> => {
    const response = await api.post(`/explore/save/${id}`);
    return response.data;
  },

  /**
   * Busca roteiros salvos
   */
  getSaved: async (
    page: number = 1,
    limit: number = 20
  ): Promise<{
    itineraries: PublicItinerary[];
    pagination: any;
  }> => {
    const response = await api.get('/explore/saved', { params: { page, limit } });
    return response.data;
  },
};

export default exploreService;
