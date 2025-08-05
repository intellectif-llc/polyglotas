/**
 * Polyglotas Brand Color System
 * 
 * This file defines the official brand colors for Polyglotas, derived from the 
 * original gradient (purple-400 to pink-600). These colors should be used 
 * consistently across the application for branding elements.
 */

export const brandColors = {
  // Primary brand colors
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff', 
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc', // Original gradient start
    500: '#a855f7', // Main brand color
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Secondary brand colors (pink accent)
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899', // Main secondary color
    600: '#db2777', // Original gradient end
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  
  // Supporting accent color
  accent: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main accent color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Neutral colors for balance
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
} as const;

// Gradient definitions
export const brandGradients = {
  primary: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
  hero: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #be185d 100%)',
  subtle: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
  accent: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
} as const;

// Utility functions for consistent color usage
export const getBrandColor = (color: keyof typeof brandColors, shade: keyof typeof brandColors.primary = 500) => {
  return brandColors[color][shade];
};

export const getBrandGradient = (gradient: keyof typeof brandGradients) => {
  return brandGradients[gradient];
};

// CSS custom properties for dynamic theming
export const brandCSSVariables = {
  '--brand-primary': brandColors.primary[500],
  '--brand-secondary': brandColors.secondary[500],
  '--brand-accent': brandColors.accent[500],
  '--brand-gradient': brandGradients.primary,
  '--brand-hero-gradient': brandGradients.hero,
} as const;