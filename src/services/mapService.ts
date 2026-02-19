// mobile/src/services/mapService.ts
import api from './api';

export interface MapPoint {
  id: string;
  dayNumber?: number;
  activityIndex?: number;
  time?: string;
  title: string;
  location: string;
  address?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category?: string;
  estimatedCost?: number;
  duration?: number;
}

export interface Route {
  from: {
    id: string;
    title: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  to: {
    id: string;
    title: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  distance: number;
  travelTime: number;
}

export interface DayRoute {
  dayNumber: number;
  date: string;
  routes: Route[];
  totalDistance: number;
  totalTravelTime: number;
}

export interface ItineraryMapData {
  itineraryId: string;
  title: string;
  destination: string;
  center: {
    lat: number;
    lng: number;
  };
  points: MapPoint[];
  dayRoutes: DayRoute[];
  statistics: {
    totalPoints: number;
    totalDays: number;
    totalDistance: number;
    totalTravelTime: number;
  };
}

export interface DayMapData {
  dayNumber: number;
  date: string;
  title: string;
  center: {
    lat: number;
    lng: number;
  };
  points: MapPoint[];
  routes: Route[];
  statistics: {
    totalPoints: number;
    totalDistance: number;
    totalTravelTime: number;
  };
}

export interface NearbyPointsData {
  userLocation: {
    lat: number;
    lng: number;
  };
  radius: number;
  points: (MapPoint & { distance: number })[];
  total: number;
}

const mapService = {
  /**
   * Busca dados do mapa completo do roteiro
   */
  getItineraryMap: async (itineraryId: string): Promise<ItineraryMapData> => {
    const response = await api.get(`/roteiros/${itineraryId}/map`);
    return response.data;
  },

  /**
   * Busca dados do mapa de um dia específico
   */
  getDayMap: async (itineraryId: string, dayNumber: number): Promise<DayMapData> => {
    const response = await api.get(`/roteiros/${itineraryId}/map/day/${dayNumber}`);
    return response.data;
  },

  /**
   * Busca pontos de interesse próximos a uma localização
   */
  getNearbyPoints: async (
    itineraryId: string,
    lat: number,
    lng: number,
    radius: number = 1
  ): Promise<NearbyPointsData> => {
    const response = await api.get(`/roteiros/${itineraryId}/nearby`, {
      params: { lat, lng, radius },
    });
    return response.data;
  },
};

export default mapService;
