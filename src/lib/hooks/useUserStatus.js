import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export const useUserStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    if (!user || !token) return;

    const newSocket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket"]
    });

    // Join user room
    newSocket.emit("join_user", { userId: user.id || user._id });

    // Listen for user status updates
    newSocket.on("user_status_update", ({ userId, status }) => {
      setOnlineUsers(prev => {
        const existing = prev.find(u => u._id === userId);
        if (existing) {
          return prev.map(u => u._id === userId ? { ...u, online_status: status } : u);
        } else {
          return [...prev, { _id: userId, online_status: status }];
        }
      });
    });

    // Listen for student activity (for teachers)
    newSocket.on("student_activity", (activity) => {
      setUserActivity(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/users/online');
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Log user activity
  const logActivity = useCallback((activity, data = {}) => {
    if (!socket) return;
    
    socket.emit("user_activity", { activity, data });
  }, [socket]);

  // Update user status manually
  const updateStatus = useCallback(async (status) => {
    try {
      const res = await fetchWithAuth('/api/users/profile', {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online_status: status })
      });
      
      if (res.ok) {
        // Status will be updated via socket
        return true;
      }
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOnlineUsers();
  }, [fetchOnlineUsers]);

  return {
    onlineUsers,
    userActivity,
    loading,
    logActivity,
    updateStatus,
    refetchOnlineUsers: fetchOnlineUsers
  };
}; 