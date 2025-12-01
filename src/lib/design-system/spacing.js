// Modern Academic Design System - Spacing
export const spacing = {
  // Base spacing unit (4px)
  base: 4,

  // Spacing scale (4px increments)
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',

  // Component-specific spacing
  component: {
    // Card spacing
    card: {
      padding: '24px',
      margin: '16px',
      gap: '16px',
      borderRadius: '12px',
    },

    // Button spacing
    button: {
      padding: {
        sm: '8px 16px',
        md: '12px 24px',
        lg: '16px 32px',
      },
      gap: '8px',
      borderRadius: '8px',
    },

    // Form spacing
    form: {
      gap: '16px',
      fieldGap: '8px',
      sectionGap: '24px',
    },

    // Layout spacing
    layout: {
      pagePadding: '24px',
      sectionGap: '32px',
      contentGap: '16px',
    },

    // Navigation spacing
    navigation: {
      itemGap: '8px',
      sectionGap: '24px',
      padding: '16px',
    },

    // Table spacing
    table: {
      cellPadding: '12px 16px',
      rowGap: '1px',
      headerPadding: '16px',
    },

    // Modal spacing
    modal: {
      padding: '24px',
      gap: '16px',
      headerGap: '16px',
    },

    // Sidebar spacing
    sidebar: {
      padding: '24px',
      itemGap: '8px',
      sectionGap: '32px',
    },

    // Dashboard spacing
    dashboard: {
      cardGap: '24px',
      sectionGap: '32px',
      statGap: '16px',
    },
  },

  // Responsive spacing
  responsive: {
    sm: {
      pagePadding: '16px',
      cardGap: '16px',
      sectionGap: '24px',
    },
    md: {
      pagePadding: '24px',
      cardGap: '24px',
      sectionGap: '32px',
    },
    lg: {
      pagePadding: '32px',
      cardGap: '32px',
      sectionGap: '40px',
    },
    xl: {
      pagePadding: '40px',
      cardGap: '40px',
      sectionGap: '48px',
    },
  },
};

// CSS Variables for spacing
export const spacingVariables = {
  '--spacing-xs': spacing[1],
  '--spacing-sm': spacing[2],
  '--spacing-md': spacing[4],
  '--spacing-lg': spacing[6],
  '--spacing-xl': spacing[8],
  '--spacing-2xl': spacing[12],
  '--spacing-3xl': spacing[16],
  '--spacing-4xl': spacing[24],
  '--spacing-5xl': spacing[32],
};

export default spacing; 