// mobile/src/platform/storage.ts
// Armazenamento seguro de tokens — implementação nativa (iOS/Android).
// No build web, o bundler substitui este arquivo por storage.web.ts automaticamente.
// Regra do projeto: nunca importar expo-secure-store direto; sempre via platform/storage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const normalize = (value?: string | null): string | null => {
  const normalized = (value || '').trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') {
    return null;
  }
  return normalized;
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const secureValue = normalize(await SecureStore.getItemAsync(key));
    if (secureValue) {
      return secureValue;
    }

    // Migração de instalações antigas que salvavam tokens no AsyncStorage
    const legacyValue = normalize(await AsyncStorage.getItem(key));
    if (legacyValue) {
      await SecureStore.setItemAsync(key, legacyValue);
    }

    return legacyValue;
  } catch {
    return null;
  }
};

export const setSecureItem = async (key: string, value: string): Promise<void> => {
  try {
    const sanitized = normalize(value);
    if (!sanitized) {
      await deleteSecureItem(key);
      return;
    }

    await SecureStore.setItemAsync(key, sanitized);
    // Remove qualquer cópia legada no AsyncStorage
    await AsyncStorage.removeItem(key);
  } catch {
    // Falha de escrita não deve derrubar o app
  }
};

export const deleteSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
    await AsyncStorage.removeItem(key);
  } catch {
    // Falha de limpeza não deve derrubar o app
  }
};
