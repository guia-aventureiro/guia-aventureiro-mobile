/**
 * Shadows - Sombras consistentes para elevation
 * iOS e Android têm diferentes sistemas de sombra
 */

import { Platform } from 'react-native';

/**
 * Gera sombra para iOS
 */
const iosShadow = (elevation: number) => {
  const shadowOpacity = elevation * 0.04;
  const shadowRadius = elevation * 0.8;
  const shadowOffset = {
    width: 0,
    height: elevation * 0.5,
  };

  return {
    shadowColor: '#000000',
    shadowOffset,
    shadowOpacity,
    shadowRadius,
  };
};

/**
 * Gera sombra para Android
 */
const androidShadow = (elevation: number) => ({
  elevation,
});

/**
 * Gera sombra cross-platform
 */
const createShadow = (elevation: number) => {
  if (Platform.OS === 'ios') {
    return iosShadow(elevation);
  }
  return androidShadow(elevation);
};

export const shadows = {
  none: createShadow(0),
  sm: createShadow(2),
  base: createShadow(4),
  md: createShadow(6),
  lg: createShadow(8),
  xl: createShadow(12),
  '2xl': createShadow(16),
  '3xl': createShadow(24),
};

/**
 * Sombras customizadas para componentes específicos
 */
export const componentShadows = {
  card: shadows.base,
  button: shadows.sm,
  fab: shadows.lg,
  modal: shadows['2xl'],
  dropdown: shadows.md,
  header: shadows.sm,
  bottomSheet: shadows['3xl'],
};

export type ShadowKey = keyof typeof shadows;
