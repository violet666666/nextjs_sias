'use client';
import { forwardRef } from 'react';

const Grid = forwardRef(({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 'default',
  className = '',
  ...props
}, ref) => {
  const gapClasses = {
    'none': '',
    'xs': 'gap-2',
    'sm': 'gap-3',
    'default': 'gap-4 sm:gap-6',
    'lg': 'gap-6 sm:gap-8',
    'xl': 'gap-8 sm:gap-12',
  };

  const generateColClasses = () => {
    const classes = [];
    
    if (cols.xs) classes.push(`grid-cols-${cols.xs}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return classes.join(' ');
  };

  const gridClasses = `
    grid
    ${generateColClasses()}
    ${gapClasses[gap]}
    ${className}
  `.trim();

  return (
    <div
      ref={ref}
      className={gridClasses}
      {...props}
    >
      {children}
    </div>
  );
});

// Grid Item Component
const GridItem = forwardRef(({
  children,
  span = { xs: 1, sm: 1, md: 1, lg: 1 },
  className = '',
  ...props
}, ref) => {
  const generateSpanClasses = () => {
    const classes = [];
    
    if (span.xs) classes.push(`col-span-${span.xs}`);
    if (span.sm) classes.push(`sm:col-span-${span.sm}`);
    if (span.md) classes.push(`md:col-span-${span.md}`);
    if (span.lg) classes.push(`lg:col-span-${span.lg}`);
    if (span.xl) classes.push(`xl:col-span-${span.xl}`);
    if (span['2xl']) classes.push(`2xl:col-span-${span['2xl']}`);
    
    return classes.join(' ');
  };

  const itemClasses = `
    ${generateSpanClasses()}
    ${className}
  `.trim();

  return (
    <div
      ref={ref}
      className={itemClasses}
      {...props}
    >
      {children}
    </div>
  );
});

GridItem.displayName = 'GridItem';
Grid.Item = GridItem;

Grid.displayName = 'Grid';

export default Grid; 