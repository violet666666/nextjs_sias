"use client";
import { forwardRef } from 'react';

const Badge = forwardRef(({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  className = '',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium
    transition-colors duration-200
  `;

  // Variant styles
  const variantStyles = {
    default: `
      bg-gray-100 text-gray-800
      dark:bg-gray-700 dark:text-gray-200
    `,
    primary: `
      bg-blue-100 text-blue-800
      dark:bg-blue-900/30 dark:text-blue-300
    `,
    secondary: `
      bg-gray-100 text-gray-800
      dark:bg-gray-700 dark:text-gray-200
    `,
    success: `
      bg-green-100 text-green-800
      dark:bg-green-900/30 dark:text-green-300
    `,
    warning: `
      bg-yellow-100 text-yellow-800
      dark:bg-yellow-900/30 dark:text-yellow-300
    `,
    danger: `
      bg-red-100 text-red-800
      dark:bg-red-900/30 dark:text-red-300
    `,
    info: `
      bg-cyan-100 text-cyan-800
      dark:bg-cyan-900/30 dark:text-cyan-300
    `,
    purple: `
      bg-purple-100 text-purple-800
      dark:bg-purple-900/30 dark:text-purple-300
    `,
    orange: `
      bg-orange-100 text-orange-800
      dark:bg-orange-900/30 dark:text-orange-300
    `,
  };

  // Size styles
  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
    xl: 'px-4 py-2 text-base',
  };

  // Border radius styles
  const radiusStyles = rounded ? 'rounded-full' : 'rounded-md';

  const badgeStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${radiusStyles}
    ${className}
  `.trim();

  return (
    <span
      ref={ref}
      className={badgeStyles}
      {...props}
    >
      {children}
    </span>
  );
});

// Status Badge Component
const StatusBadge = forwardRef(({
  status,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const statusConfig = {
    active: {
      variant: 'success',
      text: 'Aktif',
      icon: '●',
    },
    inactive: {
      variant: 'danger',
      text: 'Nonaktif',
      icon: '●',
    },
    pending: {
      variant: 'warning',
      text: 'Menunggu',
      icon: '●',
    },
    completed: {
      variant: 'success',
      text: 'Selesai',
      icon: '✓',
    },
    submitted: {
      variant: 'info',
      text: 'Dikumpulkan',
      icon: '📤',
    },
    graded: {
      variant: 'success',
      text: 'Dinilai',
      icon: '📊',
    },
    overdue: {
      variant: 'danger',
      text: 'Terlambat',
      icon: '⏰',
    },
    present: {
      variant: 'success',
      text: 'Hadir',
      icon: '✓',
    },
    absent: {
      variant: 'danger',
      text: 'Tidak Hadir',
      icon: '✗',
    },
    sick: {
      variant: 'warning',
      text: 'Sakit',
      icon: '🏥',
    },
    permission: {
      variant: 'info',
      text: 'Izin',
      icon: '📝',
    },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      size={size}
      className={`flex items-center gap-1 ${className}`}
      {...props}
    >
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </Badge>
  );
});

// Grade Badge Component
const GradeBadge = forwardRef(({
  grade,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const getGradeConfig = (grade) => {
    const numGrade = parseFloat(grade);
    
    if (numGrade >= 90) return { variant: 'success', text: 'A' };
    if (numGrade >= 80) return { variant: 'success', text: 'B' };
    if (numGrade >= 70) return { variant: 'warning', text: 'C' };
    if (numGrade >= 60) return { variant: 'warning', text: 'D' };
    return { variant: 'danger', text: 'E' };
  };

  const config = getGradeConfig(grade);

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      size={size}
      className={`font-bold ${className}`}
      {...props}
    >
      {config.text}
    </Badge>
  );
});

// Priority Badge Component
const PriorityBadge = forwardRef(({
  priority,
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const priorityConfig = {
    low: {
      variant: 'secondary',
      text: 'Rendah',
      icon: '⬇️',
    },
    medium: {
      variant: 'warning',
      text: 'Sedang',
      icon: '➡️',
    },
    high: {
      variant: 'danger',
      text: 'Tinggi',
      icon: '⬆️',
    },
    urgent: {
      variant: 'danger',
      text: 'Urgent',
      icon: '🚨',
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <Badge
      ref={ref}
      variant={config.variant}
      size={size}
      className={`flex items-center gap-1 ${className}`}
      {...props}
    >
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </Badge>
  );
});

Badge.displayName = 'Badge';
StatusBadge.displayName = 'StatusBadge';
GradeBadge.displayName = 'GradeBadge';
PriorityBadge.displayName = 'PriorityBadge';

Badge.Status = StatusBadge;
Badge.Grade = GradeBadge;
Badge.Priority = PriorityBadge;

export default Badge; 