// mobile/src/services/itineraryService.ts
import api from './api';
import { Itinerary } from '../types';
import analyticsService from './analyticsService';

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface PaginatedResponse {
  itineraries: Itinerary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const itineraryService = {
  async getAll(params?: PaginationParams): Promise<Itinerary[] | PaginatedResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.order) queryParams.append('order', params.order);
    
    const response = await api.get(`/roteiros?${queryParams.toString()}`);
    
    // Se tem paginação na resposta, retornar objeto paginado
    if (response.data.pagination) {
      return response.data as PaginatedResponse;
    }
    
    // Senão, retornar array simples (backward compatibility)
    return Array.isArray(response.data) ? response.data : response.data.itineraries;
  },

  async getById(id: string): Promise<Itinerary> {
    // IDs mockados não devem fazer requisições ao backend
    if (id.startsWith('mock-')) {
      throw new Error('Use dados mockados localmente - não chame a API para IDs mock-*');
    }
    
    const response = await api.get(`/roteiros/${id}`);
    const itinerary = response.data;
    
    // Analytics: roteiro visualizado
    await analyticsService.logItineraryView(
      id,
      `${itinerary.destination?.city}, ${itinerary.destination?.country}`
    );
    
    return itinerary;
  },

  async create(data: Partial<Itinerary>): Promise<Itinerary> {
    const response = await api.post('/roteiros', data);
    const itinerary = response.data.itinerary;
    
    // Analytics: roteiro criado
    await analyticsService.logItineraryCreate(
      `${data.destination?.city}, ${data.destination?.country}`,
      data.days?.length
    );
    
    return itinerary;
  },

  async generateWithAI(data: {
    destination: { city: string; country: string };
    startDate: string;
    endDate: string;
    budget?: { level: string; currency: string };
    preferences?: any;
  }): Promise<Itinerary> {
    // Analytics: solicitação de AI (comentado - método não existe no mock)
    // const duration = Math.ceil(
    //   (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)
    // );
    // await analyticsService.logAISuggestionRequest(
    //   `${data.destination.city}, ${data.destination.country}`,
    //   duration
    // );
    
    const response = await api.post('/roteiros/generate', data);
    const itinerary = response.data.itinerary;
    
    // Analytics: AI sugestão aceita (comentado - método não existe no mock)
    // await analyticsService.logAISuggestionAccept(
    //   `${data.destination.city}, ${data.destination.country}`
    // );
    
    return itinerary;
  },

  async update(id: string, data: Partial<Itinerary>): Promise<Itinerary> {
    const response = await api.put(`/roteiros/${id}`, data);
    
    // Analytics: roteiro editado
    await analyticsService.logItineraryEdit(id);
    
    return response.data.itinerary;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/roteiros/${id}`);
    
    // Analytics: roteiro deletado
    await analyticsService.logItineraryDelete(id);
  },

  async duplicate(id: string): Promise<Itinerary> {
    const response = await api.post(`/roteiros/${id}/duplicate`);
    const newItinerary = response.data.itinerary;
    
    // Analytics: roteiro duplicado
    await analyticsService.logItineraryDuplicate(id, newItinerary._id);
    
    return newItinerary;
  },

  async addCollaborator(id: string, email: string, permission: 'view' | 'edit'): Promise<Itinerary> {
    const response = await api.post(`/roteiros/${id}/collaborators`, {
      email,
      permission,
    });
    return response.data.itinerary;
  },

  async removeCollaborator(id: string, collaboratorId: string): Promise<Itinerary> {
    const response = await api.delete(`/roteiros/${id}/collaborators/${collaboratorId}`);
    return response.data.itinerary;
  },

  async addRating(
    id: string,
    data: { score: number; comment?: string; photos?: string[] }
  ): Promise<Itinerary> {
    const response = await api.post(`/roteiros/${id}/rating`, data);
    
    // Analytics: avaliação enviada
    await analyticsService.logRatingSubmit(data.score, id);
    
    return response.data;
  },

  async updateRating(
    id: string,
    data: { score?: number; comment?: string; photos?: string[] }
  ): Promise<Itinerary> {
    const response = await api.put(`/roteiros/${id}/rating`, data);
    return response.data;
  },

  async deleteRating(id: string): Promise<void> {
    await api.delete(`/roteiros/${id}/rating`);
  },

  async generateShareLink(id: string): Promise<{ shareLink: string; fullUrl: string }> {
    const response = await api.post(`/roteiros/${id}/share`);
    
    // Analytics: roteiro compartilhado
    await analyticsService.logItineraryShare(id, 'link');
    
    return response.data;
  },

  async revokeShareLink(id: string): Promise<void> {
    await api.delete(`/roteiros/${id}/share`);
  },

  async getSharedItinerary(shareId: string): Promise<Itinerary> {
    const response = await api.get(`/shared/${shareId}`);
    return response.data;
  },

  async copySharedItinerary(shareId: string): Promise<any> {
    const response = await api.post(`/shared/${shareId}/copy`);
    return response.data;
  },
};