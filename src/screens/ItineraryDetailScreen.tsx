// mobile/src/screens/ItineraryDetailScreen.tsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { showAlert } from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { itineraryService } from '../services/itineraryService';
import { Itinerary } from '../types';
import { useColors } from '../hooks/useColors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { PhotoPicker } from '../components/PhotoPicker';
import { RatingStars } from '../components/RatingStars';
import { RatingModal } from '../components/RatingModal';
import { ShareModal } from '../components/ShareModal';
import { BudgetTracker } from '../components/BudgetTracker';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip } from '../components/Tooltip';
import { useTooltip } from '../hooks/useTooltip';
// Utilitário para formatar valores em Real brasileiro
function formatBRL(value: number | string) {
  let num = typeof value === 'string' ? Number(value.toString().replace(/[^\d]/g, '')) / 100 : value;
  if (isNaN(num)) num = 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
import budgetService from '../services/budgetService';

// ========== DADOS MOCKADOS PARA PREVIEW ==========
const getMockItinerary = (id: string): Itinerary | null => {
  const mockItineraries: Record<string, Itinerary> = {
    'mock-1': {
      _id: 'mock-1',
      title: 'Explorando Paris em 5 Dias',
      destination: {
        city: 'Paris',
        country: 'França',
        coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=200&fit=crop'
      },
      startDate: '2026-06-15',
      endDate: '2026-06-20',
      duration: 5,
      owner: {
        _id: 'user-1',
        name: 'Ana Silva',
        email: 'ana.silva@email.com',
        isPremium: false,
        createdAt: '2025-01-01T00:00:00Z'
      },
      budget: {
        level: 'medio',
        estimatedTotal: 5000,
        currency: 'BRL',
        spent: 2340
      },
      preferences: {
        interests: ['cultura', 'gastronomia'],
        travelStyle: 'casal',
        pace: 'moderado'
      },
      days: [
        {
          _id: 'day-1',
          date: '2026-06-15',
          dayNumber: 1,
          title: 'Chegada e Torre Eiffel',
          activities: [
            {
              _id: 'act-1',
              time: '14:00',
              title: 'Check-in no hotel',
              description: 'Hotel Le Marais - próximo ao metrô',
              location: { name: 'Le Marais', address: 'Rue des Archives, 75004 Paris' },
              category: 'acomodacao',
              duration: 60,
              cost: 450,
              isCompleted: false
            },
            {
              _id: 'act-2',
              time: '17:00',
              title: 'Torre Eiffel',
              description: 'Subir até o topo para ver o pôr do sol',
              location: { name: 'Torre Eiffel', address: 'Champ de Mars, 75007 Paris' },
              category: 'atracao',
              duration: 180,
              cost: 85,
              isCompleted: false
            },
            {
              _id: 'act-3',
              time: '20:30',
              title: 'Jantar no Bistrot Paul Bert',
              description: 'Restaurante tradicional francês',
              location: { name: 'Bistrot Paul Bert', address: '18 Rue Paul Bert, 75011 Paris' },
              category: 'refeicao',
              duration: 120,
              cost: 180,
              isCompleted: false
            }
          ],
          dailyBudget: 715,
          notes: 'Comprar Paris Museum Pass'
        },
        {
          _id: 'day-2',
          date: '2026-06-16',
          dayNumber: 2,
          title: 'Museus e Montmartre',
          activities: [
            {
              _id: 'act-4',
              time: '09:00',
              title: 'Museu do Louvre',
              description: 'Ver Mona Lisa e principais obras',
              location: { name: 'Museu do Louvre', address: 'Rue de Rivoli, 75001 Paris' },
              category: 'atracao',
              duration: 240,
              cost: 0,
              isCompleted: false
            },
            {
              _id: 'act-5',
              time: '15:00',
              title: 'Basílica de Sacré-Cœur',
              description: 'Vista panorâmica de Paris',
              location: { name: 'Sacré-Cœur', address: '35 Rue du Chevalier de la Barre, 75018 Paris' },
              category: 'atracao',
              duration: 120,
              cost: 0,
              isCompleted: false
            }
          ],
          dailyBudget: 150
        }
      ],
      collaborators: [],
      status: 'confirmado',
      generatedByAI: false,
      isPublic: true,
      likes: [],
      views: 1543,
      expenses: [
        { _id: 'exp-1', category: 'transporte', description: 'Passagem aérea', amount: 1800, date: '2026-05-01', createdAt: '2026-05-01T10:00:00Z' },
        { _id: 'exp-2', category: 'acomodacao', description: 'Hotel 5 noites', amount: 2250, date: '2026-05-15', createdAt: '2026-05-15T14:00:00Z' }
      ],
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-02-08T14:30:00Z'
    },
    'mock-2': {
      _id: 'mock-2',
      title: 'Aventura na Patagônia',
      destination: {
        city: 'El Calafate',
        country: 'Argentina',
        coverImage: 'https://images.unsplash.com/photo-1531804055935-76f44d7c3621?w=400&h=200&fit=crop'
      },
      startDate: '2026-07-10',
      endDate: '2026-07-17',
      duration: 7,
      owner: {
        _id: 'user-2',
        name: 'Carlos Mendes',
        email: 'carlos.mendes@email.com',
        isPremium: true,
        createdAt: '2025-02-01T00:00:00Z'
      },
      budget: {
        level: 'medio',
        estimatedTotal: 8000,
        currency: 'BRL',
        spent: 3200
      },
      preferences: {
        interests: ['aventura', 'natureza'],
        travelStyle: 'amigos',
        pace: 'intenso'
      },
      days: [
        {
          _id: 'day-p1',
          date: '2026-07-10',
          dayNumber: 1,
          title: 'Chegada em El Calafate',
          activities: [
            {
              _id: 'act-p1',
              time: '10:00',
              title: 'Chegada ao aeroporto',
              description: 'Voo de Buenos Aires para El Calafate',
              location: { name: 'Aeroporto El Calafate', address: 'Ruta Provincial 11, El Calafate' },
              category: 'transporte',
              duration: 180,
              cost: 800,
              isCompleted: false
            },
            {
              _id: 'act-p2',
              time: '14:00',
              title: 'Check-in Hosteria',
              description: 'Acomodação com vista para o lago Argentino',
              location: { name: 'Hosteria Kalenshen', address: 'Av. Libertador 1090, El Calafate' },
              category: 'acomodacao',
              duration: 60,
              cost: 600,
              isCompleted: false
            },
            {
              _id: 'act-p3',
              time: '16:00',
              title: 'Passeio pela cidade',
              description: 'Conhecer o centro e comprar equipamentos',
              location: { name: 'Centro El Calafate', address: 'Av. del Libertador' },
              category: 'passeio',
              duration: 180,
              cost: 0,
              isCompleted: false
            }
          ],
          dailyBudget: 1400
        },
        {
          _id: 'day-p2',
          date: '2026-07-11',
          dayNumber: 2,
          title: 'Glaciar Perito Moreno',
          activities: [
            {
              _id: 'act-p4',
              time: '08:00',
              title: 'Tour Glaciar Perito Moreno',
              description: 'Dia completo visitando o glaciar com passarelas',
              location: { name: 'Parque Nacional Los Glaciares', address: 'RP11, El Calafate' },
              category: 'atracao',
              duration: 480,
              cost: 450,
              isCompleted: false
            },
            {
              _id: 'act-p5',
              time: '19:00',
              title: 'Jantar típico argentino',
              description: 'Cordeiro patagônico',
              location: { name: 'La Tablita', address: 'Coronel Rosales 28, El Calafate' },
              category: 'refeicao',
              duration: 120,
              cost: 220,
              isCompleted: false
            }
          ],
          dailyBudget: 670
        },
        {
          _id: 'day-p3',
          date: '2026-07-12',
          dayNumber: 3,
          title: 'Trekking em Torres del Paine',
          activities: [
            {
              _id: 'act-p6',
              time: '06:00',
              title: 'Trilha Base Las Torres',
              description: 'Trekking de 8h até a base das torres',
              location: { name: 'Torres del Paine', address: 'Parque Nacional Torres del Paine, Chile' },
              category: 'aventura',
              duration: 480,
              cost: 380,
              isCompleted: false
            }
          ],
          dailyBudget: 380,
          notes: 'Levar lanche e água. Acordar cedo!'
        }
      ],
      collaborators: [],
      status: 'planejando',
      generatedByAI: true,
      isPublic: true,
      likes: [],
      views: 2891,
      expenses: [
        { _id: 'exp-p1', category: 'transporte', description: 'Passagens aéreas', amount: 2400, date: '2026-06-01', createdAt: '2026-06-01T10:00:00Z' },
        { _id: 'exp-p2', category: 'acomodacao', description: 'Hosteria 7 noites', amount: 4200, date: '2026-06-15', createdAt: '2026-06-15T14:00:00Z' }
      ],
      createdAt: '2026-01-20T08:15:00Z',
      updatedAt: '2026-02-09T11:20:00Z'
    },
    'mock-3': {
      _id: 'mock-3',
      title: 'Roteiro Gastronômico em Tóquio',
      destination: {
        city: 'Tóquio',
        country: 'Japão',
        coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop'
      },
      startDate: '2026-05-01',
      endDate: '2026-05-06',
      duration: 5,
      owner: {
        _id: 'user-3',
        name: 'Marina Kobayashi',
        email: 'marina.k@email.com',
        isPremium: false,
        createdAt: '2025-03-01T00:00:00Z'
      },
      budget: {
        level: 'medio',
        estimatedTotal: 6000,
        currency: 'BRL',
        spent: 1800
      },
      preferences: {
        interests: ['gastronomia', 'cultura'],
        travelStyle: 'solo',
        pace: 'moderado'
      },
      days: [
        {
          _id: 'day-t1',
          date: '2026-05-01',
          dayNumber: 1,
          title: 'Chegada e Shibuya',
          activities: [
            {
              _id: 'act-t1',
              time: '15:00',
              title: 'Check-in capsule hotel',
              description: 'Hotel cápsula em Shinjuku',
              location: { name: 'Nine Hours Shinjuku', address: '3-10-2 Shinjuku, Shinjuku-ku' },
              category: 'acomodacao',
              duration: 60,
              cost: 180,
              isCompleted: false
            },
            {
              _id: 'act-t2',
              time: '18:00',
              title: 'Shibuya Crossing',
              description: 'Cruzamento mais famoso do mundo',
              location: { name: 'Shibuya Crossing', address: 'Shibuya, Tokyo' },
              category: 'atracao',
              duration: 90,
              cost: 0,
              isCompleted: false
            },
            {
              _id: 'act-t3',
              time: '20:00',
              title: 'Jantar ramen tradicional',
              description: 'Ichiran Ramen - experiência autêntica',
              location: { name: 'Ichiran Shibuya', address: '1-22-7 Jinnan, Shibuya-ku' },
              category: 'refeicao',
              duration: 60,
              cost: 80,
              isCompleted: false
            }
          ],
          dailyBudget: 260
        },
        {
          _id: 'day-t2',
          date: '2026-05-02',
          dayNumber: 2,
          title: 'Mercado Tsukiji e Sushi',
          activities: [
            {
              _id: 'act-t4',
              time: '06:00',
              title: 'Mercado Tsukiji',
              description: 'Café da manhã no mercado de peixes',
              location: { name: 'Toyosu Market', address: '6-6-2 Toyosu, Koto-ku' },
              category: 'atracao',
              duration: 180,
              cost: 120,
              isCompleted: false
            },
            {
              _id: 'act-t5',
              time: '12:00',
              title: 'Aula de sushi',
              description: 'Workshop prático de fazer sushi',
              location: { name: 'Tokyo Sushi Academy', address: 'Shinjuku, Tokyo' },
              category: 'atividade',
              duration: 180,
              cost: 350,
              isCompleted: false
            },
            {
              _id: 'act-t6',
              time: '19:00',
              title: 'Izakaya experience',
              description: 'Bar japonês tradicional',
              location: { name: 'Omoide Yokocho', address: 'Shinjuku, Tokyo' },
              category: 'refeicao',
              duration: 120,
              cost: 150,
              isCompleted: false
            }
          ],
          dailyBudget: 620,
          notes: 'Acordar cedo para pegar o mercado!'
        }
      ],
      collaborators: [],
      status: 'confirmado',
      generatedByAI: false,
      isPublic: true,
      likes: ['user'],
      views: 1234,
      expenses: [
        { _id: 'exp-t1', category: 'transporte', description: 'Passagem aérea', amount: 3500, date: '2026-03-01', createdAt: '2026-03-01T10:00:00Z' }
      ],
      createdAt: '2026-02-01T12:00:00Z',
      updatedAt: '2026-02-09T16:45:00Z'
    },
    'mock-4': {
      _id: 'mock-4',
      title: 'Praias Paradisíacas do Caribe',
      destination: {
        city: 'Tulum',
        country: 'México',
        coverImage: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=400&h=200&fit=crop'
      },
      startDate: '2026-08-20',
      endDate: '2026-08-27',
      duration: 7,
      owner: {
        _id: 'user-4',
        name: 'Pedro Santos',
        email: 'pedro.santos@email.com',
        isPremium: true,
        createdAt: '2024-12-01T00:00:00Z'
      },
      budget: {
        level: 'luxo',
        estimatedTotal: 12000,
        currency: 'BRL',
        spent: 5600
      },
      preferences: {
        interests: ['praia', 'mergulho'],
        travelStyle: 'casal',
        pace: 'relaxado'
      },
      days: [
        {
          _id: 'day-c1',
          date: '2026-08-20',
          dayNumber: 1,
          title: 'Chegada em Tulum',
          activities: [
            {
              _id: 'act-c1',
              time: '12:00',
              title: 'Check-in resort',
              description: 'Resort all-inclusive na praia',
              location: { name: 'Dreams Tulum', address: 'Carretera Tulum-Boca Paila Km 7' },
              category: 'acomodacao',
              duration: 60,
              cost: 1200,
              isCompleted: false
            },
            {
              _id: 'act-c2',
              time: '16:00',
              title: 'Praia do hotel',
              description: 'Relaxar e curtir o mar caribenho',
              location: { name: 'Praia Dreams Tulum', address: 'Tulum Beach' },
              category: 'praia',
              duration: 180,
              cost: 0,
              isCompleted: false
            },
            {
              _id: 'act-c3',
              time: '20:00',
              title: 'Jantar mexicano',
              description: 'Restaurante à beira-mar',
              location: { name: 'Hartwood', address: 'Tulum Beach Road' },
              category: 'refeicao',
              duration: 120,
              cost: 450,
              isCompleted: false
            }
          ],
          dailyBudget: 1650
        },
        {
          _id: 'day-c2',
          date: '2026-08-21',
          dayNumber: 2,
          title: 'Ruínas Maias e Cenote',
          activities: [
            {
              _id: 'act-c4',
              time: '08:00',
              title: 'Ruínas de Tulum',
              description: 'Sítio arqueológico com vista para o mar',
              location: { name: 'Zona Arqueológica de Tulum', address: 'Carretera Federal, Tulum' },
              category: 'atracao',
              duration: 180,
              cost: 180,
              isCompleted: false
            },
            {
              _id: 'act-c5',
              time: '14:00',
              title: 'Mergulho no Gran Cenote',
              description: 'Snorkel em águas cristalinas',
              location: { name: 'Gran Cenote', address: 'Carretera Tulum-Cobá Km 4' },
              category: 'aventura',
              duration: 180,
              cost: 280,
              isCompleted: false
            }
          ],
          dailyBudget: 460,
          notes: 'Levar protetor solar biodegradável'
        },
        {
          _id: 'day-c3',
          date: '2026-08-22',
          dayNumber: 3,
          title: 'Mergulho com Tartarugas',
          activities: [
            {
              _id: 'act-c6',
              time: '07:00',
              title: 'Tour Akumal',
              description: 'Nadar com tartarugas marinhas',
              location: { name: 'Akumal Bay', address: 'Akumal, Quintana Roo' },
              category: 'aventura',
              duration: 300,
              cost: 520,
              isCompleted: false
            }
          ],
          dailyBudget: 520
        }
      ],
      collaborators: [],
      status: 'confirmado',
      generatedByAI: false,
      isPublic: true,
      likes: [],
      views: 4567,
      expenses: [
        { _id: 'exp-c1', category: 'transporte', description: 'Passagens aéreas', amount: 3200, date: '2026-07-01', createdAt: '2026-07-01T10:00:00Z' },
        { _id: 'exp-c2', category: 'acomodacao', description: 'Resort all-inclusive', amount: 8400, date: '2026-07-15', createdAt: '2026-07-15T14:00:00Z' }
      ],
      createdAt: '2026-01-10T09:30:00Z',
      updatedAt: '2026-02-10T08:15:00Z'
    }
  };

  return mockItineraries[id] || null;
};
// ================================================

export const ItineraryDetailScreen = ({ route, navigation }: any) => {
  const { id, refresh } = route.params;
  const colors = useColors();
  const { user } = useAuth();
  const { toast, hideToast, success, error: showError } = useToast();
  const { shouldShowTooltip, markTooltipAsShown } = useTooltip();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showBudgetTooltip, setShowBudgetTooltip] = useState(false);
  const isLoadingRef = useRef(false);

  // Verificar permissões do usuário
  const { isOwner, isMockPreview, isPublicPreview } = useMemo(() => {
    const _isMockPreview = id.startsWith('mock-');
    const _isOwner = user && itinerary?.owner && itinerary.owner._id === user._id;
    const _isPublicPreview = !_isOwner && !_isMockPreview;
    
    return {
      isOwner: _isOwner,
      isMockPreview: _isMockPreview,
      isPublicPreview: _isPublicPreview
    };
  }, [id, user, itinerary]);

  // Carregar roteiro quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      // Prevenir múltiplas chamadas simultâneas
      if (isLoadingRef.current) {
        console.log('⚠️ Já está carregando, ignorando chamada duplicada');
        return;
      }

      let isMounted = true;
      isLoadingRef.current = true;
      
      const fetchItinerary = async () => {
        try {
          setLoading(true);
          console.log('📥 Carregando roteiro ID:', id);
          
          // Validar se ID existe
          if (!id) {
            throw new Error('ID do roteiro não fornecido');
          }
          
          // ========== USAR DADOS MOCKADOS SE ID COMEÇAR COM 'mock-' ==========
          if (id.startsWith('mock-')) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
            const mockData = getMockItinerary(id);
            
            if (mockData && isMounted) {
              console.log('✅ Roteiro mockado carregado:', mockData._id);
              setItinerary(mockData);
              setLoading(false);
              isLoadingRef.current = false;
              return;
            } else {
              throw new Error('Roteiro mockado não encontrado');
            }
          }
          // ===================================================================
          
          const data = await itineraryService.getById(id);
          
          if (isMounted) {
            console.log('✅ Roteiro carregado:', data._id);
            setItinerary(data);
            setLoading(false);
          }
        } catch (error) {
          if (isMounted) {
            console.error('❌ Erro ao carregar roteiro:', error);
            
            // Log detalhado do erro
            if (error instanceof Error) {
              console.error('Mensagem:', error.message);
            }
            if ((error as any)?.response) {
              console.error('Status:', (error as any).response?.status);
              console.error('Data:', (error as any).response?.data);
            }
            
            // Mensagem específica baseada no erro
            let errorMessage = 'Não foi possível carregar o roteiro.';
            if ((error as any)?.response?.status === 400) {
              errorMessage = 'ID do roteiro inválido.';
            } else if ((error as any)?.response?.status === 404) {
              errorMessage = 'Roteiro não encontrado.';
            } else if ((error as any)?.response?.status === 401) {
              errorMessage = 'Você não tem permissão para ver este roteiro.';
            }
            
            showError(errorMessage);
            setLoading(false);
            setTimeout(() => {
              navigation.goBack();
            }, 500);
          }
        } finally {
          if (isMounted) {
            isLoadingRef.current = false;
          }
        }
      };

      fetchItinerary();
      
      return () => {
        isMounted = false;
        isLoadingRef.current = false;
      };
    }, []) // Recarrega sempre que a tela ganhar foco
  );

  const loadItinerary = useCallback(async () => {
    try {
      console.log('📥 Recarregando roteiro ID:', id);
      
      // ========== USAR DADOS MOCKADOS SE ID COMEÇAR COM 'mock-' ==========
      if (id.startsWith('mock-')) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = getMockItinerary(id);
        if (mockData) {
          console.log('✅ Roteiro mockado recarregado:', mockData._id);
          setItinerary(mockData);
          return;
        }
      }
      // ===================================================================
      
      const data = await itineraryService.getById(id);
      console.log('✅ Roteiro recarregado:', data._id);
      setItinerary(data);
    } catch (error) {
      console.error('❌ Erro ao recarregar roteiro:', error);
      showError('Não foi possível carregar o roteiro.');
    }
  }, [id]);

  // Tooltip para orçamento
  useEffect(() => {
    if (!loading && itinerary && !isMockPreview && isOwner && shouldShowTooltip('budget')) {
      const timer = setTimeout(() => {
        setShowBudgetTooltip(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, itinerary, isMockPreview, isOwner, shouldShowTooltip]);

  const handleDelete = async () => {
    // Prevenir ações em roteiros mockados ou não pertencentes ao usuário
    if (isMockPreview) {
      showAlert('Roteiro de Demonstração', 'Este é um roteiro de exemplo. Crie seus próprios roteiros para editá-los!');
      return;
    }
    if (!isOwner) {
      showAlert('Sem Permissão', 'Apenas o criador do roteiro pode excluí-lo.');
      return;
    }
    
    console.log('🗑️ Botão de deletar clicado. ID:', id);
    showAlert(
      'Excluir Roteiro',
      'Tem certeza que deseja excluir este roteiro? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔥 Deletando roteiro:', id);
              await itineraryService.delete(id);
              console.log('✅ Roteiro deletado com sucesso');
              success('Roteiro excluído com sucesso!');
              // Removido callback onListChange. Dashboard recarrega via useFocusEffect.
              setTimeout(() => {
                navigation.goBack();
              }, 500);
            } catch (err: any) {
              showError(err.response?.data?.message || 'Erro ao excluir roteiro');
            }
          }
        }
      ]
    );
  };

  const handleDuplicate = async () => {
    // Prevenir ações em roteiros mockados
    if (isMockPreview) {
      showAlert('Roteiro de Demonstração', 'Este é um roteiro de exemplo. Use o botão "Usar este Roteiro" para adicioná-lo!');
      return;
    }
    // Permitir duplicar roteiros de outros usuários (isOwner pode ser false)
    
    console.log('📋 Botão de duplicar clicado. ID:', id);
    try {
      console.log('🔄 Duplicando roteiro:', id);
      const duplicate = await itineraryService.duplicate(id);
      console.log('✅ Roteiro duplicado com sucesso. Novo ID:', duplicate._id);
      success('Roteiro duplicado com sucesso!');
      
      showAlert(
        'Roteiro Duplicado',
        'Deseja visualizar a cópia agora?',
        [
          { text: 'Depois', style: 'cancel' },
          { 
            text: 'Ver Agora', 
            onPress: () => {
              navigation.goBack();
              setTimeout(() => {
                navigation.navigate('ItineraryDetail', { id: duplicate._id });
              }, 100);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Erro ao duplicar roteiro:', error);
      showError(error.response?.data?.message || 'Não foi possível duplicar o roteiro.');
    }
  };

  const handleSubmitRating = async (ratingData: {
    score: number;
    comment: string;
    photos: string[];
  }) => {
    // Prevenir ações em roteiros mockados
    if (isMockPreview) {
      throw new Error('Este é um roteiro de demonstração.');
    }
    
    try {
      await itineraryService.addRating(id, ratingData);
      success('Avaliação salva com sucesso!');
      await loadItinerary();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao salvar avaliação');
    }
  };

  const handleAddExpense = async (expenseData: {
    category: string;
    description: string;
    amount: number;
    date?: Date;
  }) => {
    // Prevenir ações em roteiros mockados ou não pertencentes ao usuário
    if (isMockPreview) {
      throw new Error('Este é um roteiro de demonstração.');
    }
    if (!isOwner) {
      throw new Error('Apenas o criador do roteiro pode adicionar gastos.');
    }
    
    try {
      await budgetService.addExpense(id, expenseData);
      success('Gasto adicionado com sucesso!');
      await loadItinerary();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao adicionar gasto');
    }
  };

  const handleUpdateExpense = async (expenseId: string, data: any) => {
    // Prevenir ações em roteiros mockados ou não pertencentes ao usuário
    if (isMockPreview) {
      throw new Error('Este é um roteiro de demonstração.');
    }
    if (!isOwner) {
      throw new Error('Apenas o criador do roteiro pode editar gastos.');
    }
    
    try {
      await budgetService.updateExpense(id, expenseId, data);
      success('Gasto atualizado com sucesso!');
      await loadItinerary();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao atualizar gasto');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    // Prevenir ações em roteiros mockados ou não pertencentes ao usuário
    if (isMockPreview) {
      throw new Error('Este é um roteiro de demonstração.');
    }
    if (!isOwner) {
      throw new Error('Apenas o criador do roteiro pode remover gastos.');
    }
    
    try {
      await budgetService.deleteExpense(id, expenseId);
      success('Gasto removido com sucesso!');
      await loadItinerary();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erro ao remover gasto');
    }
  };

  const handleEdit = () => {
    // Prevenir ações em roteiros mockados ou não pertencentes ao usuário
    if (isMockPreview) {
      showAlert('Roteiro de Demonstração', 'Este é um roteiro de exemplo. Use o botão "Usar este Roteiro" para adicioná-lo!');
      return;
    }
    if (!isOwner) {
      showAlert('Sem Permissão', 'Apenas o criador do roteiro pode editá-lo.');
      return;
    }
    navigation.navigate('EditItinerary', { id: itinerary?._id });
  };

  const handleShare = () => {
    // Prevenir ações em roteiros mockados
    if (isMockPreview) {
      showAlert('Roteiro de Demonstração', 'Este é um roteiro de exemplo.');
      return;
    }
    setShareModalVisible(true);
  };

  const handleUseItinerary = async () => {
    // Prevenir usar roteiros mockados
    if (isMockPreview) {
      showAlert('Roteiro de Demonstração', 'Roteiros de demonstração não podem ser copiados. Explore os roteiros públicos para encontrar inspiração!');
      return;
    }
    
    try {
      console.log('🔄 Usando roteiro (duplicando):', id);
      const duplicate = await itineraryService.duplicate(id);
      console.log('✅ Roteiro duplicado com sucesso. Novo ID:', duplicate._id);
      success('Roteiro adicionado aos seus roteiros!');
      
      // Navegar para o roteiro duplicado onde poderá editar
      navigation.replace('ItineraryDetail', { id: duplicate._id });
    } catch (error: any) {
      console.error('❌ Erro ao usar roteiro:', error);
      showError(error.response?.data?.message || 'Não foi possível adicionar o roteiro.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!itinerary) {
    return null;
  }

  const startDate = format(new Date(itinerary.startDate), "dd 'de' MMMM", { locale: ptBR });
  const endDate = format(new Date(itinerary.endDate), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.content}>
        {/* Hero com botões integrados */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {isOwner ? (
            <>
              {/* Layout para proprietário: seta voltar separada + botões de ação */}
              <View style={styles.heroHeader}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButtonHero}
                >
                  <Text style={[styles.backButtonTextHero, { color: colors.text }]}>‹</Text>
                </TouchableOpacity>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>🔗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEdit}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDuplicate} style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>📋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.iconButton}>
                    <Text style={styles.iconButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Informações do roteiro */}
              <Text style={[styles.title, { color: colors.text }]}>{itinerary.title}</Text>
            </>
          ) : (
            <>
              {/* Layout para preview: seta voltar junto com título */}
              <View style={styles.titleWithBack}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backButtonInline}
                >
                  <Text style={[styles.backButtonTextInline, { color: colors.text }]}>‹</Text>
                </TouchableOpacity>
                <Text style={[styles.titleInline, { color: colors.text }]} numberOfLines={2}>
                  {itinerary.title}
                </Text>
              </View>
            </>
          )}

          {/* Resto das informações (mesmo para todos) */}
          <Text style={[styles.destination, { color: colors.textSecondary }]}>
            {itinerary.destination ? `${itinerary.destination.city || 'N/A'}, ${itinerary.destination.country || 'N/A'}` : 'Destino não informado'}
          </Text>
          <Text style={[styles.dates, { color: colors.textSecondary }]}>
            {startDate} - {endDate}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{itinerary.duration} dias</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                {itinerary.budget.level === 'economico'
                  ? '💰 Econômico'
                  : itinerary.budget.level === 'medio'
                    ? '💳 Médio'
                    : '💎 Luxo'}
              </Text>
            </View>
            {itinerary.generatedByAI && (
              <View style={[styles.badge, { backgroundColor: colors.accent || colors.primary }]}>
                <Text style={[styles.aiText, { color: colors.text }]}>✨ IA</Text>
              </View>
            )}
            {isMockPreview && (
              <View style={[styles.badge, { backgroundColor: '#FF9500' }]}>
                <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>👁️ Preview</Text>
              </View>
            )}
            {isPublicPreview && (
              <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
                <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                  👤 {itinerary.owner?.name || 'Público'}
                </Text>
              </View>
            )}
          </View>

          {/* Botão "Usar este Roteiro" para roteiros não-proprietários (mock ou públicos) */}
          {!isOwner && (
            <TouchableOpacity
              onPress={handleUseItinerary}
              style={[styles.useItineraryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.useItineraryButtonText}>✨ Usar este Roteiro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Orçamento */}
        <View style={styles.section}>
          <BudgetTracker
            itineraryId={itinerary._id}
            budgetEstimated={itinerary.budget.estimatedTotal}
            budgetSpent={itinerary.budget.spent || 0}
            currency={itinerary.budget.currency}
            expenses={itinerary.expenses || []}
            readOnly={!isOwner}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        </View>

        {/* Avaliação - só aparece se status for 'concluido' */}
        {itinerary.status === 'concluido' && (
          <View style={styles.section}>
            <View style={styles.ratingHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Avaliação da Viagem</Text>
              {itinerary.rating?.score && (
                <TouchableOpacity onPress={() => setRatingModalVisible(true)}>
                  <Text style={[styles.editRatingButton, { color: colors.primary }]}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>

            {itinerary.rating?.score ? (
              <View style={[styles.ratingCard, { backgroundColor: colors.card }]}>
                <RatingStars rating={itinerary.rating.score} size={32} />
                {itinerary.rating.comment && (
                  <Text style={[styles.ratingComment, { color: colors.text }]}>{itinerary.rating.comment}</Text>
                )}
                {itinerary.rating.ratedAt && (
                  <Text style={[styles.ratingDate, { color: colors.textSecondary }]}>
                    Avaliado em {format(new Date(itinerary.rating.ratedAt), "dd/MM/yyyy")}
                  </Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addRatingButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setRatingModalVisible(true)}
              >
                <Text style={styles.addRatingIcon}>⭐</Text>
                <Text style={[styles.addRatingText, { color: colors.text }]}>Como foi sua viagem?</Text>
                <Text style={[styles.addRatingSubtext, { color: colors.textSecondary }]}>Toque para avaliar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Dias */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Roteiro dia a dia</Text>
          {itinerary.days && Array.isArray(itinerary.days) && itinerary.days.map((day, index) => (
            <View key={day._id} style={[styles.dayCard, { backgroundColor: colors.card }]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayNumber, { color: colors.primary }]}>Dia {day.dayNumber}</Text>
                <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                  {format(new Date(day.date), "dd 'de' MMMM", { locale: ptBR })}
                </Text>
              </View>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{day.title}</Text>

              {day.activities && Array.isArray(day.activities) && day.activities.map((activity, actIndex) => (
                <View key={activity._id} style={[styles.activityCard, { backgroundColor: colors.background }]}>
                  <View style={styles.activityHeader}>
                    <Text style={[styles.activityTime, { color: colors.primary }]}>{activity.time}</Text>
                    <Text style={styles.activityCategory}>
                      {activity.category === 'transporte'
                        ? '🚗'
                        : activity.category === 'alimentacao'
                          ? '🍽️'
                          : activity.category === 'atracao'
                            ? '🎭'
                            : activity.category === 'hospedagem'
                              ? '🏨'
                              : activity.category === 'compras'
                                ? '🛍️'
                                : '📍'}
                    </Text>
                  </View>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                  {activity.description && (
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>{activity.description}</Text>
                  )}
                  {activity.location && (
                    <Text style={[styles.activityLocation, { color: colors.textSecondary }]}>📍 {activity.location.name}</Text>
                  )}
                  <View style={styles.activityFooter}>
                    <Text style={[styles.activityCost, { color: colors.primary }]}> 
                      {formatBRL(activity.estimatedCost)}
                    </Text>

      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleSubmitRating}
        existingRating={itinerary?.rating}
        itineraryId={id}
      />
                    <Text style={[styles.activityDuration, { color: colors.textSecondary }]}>{activity.duration}min</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Colaboradores */}
        {itinerary.collaborators.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Colaboradores</Text>
            {itinerary.collaborators && Array.isArray(itinerary.collaborators) && itinerary.collaborators.map((collab) => (
              <View key={collab.user._id} style={[styles.collaboratorCard, { backgroundColor: colors.card }]}>
                <View style={[styles.collaboratorAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.collaboratorAvatarText, { color: '#FFFFFF' }]}>
                    {collab.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.collaboratorInfo}>
                  <Text style={[styles.collaboratorName, { color: colors.text }]}>{collab.user.name}</Text>
                  <Text style={[styles.collaboratorPermission, { color: colors.textSecondary }]}>
                    {collab.permission === 'edit' ? '✏️ Pode editar' : '👁️ Apenas visualizar'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      <ShareModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        itineraryId={id}
        itineraryTitle={itinerary?.title || ''}
        existingShareLink={itinerary?.shareLink}
        onUpgradePress={() => navigation.navigate('Pricing')}
      />
      
      <RatingModal
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={handleSubmitRating}
        existingRating={itinerary?.rating}
        itineraryId={id}
        onUpgradePress={() => navigation.navigate('Pricing')}
      />
      
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />
      
      <Tooltip
        visible={showBudgetTooltip}
        message="💰 Acompanhe seus gastos! Adicione despesas para ter controle total do seu orçamento de viagem."
        position="center"
        onClose={() => {
          setShowBudgetTooltip(false);
          markTooltipAsShown('budget');
        }}
        buttonText="Entendi!"
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  hero: {
    padding: 24,
    borderBottomWidth: 1,
  },  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonHero: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonTextHero: {
    fontSize: 36,
    fontWeight: '300',
  },
  titleWithBack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  backButtonInline: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonTextInline: {
    fontSize: 36,
    fontWeight: '300',
  },
  titleInline: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  destination: {
    fontSize: 18,
    marginBottom: 4,
  },
  dates: {
    fontSize: 16,
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiBadge: {
  },
  aiText: {
    fontSize: 14,
    fontWeight: '600',
  },
  useItineraryButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useItineraryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewDetailsButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewDetailsText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mapDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  budgetCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  budgetLabel: {
    fontSize: 14,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayDate: {
    fontSize: 14,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '700',
  },
  activityCategory: {
    fontSize: 18,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  activityLocation: {
    fontSize: 14,
    marginBottom: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCost: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityDuration: {
    fontSize: 14,
  },
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  collaboratorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collaboratorAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  collaboratorPermission: {
    fontSize: 14,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editRatingButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingComment: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  ratingDate: {
    fontSize: 13,
    marginTop: 12,
  },
  addRatingButton: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addRatingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  addRatingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  addRatingSubtext: {
    fontSize: 14,
  },
});