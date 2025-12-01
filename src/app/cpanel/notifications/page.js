import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function NotificationsPage() {
  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/notifications');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat notifikasi.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru', 'siswa', 'orangtua']}>
      <div className="max-w-3xl mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Notifikasi</h1>
        <p className="text-gray-600 dark:text-gray-300">Semua notifikasi akan tampil di sini.</p>
      </div>
    </ProtectedRoute>
  );
} 