<!-- markdownlint-disable MD022 MD032 MD031 MD040 -->

# 📱 Guia de Integração - Sistema de Assinatura Mobile

## ✅ Arquivos Criados

### **Tipos**

- ✅ `src/types/subscription.ts` - Tipos TypeScript completos

### **Serviços**

- ✅ `src/services/subscriptionService.ts` - API client para subscription

### **Hooks**

- ✅ `src/hooks/useSubscription.ts` - Hooks React Query para dados de assinatura

### **Componentes**

- ✅ `src/components/PlanBadge.tsx` - Badge do plano (Free, Premium, Pro)
- ✅ `src/components/UsageBar.tsx` - Barra de progresso de uso
- ✅ `src/components/LimitModal.tsx` - Modal quando atinge limite

### **Telas**

- ✅ `src/screens/PricingScreen.tsx` - Tela de comparação de planos
- ✅ `src/screens/UsageScreen.tsx` - Dashboard de uso e gerenciamento de assinatura

---

## 🔧 Configuração das Rotas

### 1. Adicionar rotas no navegador

Edite `src/navigation/AppNavigator.tsx` ou similar:

```typescript
import { PricingScreen } from '../screens/PricingScreen';
import { UsageScreen } from '../screens/UsageScreen';

// Dentro do Stack.Navigator:
<Stack.Screen
  name="Pricing"
  component={PricingScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="Usage"
  component={UsageScreen}
  options={{ headerShown: false }}
/>
```

---

## 📲 Integrando o LimitModal

### Exemplo: DashboardScreen (Criar Roteiro)

```typescript
import React, { useState } from 'react';
import { LimitModal } from '../components/LimitModal';
import { useCanPerformAction } from '../hooks/useSubscription';
import { LimitError } from '../types/subscription';

export const DashboardScreen = ({ navigation }: any) => {
  const { canCreateItinerary, usage, plan } = useCanPerformAction();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<LimitError | null>(null);

  const handleCreateItinerary = async () => {
    // Verificar limite ANTES de tentar criar
    if (canCreateItinerary() === false) {
      setLimitError({
        error: 'limit_reached',
        message: `Você atingiu o limite de ${usage?.itineraries.limit} roteiros do plano ${plan?.toUpperCase()}`,
        currentUsage: usage?.itineraries.current,
        limit: usage?.itineraries.limit,
        plan: plan || 'free',
        upgrade: {
          message: 'Faça upgrade para criar mais roteiros',
          availablePlans: plan === 'free' ? ['premium', 'pro'] : ['pro'],
        },
      });
      setShowLimitModal(true);
      return;
    }

    // Prosseguir com criação
    navigation.navigate('CreateItinerary');
  };

  return (
    <View>
      {/* Seu código existente */}
      <Button
        title="Criar Roteiro"
        onPress={handleCreateItinerary}
      />

      {/* Modal de Limite */}
      {limitError && (
        <LimitModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limitError={limitError}
          onUpgrade={() => navigation.navigate('Pricing')}
          currentPlan={plan || 'free'}
        />
      )}
    </View>
  );
};
```

### Exemplo: GenerateScreen (IA)

```typescript
import React, { useState } from 'react';
import { LimitModal } from '../components/LimitModal';
import { useCanPerformAction } from '../hooks/useSubscription';
import { LimitError } from '../types/subscription';

export const GenerateScreen = ({ navigation }: any) => {
  const { canUseAI, usage, plan } = useCanPerformAction();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<LimitError | null>(null);

  const handleGenerateWithAI = async () => {
    // Verificar limite de IA
    if (canUseAI() === false) {
      setLimitError({
        error: 'limit_reached',
        message: `Você atingiu o limite de ${usage?.aiGenerations.limit} gerações IA por mês do plano ${plan?.toUpperCase()}`,
        currentUsage: usage?.aiGenerations.current,
        limit: usage?.aiGenerations.limit,
        plan: plan || 'free',
        upgrade: {
          message: 'Faça upgrade para o Premium e tenha 20 gerações por mês',
          availablePlans: plan === 'free' ? ['premium', 'pro'] : ['pro'],
        },
      });
      setShowLimitModal(true);
      return;
    }

    // Gerar com IA
    try {
      const result = await itineraryService.generateWithAI(params);
      // ...
    } catch (error: any) {
      // Capturar erro 403 do backend
      if (error.response?.status === 403 && error.response?.data?.error === 'limit_reached') {
        setLimitError(error.response.data);
        setShowLimitModal(true);
      }
    }
  };

  return (
    <View>
      <Button title="Gerar com IA" onPress={handleGenerateWithAI} />

      {limitError && (
        <LimitModal
          visible={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limitError={limitError}
          onUpgrade={() => navigation.navigate('Pricing')}
          currentPlan={plan || 'free'}
        />
      )}
    </View>
  );
};
```

### Exemplo: Upload de Foto

```typescript
const handleUploadPhoto = async () => {
  const { canUploadPhoto, usage, plan } = useCanPerformAction();

  if (canUploadPhoto() === false) {
    setLimitError({
      error: 'limit_reached',
      message: `Você atingiu o limite de ${usage?.photos.limit} fotos do plano ${plan?.toUpperCase()}`,
      currentUsage: usage?.photos.current,
      limit: usage?.photos.limit,
      plan: plan || 'free',
      upgrade: {
        message: 'Faça upgrade para fazer upload de mais fotos',
        availablePlans: plan === 'free' ? ['premium', 'pro'] : ['pro'],
      },
    });
    setShowLimitModal(true);
    return;
  }

  // Upload da foto
  // ...
};
```

---

## 🎨 Adicionando Badge de Plano no Profile

### ProfileScreen.tsx

```typescript
import { PlanBadge } from '../components/PlanBadge';
import { useMySubscription } from '../hooks/useSubscription';

export const ProfileScreen = ({ navigation }: any) => {
  const { data: subscriptionData } = useMySubscription();
  const plan = subscriptionData?.subscription?.plan || 'free';

  return (
    <View>
      {/* Header do perfil */}
      <View style={styles.profileHeader}>
        <Avatar />
        <Text>{user.name}</Text>
        <PlanBadge plan={plan} size="medium" />
      </View>

      {/* Botão para ver uso */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Usage')}
        style={styles.usageButton}
      >
        <Text>Ver Uso & Assinatura</Text>
        <Ionicons name="arrow-forward" size={20} />
      </TouchableOpacity>

      {/* Botão para upgrade (se não for Pro) */}
      {plan !== 'pro' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Pricing')}
          style={styles.upgradeButton}
        >
          <Ionicons name="arrow-up-circle" size={20} />
          <Text>Fazer Upgrade</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

---

## 📊 Dashboard de Uso no Home

### DashboardScreen.tsx - Widget de Uso

```typescript
import { UsageBar } from '../components/UsageBar';
import { useUsage } from '../hooks/useSubscription';

export const DashboardScreen = ({ navigation }: any) => {
  const { data: usageData } = useUsage();
  const usage = usageData?.usage;

  return (
    <ScrollView>
      {/* Widget de uso */}
      <View style={styles.usageWidget}>
        <Text style={styles.widgetTitle}>Seu Uso</Text>

        <UsageBar
          label="Roteiros"
          current={usage?.itineraries.current || 0}
          limit={usage?.itineraries.limit || 0}
          unlimited={usage?.itineraries.unlimited}
          icon="map"
          showUpgrade={usageData?.plan === 'free'}
          onUpgrade={() => navigation.navigate('Pricing')}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Usage')}
          style={styles.viewAllButton}
        >
          <Text>Ver detalhes</Text>
        </TouchableOpacity>
      </View>

      {/* Resto do dashboard */}
    </ScrollView>
  );
};
```

---

## 🔔 Avisos de Limite Próximo

### Hook personalizado

```typescript
// src/hooks/useUsageWarnings.ts
import { useEffect } from 'react';
import { useUsage } from './useSubscription';
import { showAlert } from '../components/CustomAlert';

export const useUsageWarnings = () => {
  const { data: usageData } = useUsage();
  const usage = usageData?.usage;

  useEffect(() => {
    if (!usage) return;

    // Avisar quando chegar a 80% do limite de roteiros
    if (usage.itineraries.percentage >= 80 && usage.itineraries.percentage < 100) {
      showAlert(
        'Limite próximo!',
        `Você já usou ${usage.itineraries.current} de ${usage.itineraries.limit} roteiros. Considere fazer upgrade.`
      );
    }

    // Avisar quando IA estiver acabando
    if (usage.aiGenerations.percentage >= 80 && usage.aiGenerations.percentage < 100) {
      showAlert(
        'IA quase no limite!',
        `Você já usou ${usage.aiGenerations.current} de ${usage.aiGenerations.limit} gerações IA este mês.`
      );
    }
  }, [usage]);
};

// Usar no App.tsx ou DashboardScreen:
useUsageWarnings();
```

---

## 🎯 Fluxo Completo de Upgrade

### 1. Usuário tenta criar roteiro

```
DashboardScreen
  → Verifica limite com canCreateItinerary()
  → Se atingiu: Mostra LimitModal
  → Usuário clica "Ver Planos"
  → Navega para PricingScreen
```

### 2. Escolhe plano e confirma

```
PricingScreen
  → Usuário seleciona Premium/Pro
  → Clica "Assinar Premium"
  → Navega para UpgradeWebviewScreen
  → API: POST /api/subscriptions/create-checkout
  → Checkout hospedado (Stripe)
  → Retorno para app e verificação em /api/checkout/verify/:sessionId
  → Subscription cache é invalidado automaticamente
```

### 3. Dados atualizados

```
React Query invalida:
  - ['subscription']
  - ['usage']

Componentes re-renderizam com novos limites:
  - UsageBar mostra 0/50 (era 3/3)
  - PlanBadge mostra "Premium"
  - LimitModal não aparece mais
```

---

## 🧪 Testando Localmente

### 1. Criar usuário de teste

```typescript
// Fazer signup
const { user, accessToken } = await authService.signup({
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test123!',
  acceptedTerms: true,
});

// Automaticamente terá subscription Free
```

### 2. Ver plano atual

```typescript
const { data } = useMySubscription();
console.log(data.subscription.plan); // "free"
console.log(data.subscription.usage.itineraries); // { current: 0, limit: 3 }
```

### 3. Criar 3 roteiros

```typescript
await itineraryService.create({ ... }); // OK
await itineraryService.create({ ... }); // OK
await itineraryService.create({ ... }); // OK
await itineraryService.create({ ... }); // ERRO 403!
```

### 4. Fazer upgrade

```typescript
navigation.navigate('UpgradeWebview');

// Agora pode criar até 50 roteiros
```

---

## 📝 Checklist de Integração

### Backend

- ✅ Sistema de assinatura implementado
- ✅ Middlewares de limite aplicados
- ✅ Endpoints de subscription funcionando

### Mobile - Básico

- ✅ Tipos criados
- ✅ Serviço de API criado
- ✅ Hooks criados
- ✅ Componentes criados
- ✅ Telas criadas

### Mobile - Integração

- [ ] Adicionar rotas no navegador (Pricing, Usage)
- [ ] Integrar LimitModal em telas de criação
- [ ] Adicionar PlanBadge no ProfileScreen
- [ ] Adicionar widget de uso no DashboardScreen
- [ ] Testar fluxo completo de upgrade

### Opcional - UX Avançada

- [ ] Hook de avisos de limite próximo
- [ ] Animações de transição de plano
- [ ] Onboarding de trial gratuito
- [ ] Push notifications de limite
- [ ] Analytics de conversão

---

## 🚀 Próximos Passos

1. **Integrar Stripe** (quando estiver pronto)
   - Substituir `confirm-upgrade` por Stripe Checkout
   - Implementar webhooks de pagamento
   - Validar assinatura ao abrir app

2. **Adicionar Trial**
   - 7 dias de Premium grátis para novos usuários
   - Timer countdown na UI
   - Lembrete 1 dia antes de expirar

3. **Gamificação**
   - Badge especial para assinantes
   - Conquistas exclusivas Premium/Pro
   - Benefícios visuais no app

---

## 💡 Dicas

### Performance

- React Query cacheia por 1 minuto (subscription) e 30s (usage)
- Use `refetch()` com moderação
- `invalidateQueries` automático após mutations

### UX

- Sempre mostre o motivo do bloqueio (limite de X roteiros)
- Liste benefícios do upgrade no modal
- Permita usuário continuar navegando (não force upgrade)

### Debugging

```typescript
// Ver subscription atual
const { data } = useMySubscription();
console.log('Subscription:', data);

// Ver uso
const { data: usage } = useUsage();
console.log('Usage:', usage);

// Forçar refresh
const { refetch } = useMySubscription();
refetch();
```

---

## 📞 Troubleshooting

### "axios is not defined"

```bash
npm install axios
```

### "Cannot find module 'expo-blur'"

```bash
npx expo install expo-blur
```

### "Subscription não aparece"

- Verificar se backend está rodando
- Verificar URL da API em `config/env`
- Ver console do React Query Devtools
- Verificar token no AsyncStorage

---

✅ **Tudo pronto para começar a vender!** 🎉
