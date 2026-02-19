/**
 * Analytics Service - Firebase Analytics
 * 
 * Serviço completo para rastreamento de eventos de usuário com Firebase Analytics.
 * Fornece insights sobre comportamento, conversão e engajamento.
 * 
 * NOTA: Firebase comentado temporariamente para testes com Expo Go
 */

// import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

// Tipos de eventos personalizados
export enum AnalyticsEvent {
  // Navegação
  SCREEN_VIEW = 'screen_view',
  
  // Autenticação
  LOGIN = 'login',
  LOGOUT = 'logout',
  SIGN_UP = 'sign_up',
  
  // Roteiros
  ITINERARY_CREATE = 'itinerary_create',
  ITINERARY_VIEW = 'itinerary_view',
  ITINERARY_EDIT = 'itinerary_edit',
  ITINERARY_DELETE = 'itinerary_delete',
  ITINERARY_DUPLICATE = 'itinerary_duplicate',
  ITINERARY_SHARE = 'itinerary_share',
  
  // Budget
  BUDGET_VIEW = 'budget_view',
  EXPENSE_ADD = 'expense_add',
  EXPENSE_DELETE = 'expense_delete',
  BUDGET_EXCEEDED = 'budget_exceeded',
  
  // Map
  MAP_VIEW = 'map_view',
  MAP_POINT_SELECT = 'map_point_select',
  
  // Notifications
  NOTIFICATION_ENABLE = 'notification_enable',
  NOTIFICATION_DISABLE = 'notification_disable',
  NOTIFICATION_RECEIVED = 'notification_received',
  NOTIFICATION_TAPPED = 'notification_tapped',
  
  // Fotos
  PHOTO_UPLOAD = 'photo_upload',
  PHOTO_DELETE = 'photo_delete',
  
  // Busca e AI
  DESTINATION_SEARCH = 'destination_search',
  AI_GENERATION_START = 'ai_generation_start',
  AI_GENERATION_SUCCESS = 'ai_generation_success',
  AI_GENERATION_ERROR = 'ai_generation_error',
  
  // Engajamento
  RATING_SUBMIT = 'rating_submit',
  EXPLORE_VIEW = 'explore_view',
  RECOMMENDATION_VIEW = 'recommendation_view',
}

interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private isEnabled: boolean = true;
  private isDevelopment: boolean = __DEV__;

  /**
   * Inicializa o serviço de analytics
   */
  async initialize(): Promise<void> {
    try {
      if (this.isDevelopment) {
        console.log('[Analytics] Mock Analytics inicializado (Firebase comentado para Expo Go)');
      }
      
      // Mock: Habilitar coleta de dados
      // await analytics().setAnalyticsCollectionEnabled(true);
      this.isEnabled = true;
    } catch (error) {
      console.error('[Analytics] Erro ao inicializar:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Define propriedades do usuário
   */
  async setUserProperties(properties: { [key: string]: string }): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.isDevelopment) {
        console.log('[Analytics] Mock: setUserProperties', properties);
      }
      // Mock: Comentado para Expo Go
      // for (const [key, value] of Object.entries(properties)) {
      //   await analytics().setUserProperty(key, value);
      // }
    } catch (error) {
      console.error('[Analytics] Erro ao definir propriedades do usuário:', error);
    }
  }

  /**
   * Define ID do usuário
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Mock: Comentado para Expo Go
      // await analytics().setUserId(userId);
      
      if (this.isDevelopment) {
        console.log('[Analytics] Mock: User ID definido:', userId);
      }
    } catch (error) {
      console.error('[Analytics] Erro ao definir user ID:', error);
    }
  }

  /**
   * Registra um evento personalizado
   */
  async logEvent(eventName: AnalyticsEvent | string, params?: EventParams): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.isDevelopment) {
        console.log(`[Analytics] Mock Evento: ${eventName}`, params);
      }

      // Mock: Comentado para Expo Go
      // Remove valores undefined
      // const cleanParams = params ? Object.fromEntries(
      //   Object.entries(params).filter(([_, v]) => v !== undefined)
      // ) : {};
      // await analytics().logEvent(eventName, cleanParams);
    } catch (error) {
      console.error('[Analytics] Erro ao registrar evento:', eventName, error);
    }
  }

  /**
   * Registra visualização de tela
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (this.isDevelopment) {
      console.log('[Analytics] Mock: Screen view', { screenName, screenClass });
    }
    // Mock: Comentado para Expo Go
    // await analytics().logScreenView({
    //   screen_name: screenName,
    //   screen_class: screenClass || screenName,
    // });
  }

  /**
   * Registra login de usuário
   */
  async logLogin(method: string = 'email'): Promise<void> {
    await this.logEvent(AnalyticsEvent.LOGIN, {
      method,
    });
  }

  /**
   * Registra cadastro de usuário
   */
  async logSignUp(method: string = 'email'): Promise<void> {
    await this.logEvent(AnalyticsEvent.SIGN_UP, {
      method,
    });
  }

  /**
   * Registra criação de roteiro
   */
  async logItineraryCreated(params: {
    destination: string;
    duration?: number;
    budget?: string;
    generatedByAI?: boolean;
  }): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_CREATE, {
      destination: params.destination,
      duration_days: params.duration,
      budget_level: params.budget,
      generated_by_ai: params.generatedByAI,
    });
  }

  /**
   * Registra visualização de roteiro
   */
  async logItineraryView(itineraryId: string, destination: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_VIEW, {
      itinerary_id: itineraryId,
      destination,
    });
  }

  /**
   * Registra edição de roteiro
   */
  async logItineraryEdit(itineraryId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_EDIT, {
      itinerary_id: itineraryId,
    });
  }

  /**
   * Registra exclusão de roteiro
   */
  async logItineraryDelete(itineraryId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_DELETE, {
      itinerary_id: itineraryId,
    });
  }

  /**
   * Registra duplicação de roteiro
   */
  async logItineraryDuplicate(originalId: string, newId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_DUPLICATE, {
      original_id: originalId,
      new_id: newId,
    });
  }

  /**
   * Registra compartilhamento de roteiro
   */
  async logItineraryShare(itineraryId: string, method: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.ITINERARY_SHARE, {
      itinerary_id: itineraryId,
      method,
    });
  }

  /**
   * Registra upload de foto
   */
  async logPhotoUpload(count: number = 1, source: 'camera' | 'gallery'): Promise<void> {
    await this.logEvent(AnalyticsEvent.PHOTO_UPLOAD, {
      photo_count: count,
      source,
    });
  }

  /**
   * Registra exclusão de foto
   */
  async logPhotoDelete(photoId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.PHOTO_DELETE, {
      photo_id: photoId,
    });
  }

  /**
   * Registra busca de destino
   */
  async logDestinationSearch(query: string, resultsCount: number): Promise<void> {
    await this.logEvent(AnalyticsEvent.DESTINATION_SEARCH, {
      search_term: query,
      results_count: resultsCount,
    });
  }

  /**
   * Registra início de geração com IA
   */
  async logAIGenerationStart(destination: string, duration: number): Promise<void> {
    await this.logEvent(AnalyticsEvent.AI_GENERATION_START, {
      destination,
      duration_days: duration,
    });
  }

  /**
   * Registra sucesso de geração com IA
   */
  async logAIGenerationSuccess(destination: string, duration: number, executionTime: number): Promise<void> {
    await this.logEvent(AnalyticsEvent.AI_GENERATION_SUCCESS, {
      destination,
      duration_days: duration,
      execution_time_ms: executionTime,
    });
  }

  /**
   * Registra erro de geração com IA
   */
  async logAIGenerationError(destination: string, errorMessage: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.AI_GENERATION_ERROR, {
      destination,
      error_message: errorMessage,
    });
  }

  /**
   * Registra envio de avaliação
   */
  async logRatingSubmit(rating: number, itineraryId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.RATING_SUBMIT, {
      rating_value: rating,
      itinerary_id: itineraryId,
    });
  }

  /**
   * Registra visualização de orçamento
   */
  async logBudgetView(itineraryId: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.BUDGET_VIEW, {
      itinerary_id: itineraryId,
    });
  }

  /**
   * Registra adição de despesa
   */
  async logExpenseAdd(category: string, amount: number): Promise<void> {
    await this.logEvent(AnalyticsEvent.EXPENSE_ADD, {
      category,
      amount,
    });
  }

  /**
   * Registra visualização do mapa
   */
  async logMapView(itineraryId: string, dayNumber?: number): Promise<void> {
    await this.logEvent(AnalyticsEvent.MAP_VIEW, {
      itinerary_id: itineraryId,
      day_number: dayNumber,
    });
  }

  /**
   * Registra ativação de notificações
   */
  async logNotificationEnable(): Promise<void> {
    await this.logEvent(AnalyticsEvent.NOTIFICATION_ENABLE);
  }

  /**
   * Registra desativação de notificações
   */
  async logNotificationDisable(): Promise<void> {
    await this.logEvent(AnalyticsEvent.NOTIFICATION_DISABLE);
  }

  /**
   * Registra toque em notificação
   */
  async logNotificationTapped(notificationType: string): Promise<void> {
    await this.logEvent(AnalyticsEvent.NOTIFICATION_TAPPED, {
      notification_type: notificationType,
    });
  }

  /**
   * Define propriedades do usuário
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    if (!this.isEnabled) return;

    try {
      if (this.isDevelopment) {
        console.log(`[Analytics] Mock: User Property: ${name} = ${value}`);
      }

      // Mock: Comentado para Expo Go
      // await analytics().setUserProperty(name, value);
    } catch (error) {
      console.error('[Analytics] Erro ao definir propriedade do usuário:', error);
    }
  }

  /**
   * Habilita/desabilita coleta de analytics
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.isEnabled = enabled;
    
    try {
      // Mock: Comentado para Expo Go
      // await analytics().setAnalyticsCollectionEnabled(enabled);
      
      if (this.isDevelopment) {
        console.log(`[Analytics] Mock: Coleta ${enabled ? 'habilitada' : 'desabilitada'}`);
      }
    } catch (error) {
      console.error('[Analytics] Erro ao alterar estado de coleta:', error);
    }
  }
}

// Exporta uma instância singleton
export default new AnalyticsService();
