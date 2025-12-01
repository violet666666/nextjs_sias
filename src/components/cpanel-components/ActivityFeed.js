"use client";
import { useState, useEffect } from 'react';
import { useUserStatus } from '@/lib/hooks/useUserStatus';
import { 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  BookOpen,
  Calendar,
  Award
} from 'lucide-react';
import { io } from 'socket.io-client';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const ActivityFeed = ({ maxItems = 10 }) => {
  // const { userActivity } = useUserStatus(); // userActivity tidak dipakai lagi
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let socket;
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/audit-logs?limit=${maxItems}`);
        const data = await res.json();
        if (data.success) setActivities(data.data);
      } catch (e) {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
    // Listen real-time
    try {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket']
      });
      socket.on('activity_feed_update', (recent) => {
        setActivities(recent.slice(0, maxItems));
      });
    } catch {}
    return () => { if (socket) socket.disconnect(); };
  }, [maxItems]);

  const getActivityIcon = (activity) => {
    switch (activity.activity) {
      case 'view_task_management':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'create_task':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'submit_task':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'grade_submission':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'view_class':
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'send_message':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'view_attendance':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityText = (activity) => {
    const studentName = activity.studentName || 'Siswa';
    
    switch (activity.activity) {
      case 'view_task_management':
        return `${studentName} membuka halaman manajemen tugas`;
      case 'create_task':
        return `${studentName} membuat tugas baru: "${activity.data?.taskTitle || 'Tugas'}"`;
      case 'submit_task':
        return `${studentName} mengumpulkan tugas`;
      case 'grade_submission':
        return `${studentName} memperbarui nilai tugas`;
      case 'view_class':
        return `${studentName} membuka halaman kelas`;
      case 'send_message':
        return `${studentName} mengirim pesan`;
      case 'view_attendance':
        return `${studentName} melihat kehadiran`;
      default:
        return `${studentName} melakukan aktivitas`;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    return activityTime.toLocaleDateString('id-ID');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aktivitas Terbaru
          </h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aktivitas Terbaru
        </h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Belum ada aktivitas terbaru
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((log, index) => (
            <div
              key={log._id || index}
              className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon({ activity: log.action })}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-semibold">{log.user_id?.nama || 'User'}</span> {log.action.replace(/_/g, ' ').toLowerCase()} <span className="font-semibold">{log.resource_type}</span>
                </p>
                {log.details && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(log.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {activities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
            Lihat semua aktivitas
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed; 