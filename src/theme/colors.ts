/**
 * Colors - Paleta de cores centralizada
 * Facilita manutenção e temas (futuro: dark mode)
 */

export const colors = {
  // Primárias
  primary: '#007AFF',
  primaryDark: '#0062CC',
  primaryLight: '#4DA3FF',

  // Secundárias
  secondary: '#5856D6',
  secondaryDark: '#4340AA',
  secondaryLight: '#7C7AE8',

  // Sucessos
  success: '#34C759',
  successDark: '#2AA447',
  successLight: '#5DD477',

  // Avisos
  warning: '#FF9500',
  warningDark: '#CC7700',
  warningLight: '#FFB040',

  // Erros
  error: '#FF3B30',
  errorDark: '#CC2F26',
  errorLight: '#FF6259',

  // Info
  info: '#5AC8FA',
  infoDark: '#48A0C8',
  infoLight: '#7FD4FB',

  // Neutros (claros)
  white: '#FFFFFF',
  offWhite: '#F9FAFB',
  gray50: '#F7F8FA',
  gray100: '#E5E7EB',
  gray200: '#D1D5DB',
  gray300: '#9CA3AF',
  gray400: '#6B7280',

  // Neutros (escuros)
  gray500: '#4B5563',
  gray600: '#374151',
  gray700: '#1F2937',
  gray800: '#111827',
  black: '#000000',

  // Backgrounds
  background: '#F9FAFB',
  backgroundDark: '#E5E7EB',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Textos
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    disabled: '#D1D5DB',
  },

  // Bordas
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Estados
  disabled: '#D1D5DB',
  placeholder: '#9CA3AF',

  // Social
  facebook: '#1877F2',
  google: '#DB4437',
  apple: '#000000',

  // Categorias de viagem (para tags)
  categories: {
    aventura: '#FF6B35',
    cultural: '#9B59B6',
    gastronomia: '#E74C3C',
    praia: '#3498DB',
    montanha: '#16A085',
    urbano: '#95A5A6',
    rural: '#27AE60',
    ecoturismo: '#2ECC71',
  },

  // Status de roteiro
  status: {
    planejamento: '#F59E0B',
    confirmado: '#3B82F6',
    emAndamento: '#10B981',
    concluido: '#6B7280',
    cancelado: '#EF4444',
  },
};

export type ColorKey = keyof typeof colors;
