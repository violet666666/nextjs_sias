"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor helper
import StatCard from "@/components/common/StatCard";
import SimpleBarChart from "@/components/common/BarChart";
import SimplePieChart from "@/components/common/PieChart";
import { exportDashboardSummaryPDF, downloadPDF } from "@/lib/pdfExporter";
import Toast from "@/components/common/Toast";
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  MessageSquare,
  Folder,
  Settings,
  Award,
  User
} from 'lucide-react';
import ResponsiveLayout from '@/components/layout/ResponsiveLayout';
import AdvancedDashboard from '@/components/analytics/AdvancedDashboard';
import NotificationBell from '@/components/notifications/NotificationSystem';
import { useAuth } from '@/lib/auth';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DashboardAnalytics from '@/components/analytics/DashboardAnalytics';
import { useUserStatus } from "@/lib/hooks/useUserStatus";
import ActivityFeed from "@/components/cpanel-components/ActivityFeed";
import { io } from "socket.io-client";
import QuickActions from "@/components/common/QuickActions";

const ROLE_LABELS = {
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
  orangtua: "Orang Tua",
};

const DashboardCard = ({ title, value, icon: Icon, color = 'blue', change = null, onClick = null }) => (
  <div 
    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-100' : activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            {activity.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : activity.type === 'warning' ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <Clock className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            <p className="text-sm text-gray-600">{activity.description}</p>
            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [socket, setSocket] = useState(null);

  // Real-time user status
  const { onlineUsers, userActivity, logActivity } = useUserStatus();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Log activity
      logActivity('view_dashboard', { page: 'dashboard' });
      
      fetchDashboardData(userData);

      // Initialize socket for dashboard stats
      const token = localStorage.getItem("token");
      if (token) {
        const newSocket = io("http://localhost:3001", {
          auth: { token },
          transports: ["websocket"]
        });

        newSocket.on('connect', () => {
          console.log('Socket connected for dashboard stats');
        });
        
        newSocket.on("dashboard_stats_updated", (newStats) => {
          setStats(currentStats => ({...currentStats, ...newStats}));
          setToast({ message: "Data dashboard telah diperbarui!", type: "info" });
        });

        setSocket(newSocket);

        return () => {
          newSocket.disconnect();
        };
      }

    } else {
      router.push("/login");
    }
  }, [router, logActivity]);

  useEffect(() => {
    if (!socket) return;
    const handler = (activities) => {
      setRecentActivities(activities || []);
    };
    socket.on('activity_feed_update', handler);
    return () => socket.off('activity_feed_update', handler);
  }, [socket]);

  const fetchDashboardData = async (userData) => {
    setLoading(true);
    try {
      let statsRes, analyticsRes, activitiesRes;
      if (userData.role === 'guru') {
        analyticsRes = await fetchWithAuth('/api/analytics/dashboard');
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setStats(analyticsData);
        }
      } else {
        statsRes = await fetchWithAuth('/api/dashboard/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
      activitiesRes = await fetchWithAuth('/api/dashboard/activities');
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData.activities || []);
      }
    } catch (error) {
      setToast({ message: "Gagal memuat data dashboard", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getRoleSpecificStats = () => {
    if (!user) return [];

    const baseStats = [
      {
        title: "Pengguna Online",
        value: onlineUsers.length,
        icon: <Users className="w-6 h-6" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900"
      }
    ];

    switch (user.role) {
      case "admin":
        return [
          ...baseStats,
          {
            title: "Total Kelas",
            value: stats.stats?.totalClasses || stats.totalClasses || 0,
            icon: <BookOpen className="w-6 h-6" />,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
          },
          {
            title: "Total Guru",
            value: stats.stats?.usersByRole?.guru || stats.totalTeachers || 0,
            icon: <User className="w-6 h-6" />,
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900"
          },
          {
            title: "Total Siswa",
            value: stats.stats?.usersByRole?.siswa || stats.totalStudents || 0,
            icon: <Users className="w-6 h-6" />,
            color: "text-orange-600",
            bgColor: "bg-orange-100 dark:bg-orange-900"
          }
        ];
      case "guru":
        return [
          ...baseStats,
          {
            title: "Kelas Diajar",
            value: stats.stats?.myClasses || stats.myClasses || 0,
            icon: <BookOpen className="w-6 h-6" />,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
          },
          {
            title: "Tugas Aktif",
            value: stats.stats?.myAssignments || stats.myAssignments || 0,
            icon: <FileText className="w-6 h-6" />,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900"
          },
          {
            title: "Submissions Baru",
            value: stats.stats?.recentSubmissions?.length || stats.recentSubmissions?.length || 0,
            icon: <CheckCircle className="w-6 h-6" />,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100 dark:bg-yellow-900"
          }
        ];
      case "siswa":
        return [
          ...baseStats,
          {
            title: "Kelas Diikuti",
            value: stats.stats?.myClasses || stats.myClasses || 0,
            icon: <BookOpen className="w-6 h-6" />,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
          },
          {
            title: "Tugas Pending",
            value: stats.stats?.upcomingDeadlines?.length || stats.upcomingDeadlines?.length || 0,
            icon: <Clock className="w-6 h-6" />,
            color: "text-orange-600",
            bgColor: "bg-orange-100 dark:bg-orange-900"
          },
          {
            title: "Tugas Selesai",
            value: stats.stats?.myAssignments || stats.myAssignments || 0,
            icon: <CheckCircle className="w-6 h-6" />,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
          }
        ];
      case "orangtua":
        return [
          ...baseStats,
          {
            title: "Jumlah Anak",
            value: stats.stats?.childrenCount || stats.childrenCount || 0,
            icon: <Users className="w-6 h-6" />,
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900"
          },
          {
            title: "Performa Anak",
            value: stats.stats?.childrenPerformance?.length || stats.childrenPerformance?.length || 0,
            icon: <Award className="w-6 h-6" />,
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900"
          },
          {
            title: "Update Terbaru",
            value: stats.stats?.recentUpdates?.length || stats.recentUpdates?.length || 0,
            icon: <Clock className="w-6 h-6" />,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100 dark:bg-yellow-900"
          }
        ];
      default:
        return baseStats;
    }
  };

  if (!user) return <LoadingSpinner />;

  const roleStats = getRoleSpecificStats();

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Selamat datang kembali, {user.nama}!
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roleStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <div className={stat.color}>{stat.icon}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <QuickActions user={user} role={user.role} />
              </div>

              {/* Activity Feed (Audit Log) */}
              <div className="lg:col-span-2">
                <ActivityFeed maxItems={10} />
              </div>
            </div>
          </div>
        )}
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ message: "", type: "success" })} 
        />
      </div>
    </ProtectedRoute>
  );
}

function KehadiranTable({ siswaId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/api/kehadiran")
      .then((res) => res.json())
      .then((all) => {
        // Pastikan 'all' adalah array sebelum filter
        setData(Array.isArray(all) ? all.filter((d) => d.siswa_id?._id === siswaId || d.siswa_id === siswaId) : []);
      })
      .finally(() => setLoading(false));
  }, [siswaId]);

  if (loading) return <div className="text-gray-600 dark:text-gray-400">Loading kehadiran...</div>;
  if (!data.length) return <div className="text-gray-600 dark:text-gray-400">Tidak ada data kehadiran.</div>;
  return (
    <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Kelas</th>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Tanggal</th>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d._id}>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{d.kelas_id?.nama_kelas || '-'}</td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{new Date(d.tanggal).toLocaleDateString()}</td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{d.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NilaiTable({ siswaId, kelas }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/api/submissions")
      .then((res) => res.json())
      .then((all) => {
        // Pastikan 'all' adalah array sebelum filter
        setData(Array.isArray(all) ? all.filter((d) => d.siswa_id?._id === siswaId || d.siswa_id === siswaId) : []);
      })
      .finally(() => setLoading(false));
  }, [siswaId]);

  if (loading) return <div className="text-gray-600 dark:text-gray-400">Loading nilai...</div>;
  if (!data.length) return <div className="text-gray-600 dark:text-gray-400">Tidak ada data nilai.</div>;
  return (
    <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Judul Tugas</th>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Kelas</th>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nilai</th>
          <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Feedback</th>
        </tr>
      </thead>
      <tbody>
        {data.map((d) => (
          <tr key={d._id}>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{d.tugas_id?.judul || '-'}</td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{
              kelas.find((k) => k._id === (d.tugas_id?.kelas_id?._id || d.tugas_id?.kelas_id))?.nama_kelas || '-'
            }</td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{d.nilai ?? '-'}</td>
            <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
              {d.feedback && (
                <span className="block text-gray-700 dark:text-gray-300 transition-colors duration-200">Feedback: {d.feedback}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MonitoringAnakDropdown({ userId }) {
  const [anakList, setAnakList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/api/orangtua")
      .then((res) => res.json())
      .then((all) => {
        // Pastikan 'all' adalah array dan format untuk siswa_ids array
        const allData = Array.isArray(all) ? all : [];
        const filteredData = allData.filter((d) => d.user_id?._id === userId || d.user_id === userId);
        
        // Flatten siswa_ids dari semua record
        const allAnak = filteredData.flatMap(item => {
          if (item.siswa_ids && Array.isArray(item.siswa_ids)) {
            return item.siswa_ids;
          } else if (item.siswa_id) {
            // Backward compatibility
            return [item.siswa_id];
          }
          return [];
        });
        
        setAnakList(allAnak);
        if (allAnak.length > 0) {
          const id = allAnak[0]._id || allAnak[0];
          setSelected(id);
          localStorage.setItem("anak_id", id); // Set default anak ke localStorage
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSelect = (e) => {
    setSelected(e.target.value);
    localStorage.setItem("anak_id", e.target.value); // Set anak_id ke localStorage saat dipilih
  };

  if (loading) return <div>Loading data anak...</div>;
  if (!anakList.length) return <div>Tidak ada data anak terhubung.</div>;

  return (
    <div>
      <div className="mb-4">
        <label className="font-semibold mr-2">Pilih Anak:</label>
        <select
          className="border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors duration-200"
          value={selected || ""}
          onChange={handleSelect}
        >
          {anakList.map((a) => {
            const anakId = a._id || a;
            const anakNama = a.nama || "-";
            return (
              <option key={anakId} value={anakId}>
                {anakNama}
              </option>
            );
          })}
        </select>
      </div>
      <MonitoringAnakById siswaId={selected} />
    </div>
  );
}

function MonitoringAnakById({ siswaId }) {
  const [kelas, setKelas] = useState([]);
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWithAuth("/api/kelas").then((res) => res.json()),
      fetchWithAuth("/api/tugas").then((res) => res.json()),
    ]).then(([kelasData, tugasData]) => {
      setKelas(kelasData);
      setTugas(tugasData);
    }).finally(() => setLoading(false));
  }, [siswaId]);

  // Fetch kelas untuk siswaId
  const [kelasSiswaFiltered, setKelasSiswa] = useState([]);
  useEffect(() => {
    if (!siswaId) {
      setKelasSiswa([]);
      return;
    }
    fetchWithAuth(`/api/kelas?siswa_id=${siswaId}`)
      .then((res) => res.json())
      .then((data) => {
        setKelasSiswa(Array.isArray(data) ? data : []);
      });
  }, [siswaId]);
  const kelasIds = kelasSiswaFiltered.map((k) => k._id);
  // Pastikan 'kelas' dan 'tugas' adalah array sebelum filter
  const kelasSiswaFilteredFiltered = Array.isArray(kelas) ? kelas.filter((k) => kelasIds.includes(k._id)) : [];
  const tugasSiswa = Array.isArray(tugas) ? tugas.filter((t) => kelasIds.includes(t.kelas_id?._id || t.kelas_id)) : [];

  // Monitoring Kehadiran & Nilai
  return (
    <div className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="text-lg mb-4">Daftar Kelas Anak</div>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading kelas...</div>
      ) : kelasSiswaFiltered.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">Tidak ada kelas yang diikuti anak ini.</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama Kelas</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Tahun Ajaran</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {kelasSiswaFiltered.map((k) => (
              <tr key={k._id}>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.nama_kelas}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.tahun_ajaran}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.status_kelas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="text-lg mb-4">Daftar Tugas Anak</div>
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading tugas...</div>
      ) : tugasSiswa.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">Tidak ada tugas dari kelas yang diikuti anak ini.</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Judul</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Deskripsi</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Deadline</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Kelas</th>
            </tr>
          </thead>
          <tbody>
            {tugasSiswa.map((t) => (
              <tr key={t._id}>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{t.judul}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{t.deskripsi}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{new Date(t.tanggal_deadline).toLocaleString()}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{kelasSiswaFiltered.find((k) => k._id === (t.kelas_id?._id || t.kelas_id))?.nama_kelas || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="text-lg mb-2 font-semibold">Monitoring Kehadiran</div>
      <KehadiranTable siswaId={siswaId} />
      <div className="text-lg mb-2 font-semibold mt-8">Monitoring Nilai</div>
      <NilaiTable siswaId={siswaId} kelas={kelasSiswaFilteredFiltered} />
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'siswa' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    fetchWithAuth('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Failed to fetch users:", err)) // Tambah error handling
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);
  
  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ nama: user.nama, email: user.email, password: '', role: user.role });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus user ini?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('User berhasil dihapus');
      fetchUsers();
    } else {
      setError('Gagal menghapus user');
    }
    setSaving(false);
  };

  const handleAdd = () => {
    setEditUser(null);
    setForm({ nama: '', email: '', password: '', role: 'siswa' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!form.nama || !form.email || (!editUser && !form.password)) {
      setError('Nama, email, dan password wajib diisi');
      setSaving(false);
      return;
    }
    let res;
    if (editUser) {
      // Edit user
      const body = { nama: form.nama, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      res = await fetchWithAuth(`/api/users/${editUser._id}`, {
        method: 'PUT',
        // headers: { 'Content-Type': 'application/json' }, // Dihandle fetchWithAuth
        body: JSON.stringify(body),
      });
    } else {
      // Tambah user
      res = await fetchWithAuth('/api/auth/register', { // Register juga bisa diproteksi jika perlu
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    if (res.ok) {
      setSuccess(editUser ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
      setShowModal(false);
      fetchUsers();
    } else {
      const data = await res.json();
      setError(data.message || 'Gagal menyimpan user');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-gray-600 dark:text-gray-400">Loading user...</div>;
  return (
    <div className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex items-center gap-4 mb-4">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors duration-200">
          <option value="all">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="guru">Guru</option>
          <option value="siswa">Siswa</option>
          <option value="orangtua">Orang Tua</option>
        </select>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200">+ Tambah User</button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading user...</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Email</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Role</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u._id}>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{u.nama}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{u.email}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 capitalize">{u.role}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                  <button onClick={() => handleEdit(u)} className="text-blue-500 hover:underline mr-2 transition-colors duration-200">Edit</button>
                  <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:underline transition-colors duration-200">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal Form Tambah/Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded shadow w-96 transition-colors duration-300">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{editUser ? 'Edit User' : 'Tambah User'}</h2>
            <input type="text" required placeholder="Nama" className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            <input type="email" required placeholder="Email" className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input type="password" placeholder={editUser ? "Password (kosongkan jika tidak diubah)" : "Password"} className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <select required className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
              <option value="orangtua">Orang Tua</option>
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200">Batal</button>
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Komponen dashboard siswa dengan fitur pengumpulan tugas
function SiswaDashboard({ user, kelas, tugas, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [kelasSiswaFilteredUser, setKelasSiswaUser] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(true);

  // Fetch submissions milik siswa ini
  useEffect(() => {
    fetchWithAuth("/api/submissions")
      .then((res) => res.json())
      .then((all) => {
        // Pastikan 'all' adalah array
        setSubmissions(Array.isArray(all) ? all.filter((d) => d.siswa_id?._id === user.id || d.siswa_id === user.id) : []);
      });
  }, [user.id, submitSuccess]);

  // Cek apakah tugas sudah dikumpulkan
  const isSubmitted = (tugasId) => submissions.some((s) => s.tugas_id?._id === tugasId || s.tugas_id === tugasId);
  const getSubmission = (tugasId) => submissions.find((s) => s.tugas_id?._id === tugasId || s.tugas_id === tugasId);

  const handleOpenModal = (tugas) => {
    setSelectedTugas(tugas);
    setShowModal(true);
    setFile(null);
    setLink("");
    setSubmitError("");
    setSubmitSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError("");
    setSubmitSuccess("");
    // Simulasi upload file: hanya simpan nama file/link
    let file_path = link;
    if (file) {
      // Simulasi upload file, di real case harus upload ke storage
      file_path = file.name;
    }
    if (!file_path) {
      setSubmitError("File atau link wajib diisi");
      setSubmitLoading(false);
      return;
    }
    const res = await fetchWithAuth("/api/submissions", {
      method: "POST",
      body: JSON.stringify({
        tugas_id: selectedTugas._id,
        siswa_id: user.id,
        tanggal_kumpul: new Date(),
        file_path,
      }),
    });
    if (res.ok) {
      setSubmitSuccess("Tugas berhasil dikumpulkan!");
      setShowModal(false);
    } else {
      const data = await res.json();
      setSubmitError(data.error || "Gagal mengumpulkan tugas");
    }
    setSubmitLoading(false);
  };

  useEffect(() => {
    setEnrollLoading(true);
    fetchWithAuth(`/api/kelas?siswa_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setKelasSiswaUser(Array.isArray(data) ? data : []);
      })
      .finally(() => setEnrollLoading(false));
  }, [user.id]);

  // Kelas yang diikuti siswa
  const kelasIds = kelasSiswaFilteredUser.map((k) => k._id);
  // Pastikan 'kelas' adalah array sebelum filter
  const kelasSiswaFiltered = Array.isArray(kelas) ? kelas.filter((k) => kelasIds.includes(k._id)) : [];
  // Tugas dari kelas yang diikuti siswa
  const tugasSiswa = tugas.filter((t) => kelasIds.includes(t.kelas_id?._id || t.kelas_id));

  return (
    <div className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="text-lg mb-4">Daftar Kelas</div>
      {enrollLoading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading kelas...</div>
      ) : kelasSiswaFiltered.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">Tidak ada kelas yang diikuti.</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama Kelas</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Tahun Ajaran</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {kelasSiswaFiltered.map((k) => (
              <tr key={k._id}>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.nama_kelas}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.tahun_ajaran}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.status_kelas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="text-lg mb-4">Daftar Tugas</div>
      {enrollLoading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading tugas...</div>
      ) : tugasSiswa.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">Tidak ada tugas dari kelas yang diikuti.</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-8 transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Judul</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Deskripsi</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Deadline</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Kelas</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tugasSiswa.map((t) => {
              const sudah = isSubmitted(t._id);
              const sub = getSubmission(t._id);
              return (
                <tr key={t._id}>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{t.judul}</td>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{t.deskripsi}</td>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{new Date(t.tanggal_deadline).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{kelasSiswaFiltered.find((k) => k._id === (t.kelas_id?._id || t.kelas_id))?.nama_kelas || '-'}</td>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    {sudah ? (
                      <span className="text-green-600 font-semibold">Sudah Dikumpulkan</span>
                    ) : (
                      <span className="text-red-500">Belum</span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    {sudah ? (
                      <>
                        {sub.nilai !== undefined && (
                          <span className="block text-blue-600">Nilai: {sub.nilai}</span>
                        )}
                        {sub.feedback && (
                          <span className="block text-gray-700 dark:text-gray-300 transition-colors duration-200">Feedback: {sub.feedback}</span>
                        )}
                      </>
                    ) : (
                      <button onClick={() => handleOpenModal(t)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Kumpulkan</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Modal Kumpulkan Tugas */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-[600px] max-h-[80vh] overflow-y-auto transition-colors duration-300">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Submission Tugas: {selectedTugas?.judul}</h2>
            <PenilaianTugasModal tugas={selectedTugas} onClose={() => setShowModal(false)} />
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Kehadiran */}
      <div className="text-lg mb-2 font-semibold">Monitoring Kehadiran</div>
      <KehadiranTable siswaId={user.id} />

      {/* Monitoring Nilai */}
      <div className="text-lg mb-2 font-semibold mt-8">Monitoring Nilai</div>
      <NilaiTable siswaId={user.id} kelas={kelas} />
    </div>
  );
}

function PenilaianTugasButton({ tugas }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)} className="text-blue-500 dark:text-blue-400 hover:underline transition-colors duration-200">Lihat Submission</button>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-[600px] max-h-[80vh] overflow-y-auto transition-colors duration-300">
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Submission Tugas: {tugas.judul}</h2>
            <PenilaianTugasModal tugas={tugas} onClose={() => setShow(false)} />
            <div className="flex justify-end mt-4">
              <button onClick={() => setShow(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PenilaianTugas({ kelas, tugas }) {
  // Section ini bisa dikembangkan untuk menampilkan rekap penilaian semua tugas
  return null;
}

function PenilaianTugasModal({ tugas, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [nilai, setNilai] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchWithAuth("/api/submissions")
      .then((res) => res.json())
      .then((all) => {
        // Pastikan 'all' adalah array
        setSubmissions(Array.isArray(all) ? all.filter((s) => s.tugas_id?._id === tugas._id || s.tugas_id === tugas._id) : []);
      })
      .finally(() => setLoading(false));
  }, [tugas._id, success]);

  const handleEdit = (sub) => {
    setEditId(sub._id);
    setNilai(sub.nilai ?? "");
    setFeedback(sub.feedback ?? "");
    setError("");
    setSuccess("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const res = await fetchWithAuth(`/api/submissions/${editId}`, {
      method: "PUT",
      body: JSON.stringify({ nilai, feedback }),
    });
    if (res.ok) {
      setSuccess("Penilaian berhasil disimpan");
      setEditId(null);
    } else {
      const data = await res.json();
      setError(data.error || "Gagal menyimpan penilaian");
    }
    setSaving(false);
  };

  return (
    <div className="text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {loading ? (
        <div className="text-gray-600 dark:text-gray-400">Loading submission...</div>
      ) : submissions.length === 0 ? (
        <div className="text-gray-600 dark:text-gray-400">Tidak ada submission siswa.</div>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-4 transition-colors duration-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama Siswa</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">File/Link</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Tanggal Kumpul</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Nilai</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Feedback</th>
              <th className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub._id}>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{sub.siswa_id?.nama || '-'}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                  {sub.file_path ? (
                    <a href={sub.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300 transition-colors duration-200">{sub.file_path}</a>
                  ) : "-"}
                </td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">{new Date(sub.tanggal_kumpul).toLocaleString()}</td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                  {editId === sub._id ? (
                    <input type="number" className="border rounded p-1 w-16 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={nilai} onChange={e => setNilai(e.target.value)} />
                  ) : (
                    sub.nilai ?? "-"
                  )}
                </td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                  {editId === sub._id ? (
                    <input type="text" className="border rounded p-1 w-32 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" value={feedback} onChange={e => setFeedback(e.target.value)} />
                  ) : (
                    sub.feedback && (
                      <span className="block text-gray-700 dark:text-gray-300 transition-colors duration-200">Feedback: {sub.feedback}</span>
                    )
                  )}
                </td>
                <td className="py-2 px-4 border-b text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                  {editId === sub._id ? (
                    <button onClick={handleSave} className="bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600 transition-colors duration-200" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
                  ) : (
                    <button onClick={() => handleEdit(sub)} className="text-blue-500 dark:text-blue-400 hover:underline transition-colors duration-200">Nilai</button>
                  )}
                  {editId === sub._id && (
                    <button onClick={() => setEditId(null)} className="text-gray-500 dark:text-gray-400 ml-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Batal</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
    </div>
  );
}
