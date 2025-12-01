'use client';
import { forwardRef } from 'react';

// Base Skeleton Component
const Skeleton = forwardRef(({
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

// Skeleton Text
export const SkeletonText = forwardRef(({
  lines = 1,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
});

SkeletonText.displayName = 'SkeletonText';

// Skeleton Card
export const SkeletonCard = forwardRef(({
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

// Skeleton Table
export const SkeletonTable = forwardRef(({
  rows = 5,
  columns = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      {...props}
    >
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SkeletonTable.displayName = 'SkeletonTable';

// Skeleton List
export const SkeletonList = forwardRef(({
  items = 5,
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`space-y-3 ${className}`} {...props}>
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="w-20 h-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
});

SkeletonList.displayName = 'SkeletonList';

// Skeleton Dashboard
export const SkeletonDashboard = forwardRef(({
  className = '',
  ...props
}, ref) => {
  return (
    <div ref={ref} className={`space-y-6 ${className}`} {...props}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <SkeletonList items={4} />
      </div>
    </div>
  );
});

SkeletonDashboard.displayName = 'SkeletonDashboard';

// Skeleton Form
export const SkeletonForm = forwardRef(({
  fields = 4,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      {...props}
    >
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex space-x-3 mt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
});

SkeletonForm.displayName = 'SkeletonForm';

// Skeleton Profile
export const SkeletonProfile = forwardRef(({
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      {...props}
    >
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
});

SkeletonProfile.displayName = 'SkeletonProfile';

export default Skeleton; 