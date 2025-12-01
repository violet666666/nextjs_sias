"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Toast from '@/components/common/Toast';
import Button from '@/components/ui/Button';
import { 
  Download, 
  Upload, 
  Database, 
  Folder, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Settings,
  Trash2,
  FileText,
  HardDrive
} from 'lucide-react';

export default function BackupPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: false,
    backupInterval: 'daily',
    keepBackups: 7,
    includeFiles: true,
    includeDatabase: true
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (userData.role !== 'admin') {
        router.push('/cpanel/dashboard');
        return;
      }
      
      fetchBackups();
      fetchBackupSettings();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchBackups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth('/api/backup');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      } else {
        throw new Error('Gagal memuat daftar backup');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      const res = await fetchWithAuth('/api/backup/settings');
      if (res.ok) {
        const data = await res.json();
        setBackupSettings(data);
      }
    } catch (err) {
      console.error('Error fetching backup settings:', err);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    setError("");
    try {
      const res = await fetchWithAuth('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeFiles: backupSettings.includeFiles,
          includeDatabase: backupSettings.includeDatabase,
          description: `Manual backup - ${new Date().toLocaleString('id-ID')}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setToast({ message: 'Backup berhasil dibuat!', type: "success" });
        fetchBackups();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal membuat backup');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message, type: "error" });
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId) => {
    try {
      const res = await fetchWithAuth(`/api/backup/${backupId}/download`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${backupId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast({ message: 'Download backup berhasil!', type: "success" });
      } else {
        throw new Error('Gagal download backup');
      }
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const restoreBackup = async (backupId) => {
    setRestoringBackup(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/backup/${backupId}/restore`, {
        method: 'POST'
      });

      if (res.ok) {
        setToast({ message: 'Restore backup berhasil!', type: "success" });
        setShowRestoreModal(false);
        setSelectedBackup(null);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal restore backup');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message, type: "error" });
    } finally {
      setRestoringBackup(false);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus backup ini?')) return;

    try {
      const res = await fetchWithAuth(`/api/backup/${backupId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setToast({ message: 'Backup berhasil dihapus!', type: "success" });
        fetchBackups();
      } else {
        throw new Error('Gagal menghapus backup');
      }
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const updateBackupSettings = async () => {
    try {
      const res = await fetchWithAuth('/api/backup/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupSettings)
      });

      if (res.ok) {
        setToast({ message: 'Pengaturan backup berhasil disimpan!', type: "success" });
      } else {
        throw new Error('Gagal menyimpan pengaturan');
      }
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />}
      <ProtectedRoute requiredRoles={['admin']}>
        <div className="max-w-7xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Backup & Restore System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola backup database dan file sistem
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Buat Backup
                </h3>
                <Database className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Buat backup manual database dan file
              </p>
              <Button
                onClick={createBackup}
                loading={creatingBackup}
                color="primary"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
              >
                {creatingBackup ? 'Membuat Backup...' : 'Buat Backup'}
              </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Backup
                </h3>
                <Folder className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {backups.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Backup tersimpan
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pengaturan
                </h3>
                <Settings className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Konfigurasi backup otomatis
              </p>
              <Button
                onClick={() => setShowRestoreModal(true)}
                variant="outline"
                className="w-full"
                icon={<Settings className="w-4 h-4" />}
              >
                Pengaturan
              </Button>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengaturan Backup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={backupSettings.autoBackup}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Backup Otomatis</span>
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Interval Backup
                </label>
                <select
                  value={backupSettings.backupInterval}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, backupInterval: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Simpan Backup
                </label>
                <select
                  value={backupSettings.keepBackups}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, keepBackups: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={3}>3 backup</option>
                  <option value={7}>7 backup</option>
                  <option value={14}>14 backup</option>
                  <option value={30}>30 backup</option>
                </select>
              </div>
              <div className="flex items-center justify-end">
                <Button
                  onClick={updateBackupSettings}
                  color="primary"
                  size="sm"
                >
                  Simpan
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupSettings.includeDatabase}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, includeDatabase: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sertakan Database</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={backupSettings.includeFiles}
                  onChange={(e) => setBackupSettings(prev => ({ ...prev, includeFiles: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Sertakan File</span>
              </label>
            </div>
          </div>

          {/* Backup List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Daftar Backup
              </h3>
            </div>
            
            {loading ? (
              <div className="p-6">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-6 text-center">
                <HardDrive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada backup tersimpan</p>
                <p className="text-sm text-gray-400">Buat backup pertama Anda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ukuran
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {backups.map((backup) => (
                      <tr key={backup._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getBackupStatusIcon(backup.status)}
                            <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">
                              {backup.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(backup.createdAt).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatFileSize(backup.size || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {backup.description || 'Backup sistem'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => downloadBackup(backup._id)}
                              size="sm"
                              variant="outline"
                              icon={<Download className="w-4 h-4" />}
                            >
                              Download
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              size="sm"
                              variant="outline"
                              icon={<Upload className="w-4 h-4" />}
                            >
                              Restore
                            </Button>
                            <Button
                              onClick={() => deleteBackup(backup._id)}
                              size="sm"
                              variant="outline"
                              color="red"
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Restore Modal */}
          {showRestoreModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Restore Backup
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedBackup 
                    ? `Anda akan restore backup dari ${new Date(selectedBackup.createdAt).toLocaleString('id-ID')}`
                    : 'Pilih backup yang akan di-restore'
                  }
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    ⚠️ Peringatan: Restore akan menimpa data yang ada. Pastikan Anda telah membuat backup terbaru.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      setShowRestoreModal(false);
                      setSelectedBackup(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => selectedBackup && restoreBackup(selectedBackup._id)}
                    loading={restoringBackup}
                    color="red"
                    className="flex-1"
                    icon={<Upload className="w-4 h-4" />}
                  >
                    {restoringBackup ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ProtectedRoute>
    </div>
  );
} 