"use client";
import { forwardRef } from 'react';

const Card = forwardRef(({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'md',
  border = false,
  hover = false,
  className = '',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = `
    bg-white dark:bg-gray-800
    rounded-xl
    transition-all duration-200 ease-in-out
  `;

  // Variant styles
  const variantStyles = {
    default: '',
    elevated: 'shadow-lg',
    outlined: 'border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent',
  };

  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Shadow styles
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  // Border styles
  const borderStyles = border ? 'border border-gray-200 dark:border-gray-700' : '';

  // Hover styles
  const hoverStyles = hover ? 'hover:shadow-lg hover:-translate-y-1' : '';

  const cardStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${shadowStyles[shadow]}
    ${borderStyles}
    ${hoverStyles}
    ${className}
  `.trim();

  return (
    <div
      ref={ref}
      className={cardStyles}
      {...props}
    >
      {children}
    </div>
  );
});

// Card Header Component
const CardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center justify-between mb-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

// Card Title Component
const CardTitle = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <h3
      ref={ref}
      className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
});

// Card Subtitle Component
const CardSubtitle = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

// Card Content Component
const CardContent = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`space-y-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

// Card Footer Component
const CardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardSubtitle.displayName = 'CardSubtitle';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 