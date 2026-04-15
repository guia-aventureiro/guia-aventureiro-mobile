// mobile/src/services/api.ts
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import ENV from '../config/env';

// EventEmitter simples para comunicar eventos de autenticação (React Native compatível)
class SimpleEventEmitter {
  private listeners: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(...args));
  }
}

export const apiEvents = new SimpleEventEmitter();

const RETRYABLE_GATEWAY_STATUS = new Set([502, 503, 504]);
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const MAX_GATEWAY_RETRIES = 2;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const api = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validate HTTPS in production
if (!__DEV__ && ENV.apiUrl && !ENV.apiUrl.startsWith('https://')) {
  if (__DEV__) {
    console.warn('⚠️  WARNING: API URL is not HTTPS');
  }
}

// Secure token storage helper
const getSecureToken = async (key: string): Promise<string | null> => {
  try {
    // Try secure store first (new way)
    const secureToken = await SecureStore.getItemAsync(key);
    if (secureToken) {
      return secureToken;
    }

    // Fallback to AsyncStorage for migration (old way) - but don't use beyond migration
    const asyncToken = await AsyncStorage.getItem(key);
    if (asyncToken && secureToken === null) {
      // Migrate to secure store
      await SecureStore.setItemAsync(key, asyncToken);
      // Don't delete from AsyncStorage immediately - let it expire naturally
    }

    return asyncToken;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error accessing secure store');
    }
    return null;
  }
};

const setSecureToken = async (key: string, value: string): Promise<void> => {
  try {
    // Store in secure store
    await SecureStore.setItemAsync(key, value);
    // Also clear from AsyncStorage for security
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error storing secure token');
    }
  }
};

const removeSecureToken = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error removing secure token');
    }
  }
};

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    const token = await getSecureToken('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const method = (originalRequest?.method || 'get').toLowerCase();
    const status = error.response?.status;

    // Retry automático para erros transitórios comuns de cold start (Render free).
    if (RETRYABLE_METHODS.has(method)) {
      const shouldRetryGateway = status && RETRYABLE_GATEWAY_STATUS.has(status);
      const shouldRetryNetwork = !error.response;

      if (shouldRetryGateway || shouldRetryNetwork) {
        originalRequest._gatewayRetryCount = (originalRequest._gatewayRetryCount || 0) + 1;

        if (originalRequest._gatewayRetryCount <= MAX_GATEWAY_RETRIES) {
          const waitMs = 1500 * Math.pow(2, originalRequest._gatewayRetryCount - 1);
          if (__DEV__) {
            console.warn(
              `⏳ API indisponível temporariamente (${status || 'network'}). Tentando novamente em ${waitMs}ms...`
            );
          }
          await delay(waitMs);
          return api(originalRequest);
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getSecureToken('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${ENV.apiUrl.replace('/api', '')}/api/auth/refresh`, {
            refreshToken,
          });

          await setSecureToken('accessToken', data.accessToken);
          await setSecureToken('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        await removeSecureToken('accessToken');
        await removeSecureToken('refreshToken');
        await AsyncStorage.removeItem('user');

        // Emitir evento para forçar logout no app
        apiEvents.emit('unauthorized');

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
