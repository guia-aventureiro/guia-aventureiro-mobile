// mobile/src/types/index.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  createdAt: string;
  preferences?: {
    travelStyle?: 'solo' | 'casal' | 'familia' | 'amigos' | 'mochileiro';
    interests?: string[];
    budgetLevel?: 'economico' | 'medio' | 'luxo';
    pace?: 'relaxado' | 'moderado' | 'intenso';
  };
  publicProfile?: boolean;
}

export interface Itinerary {
  _id: string;
  owner: User;
  title: string;
  destination: {
    city: string;
    country: string;
    coverImage?: string;
  };
  startDate: string;
  endDate: string;
  duration: number;
  budget: {
    level: 'economico' | 'medio' | 'luxo';
    estimatedTotal: number;
    currency: string;
    spent?: number;
    lastUpdated?: string;
  };
  preferences: {
    interests: string[];
    travelStyle: 'solo' | 'casal' | 'familia' | 'amigos' | 'mochileiro';
    pace: 'relaxado' | 'moderado' | 'intenso';
  };
  days: Day[];
  collaborators: Collaborator[];
  status: 'rascunho' | 'planejando' | 'confirmado' | 'em_andamento' | 'concluido';
  generatedByAI: boolean;
  rating?: {
    score: number;
    comment?: string;
    photos?: string[];
    ratedAt?: string;
  };
  expenses?: Expense[];
  publicLink?: string;
  isPublic?: boolean;
  likes?: string[];
  views?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Day {
  _id: string;
  date: string;
  dayNumber: number;
  title: string;
  activities: Activity[];
  dailyBudget: number;
  notes?: string;
}

export interface Activity {
  _id: string;
  time: string;
  title: string;
  description?: string;
  location?: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  estimatedCost?: number;
  cost?: number;
  duration: number;
  category: 'transporte' | 'alimentacao' | 'atracao' | 'hospedagem' | 'compras' | 'outro';
  bookingLinks?: BookingLink[];
  completed?: boolean;
  isCompleted?: boolean;
}

export interface BookingLink {
  platform: string;
  url: string;
}

export interface Collaborator {
  user: User;
  permission: 'view' | 'edit';
  addedAt: string;
}

export interface Expense {
  _id: string;
  date: Date | string;
  category: 'hospedagem' | 'alimentacao' | 'transporte' | 'atracao' | 'compras' | 'outro';
  description: string;
  amount: number;
  currency?: string;
  receipt?: string;
  createdAt: Date | string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isTransitioning: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (
    name: string,
    avatar?: string,
    preferences?: any,
    publicProfile?: boolean
  ) => Promise<User>;
}
