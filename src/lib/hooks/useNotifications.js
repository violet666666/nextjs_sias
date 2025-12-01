import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { io } from 'socket.io-client';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: options.page || '1',
        limit: options.limit || '20',
        ...options
      });

      const [notifRes, statsRes] = await Promise.all([
        fetchWithAuth(`/api/notifications?${params}`),
        fetchWithAuth('/api/notifications/stats')
      ]);

      if (notifRes.ok && statsRes.ok) {
        const notifData = await notifRes.json();
        const statsData = await statsRes.json();
        
        setNotifications(notifData.notifications || []);
        setStats(statsData);
        
        return { notifications: notifData.notifications, pagination: notifData.pagination, stats: statsData };
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const res = await fetchWithAuth("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, read: true, readAt: new Date() } : n)
        );
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        return true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ markAll: true })
      });
      
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date() })));
        setStats(prev => ({ ...prev, unread: 0 }));
        return true;
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const res = await fetchWithAuth(`/api/notifications?id=${id}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        const notification = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        setStats(prev => ({ 
          ...prev, 
          total: prev.total - 1,
          unread: notification?.read ? prev.unread : prev.unread - 1
        }));
        return true;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [notifications]);

  // Delete read notifications
  const deleteReadNotifications = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/notifications?deleteRead=true", {
        method: "DELETE"
      });
      
      if (res.ok) {
        const readCount = notifications.filter(n => n.read).length;
        setNotifications(prev => prev.filter(n => !n.read));
        setStats(prev => ({ ...prev, total: prev.total - readCount }));
        return readCount;
      }
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }, [notifications]);

  // Create notification (admin only)
  const createNotification = useCallback(async (notificationData) => {
    try {
      const res = await fetchWithAuth("/api/notifications", {
        method: "POST",
        body: JSON.stringify(notificationData)
      });
      
      if (res.ok) {
        const newNotification = await res.json();
        // Refresh notifications if needed
        await fetchNotifications();
        return newNotification;
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }, [fetchNotifications]);

  // Setup real-time notifications
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    if (!user || !token) return;

    // Initialize socket connection
    const newSocket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"]
    });

    // Join user room
    newSocket.emit("join_user", { userId: user.id || user._id });

    // Listen for new notifications
    newSocket.on("notification:new", (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setStats(prev => ({ 
        ...prev, 
        total: prev.total + 1,
        unread: prev.unread + 1
      }));
    });

    // Listen for notification updates
    newSocket.on("notification_update", (updatedNotification) => {
      setNotifications(prev => 
        prev.map(n => n._id === updatedNotification._id ? updatedNotification : n)
      );
    });

    // Listen for notification deletion
    newSocket.on("notification_delete", (notificationId) => {
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setStats(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    });

    setSocket(newSocket);

    // Initial fetch
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    stats,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    createNotification,
    socket
  };
};

export default useNotifications; 