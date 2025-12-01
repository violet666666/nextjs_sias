"use client";
import { forwardRef } from 'react';
import { colors } from '@/lib/design-system/colors';

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `;

  // Variant styles
  const variantStyles = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      shadow-sm hover:shadow-md
    `,
    secondary: `
      bg-gray-100 text-gray-900
      hover:bg-gray-200
      focus:ring-gray-500
      dark:bg-gray-700 dark:text-gray-100
      dark:hover:bg-gray-600
    `,
    outline: `
      border-2 border-blue-600 text-blue-600
      hover:bg-blue-50
      focus:ring-blue-500
      dark:border-blue-400 dark:text-blue-400
      dark:hover:bg-blue-900/20
    `,
    ghost: `
      text-gray-700 hover:bg-gray-100
      focus:ring-gray-500
      dark:text-gray-300 dark:hover:bg-gray-700
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      focus:ring-red-500
      shadow-sm hover:shadow-md
    `,
    success: `
      bg-green-600 text-white
      hover:bg-green-700
      focus:ring-green-500
      shadow-sm hover:shadow-md
    `,
    warning: `
      bg-yellow-600 text-white
      hover:bg-yellow-700
      focus:ring-yellow-500
      shadow-sm hover:shadow-md
    `,
  };

  // Size styles
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Icon styles
  const iconStyles = {
    left: 'flex-row',
    right: 'flex-row-reverse',
  };

  // Loading styles
  const loadingStyles = loading ? 'cursor-wait' : '';

  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles}
    ${iconStyles[iconPosition]}
    ${loadingStyles}
    ${className}
  `.trim();

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={buttonStyles}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 