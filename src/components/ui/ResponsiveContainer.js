'use client';
import { forwardRef } from 'react';

const ResponsiveContainer = forwardRef(({
  children,
  maxWidth = '7xl',
  padding = 'default',
  className = '',
  ...props
}, ref) => {
  const maxWidthClasses = {
    'xs': 'max-w-xs',
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  const paddingClasses = {
    'none': '',
    'xs': 'px-2 py-2',
    'sm': 'px-4 py-4',
    'default': 'px-4 sm:px-6 lg:px-8 py-6',
    'lg': 'px-6 sm:px-8 lg:px-12 py-8',
    'xl': 'px-8 sm:px-12 lg:px-16 py-12',
  };

  const containerClasses = `
    mx-auto
    ${maxWidthClasses[maxWidth]}
    ${paddingClasses[padding]}
    ${className}
  `.trim();

  return (
    <div
      ref={ref}
      className={containerClasses}
      {...props}
    >
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

export default ResponsiveContainer; 