"use client";
import { useState, useRef, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Toast from './Toast';

const FileUpload = ({ 
  onUploadComplete, 
  onUploadError, 
  multiple = false, 
  category = 'other',
  entityType = null,
  entityId = null,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [],
  className = ''
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [toast, setToast] = useState({ message: "", type: "success" });
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate number of files
    if (files.length + fileArray.length > maxFiles) {
      setToast({ 
        message: `Maximum ${maxFiles} files allowed`, 
        type: "error" 
      });
      return;
    }

    // Validate file types
    const invalidFiles = fileArray.filter(file => {
      if (allowedTypes.length === 0) return false;
      return !allowedTypes.includes(file.type);
    });

    if (invalidFiles.length > 0) {
      setToast({ 
        message: `Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`, 
        type: "error" 
      });
      return;
    }

    // Validate file sizes
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setToast({ 
        message: `File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}`, 
        type: "error" 
      });
      return;
    }

    // Add files to state
    const newFiles = fileArray.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files, maxFiles, allowedTypes, maxSize]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach((fileObj, index) => {
      formData.append('files', fileObj.file);
    });
    
    formData.append('category', category);
    if (entityType) formData.append('entityType', entityType);
    if (entityId) formData.append('entityId', entityId);

    try {
      const response = await fetchWithAuth('/api/files', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setToast({ 
          message: `Successfully uploaded ${files.length} file(s)`, 
          type: "success" 
        });
        
        // Update file status
        setFiles(prev => prev.map(f => ({ ...f, status: 'completed' })));
        
        if (onUploadComplete) {
          onUploadComplete(result);
        }
        
        // Clear files after successful upload
        setTimeout(() => {
          setFiles([]);
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setToast({ 
        message: error.message || 'Upload failed', 
        type: "error" 
      });
      
      // Update file status
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {formatFileSize(maxSize)} each
            </p>
            {allowedTypes.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Allowed types: {allowedTypes.join(', ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={allowedTypes.join(',')}
        className="hidden"
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Selected Files ({files.length})
            </h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setFiles([])}
                className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={uploadFiles}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {files.map((fileObj) => (
              <div
                key={fileObj.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                  fileObj.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600'
                    : fileObj.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                }`}
              >
                {/* File Icon */}
                <div className="text-2xl">{getFileIcon(fileObj.type)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {fileObj.name}
                    </p>
                    {fileObj.status === 'completed' && (
                      <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                    )}
                    {fileObj.status === 'error' && (
                      <span className="text-red-600 dark:text-red-400 text-xs">✗</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {formatFileSize(fileObj.size)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {fileObj.preview && (
                    <button
                      type="button"
                      onClick={() => window.open(fileObj.preview, '_blank')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(fileObj.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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

export default FileUpload; 