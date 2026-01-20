'use client';
import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { toast } from 'react-hot-toast';
import { Settings, Database, Bell, Shield, Users, Save, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalSubmissions: 0,
  });

  // Settings states
  const [generalSettings, setGeneralSettings] = useState({
    schoolName: 'SMK Negeri 2',
    schoolYear: '2025/2026',
    semester: 'Ganjil',
    kkm: 75,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    gradeNotifications: true,
    attendanceAlerts: true,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, kelasRes] = await Promise.all([
        fetchWithAuth('/api/users?count=true'),
        fetchWithAuth('/api/kelas'),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setStats(prev => ({ ...prev, totalUsers: Array.isArray(data) ? data.length : data.count || 0 }));
      }
      if (kelasRes.ok) {
        const data = await kelasRes.json();
        setStats(prev => ({ ...prev, totalClasses: Array.isArray(data) ? data.length : 0 }));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveGeneral = async () => {
    setLoading(true);
    try {
      // In a real app, this would save to database
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
      toast.success('Pengaturan umum berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      toast.success('Pengaturan notifikasi berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'general', label: 'Umum', icon: Settings },
    { key: 'notifications', label: 'Notifikasi', icon: Bell },
    { key: 'system', label: 'Sistem', icon: Database },
  ];

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Pengaturan Sistem
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola konfigurasi dan preferensi sistem SIAS
            </p>
          </div>

          {/* System Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Kelas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalClasses}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Versi Sistem</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">v1.0.0</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">Online</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tabs */}
            <div className="lg:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.key
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Pengaturan Umum
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Sekolah
                      </label>
                      <input
                        type="text"
                        value={generalSettings.schoolName}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, schoolName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tahun Ajaran
                      </label>
                      <input
                        type="text"
                        value={generalSettings.schoolYear}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, schoolYear: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Semester
                      </label>
                      <select
                        value={generalSettings.semester}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, semester: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value="Ganjil">Ganjil</option>
                        <option value="Genap">Genap</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        KKM Default
                      </label>
                      <input
                        type="number"
                        value={generalSettings.kkm}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, kkm: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveGeneral}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Pengaturan Notifikasi
                  </h2>

                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Notifikasi Email', desc: 'Kirim notifikasi melalui email' },
                      { key: 'taskReminders', label: 'Pengingat Tugas', desc: 'Ingatkan siswa tentang deadline tugas' },
                      { key: 'gradeNotifications', label: 'Notifikasi Nilai', desc: 'Beritahu siswa saat nilai diinput' },
                      { key: 'attendanceAlerts', label: 'Peringatan Kehadiran', desc: 'Kirim peringatan jika siswa tidak hadir' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[item.key]}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Informasi Sistem
                  </h2>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Framework</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">Next.js 16</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Database</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">MongoDB</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Environment</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{process.env.NODE_ENV || 'development'}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-600 dark:text-green-400">Status Database</p>
                      <p className="font-bold text-green-800 dark:text-green-100">Connected ✓</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}