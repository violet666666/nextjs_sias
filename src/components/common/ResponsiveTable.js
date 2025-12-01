import React from 'react';

export default function ResponsiveTable({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </table>
    </div>
  );
} 