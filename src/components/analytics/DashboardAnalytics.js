"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardAnalytics = ({ userRole }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/analytics/dashboard?period=${selectedPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!analytics) return <div>No data available</div>;

  const renderOverviewCards = () => {
    const cards = [
      { title: 'Total Users', value: analytics.totalUsers, icon: '👥', color: 'bg-blue-500' },
      { title: 'Total Classes', value: analytics.totalClasses, icon: '🏫', color: 'bg-green-500' },
      { title: 'Total Assignments', value: analytics.totalAssignments, icon: '📝', color: 'bg-yellow-500' },
      { title: 'Total Attendance', value: analytics.totalAttendance, icon: '📊', color: 'bg-purple-500' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full text-white text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUsersByRole = () => {
    if (!analytics.usersByRole) return null;

    const data = Object.entries(analytics.usersByRole).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Users by Role
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderMonthlyGrowth = () => {
    if (!analytics.monthlyGrowth) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Monthly Growth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analytics.monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area type="monotone" dataKey="classes" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            <Area type="monotone" dataKey="assignments" stackId="1" stroke="#ffc658" fill="#ffc658" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderClassPerformance = () => {
    if (!analytics.classPerformance) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Class Performance
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.classPerformance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kelas" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageGrade" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAttendanceStats = () => {
    if (!analytics.attendanceStats) return null;

    const data = Object.entries(analytics.attendanceStats).map(([status, count]) => ({
      status,
      count
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Attendance Statistics
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (!analytics.recentActivity) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {analytics.recentActivity.slice(0, 10).map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex-shrink-0">
                {activity.type === 'user_registration' && <span className="text-blue-500">👤</span>}
                {activity.type === 'class_creation' && <span className="text-green-500">🏫</span>}
                {activity.type === 'assignment_creation' && <span className="text-yellow-500">📝</span>}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {activity.description}
                </p>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(activity.timestamp).toLocaleDateString('id-ID')}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStudentSpecificCharts = () => {
    if (userRole !== 'siswa') return null;

    return (
      <>
        {analytics.myAttendance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              My Attendance Rate
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {analytics.myAttendance.rate}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analytics.myAttendance.present} of {analytics.myAttendance.total} sessions
              </p>
            </div>
          </div>
        )}

        {analytics.myGrades && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              My Grade Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.myGrades.average}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.myGrades.total}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Grades</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analytics.myGrades.highest}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highest</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.myGrades.lowest}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Lowest</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTeacherSpecificCharts = () => {
    if (userRole !== 'guru') return null;

    return (
      <>
        {analytics.classPerformance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              My Classes Performance
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.classPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kelas" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageGrade" fill="#8884d8" name="Average Grade" />
                <Bar dataKey="totalStudents" fill="#82ca9d" name="Total Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {analytics.assignmentCompletion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Assignment Completion Rate
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.assignmentCompletion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tugas" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                <Bar dataKey="totalSubmissions" fill="#8884d8" name="Total Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard Analytics
        </h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderUsersByRole()}
        {renderAttendanceStats()}
      </div>

      {/* Full Width Charts */}
      {renderMonthlyGrowth()}
      {renderClassPerformance()}
      {renderTeacherSpecificCharts()}
      {renderStudentSpecificCharts()}
      {renderRecentActivity()}
    </div>
  );
};

export default DashboardAnalytics; 