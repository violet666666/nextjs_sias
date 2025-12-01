"use client";
import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import FileUpload from './FileUpload';
import Toast from './Toast';

const FileManager = ({ 
  category = null,
  entityType = null,
  entityId = null,
  onFileSelect = null,
  selectMode = false,
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    category: category || '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const searchTimeoutRef = useRef(null);

  // Fetch files
  const fetchFiles = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      if (entityType && entityId) {
        params.append('entityType', entityType);
        params.append('entityId', entityId);
      }

      const res = await fetchWithAuth(`/api/files?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setPagination(data.pagination);
      } else {
        throw new Error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchFiles(1);
    }, 500);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    fetchFiles(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchFiles(page);
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    if (selectMode) {
      setSelectedFiles(prev => {
        const isSelected = prev.includes(fileId);
        if (isSelected) {
          return prev.filter(id => id !== fileId);
        } else {
          return [...prev, fileId];
        }
      });
    }
  };

  // Handle file download
  const handleFileDownload = async (file) => {
    try {
      const res = await fetchWithAuth(`/api/files/${file.filename}`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setToast({ message: 'File downloaded successfully', type: "success" });
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setToast({ message: 'Download failed', type: "error" });
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const res = await fetchWithAuth(`/api/files?id=${fileId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setFiles(prev => prev.filter(f => f._id !== fileId));
        setToast({ message: 'File deleted successfully', type: "success" });
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'Delete failed', type: "error" });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) return;
    
    try {
      const deletePromises = selectedFiles.map(fileId =>
        fetchWithAuth(`/api/files?id=${fileId}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      setFiles(prev => prev.filter(f => !selectedFiles.includes(f._id)));
      setSelectedFiles([]);
      setToast({ message: 'Files deleted successfully', type: "success" });
    } catch (error) {
      console.error('Bulk delete error:', error);
      setToast({ message: 'Bulk delete failed', type: "error" });
    }
  };

  // Handle upload complete
  const handleUploadComplete = (uploadedFiles) => {
    setToast({ message: 'Files uploaded successfully', type: "success" });
    setShowUpload(false);
    fetchFiles(1); // Refresh file list
  };

  // Initial fetch
  useEffect(() => {
    fetchFiles();
  }, []);

  // Get file icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          File Manager
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            {showUpload ? 'Cancel Upload' : 'Upload Files'}
          </button>
          {selectMode && selectedFiles.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              Delete Selected ({selectedFiles.length})
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => setToast({ message: error.message, type: "error" })}
            multiple={true}
            category={category}
            entityType={entityType}
            entityId={entityId}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search files..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All Categories</option>
              <option value="assignment">Assignment</option>
              <option value="profile">Profile</option>
              <option value="announcement">Announcement</option>
              <option value="document">Document</option>
              <option value="image">Image</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="createdAt">Date Created</option>
              <option value="filename">Filename</option>
              <option value="size">File Size</option>
              <option value="downloadCount">Downloads</option>
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              View
            </label>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-3 py-2 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 px-3 py-2 text-sm ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No files found
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedFiles.includes(file._id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleFileSelect(file._id)}
                >
                  <div className="text-center space-y-3">
                    <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDownload(file);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                      >
                        Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileDelete(file._id);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {selectMode && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Select
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {files.map((file) => (
                      <tr
                        key={file._id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedFiles.includes(file._id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleFileSelect(file._id)}
                      >
                        {selectMode && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file._id)}
                              onChange={() => handleFileSelect(file._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getFileIcon(file.mimeType)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {file.originalName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-500">
                                {file.uploadedBy?.nama || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {file.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDownload(file);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              Download
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDelete(file._id);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} files
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toast */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: "", type: "success" })} 
      />
    </div>
  );
};

export default FileManager; 