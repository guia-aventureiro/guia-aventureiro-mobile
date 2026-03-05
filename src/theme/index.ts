/**
 * Theme - Barrel export
 * Centraliza todos os tokens de design
 */

export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { shadows, componentShadows } from './shadows';

/**
 * Theme completo (para uso com Context API)
 */
export const theme = {
  colors: require('./colors').colors,
  spacing: require('./spacing').spacing,
  typography: require('./typography').typography,
  shadows: require('./shadows').shadows,
  componentShadows: require('./shadows').componentShadows,
};

export type Theme = typeof theme;
