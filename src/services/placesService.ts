// mobile/src/services/placesService.ts
import axios from 'axios';
import { Platform } from 'react-native';
import env from '../config/env';

const GOOGLE_PLACES_API_KEY = env.googleMapsKey;
const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const PLACE_DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const PHOTOS_URL = 'https://maps.googleapis.com/maps/api/place/photo';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  name: string;
  city: string;
  country: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
}

// Lista compartilhada entre sugestões e detalhes mockados.
// IDs estáveis (mock_<cidade>) garantem que o detalhe resolva a cidade certa.
const MOCK_PLACES = [
  { city: 'Paris', country: 'França', latitude: 48.8566, longitude: 2.3522 },
  { city: 'Londres', country: 'Reino Unido', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Roma', country: 'Itália', latitude: 41.9028, longitude: 12.4964 },
  { city: 'Barcelona', country: 'Espanha', latitude: 41.3874, longitude: 2.1686 },
  { city: 'Amsterdã', country: 'Holanda', latitude: 52.3676, longitude: 4.9041 },
  { city: 'Tóquio', country: 'Japão', latitude: 35.6762, longitude: 139.6503 },
  { city: 'Nova York', country: 'Estados Unidos', latitude: 40.7128, longitude: -74.006 },
  { city: 'Rio de Janeiro', country: 'Brasil', latitude: -22.9068, longitude: -43.1729 },
  { city: 'São Paulo', country: 'Brasil', latitude: -23.5505, longitude: -46.6333 },
  { city: 'Buenos Aires', country: 'Argentina', latitude: -34.6037, longitude: -58.3816 },
  { city: 'Lisboa', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  { city: 'Dubai', country: 'Emirados Árabes', latitude: 25.2048, longitude: 55.2708 },
  { city: 'Bangkok', country: 'Tailândia', latitude: 13.7563, longitude: 100.5018 },
  { city: 'Cancún', country: 'México', latitude: 21.1619, longitude: -86.8515 },
  { city: 'Praga', country: 'República Tcheca', latitude: 50.0755, longitude: 14.4378 },
];

class PlacesService {
  /**
   * Busca sugestões de lugares baseado no texto digitado
   */
  async searchPlaces(input: string): Promise<PlaceSuggestion[]> {
    if (!input || input.length < 3) {
      return [];
    }

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key não configurada');
      // Retornar sugestões mockadas para desenvolvimento
      return this.getMockSuggestions(input);
    }

    // Web: o Places Web Service não aceita chamadas de navegador (CORS).
    // No MVP web, respondemos com as sugestões locais diretamente, sem
    // disparar uma requisição que sempre falha. Caminho de produção:
    // proxy via backend ou Maps JS SDK com key restrita a HTTP referrer.
    if (Platform.OS === 'web') {
      return this.getMockSuggestions(input);
    }

    try {
      const response = await axios.get(AUTOCOMPLETE_URL, {
        params: {
          input,
          types: '(cities)', // Apenas cidades
          language: 'pt-BR',
          key: GOOGLE_PLACES_API_KEY,
        },
      });

      if (response.data.status !== 'OK') {
        console.warn('Google Places API error:', response.data.status);
        return this.getMockSuggestions(input);
      }

      return response.data.predictions.map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
      }));
    } catch (error) {
      console.error('Erro ao buscar lugares:', error);
      return this.getMockSuggestions(input);
    }
  }

  /**
   * Obtém detalhes de um lugar específico
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    // Sugestões mockadas nunca vão para a API real
    if (placeId.startsWith('mock_')) {
      return this.getMockPlaceDetails(placeId);
    }

    if (!GOOGLE_PLACES_API_KEY) {
      return this.getMockPlaceDetails(placeId);
    }

    try {
      const response = await axios.get(PLACE_DETAILS_URL, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,address_components,photos',
          language: 'pt-BR',
          key: GOOGLE_PLACES_API_KEY,
        },
      });

      if (response.data.status !== 'OK') {
        console.warn('Google Place Details API error:', response.data.status);
        return null;
      }

      const result = response.data.result;
      const addressComponents = result.address_components;

      // Extrair cidade e país
      const cityComponent = addressComponents.find(
        (comp: any) =>
          comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
      );
      const countryComponent = addressComponents.find((comp: any) =>
        comp.types.includes('country')
      );

      // URL da foto (se disponível)
      let photoUrl: string | undefined;
      if (result.photos && result.photos.length > 0) {
        const photoReference = result.photos[0].photo_reference;
        photoUrl = `${PHOTOS_URL}?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
      }

      return {
        name: result.name,
        city: cityComponent?.long_name || result.name,
        country: countryComponent?.long_name || '',
        formattedAddress: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        photoUrl,
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
      return null;
    }
  }

  /**
   * Sugestões mockadas para desenvolvimento (sem API key)
   */
  private getMockSuggestions(input: string): PlaceSuggestion[] {
    const filtered = MOCK_PLACES.filter(
      (place) =>
        place.city.toLowerCase().includes(input.toLowerCase()) ||
        place.country.toLowerCase().includes(input.toLowerCase())
    );

    return filtered.map((place) => ({
      placeId: `mock_${place.city}`,
      description: `${place.city}, ${place.country}`,
      mainText: place.city,
      secondaryText: place.country,
    }));
  }

  /**
   * Detalhes mockados para desenvolvimento
   */
  private getMockPlaceDetails(placeId: string): PlaceDetails {
    const cityName = placeId.replace(/^mock_/, '');
    const match = MOCK_PLACES.find((place) => place.city === cityName);

    if (!match) {
      return {
        name: 'Destino Desconhecido',
        city: 'Cidade',
        country: 'País',
        formattedAddress: 'Endereço desconhecido',
        latitude: 0,
        longitude: 0,
      };
    }

    return {
      name: match.city,
      city: match.city,
      country: match.country,
      formattedAddress: `${match.city}, ${match.country}`,
      latitude: match.latitude,
      longitude: match.longitude,
    };
  }
}

export const placesService = new PlacesService();
