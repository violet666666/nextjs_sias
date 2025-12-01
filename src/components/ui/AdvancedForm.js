'use client';
import { useState, useEffect, forwardRef } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';

// Form Validation Hook
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    if (!validationSchema[name]) return '';
    
    const fieldValidation = validationSchema[name];
    for (const rule of fieldValidation) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    setTouched(Object.keys(validationSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    if (validateForm()) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors
  };
};

// Advanced Input Component
export const AdvancedInput = forwardRef(({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  leftIcon,
  rightIcon,
  helperText,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = error && touched;

  const inputClasses = `
    w-full px-4 py-3 text-sm
    bg-white dark:bg-gray-800
    border rounded-lg
    placeholder-gray-500 dark:placeholder-gray-400
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || type === 'password' ? 'pr-10' : ''}
    ${hasError
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : isFocused
      ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
      : 'border-gray-300 dark:border-gray-600'
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          type={inputType}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => {
            onBlur(name);
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-gray-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {(hasError || helperText) && (
        <div className="flex items-center space-x-1">
          {hasError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

AdvancedInput.displayName = 'AdvancedInput';

// Advanced Select Component
export const AdvancedSelect = forwardRef(({
  name,
  label,
  options = [],
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = error && touched;

  const selectClasses = `
    w-full px-4 py-3 text-sm
    bg-white dark:bg-gray-800
    border rounded-lg
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    appearance-none
    pr-10
    ${hasError
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : isFocused
      ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
      : 'border-gray-300 dark:border-gray-600'
    }
    ${className}
  `.trim();

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => {
            onBlur(name);
            setIsFocused(false);
          }}
          onFocus={() => setIsFocused(true)}
          disabled={disabled}
          className={selectClasses}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {hasError && (
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
});

AdvancedSelect.displayName = 'AdvancedSelect';

// Advanced Textarea Component
export const AdvancedTextarea = forwardRef(({
  name,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  className = '',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = error && touched;

  const textareaClasses = `
    w-full px-4 py-3 text-sm
    bg-white dark:bg-gray-800
    border rounded-lg
    placeholder-gray-500 dark:placeholder-gray-400
    text-gray-900 dark:text-gray-100
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    resize-vertical
    ${hasError
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : isFocused
      ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
      : 'border-gray-300 dark:border-gray-600'
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => {
          onBlur(name);
          setIsFocused(false);
        }}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
        {...props}
      />
      
      <div className="flex items-center justify-between">
        {hasError && (
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        {showCharacterCount && maxLength && (
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

AdvancedTextarea.displayName = 'AdvancedTextarea';

// Form Component
export const Form = ({ children, onSubmit, className = '', ...props }) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {children}
    </form>
  );
};

// Form Actions Component
export const FormActions = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Validation Rules
export const validationRules = {
  required: (value) => (!value || value.trim() === '') ? 'This field is required' : '',
  email: (value) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
  },
  minLength: (min) => (value) => {
    if (!value) return '';
    return value.length < min ? `Must be at least ${min} characters` : '';
  },
  maxLength: (max) => (value) => {
    if (!value) return '';
    return value.length > max ? `Must be no more than ${max} characters` : '';
  },
  phone: (value) => {
    if (!value) return '';
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return !phoneRegex.test(value.replace(/\s/g, '')) ? 'Please enter a valid phone number' : '';
  },
  password: (value) => {
    if (!value) return '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (value.length < 8) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';
    
    return '';
  },
  confirmPassword: (password) => (value) => {
    if (!value) return '';
    return value !== password ? 'Passwords do not match' : '';
  },
  url: (value) => {
    if (!value) return '';
    try {
      new URL(value);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  }
}; 