"use client";
import { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Toast from "./Toast";
import { Bell, X, Check, AlertCircle, Info, Clock, Settings, Filter } from 'lucide-react';
import { io } from 'socket.io-client';
import Link from "next/link";
import { useSocket } from '@/hooks/useSocket';

const NotificationCenter = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [filters, setFilters] = useState({
    read: null,
    type: '',
    category: '',
    priority: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [toast, setToast] = useState({ message: "", type: "success" });
  const modalRef = useRef();
  const socketRef = useRef(null);
  const socket = useSocket();
  const notificationRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to notification server');
    });

    socketRef.current.on('notification:new', (notification) => {
      addNotification(notification);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    // Load existing notifications
    loadNotifications();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Play sound if enabled
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      
      // Show toast for important notifications
      if (notification.priority === 'high') {
        setToast({ 
          message: notification.title, 
          type: notification.type === 'error' ? 'error' : 'success' 
        });
      }
    };

    const handleNotificationUpdate = (updatedNotification) => {
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === updatedNotification._id ? updatedNotification : notif
        )
      );
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:update', handleNotificationUpdate);
    };
  }, [socket, settings.soundEnabled]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetchWithAuth(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
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
      const response = await fetchWithAuth('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetchWithAuth(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(n => n._id !== notificationId)
        );
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-blue-500",
      high: "text-orange-500",
      urgent: "text-red-500"
    };
    return colors[priority] || "text-gray-500";
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notificationTime.toLocaleDateString();
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Audio not supported');
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/cpanel/notifications"
                className="text-sm text-blue-600 hover:text-blue-700 text-center block"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "success" })} 
      />
    </div>
  );
};

export default NotificationCenter; 