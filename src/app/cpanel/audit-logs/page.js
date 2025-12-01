"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import { saveAs } from "file-saver";
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    resource_type: "",
    status: "",
    date_start: "",
    date_end: "",
    search: ""
  });
  const [toast, setToast] = useState({ message: "", type: "success" });

  const actionOptions = [
    "CREATE_USER", "UPDATE_USER", "DELETE_USER",
    "CREATE_KELAS", "UPDATE_KELAS", "DELETE_KELAS",
    "CREATE_TUGAS", "UPDATE_TUGAS", "DELETE_TUGAS",
    "CREATE_BULLETIN", "UPDATE_BULLETIN", "DELETE_BULLETIN",
    "LOGIN", "LOGOUT", "LOGIN_FAILED",
    "ENROLL_STUDENT", "REMOVE_STUDENT",
    "UPLOAD_FILE", "DELETE_FILE",
    "GRADE_ASSIGNMENT", "UPDATE_GRADE",
    "MARK_ATTENDANCE", "UPDATE_ATTENDANCE",
    "SEND_NOTIFICATION", "READ_NOTIFICATION",
    "EXPORT_DATA", "IMPORT_DATA",
    "BULK_ACTION", "SYSTEM_UPDATE"
  ];

  const resourceTypeOptions = [
    "USER", "KELAS", "TUGAS", "BULLETIN", "ENROLLMENT", 
    "SUBMISSION", "ATTENDANCE", "NOTIFICATION", "FILE", "SYSTEM"
  ];

  const statusOptions = ["SUCCESS", "FAILED", "PENDING"];

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const res = await fetchWithAuth(`/api/audit-logs?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil audit logs");
      
      const data = await res.json();
      setAuditLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs(1);
  };

  const handleClearFilters = () => {
    setFilters({
      user_id: "",
      action: "",
      resource_type: "",
      status: "",
      date_start: "",
      date_end: "",
      search: ""
    });
    fetchAuditLogs(1);
  };

  const handleExportCSV = () => {
    try {
      let csv = "Timestamp,User,Action,Resource Type,Resource ID,Status,Details,Error Message\n";
      
      auditLogs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('id-ID');
        const user = log.user_id?.nama || log.user_id?.email || 'Unknown';
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        const errorMessage = log.error_message ? log.error_message.replace(/"/g, '""') : '';
        
        csv += `"${timestamp}","${user}","${log.action}","${log.resource_type}","${log.resource_id || ''}","${log.status}","${details}","${errorMessage}"\n`;
      });
      
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      setToast({ message: "Audit logs berhasil diekspor", type: "success" });
    } catch (error) {
      setToast({ message: "Gagal mengekspor audit logs", type: "error" });
    }
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
          <button
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilterSubmit} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400" title="Cari berdasarkan pesan detail atau error message">
                  (ℹ️)
                </span>
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cari berdasarkan pesan detail atau error message..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mencari dalam detail pesan atau pesan error dari log
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {actionOptions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
              <select
                value={filters.resource_type}
                onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                {resourceTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Start</label>
              <input
                type="date"
                value={filters.date_start}
                onChange={(e) => handleFilterChange('date_start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date End</label>
              <input
                type="date"
                value={filters.date_end}
                onChange={(e) => handleFilterChange('date_end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto rounded-lg">
          <ResponsiveTable>
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Timestamp</th>
                <th className="px-4 py-2 border-b">User</th>
                <th className="px-4 py-2 border-b">Action</th>
                <th className="px-4 py-2 border-b">Resource Type</th>
                <th className="px-4 py-2 border-b">Resource ID</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Details</th>
                <th className="px-4 py-2 border-b">Error Message</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log._id}>
                  <td className="px-4 py-2 border-b">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-2 border-b">{log.user_id?.nama || log.user_id?.email || 'Unknown'}</td>
                  <td className={`px-4 py-2 border-b ${getActionColor(log.action)}`}>{log.action}</td>
                  <td className="px-4 py-2 border-b">{log.resource_type}</td>
                  <td className="px-4 py-2 border-b">{log.resource_id || ''}</td>
                  <td className={`px-4 py-2 border-b ${getStatusColor(log.status)}`}>{log.status}</td>
                  <td className="px-4 py-2 border-b text-xs break-all max-w-xs">{log.details ? JSON.stringify(log.details) : ''}</td>
                  <td className="px-4 py-2 border-b text-xs break-all max-w-xs">{log.error_message}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchAuditLogs(pagination.page - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchAuditLogs(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </div>
  );
} 