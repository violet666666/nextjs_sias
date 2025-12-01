import React from "react";

export default function StatCard({ title, value, icon, trend, trendValue, color = "blue" }) {
  const getColorClasses = () => {
    switch (color) {
      case "green":
        return "bg-green-500 dark:bg-green-600";
      case "blue":
        return "bg-blue-500 dark:bg-blue-600";
      case "purple":
        return "bg-purple-500 dark:bg-purple-600";
      case "orange":
        return "bg-orange-500 dark:bg-orange-600";
      case "red":
        return "bg-red-500 dark:bg-red-600";
      default:
        return "bg-blue-500 dark:bg-blue-600";
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-gray-500 dark:text-gray-400";
    return trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === "up" ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1">{trendValue}</span>
              <span className="ml-1">dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${getColorClasses()} text-white`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
} 