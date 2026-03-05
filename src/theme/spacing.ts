/**
 * Spacing - Sistema de espaçamento consistente
 * Baseado em múltiplos de 4
 */

export const spacing = {
  // Base (4px)
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,

  // Padding horizontal das telas
  screenHorizontal: 16,

  // Padding vertical das telas
  screenVertical: 20,

  // Espaçamento entre cards
  cardGap: 12,

  // Espaçamento interno de cards
  cardPadding: 16,

  // Espaçamento entre sections
  sectionGap: 24,

  // Bottom tab bar
  tabBarHeight: 60,

  // Header
  headerHeight: 56,

  // Bottom sheet
  bottomSheetRadius: 20,

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  // Button heights
  button: {
    small: 32,
    medium: 44,
    large: 56,
  },

  // Input heights
  input: {
    small: 36,
    medium: 44,
    large: 52,
  },

  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
    '2xl': 96,
  },

  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
  },
};

export type SpacingKey = keyof typeof spacing;
