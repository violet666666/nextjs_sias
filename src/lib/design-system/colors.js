// Modern Academic Design System - Color Palette
export const colors = {
  // Primary Colors - Academic Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main brand color
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Secondary Colors - Success Green
  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Success color
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Accent Colors
  accent: {
    warning: '#f59e0b', // Amber
    error: '#ef4444',   // Red
    info: '#06b6d4',    // Cyan
    purple: '#8b5cf6',  // Purple
    orange: '#f97316',  // Orange
  },

  // Neutral Colors - Modern Grays
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Background Colors
  background: {
    light: '#ffffff',
    dark: '#0f172a',
    card: {
      light: '#ffffff',
      dark: '#1e293b',
    },
    sidebar: {
      light: '#f8fafc',
      dark: '#1e293b',
    },
  },

  // Text Colors
  text: {
    primary: {
      light: '#0f172a',
      dark: '#f8fafc',
    },
    secondary: {
      light: '#64748b',
      dark: '#94a3b8',
    },
    muted: {
      light: '#94a3b8',
      dark: '#64748b',
    },
  },

  // Border Colors
  border: {
    light: '#e2e8f0',
    dark: '#334155',
    focus: {
      light: '#3b82f6',
      dark: '#60a5fa',
    },
  },
};

// CSS Variables for easy theming
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-light': colors.primary[400],
  '--color-primary-dark': colors.primary[600],
  '--color-secondary': colors.secondary[500],
  '--color-success': colors.semantic.success,
  '--color-warning': colors.semantic.warning,
  '--color-error': colors.semantic.error,
  '--color-info': colors.semantic.info,
  '--color-background': colors.background.light,
  '--color-background-dark': colors.background.dark,
  '--color-text-primary': colors.text.primary.light,
  '--color-text-secondary': colors.text.secondary.light,
  '--color-border': colors.border.light,
};

export default colors; 