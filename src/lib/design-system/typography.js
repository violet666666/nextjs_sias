// Modern Academic Design System - Typography
export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Consolas',
      'Monaco',
      'Andale Mono',
      'Ubuntu Mono',
      'monospace'
    ],
  },

  // Font Sizes - Modern Scale
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles for Academic Context
  textStyles: {
    // Headings
    h1: {
      fontSize: '2.25rem',
      lineHeight: '2.5rem',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h5: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h6: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },

    // Body Text
    body: {
      fontSize: '1rem',
      lineHeight: '1.625rem',
      fontWeight: '400',
    },
    bodyLarge: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
    },

    // UI Text
    label: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '400',
    },
    button: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },

    // Academic Specific
    grade: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    score: {
      fontSize: '2rem',
      lineHeight: '2.5rem',
      fontWeight: '800',
      letterSpacing: '-0.05em',
    },
    subject: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
  },
};

// CSS Classes for Typography
export const typographyClasses = {
  // Headings
  'text-h1': 'text-4xl font-bold leading-10 tracking-tight',
  'text-h2': 'text-3xl font-semibold leading-9 tracking-tight',
  'text-h3': 'text-2xl font-semibold leading-8 tracking-tight',
  'text-h4': 'text-xl font-semibold leading-7 tracking-tight',
  'text-h5': 'text-lg font-semibold leading-7 tracking-tight',
  'text-h6': 'text-base font-semibold leading-6 tracking-tight',

  // Body Text
  'text-body': 'text-base leading-relaxed',
  'text-body-large': 'text-lg leading-7',
  'text-body-small': 'text-sm leading-5',

  // UI Text
  'text-label': 'text-sm font-medium leading-5 tracking-wide',
  'text-caption': 'text-xs leading-4',
  'text-button': 'text-sm font-medium leading-5 tracking-wide',

  // Academic Specific
  'text-grade': 'text-2xl font-bold leading-8 tracking-tight',
  'text-score': 'text-3xl font-extrabold leading-10 tracking-tighter',
  'text-subject': 'text-lg font-semibold leading-7 tracking-tight',
};

export default typography; 