// mobile/src/config/env.ts

// API URLs - can be overridden via environment variables
const DEV_API_URL = process.env.EXPO_PUBLIC_LOCAL_API_URL || process.env.EXPO_PUBLIC_DEV_API_URL || 'http://localhost:3000/api';
const PROD_API_URL = process.env.EXPO_PUBLIC_PROD_API_URL || 'https://guia-aventureiro-backend.onrender.com/api';
const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV || 'local').toLowerCase();

// Google Maps Key - NEVER hardcoded, read from .env.local
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

if (!GOOGLE_MAPS_KEY) {
  console.warn('⚠️  EXPO_PUBLIC_GOOGLE_MAPS_KEY not set. Maps will not work. Check .env.local');
}

const ENV = {
  local: {
    apiUrl: DEV_API_URL,
    googleMapsKey: GOOGLE_MAPS_KEY,
  },
  production: {
    apiUrl: PROD_API_URL,
    googleMapsKey: GOOGLE_MAPS_KEY,
  },
};

const getEnvVars = () => {
  // Seleção explícita de ambiente para facilitar Expo Go local e validação de produção
  if (APP_ENV === 'production') {
    return ENV.production;
  }
  return ENV.local;
};

const env = getEnvVars();
export const apiUrl = env.apiUrl;
export const appEnv = APP_ENV === 'production' ? 'production' : 'local';
export const isProductionEnv = appEnv === 'production';
export default env;
