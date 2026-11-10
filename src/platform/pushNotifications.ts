// mobile/src/platform/pushNotifications.ts
// Push notifications — versão nativa (expo-notifications + expo-device).
// No build web, o bundler substitui por pushNotifications.web.ts (no-op).
export { default } from '../services/pushNotificationService';
export * from '../services/pushNotificationService';
