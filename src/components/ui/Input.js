"use client";
import { forwardRef, useState } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Base styles
  const baseStyles = `
    block w-full
    px-4 py-3
    text-sm
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    rounded-lg
    placeholder-gray-500 dark:placeholder-gray-400
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Error styles
  const errorStyles = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

  // Focus styles
  const focusStyles = isFocused ? 'ring-2 ring-blue-500 border-blue-500' : '';

  // Icon styles
  const iconStyles = (leftIcon || rightIcon) ? 'pl-10' : '';
  const rightIconStyles = rightIcon ? 'pr-10' : '';

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  const inputStyles = `
    ${baseStyles}
    ${errorStyles}
    ${focusStyles}
    ${iconStyles}
    ${rightIconStyles}
    ${widthStyles}
    ${className}
  `.trim();

  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          className={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

// Textarea Component
const Textarea = forwardRef(({
  label,
  error,
  helperText,
  rows = 4,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Base styles
  const baseStyles = `
    block w-full
    px-4 py-3
    text-sm
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    rounded-lg
    placeholder-gray-500 dark:placeholder-gray-400
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    resize-vertical
  `;

  // Error styles
  const errorStyles = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

  // Focus styles
  const focusStyles = isFocused ? 'ring-2 ring-blue-500 border-blue-500' : '';

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  const textareaStyles = `
    ${baseStyles}
    ${errorStyles}
    ${focusStyles}
    ${widthStyles}
    ${className}
  `.trim();

  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={textareaStyles}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

// Select Component
const Select = forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Base styles
  const baseStyles = `
    block w-full
    px-4 py-3
    text-sm
    bg-white dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    rounded-lg
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    appearance-none
    bg-no-repeat bg-right
    pr-10
  `;

  // Error styles
  const errorStyles = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';

  // Focus styles
  const focusStyles = isFocused ? 'ring-2 ring-blue-500 border-blue-500' : '';

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  const selectStyles = `
    ${baseStyles}
    ${errorStyles}
    ${focusStyles}
    ${widthStyles}
    ${className}
  `.trim();

  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={selectStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1.5em 1.5em',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
Textarea.displayName = 'Textarea';
Select.displayName = 'Select';

Input.Textarea = Textarea;
Input.Select = Select;

export default Input; 