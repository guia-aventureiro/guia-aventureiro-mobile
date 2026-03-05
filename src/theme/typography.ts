/**
 * Typography - Sistema de tipografia centralizado
 * Font family + tamanhos + pesos
 */

export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    semibold: 'System',
  },

  // Font sizes
  fontSize: {
    '2xs': 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Heading styles (pré-configurados)
  heading: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 44,
    },
    h2: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 38,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },

  // Body styles (pré-configurados)
  body: {
    large: {
      fontSize: 18,
      fontWeight: '400' as const,
      lineHeight: 28,
    },
    base: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    small: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
  },

  // Caption styles
  caption: {
    large: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    base: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    small: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },

  // Button styles
  button: {
    large: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    medium: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    small: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
  },
};

export type TypographyKey = keyof typeof typography;
