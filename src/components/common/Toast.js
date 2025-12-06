import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000, icon }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getToastStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-600 dark:bg-red-500 text-white";
      case "warning":
        return "bg-yellow-600 dark:bg-yellow-500 text-white";
      case "info":
        return "bg-blue-600 dark:bg-blue-500 text-white";
      case "success":
      default:
        return "bg-green-600 dark:bg-green-500 text-white";
    }
  };

  return (
    <div className={`toast ${type} ${getToastStyles()}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{message}</span>
        </div>
        <button
          className="ml-4 text-lg font-bold text-gray-400 hover:text-gray-700 focus:outline-none"
          aria-label="Tutup notifikasi"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
} 