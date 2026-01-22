'use client';
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Color palette for charts
const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316',
  '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${getColorClasses(color)}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// Advanced Dashboard Component
export const AdvancedDashboard = ({ user, role, onError }) => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('attendance');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedMetric]);

  const fetchDashboardData = async () => {
    setLoading(true);
    if (onError) onError("");
    try {
      const response = await fetchWithAuth(`/api/analytics/dashboard?range=${timeRange}&metric=${selectedMetric}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error("Gagal mengambil data analitik dashboard");
      }
    } catch (error) {
      if (onError) onError(error.message);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Siswa"
          value={dashboardData.totalStudents || 0}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Kelas Aktif"
          value={dashboardData.activeClasses || 0}
          icon={BookOpen}
          color="green"
        />
        <MetricCard
          title="Tingkat Penyelesaian"
          value={`${dashboardData.completionRate || 0}%`}
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Rata-rata Nilai"
          value={`${dashboardData.averageGrade || 0}%`}
          icon={Award}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tren Kehadiran
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.attendanceTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="#10B981"
                strokeWidth={2}
                name="Hadir"
              />
              <Line
                type="monotone"
                dataKey="absent"
                stroke="#EF4444"
                strokeWidth={2}
                name="Absen"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Distribusi Nilai
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.gradeDistribution || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dashboardData.gradeDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performa Mata Pelajaran
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={dashboardData.subjectPerformance || []}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" stroke="#6B7280" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
              <Radar
                name="Performa"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Aktivitas Terkini
          </h3>
          <div className="space-y-4">
            {dashboardData.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-100 text-green-600' :
                  activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                  {activity.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                    activity.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                      <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )) || (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Tidak ada aktivitas terkini
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      {/* Teacher Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Kelas Aktif"
          value={dashboardData.myClasses || 0}
          icon={BookOpen}
          color="blue"
        />
        <MetricCard
          title="Total Siswa"
          value={dashboardData.myStudents || 0}
          icon={Users}
          color="indigo"
        />
        <MetricCard
          title="Tugas Aktif"
          value={dashboardData.myAssignments || 0}
          icon={FileText}
          color="green"
        />
        <MetricCard
          title="Tingkat Kehadiran"
          value={`${dashboardData.attendanceRate || 0}%`}
          icon={Calendar}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Performance */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Rata-rata Nilai per Kelas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.classPerformance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="kelas" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageGrade" fill="#8884d8" name="Rata-rata" />
              <Bar dataKey="totalStudents" fill="#82ca9d" name="Jml Siswa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* At Risk Students */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ⚠️ Siswa Perlu Perhatian
            </h3>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full dark:bg-red-900 dark:text-red-200">
              Butuh Tindakan
            </span>
          </div>
          <div className="space-y-3">
            {dashboardData.atRiskStudents && dashboardData.atRiskStudents.length > 0 ? (
              dashboardData.atRiskStudents.map((student, idx) => (
                <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/40">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{student.nama}</p>
                  <ul className="mt-1 text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                    {student.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>Semua siswa dalam kondisi baik!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Completion */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Tingkat Pengumpulan Tugas
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboardData.assignmentCompletion || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tugas" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" fill="#82ca9d" name="Sudah Dinilai" />
            <Bar dataKey="totalSubmissions" fill="#8884d8" name="Total Terkumpul" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Student Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Kelas Saya"
          value={dashboardData.myClasses || 0}
          icon={BookOpen}
          color="blue"
        />
        <MetricCard
          title="Total Tugas"
          value={dashboardData.myAssignments || 0}
          icon={FileText}
          color="red"
        />
        <MetricCard
          title="Rata-rata Nilai"
          value={dashboardData.myGrades?.average || 0}
          icon={Award}
          color="purple"
        />
        <MetricCard
          title="Kehadiran"
          value={`${dashboardData.myAttendance?.rate || 0}%`}
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Deadline Mendatang
        </h3>
        {dashboardData.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.upcomingDeadlines.map((deadline, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{deadline.judul}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{deadline.kelas_id?.nama_kelas || 'Kelas'}</p>
                </div>
                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  {deadline.tanggal_deadline ? new Date(deadline.tanggal_deadline).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>Tidak ada deadline mendatang</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderParentDashboard = () => {
    // Calculate average from childrenPerformance array
    const childrenPerf = dashboardData.childrenPerformance || [];
    const avgGrade = childrenPerf.length > 0
      ? Math.round(childrenPerf.reduce((sum, c) => sum + (c.averageGrade || 0), 0) / childrenPerf.length)
      : 0;

    return (
      <div className="space-y-6">
        {/* Parent Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Jumlah Anak"
            value={dashboardData.childrenCount || 0}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Rata-rata Nilai Anak"
            value={avgGrade}
            icon={Award}
            color="purple"
          />
          <MetricCard
            title="Tingkat Kehadiran"
            value={`${dashboardData.childrenAttendance || 0}%`}
            icon={Calendar}
            color="green"
          />
        </div>

        {/* Children Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performa Anak
          </h3>
          {childrenPerf.length > 0 ? (
            <div className="space-y-4">
              {childrenPerf.map((child, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{child.nama}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{child.totalGrades} tugas dinilai</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-bold ${child.averageGrade >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {child.averageGrade}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Data anak belum tersedia</p>
            </div>
          )}
        </div>

        {/* Recent Updates */}
        {dashboardData.recentUpdates && dashboardData.recentUpdates.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Update Terbaru
            </h3>
            <div className="space-y-3">
              {dashboardData.recentUpdates.map((update, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Award className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{update.description}</p>
                    <p className="text-xs text-gray-500">{update.timestamp ? new Date(update.timestamp).toLocaleDateString('id-ID') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData || Object.keys(dashboardData).length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-12">
        Tidak ada data analitik untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Analytics Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="quarter">Kuartal Ini</option>
            <option value="year">Tahun Ini</option>
          </select>
        </div>
      </div>

      {/* Role-based Dashboard */}
      {role === 'admin' && renderAdminDashboard()}
      {role === 'guru' && renderTeacherDashboard()}
      {role === 'siswa' && renderStudentDashboard()}
      {role === 'orangtua' && renderParentDashboard()}
    </div>
  );
};

export default AdvancedDashboard; 