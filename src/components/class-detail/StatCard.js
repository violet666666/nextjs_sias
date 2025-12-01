import React from 'react';

export default function StatCard({ icon, label, value, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    pink: 'bg-pink-100 text-pink-700',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl shadow-md ${colorMap[color] || colorMap.blue} min-w-[160px]`}>
      <div className="text-3xl">
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-xs font-medium opacity-80 mt-1">{label}</div>
      </div>
    </div>
  );
} 