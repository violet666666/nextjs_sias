import React from 'react';

export default function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="flex gap-2 border-b border-gray-200 dark:border-slate-700 mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200
            ${activeTab === tab.key
              ? 'bg-white dark:bg-slate-900 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 shadow'
              : 'text-gray-500 dark:text-slate-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800'}
          `}
          style={{ borderBottomWidth: activeTab === tab.key ? 2 : 0 }}
        >
          {tab.icon && <span className="text-lg">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </nav>
  );
} 