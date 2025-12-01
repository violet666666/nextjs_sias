"use client";
import { forwardRef } from 'react';

const Table = forwardRef(({
  children,
  striped = false,
  hover = true,
  bordered = false,
  responsive = true,
  className = '',
  ...props
}, ref) => {
  const tableStyles = `
    w-full
    text-sm text-left
    ${className}
  `.trim();

  const wrapperStyles = responsive ? 'overflow-x-auto' : '';

  return (
    <div className={wrapperStyles}>
      <table
        ref={ref}
        className={tableStyles}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

// Table Header Component
const TableHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <thead
      ref={ref}
      className={`bg-gray-50 dark:bg-gray-700 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
});

// Table Body Component
const TableBody = forwardRef(({
  children,
  striped = false,
  className = '',
  ...props
}, ref) => {
  const bodyStyles = striped ? 'divide-y divide-gray-200 dark:divide-gray-700' : '';

  return (
    <tbody
      ref={ref}
      className={`${bodyStyles} ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
});

// Table Row Component
const TableRow = forwardRef(({
  children,
  hover = true,
  selected = false,
  className = '',
  ...props
}, ref) => {
  const rowStyles = `
    ${hover ? 'hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
    ${selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
    transition-colors duration-200
    ${className}
  `.trim();

  return (
    <tr
      ref={ref}
      className={rowStyles}
      {...props}
    >
      {children}
    </tr>
  );
});

// Table Header Cell Component
const TableHeaderCell = forwardRef(({
  children,
  sortable = false,
  sortDirection = null,
  onSort,
  className = '',
  ...props
}, ref) => {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  const headerStyles = `
    px-6 py-3
    text-xs font-medium text-gray-500 dark:text-gray-400
    uppercase tracking-wider
    ${sortable ? 'cursor-pointer select-none' : ''}
    ${className}
  `.trim();

  return (
    <th
      ref={ref}
      className={headerStyles}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={`w-3 h-3 ${
                sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            <svg
              className={`w-3 h-3 ${
                sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
});

// Table Cell Component
const TableCell = forwardRef(({
  children,
  align = 'left',
  className = '',
  ...props
}, ref) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const cellStyles = `
    px-6 py-4
    whitespace-nowrap
    text-sm text-gray-900 dark:text-gray-100
    ${alignStyles[align]}
    ${className}
  `.trim();

  return (
    <td
      ref={ref}
      className={cellStyles}
      {...props}
    >
      {children}
    </td>
  );
});

// Table Empty State Component
const TableEmpty = forwardRef(({
  message = 'No data available',
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <tr ref={ref} {...props}>
      <td
        colSpan="100%"
        className={`px-6 py-12 text-center ${className}`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {icon && (
            <div className="text-gray-400 dark:text-gray-500 text-4xl">
              {icon}
            </div>
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {message}
          </p>
        </div>
      </td>
    </tr>
  );
});

// Table Loading State Component
const TableLoading = forwardRef(({
  columns = 5,
  rows = 3,
  className = '',
  ...props
}, ref) => {
  return (
    <tbody ref={ref} {...props}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={className}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
});

Table.displayName = 'Table';
TableHeader.displayName = 'TableHeader';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHeaderCell.displayName = 'TableHeaderCell';
TableCell.displayName = 'TableCell';
TableEmpty.displayName = 'TableEmpty';
TableLoading.displayName = 'TableLoading';

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;
Table.Empty = TableEmpty;
Table.Loading = TableLoading;

export default Table; 