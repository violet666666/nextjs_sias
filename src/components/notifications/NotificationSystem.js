'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertTriangle, 
  Info, 
  Star,
  MessageSquare,
  FileText,
  Calendar,
  Award,
  Settings
} from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification Provider
export const NotificationProvider = ({ children, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socket, setSocket] = useState(null);
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    sound: true,
    desktop: true
  });

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      newSocket.emit('join_notifications', { userId: user._id || user.id });
    });

    newSocket.on('notification:new', (notification) => {
      addNotification(notification);
      
      // Show desktop notification if enabled
      if (preferences.desktop && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }

      // Play sound if enabled
      if (preferences.sound) {
        playNotificationSound();
      }
    });

    setSocket(newSocket);

    // Load existing notifications
    fetchNotifications();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      newSocket.disconnect();
    };
  }, [user, preferences]);

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications');

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetchWithAuth(`/api/notifications/${notificationId}/read`);

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/read-all');

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetchWithAuth(`/api/notifications/${notificationId}`);

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notif => notif._id !== notificationId)
        );
        setUnreadCount(prev => {
          const deletedNotif = notifications.find(n => n._id === notificationId);
          return deletedNotif && !deletedNotif.read ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {
      // Fallback to system beep
      console.log('\u0007');
    });
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetchWithAuth('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        setPreferences(newPreferences);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    showNotifications,
    setShowNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    preferences,
    updatePreferences
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell = () => {
  const { unreadCount, showNotifications, setShowNotifications } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && <NotificationPanel />}
    </div>
  );
};

// Notification Panel Component
const NotificationPanel = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    setShowNotifications 
  } = useNotifications();

  const getNotificationIcon = (type) => {
    const icons = {
      'success': Check,
      'warning': AlertTriangle,
      'error': X,
      'info': Info,
      'message': MessageSquare,
      'task': FileText,
      'event': Calendar,
      'achievement': Award,
      'default': Bell
    };
    return icons[type] || icons.default;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'success': 'text-green-600 bg-green-100 dark:bg-green-900/20',
      'warning': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      'error': 'text-red-600 bg-red-100 dark:bg-red-900/20',
      'info': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      'message': 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      'task': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
      'event': 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
      'achievement': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      'default': 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    };
    return colors[type] || colors.default;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowNotifications(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const colorClasses = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Delete"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => window.location.href = '/cpanel/notifications'}
            className="w-full text-sm text-blue-600 hover:text-blue-800 text-center"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

// Notification Settings Component
export const NotificationSettings = () => {
  const { preferences, updatePreferences } = useNotifications();

  const handleToggle = (key) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    updatePreferences(newPreferences);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Settings
        </h2>
      </div>

      <div className="space-y-4">
        {Object.entries(preferences).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                {key} notifications
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Receive notifications via {key}
              </p>
            </div>
            <button
              onClick={() => handleToggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Toast Notification Component
export const ToastNotification = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const Icon = getNotificationIcon(notification.type);
  const colorClasses = getNotificationColor(notification.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-full ${colorClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => {
            markAsRead(notification._id);
            onClose();
          }}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// Helper functions
const getNotificationIcon = (type) => {
  const icons = {
    'success': Check,
    'warning': AlertTriangle,
    'error': X,
    'info': Info,
    'message': MessageSquare,
    'task': FileText,
    'event': Calendar,
    'achievement': Award,
    'default': Bell
  };
  return icons[type] || icons.default;
};

const getNotificationColor = (type) => {
  const colors = {
    'success': 'text-green-600 bg-green-100 dark:bg-green-900/20',
    'warning': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
    'error': 'text-red-600 bg-red-100 dark:bg-red-900/20',
    'info': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    'message': 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
    'task': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
    'event': 'text-pink-600 bg-pink-100 dark:bg-pink-900/20',
    'achievement': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
    'default': 'text-gray-600 bg-gray-100 dark:bg-gray-700'
  };
  return colors[type] || colors.default;
};

export default NotificationBell; 