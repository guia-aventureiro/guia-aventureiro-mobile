# Mobile Best Practices
**Guia Aventureiro - Convenções e Padrões de Desenvolvimento Mobile (React Native)**

---

## 📑 Índice

1. [Estrutura de Pastas](#estrutura-de-pastas)
2. [Theme System](#theme-system)
3. [Helpers](#helpers)
4. [Fixtures](#fixtures)
5. [Components](#components)
6. [Screens](#screens)
7. [Navigation](#navigation)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Performance](#performance)
11. [Styling](#styling)
12. [Testing](#testing)

---

## 📁 Estrutura de Pastas

```
mobile/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Context API para estado global
│   ├── fixtures/        # 🆕 Mock data para desenvolvimento
│   ├── helpers/         # 🆕 Funções utilitárias (formatters, validators, date)
│   ├── hooks/           # Custom hooks
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # Telas do app
│   ├── services/        # API services
│   ├── theme/           # 🆕 Design tokens (colors, spacing, typography, shadows)
│   └── utils/           # Utilitários gerais
├── assets/              # Imagens, fontes, ícones
├── App.tsx              # Entry point
└── package.json
```

---

## 🎨 Theme System

### ✅ Use design tokens centralizados

**❌ Evite hardcoded values:**
```tsx
<View style={{
  backgroundColor: '#007AFF',
  padding: 16,
  marginBottom: 20,
  borderRadius: 12,
}}>
```

**✅ Use theme tokens:**
```tsx
import { colors, spacing } from '@/theme';

<View style={{
  backgroundColor: colors.primary,
  padding: spacing.base,
  marginBottom: spacing.lg,
  borderRadius: spacing.borderRadius.md,
}}>
```

### 📦 Theme disponível

```tsx
import { colors, spacing, typography, shadows } from '@/theme';

// Colors
colors.primary           // '#007AFF'
colors.success           // '#34C759'
colors.error             // '#FF3B30'
colors.text.primary      // '#111827'
colors.text.secondary    // '#6B7280'
colors.categories.praia  // '#3498DB'

// Spacing
spacing.xs               // 4
spacing.base             // 16
spacing.xl               // 24
spacing.borderRadius.md  // 12
spacing.avatar.md        // 40
spacing.icon.lg          // 24

// Typography
typography.heading.h1    // { fontSize: 36, fontWeight: '700', lineHeight: 44 }
typography.body.base     // { fontSize: 16, fontWeight: '400', lineHeight: 24 }
typography.button.medium // { fontSize: 16, fontWeight: '600', lineHeight: 22 }

// Shadows
shadows.base             // Cross-platform shadow (elevation 4)
shadows.lg               // elevation 8
```

### 💡 Exemplo de componente com theme

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';

const Card = ({ title, description }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: spacing.borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.base,
  },
  title: {
    ...typography.heading.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body.base,
    color: colors.text.secondary,
  },
});
```

---

## 🛠️ Helpers

### ✅ Use helpers para lógica reutilizável

```tsx
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  isValidEmail,
  validatePassword,
  addDays,
  daysBetween,
} from '@/helpers';

// Formatters
formatCurrency(2500, 'BRL')              // 'R$ 2.500,00'
formatDate(new Date(), 'long')           // '15 de março de 2026'
formatRelativeTime(new Date())           // 'há 2 horas'
truncate(longText, 100)                  // 'Lorem ipsum...'

// Validators
isValidEmail('joao@example.com')         // true
validatePassword('Test123!')             // { valid: true, errors: [] }
isValidCPF('12345678901')                // false

// Date helpers
addDays(new Date(), 7)                   // 7 dias no futuro
daysBetween(startDate, endDate)          // 5 dias
isFuture(date)                           // true/false
```

### 📦 Helpers disponíveis

**formatters.ts** (25 funções):
- `formatCurrency`, `formatNumber`, `formatDate`, `formatDateTime`, `formatRelativeTime`
- `formatDuration`, `formatPhone`, `formatCPF`, `formatFileSize`, `formatPercentage`
- `truncate`, `pluralize`, `capitalize`, `formatName`

**validators.ts** (13 validações):
- `isValidEmail`, `validatePassword`, `isValidCPF`, `isValidPhone`, `isValidUrl`
- `isValidCreditCard`, `isValidCVV`, `isValidExpiryDate`
- `isNotEmpty`, `isValidDateRange`, `isValidLatitude`, `isValidLongitude`

**dateHelpers.ts** (18 funções):
- `addDays`, `subtractDays`, `daysBetween`, `isFuture`, `isPast`, `isToday`
- `isThisWeek`, `isThisMonth`, `startOfDay`, `endOfDay`, `isBetween`
- `getMonthName`, `getDayName`, `getDateRange`, `isValidDate`, `parseISODate`

---

## 🗂️ Fixtures

### ✅ Use fixtures para desenvolvimento

**❌ Evite hardcoded mock data em componentes:**
```tsx
const MyScreen = () => {
  const users = [
    { id: '1', name: 'João', email: 'joao@example.com' },
    // ...
  ];
```

**✅ Importe de fixtures:**
```tsx
import { mockItineraries, mockUsers, mockCategories } from '@/fixtures';

const MyScreen = () => {
  const [itineraries, setItineraries] = useState(mockItineraries);

  // Ou use no storybook
  // Ou use em testes
};
```

### 📦 Fixtures disponíveis

```tsx
import {
  mockLoggedUser,
  mockUsers,
  mockItineraries,
  mockCategories,
  mockPopularDestinations,
  mockComments,
  mockNotifications,
} from '@/fixtures';

// Usuário logado mock
console.log(mockLoggedUser.nome); // 'João Silva'

// 5 roteiros mock
mockItineraries.forEach(it => console.log(it.titulo));

// 8 categorias com ícones
mockCategories // [{ id: 'aventura', label: 'Aventura', icon: '🏔️' }, ...]
```

---

## 🧩 Components

### ✅ Estrutura padrão de componente

```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.text,
        variant === 'secondary' && styles.textSecondary,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
  },
  text: {
    ...typography.button.medium,
    color: colors.white,
  },
  textSecondary: {
    color: colors.primary,
  },
});
```

### ✅ Boas práticas

- ✅ **TypeScript**: Sempre use interfaces para props
- ✅ **Naming**: PascalCase para componentes (`Button.tsx`)
- ✅ **Export**: Use named exports (`export const Button`)
- ✅ **Memo**: Use `React.memo` para otimização quando necessário
- ✅ **Props**: Sempre defina valores default
- ✅ **Styles**: StyleSheet.create no final do arquivo
- ✅ **Theme**: Use tokens do theme, nunca hardcode

---

## 📱 Screens

### ✅ Estrutura padrão de screen

```tsx
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { ItineraryCard, LoadingSpinner, ErrorMessage } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { itineraryService } from '@/services';
import type { Itinerary } from '@/types';

export const ItinerariesScreen = () => {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItineraries();
  }, []);

  const loadItineraries = async () => {
    try {
      setLoading(true);
      const data = await itineraryService.listMyItineraries();
      setItineraries(data);
    } catch (err) {
      setError('Erro ao carregar roteiros');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadItineraries} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={itineraries}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ItineraryCard itinerary={item} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
});
```

---

## 🧭 Navigation

### ✅ Setup do React Navigation

```tsx
// navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  ItineraryDetails: { id: string };
  CreateItinerary: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="ItineraryDetails" component={ItineraryDetailsScreen} />
  </Stack.Navigator>
);
```

### ✅ Typed navigation hook

```tsx
// hooks/useTypedNavigation.ts
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation';

export const useTypedNavigation = () => {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
};

// Uso
const navigation = useTypedNavigation();
navigation.navigate('ItineraryDetails', { id: '123' });
```

---

## 🔐 State Management

### ✅ Context API para estado global

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextData {
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    const storedToken = await SecureStore.getItemAsync('token');
    if (storedToken) {
      setToken(storedToken);
      // Load user data...
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
    setToken(response.token);
    await SecureStore.setItemAsync('token', response.token);
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 🌐 API Integration

### ✅ Service structure

```tsx
// services/itineraryService.ts
import { api } from './api';
import type { Itinerary, CreateItineraryDTO } from '@/types';

export const itineraryService = {
  listMyItineraries: async (): Promise<Itinerary[]> => {
    const { data } = await api.get('/itineraries');
    return data.data;
  },

  getById: async (id: string): Promise<Itinerary> => {
    const { data } = await api.get(`/itineraries/${id}`);
    return data.data;
  },

  create: async (dto: CreateItineraryDTO): Promise<Itinerary> => {
    const { data } = await api.post('/itineraries', dto);
    return data.data;
  },

  update: async (id: string, dto: Partial<CreateItineraryDTO>): Promise<Itinerary> => {
    const { data } = await api.put(`/itineraries/${id}`, dto);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/itineraries/${id}`);
  },
};
```

---

## ⚡ Performance

### ✅ Otimizações importantes

```tsx
// 1. Memoização de componentes
export const ExpensiveComponent = React.memo(({ data }) => {
  return <View>...</View>;
});

// 2. useMemo para computações caras
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.likes - a.likes);
}, [data]);

// 3. useCallback para funções
const handlePress = useCallback(() => {
  navigation.navigate('Details');
}, [navigation]);

// 4. FlatList com otimizações
<FlatList
  data={items}
  keyExtractor={(item) => item._id}
  renderItem={renderItem}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>

// 5. Image otimization
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  defaultSource={require('@/assets/placeholder.png')}
/>
```

---

## 🎨 Styling

### ✅ StyleSheet best practices

```tsx
// ✅ Use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

// ✅ Conditional styles com array
<View style={[styles.base, isActive && styles.active]} />

// ✅ Responsive com Dimensions
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  image: {
    width: width - spacing.base * 2,
    height: 200,
  },
});

// ✅ Platform-specific styles
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  text: {
    ...Platform.select({
      ios: { fontSize: 16 },
      android: { fontSize: 14 },
    }),
  },
});
```

---

## 🧪 Testing

### ✅ Estrutura de teste

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Button title="Click me" onPress={() => {}} />);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('should call onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Click me" onPress={onPress} />);

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Click me" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Click me'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

---

## 📚 Resumo

### ✅ Principais melhorias implementadas

1. **Theme System**: Design tokens centralizados (colors, spacing, typography, shadows)
2. **Helpers**: 56 funções utilitárias (formatters, validators, dateHelpers)
3. **Fixtures**: Mock data organizado para desenvolvimento e testes
4. **TypeScript**: Tipagem forte em todos os módulos
5. **Estrutura**: Organização clara e escalável

### 🎯 Próximos passos

- Implementar dark mode com theme provider
- Adicionar testes unitários com Jest
- Implementar Storybook para componentes
- Adicionar analytics (Firebase/Amplitude)
- Implementar error boundary
- Cache com React Query
- Offline-first com AsyncStorage

---

**📝 Última atualização**: Janeiro 2026
**👤 Mantenedor**: Equipe Guia Aventureiro
