'use client';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { Bell, CheckCircle, AlertCircle, Info, Calendar, X } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/notifications');
      if (!res.ok) {
        // If no notifications API, show empty state
        if (res.status === 404) {
          setNotifications([]);
          return;
        }
        throw new Error(await res.text());
      }
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Notification fetch error:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error('Failed to mark as read:', e);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'assignment':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Sample notifications for demo if API returns empty
  const sampleNotifications = [
    {
      _id: '1',
      title: 'Selamat Datang',
      text: 'Selamat datang di Sistem Informasi Akademik Siswa (SIAS).',
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      title: 'Sistem Aktif',
      text: 'Sistem SIAS sudah siap digunakan untuk tahun ajaran 2025/2026.',
      type: 'success',
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru', 'siswa', 'orangtua']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifikasi</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {displayNotifications.filter(n => !n.read).length} notifikasi belum dibaca
                </p>
              </div>
            </div>
            {displayNotifications.some(n => !n.read) && (
              <button
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Memuat notifikasi...</p>
            </div>
          )}

          {/* Notifications List */}
          {!loading && (
            <div className="space-y-3">
              {displayNotifications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tidak ada notifikasi
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Anda akan menerima notifikasi untuk tugas baru, pengumuman, dan update lainnya.
                  </p>
                </div>
              ) : (
                displayNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border-l-4 transition-all duration-200 hover:shadow-md ${notification.read
                        ? 'border-gray-200 dark:border-gray-700 opacity-75'
                        : 'border-blue-500'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-medium ${notification.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.text}
                        </p>
                        {notification.link && (
                          <a
                            href={notification.link}
                            className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Lihat Detail →
                          </a>
                        )}
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Tandai dibaca"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}