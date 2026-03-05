/**
 * Mock Data - Dados de exemplo para desenvolvimento e testes
 */

export interface MockUser {
  _id: string;
  nome: string;
  email: string;
  avatar?: string;
  assinatura: {
    tipo: 'free' | 'premium';
    status: string;
  };
}

export interface MockItinerary {
  _id: string;
  titulo: string;
  descricao: string;
  destinos: string[];
  dataInicio: string;
  dataFim: string;
  orcamento?: {
    valor: number;
    moeda: string;
  };
  categorias: string[];
  visibilidade: string;
  status: string;
  userId: string;
  fotos?: string[];
  likes: number;
}

/**
 * Usuário mock logado
 */
export const mockLoggedUser: MockUser = {
  _id: '507f1f77bcf86cd799439011',
  nome: 'João Silva',
  email: 'joao@example.com',
  avatar: 'https://i.pravatar.cc/150?img=12',
  assinatura: {
    tipo: 'premium',
    status: 'ativa',
  },
};

/**
 * Usuários mock
 */
export const mockUsers: MockUser[] = [
  mockLoggedUser,
  {
    _id: '507f1f77bcf86cd799439012',
    nome: 'Maria Santos',
    email: 'maria@example.com',
    avatar: 'https://i.pravatar.cc/150?img=5',
    assinatura: {
      tipo: 'free',
      status: 'ativa',
    },
  },
  {
    _id: '507f1f77bcf86cd799439013',
    nome: 'Pedro Oliveira',
    email: 'pedro@example.com',
    avatar: 'https://i.pravatar.cc/150?img=33',
    assinatura: {
      tipo: 'premium',
      status: 'ativa',
    },
  },
];

/**
 * Roteiros mock
 */
export const mockItineraries: MockItinerary[] = [
  {
    _id: 'itin_001',
    titulo: 'Aventura na Chapada Diamantina',
    descricao: 'Roteiro de 5 dias explorando as cachoeiras e trilhas da Chapada',
    destinos: ['Lençóis', 'Vale do Capão', 'Mucugê'],
    dataInicio: '2025-06-15',
    dataFim: '2025-06-20',
    orcamento: {
      valor: 2500,
      moeda: 'BRL',
    },
    categorias: ['aventura', 'montanha', 'eco-turismo'],
    visibilidade: 'publico',
    status: 'planejamento',
    userId: mockLoggedUser._id,
    fotos: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    ],
    likes: 42,
  },
  {
    _id: 'itin_002',
    titulo: 'Europa Cultural - Paris e Londres',
    descricao: 'Roteiro de 10 dias visitando os principais pontos turísticos',
    destinos: ['Paris', 'Londres'],
    dataInicio: '2025-09-01',
    dataFim: '2025-09-10',
    orcamento: {
      valor: 18000,
      moeda: 'BRL',
    },
    categorias: ['cultural', 'urbano', 'gastronomia'],
    visibilidade: 'publico',
    status: 'planejamento',
    userId: mockLoggedUser._id,
    fotos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    ],
    likes: 156,
  },
  {
    _id: 'itin_003',
    titulo: 'Praias do Nordeste',
    descricao: 'Roteiro de praia passando por 3 destinos incríveis',
    destinos: ['Jericoacoara', 'Maragogi', 'Porto de Galinhas'],
    dataInicio: '2025-12-10',
    dataFim: '2025-12-17',
    orcamento: {
      valor: 4500,
      moeda: 'BRL',
    },
    categorias: ['praia', 'aventura'],
    visibilidade: 'publico',
    status: 'confirmado',
    userId: '507f1f77bcf86cd799439012',
    fotos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
    ],
    likes: 89,
  },
  {
    _id: 'itin_004',
    titulo: 'Final de semana em Ouro Preto',
    descricao: 'Roteiro cultural pelas igrejas históricas',
    destinos: ['Ouro Preto', 'Mariana'],
    dataInicio: '2025-04-05',
    dataFim: '2025-04-07',
    orcamento: {
      valor: 800,
      moeda: 'BRL',
    },
    categorias: ['cultural', 'rural'],
    visibilidade: 'amigos',
    status: 'confirmado',
    userId: mockLoggedUser._id,
    fotos: [],
    likes: 23,
  },
  {
    _id: 'itin_005',
    titulo: 'Fernando de Noronha',
    descricao: 'Paraíso ecológico - mergulho e trilhas',
    destinos: ['Fernando de Noronha'],
    dataInicio: '2025-10-15',
    dataFim: '2025-10-20',
    orcamento: {
      valor: 7000,
      moeda: 'BRL',
    },
    categorias: ['praia', 'eco-turismo', 'aventura'],
    visibilidade: 'publico',
    status: 'planejamento',
    userId: '507f1f77bcf86cd799439013',
    fotos: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    ],
    likes: 201,
  },
];

/**
 * Categorias disponíveis
 */
export const mockCategories = [
  { id: 'aventura', label: 'Aventura', icon: '🏔️' },
  { id: 'cultural', label: 'Cultural', icon: '🏛️' },
  { id: 'gastronomia', label: 'Gastronomia', icon: '🍽️' },
  { id: 'praia', label: 'Praia', icon: '🏖️' },
  { id: 'montanha', label: 'Montanha', icon: '⛰️' },
  { id: 'urbano', label: 'Urbano', icon: '🏙️' },
  { id: 'rural', label: 'Rural', icon: '🌾' },
  { id: 'eco-turismo', label: 'Eco-turismo', icon: '🌿' },
];

/**
 * Destinos populares
 */
export const mockPopularDestinations = [
  { id: 1, name: 'Rio de Janeiro', country: 'Brasil', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325' },
  { id: 2, name: 'Paris', country: 'França', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
  { id: 3, name: 'Chapada Diamantina', country: 'Brasil', image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800' },
  { id: 4, name: 'Fernando de Noronha', country: 'Brasil', image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19' },
  { id: 5, name: 'Londres', country: 'Inglaterra', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad' },
];

/**
 * Comentários mock
 */
export const mockComments = [
  {
    _id: 'comment_001',
    itineraryId: 'itin_001',
    userId: '507f1f77bcf86cd799439012',
    userName: 'Maria Santos',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    texto: 'Que roteiro incrível! Já fui pra Chapada e é realmente fantástico 😍',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
  },
  {
    _id: 'comment_002',
    itineraryId: 'itin_001',
    userId: '507f1f77bcf86cd799439013',
    userName: 'Pedro Oliveira',
    userAvatar: 'https://i.pravatar.cc/150?img=33',
    texto: 'Quantos dias você recomenda para Lençóis?',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5h atrás
  },
];

/**
 * Notificações mock
 */
export const mockNotifications = [
  {
    _id: 'notif_001',
    tipo: 'like',
    titulo: 'Novo like no seu roteiro',
    mensagem: 'Maria Santos curtiu "Aventura na Chapada Diamantina"',
    lida: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30min atrás
  },
  {
    _id: 'notif_002',
    tipo: 'comentario',
    titulo: 'Novo comentário',
    mensagem: 'Pedro Oliveira comentou no seu roteiro',
    lida: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h atrás
  },
  {
    _id: 'notif_003',
    tipo: 'sistema',
    titulo: 'Atualização disponível',
    mensagem: 'Nova versão do app disponível na loja',
    lida: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
  },
];
