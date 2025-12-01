'use client';
import { useState, useEffect } from 'react';
import { X, Menu, ChevronDown } from 'lucide-react';

const MobileMenu = ({
  items = [],
  isOpen = false,
  onToggle = () => {},
  className = '',
  ...props
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleItem = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderMenuItem = (item, index) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id || index);

    return (
      <div key={item.id || index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        {hasChildren ? (
          <div>
            <button
              onClick={() => toggleItem(item.id || index)}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                {item.icon && (
                  <span className="text-gray-500 dark:text-gray-400">
                    {item.icon}
                  </span>
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="bg-gray-50 dark:bg-gray-900">
                {item.children.map((child, childIndex) => (
                  <a
                    key={child.id || childIndex}
                    href={child.href}
                    className="block px-8 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                    onClick={() => onToggle()}
                  >
                    {child.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <a
            href={item.href}
            className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            onClick={() => onToggle()}
          >
            {item.icon && (
              <span className="text-gray-500 dark:text-gray-400">
                {item.icon}
              </span>
            )}
            <span className="font-medium">{item.label}</span>
          </a>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-xl z-50
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Menu
          </h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map(renderMenuItem)}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-xs text-gray-400 mt-8">© 2024 SIAS</p>
        </div>
      </div>
    </>
  );
};

export default MobileMenu; 