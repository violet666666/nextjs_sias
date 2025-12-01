'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Folder, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Download,
  Trash2,
  Share,
  MoreVertical,
  Search,
  Grid,
  List,
  Eye,
  Edit,
  Copy,
  Star,
  StarOff
} from 'lucide-react';

// File Manager Component
export const FileManager = ({ user, role }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentPath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      'image': Image,
      'video': Video,
      'audio': Music,
      'application/pdf': FileText,
      'text': FileText,
      'archive': Archive,
      'default': File
    };

    if (fileType.startsWith('image/')) return icons.image;
    if (fileType.startsWith('video/')) return icons.video;
    if (fileType.startsWith('audio/')) return icons.audio;
    if (fileType === 'application/pdf') return icons['application/pdf'];
    if (fileType.startsWith('text/')) return icons.text;
    if (fileType.includes('zip') || fileType.includes('rar')) return icons.archive;
    
    return icons.default;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (uploadedFiles) => {
    setIsUploading(true);
    const formData = new FormData();
    
    Array.from(uploadedFiles).forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('path', currentPath);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [uploadedFiles[0].name]: percentCompleted }));
        }
      });

      if (response.ok) {
        fetchFiles();
        setShowUploadModal(false);
        setUploadProgress({});
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileUpload(droppedFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileSelect = (file) => {
    setSelectedFiles(prev => 
      prev.find(f => f.id === file.id)
        ? prev.filter(f => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleFilePreview = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handleFileDownload = async (file) => {
    try {
      const response = await fetch(`/api/files/download/${file.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleFileDelete = async (fileIds) => {
    if (!confirm('Are you sure you want to delete the selected files?')) return;

    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fileIds }),
      });

      if (response.ok) {
        fetchFiles();
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const handleCreateFolder = async (folderName) => {
    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name: folderName,
          path: currentPath
        }),
      });

      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const filteredItems = [...folders, ...files].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            File Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your files and folders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => setCurrentPath('/')}
          className="hover:text-gray-900 dark:hover:text-gray-100"
        >
          Home
        </button>
        {currentPath.split('/').filter(Boolean).map((segment, index, array) => (
          <div key={index} className="flex items-center space-x-2">
            <span>/</span>
            <button
              onClick={() => {
                const newPath = '/' + array.slice(0, index + 1).join('/');
                setCurrentPath(newPath);
              }}
              className="hover:text-gray-900 dark:hover:text-gray-100"
            >
              {segment}
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Files Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {selectedFiles.length} file(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFileDownload(selectedFiles[0])}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => handleFileDelete(selectedFiles.map(f => f.id))}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Grid/List */}
      <div
        ref={dropZoneRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
            : 'space-y-2'
        }`}
      >
        {filteredItems.map((item) => {
          const isSelected = selectedFiles.find(f => f.id === item.id);
          const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);

          return (
            <div
              key={item.id}
              onClick={() => item.type === 'folder' ? setCurrentPath(item.path) : handleFileSelect(item)}
              onDoubleClick={() => item.type !== 'folder' && handleFilePreview(item)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${viewMode === 'list' ? 'flex items-center space-x-3' : 'text-center'}
              `}
            >
              <div className={`${viewMode === 'list' ? 'flex items-center space-x-3 flex-1' : ''}`}>
                <div className={`${viewMode === 'list' ? 'w-10 h-10' : 'w-12 h-12 mx-auto mb-2'}`}>
                  <Icon className={`w-full h-full text-gray-600 dark:text-gray-400`} />
                </div>
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${viewMode === 'list' ? 'text-left' : ''}`}>
                    {item.name}
                  </p>
                  {item.type !== 'folder' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(item.size)}
                    </p>
                  )}
                </div>
              </div>

              {/* File Actions */}
              {item.type !== 'folder' && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilePreview(item);
                      }}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDownload(item);
                      }}
                      className="p-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewFile && (
        <PreviewModal
          file={previewFile}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
        />
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ onClose, onUpload, isUploading, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Upload Files
        </h2>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            browse files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => e.target.files && onUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {isUploading && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{fileName}</span>
                  <span className="text-gray-600 dark:text-gray-400">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Preview Modal Component
const PreviewModal = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <img
          src={`/api/files/preview/${file.id}`}
          alt={file.name}
          className="max-w-full max-h-full object-contain"
          onLoad={() => setLoading(false)}
        />
      );
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <video
          controls
          className="max-w-full max-h-full"
          onLoadedData={() => setLoading(false)}
        >
          <source src={`/api/files/preview/${file.id}`} type={file.mimeType} />
        </video>
      );
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <audio
          controls
          className="max-w-full"
          onLoadedData={() => setLoading(false)}
        >
          <source src={`/api/files/preview/${file.id}`} type={file.mimeType} />
        </audio>
      );
    }

    return (
      <div className="text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Preview not available for this file type
        </p>
        <button
          onClick={() => window.open(`/api/files/preview/${file.id}`, '_blank')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Open in new tab
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {file.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default FileManager; 