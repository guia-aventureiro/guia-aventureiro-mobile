// mobile/src/services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import analyticsService from './analyticsService';

// Helper to store tokens securely
const storeTokensSecurely = async (accessToken: string, refreshToken: string) => {
  try {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    // Clear from AsyncStorage for security
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error storing tokens securely');
    }
  }
};

// Helper to load tokens securely
const loadTokensSecurely = async (): Promise<{ accessToken: string | null; refreshToken: string | null }> => {
  try {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    
    // Fallback: check AsyncStorage for migration
    if (!accessToken) {
      const asyncAccessToken = await AsyncStorage.getItem('accessToken');
      if (asyncAccessToken) {
        await SecureStore.setItemAsync('accessToken', asyncAccessToken);
        await AsyncStorage.removeItem('accessToken');
      }
    }
    
    if (!refreshToken) {
      const asyncRefreshToken = await AsyncStorage.getItem('refreshToken');
      if (asyncRefreshToken) {
        await SecureStore.setItemAsync('refreshToken', asyncRefreshToken);
        await AsyncStorage.removeItem('refreshToken');
      }
    }
    
    return {
      accessToken: await SecureStore.getItemAsync('accessToken'),
      refreshToken: await SecureStore.getItemAsync('refreshToken'),
    };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error loading tokens securely');
    }
    return { accessToken: null, refreshToken: null };
  }
};

export const authService = {
  async signup(name: string, email: string, password: string) {
    const response = await api.post('/auth/signup', {
      name,
      email,
      password,
      acceptedTerms: true,
    });

    const { user, accessToken, refreshToken } = response.data;

    // Store tokens securely
    await storeTokensSecurely(accessToken, refreshToken);
    // Store user data (non-sensitive) in AsyncStorage
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    // Analytics: novo cadastro
    await analyticsService.logSignUp('email');

    return { user, accessToken, refreshToken };
  },

  async login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Store tokens securely
      await storeTokensSecurely(accessToken, refreshToken);
      // Store user data (non-sensitive) in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Analytics: login realizado
      await analyticsService.logLogin('email');

      return { user, accessToken, refreshToken };
    } catch (error: any) {
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorar erro no logout do servidor
    } finally {
      // Remove tokens from secure store
      try {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      } catch (e) {
        // Ignore errors during cleanup
      }
      // Also clear AsyncStorage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  async updateProfile(name: string, avatar?: string, preferences?: any, publicProfile?: boolean) {
    const response = await api.put('/auth/profile', { name, avatar, preferences, publicProfile });
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  },

  async updatePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  async deleteAccount() {
    await api.delete('/auth/account');
    try {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } catch (e) {
      // Ignore cleanup errors
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },

  async getPublicProfile(userId: string) {
    const response = await api.get(`/auth/public/${userId}`);
    return response.data;
  },

  async loadStoredAuth() {
    // Load tokens from secure store
    const { accessToken, refreshToken } = await loadTokensSecurely();
    
    // Load user from AsyncStorage
    const userJson = await AsyncStorage.getItem('user');

    if (accessToken && refreshToken && userJson) {
      return {
        accessToken,
        refreshToken,
        user: JSON.parse(userJson) as User,
      };
    }

    return null;
  },
};