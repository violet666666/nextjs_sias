"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Toast from '@/components/common/Toast';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, ChartLegend, ArcElement);

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState({
    overview: {},
    attendance: {},
    grades: {},
    activity: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      if (userData.role !== 'admin' && userData.role !== 'guru') {
        router.push('/cpanel/dashboard');
        return;
      }
      
      fetchAnalytics(userData, timeRange);
    } else {
      router.push('/login');
    }
  }, [router, timeRange]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const newSocket = io("http://localhost:3001", {
        auth: { token },
        transports: ["websocket"]
      });
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (activities) => {
      setAnalytics(prev => ({
        ...prev,
        activity: {
          ...prev.activity,
          recentActivities: activities
        }
      }));
    };
    socket.on('activity_feed_update', handler);
    return () => socket.off('activity_feed_update', handler);
  }, [socket]);

  const fetchAnalytics = async (_, range) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchWithAuth(`/api/analytics/overview?range=${range}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      setAnalytics({
        overview: data.overview || {},
        attendance: data.attendance || {},
        grades: data.grades || {},
        activity: data.activity || {}
      });
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data analytics");
      setToast({ message: "Gagal memuat data analytics", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getMetricCard = (title, value, change, icon, color = "blue") => {
    const isPositive = change >= 0;
    const changeColor = isPositive ? "text-green-600" : "text-red-600";
    const changeIcon = isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <div className="flex items-center mt-2">
              {changeIcon}
              <span className={`ml-1 text-sm font-medium ${changeColor}`}>
                {Math.abs(change)}%
              </span>
              <span className="ml-1 text-sm text-gray-500">vs bulan lalu</span>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
            <div className={`text-${color}-600 dark:text-${color}-400`}>{icon}</div>
          </div>
        </div>
      </div>
    );
  };

  const getChartData = (data, type = 'bar') => {
    if (!data || !data.labels) return null;

    const colors = [
      'rgba(59, 130, 246, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(139, 92, 246, 0.8)'
    ];

    return {
      labels: data.labels,
      datasets: [{
        label: data.label || 'Data',
        data: data.values,
        backgroundColor: colors.slice(0, data.values.length),
        borderColor: colors.slice(0, data.values.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 4,
        tension: 0.4
      }]
    };
  };

  const renderOverviewMetrics = () => {
    const { overview } = analytics;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getMetricCard(
          "Total Siswa",
          overview.totalStudents || 0,
          overview.studentGrowth || 0,
          <Users className="w-6 h-6" />,
          "blue"
        )}
        {getMetricCard(
          "Total Kelas",
          overview.totalClasses || 0,
          overview.classGrowth || 0,
          <BookOpen className="w-6 h-6" />,
          "green"
        )}
        {getMetricCard(
          "Rata-rata Kehadiran",
          `${overview.avgAttendance || 0}%`,
          overview.attendanceGrowth || 0,
          <Calendar className="w-6 h-6" />,
          "yellow"
        )}
        {getMetricCard(
          "Rata-rata Nilai",
          overview.avgGrade || 0,
          overview.gradeGrowth || 0,
          <Award className="w-6 h-6" />,
          "purple"
        )}
      </div>
    );
  };

  const renderAttendanceChart = () => {
    const { attendance } = analytics;
    
    if (!attendance.chartData) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Statistik Kehadiran
          </h3>
          <div className="text-center py-8 text-gray-500">
            Data kehadiran tidak tersedia
          </div>
        </div>
      );
    }

    const chartData = getChartData(attendance.chartData);
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistik Kehadiran
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {attendance.present || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Hadir</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {attendance.late || 0}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Terlambat</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {attendance.absent || 0}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Tidak Hadir</div>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <Bar data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: false }
            },
            scales: {
              x: { grid: { color: '#E5E7EB' }, ticks: { color: '#6B7280' } },
              y: { grid: { color: '#E5E7EB' }, ticks: { color: '#6B7280' } }
            }
          }} />
        </div>
      </div>
    );
  };

  const renderGradeAnalytics = () => {
    const { grades } = analytics;
    
    // Example pie chart data for grade distribution
    const pieData = grades && grades.distribution ? {
      labels: grades.distribution.labels,
      datasets: [
        {
          data: grades.distribution.values,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
        },
      ],
    } : null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analisis Nilai
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {grades.avgGrade || 0}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Rata-rata</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {grades.highestGrade || 0}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Tertinggi</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {grades.lowestGrade || 0}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Terendah</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {grades.passRate || 0}%
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Lulus</div>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          {pieData ? (
            <Pie data={pieData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom', labels: { color: '#6B7280' } },
                title: { display: false }
              }
            }} />
          ) : (
            <div className="text-center">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Distribusi nilai akan ditampilkan di sini</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActivityFeed = () => {
    const { activity } = analytics;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aktivitas Terbaru
        </h3>
        <div className="space-y-4">
          {(activity.recentActivities || []).map((item, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{item.description}</p>
                <p className="text-xs text-gray-500">{item.timestamp}</p>
              </div>
            </div>
          ))}
          {(!activity.recentActivities || activity.recentActivities.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              Belum ada aktivitas terbaru
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru']}>
      <div className="max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analisis data dan statistik sistem akademik
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Periode Waktu:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="quarter">3 Bulan Terakhir</option>
              <option value="year">Tahun Ini</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Metrics */}
            {renderOverviewMetrics()}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {renderAttendanceChart()}
              {renderGradeAnalytics()}
            </div>

            {/* Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {renderActivityFeed()}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quick Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analytics.overview?.totalTasks || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tugas Selesai</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analytics.overview?.completedTasks || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tugas Pending</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analytics.overview?.pendingTasks || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Waktu Submit</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {analytics.overview?.avgSubmitTime || '0'} jam
                    </span>
                  </div>
                </div>
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