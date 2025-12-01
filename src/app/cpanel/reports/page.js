"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Toast from '@/components/common/Toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  BookOpen,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [selectedReport, setSelectedReport] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (userData.role !== 'admin' && userData.role !== 'guru') {
        router.push('/cpanel/dashboard');
        return;
      }
      
      fetchReports();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      // For now, use mock data
      const mockReports = [
        {
          id: 1,
          title: 'Laporan Kehadiran Bulanan',
          type: 'attendance',
          description: 'Laporan kehadiran siswa per kelas',
          lastGenerated: new Date('2024-01-15').toISOString(),
          status: 'completed',
          fileSize: '2.5 MB',
          downloadUrl: '#'
        },
        {
          id: 2,
          title: 'Laporan Nilai Semester',
          type: 'grades',
          description: 'Laporan nilai siswa per mata pelajaran',
          lastGenerated: new Date('2024-01-10').toISOString(),
          status: 'completed',
          fileSize: '1.8 MB',
          downloadUrl: '#'
        },
        {
          id: 3,
          title: 'Laporan Tugas',
          type: 'tasks',
          description: 'Laporan pengumpulan dan penilaian tugas',
          lastGenerated: new Date('2024-01-12').toISOString(),
          status: 'completed',
          fileSize: '3.2 MB',
          downloadUrl: '#'
        }
      ];
      
      setReports(mockReports);
    } catch (err) {
      setError("Gagal memuat laporan");
      setToast({ message: "Gagal memuat laporan", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: Date.now(),
        title: `Laporan ${reportType} - ${new Date().toLocaleDateString('id-ID')}`,
        type: reportType,
        description: `Laporan ${reportType} yang baru dibuat`,
        lastGenerated: new Date().toISOString(),
        status: 'completed',
        fileSize: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
        downloadUrl: '#'
      };
      
      setReports(prev => [newReport, ...prev]);
      setToast({ message: 'Laporan berhasil dibuat!', type: "success" });
    } catch (err) {
      setToast({ message: "Gagal membuat laporan", type: "error" });
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      // Simulate download
      setToast({ message: 'Download laporan dimulai...', type: "success" });
    } catch (err) {
      setToast({ message: "Gagal download laporan", type: "error" });
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'attendance':
        return <Calendar className="w-6 h-6" />;
      case 'grades':
        return <BookOpen className="w-6 h-6" />;
      case 'tasks':
        return <FileText className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'attendance':
        return 'Kehadiran';
      case 'grades':
        return 'Nilai';
      case 'tasks':
        return 'Tugas';
      default:
        return 'Umum';
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru']}>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Laporan & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generate dan kelola laporan akademik
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Laporan Kehadiran
              </h3>
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate laporan kehadiran siswa
            </p>
            <button
              onClick={() => generateReport('attendance')}
              disabled={generatingReport}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {generatingReport ? 'Membuat...' : 'Buat Laporan'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Laporan Nilai
              </h3>
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate laporan nilai siswa
            </p>
            <button
              onClick={() => generateReport('grades')}
              disabled={generatingReport}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {generatingReport ? 'Membuat...' : 'Buat Laporan'}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Laporan Tugas
              </h3>
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate laporan tugas siswa
            </p>
            <button
              onClick={() => generateReport('tasks')}
              disabled={generatingReport}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {generatingReport ? 'Membuat...' : 'Buat Laporan'}
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Laporan Tersedia
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
          ) : reports.length === 0 ? (
            <div className="p-6 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada laporan tersedia</p>
              <p className="text-sm text-gray-400">Generate laporan pertama Anda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Laporan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Terakhir Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ukuran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getReportIcon(report.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {report.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {getReportTypeLabel(report.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(report.lastGenerated).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {report.fileSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => downloadReport(report.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ message: "", type: "success" })} 
        />
      </div>
    </ProtectedRoute>
  );
} 