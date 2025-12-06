import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import TaskModal from './TaskModal';
import { BookOpen, User, Clock, FileText, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import Toast from '../common/Toast';

export default function MataPelajaranSection({ kelas, kelasId, onSuccess, userRole = 'admin' }) {
  const [mapelList, setMapelList] = useState([]);
  const [allMapel, setAllMapel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState('');
  const [expandedMapel, setExpandedMapel] = useState({});
  const [tasksByMapel, setTasksByMapel] = useState({});
  const [loadingTasks, setLoadingTasks] = useState({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMapelForTask, setSelectedMapelForTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Get current user
  useEffect(() => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    setCurrentUser(u);
  }, []);

  // Load mata pelajaran
  useEffect(() => {
    setLoading(true);
    try {
      if (kelas?.matapelajaran_ids && Array.isArray(kelas.matapelajaran_ids) && kelas.matapelajaran_ids.length > 0) {
        const validMapel = kelas.matapelajaran_ids.filter(m => m !== null && m !== undefined);
        setMapelList(validMapel);
      } else {
        setMapelList([]);
      }
      setError('');
    } catch (err) {
      setError(err.message);
      setMapelList([]);
    } finally {
      setLoading(false);
    }
  }, [kelas?.matapelajaran_ids]);

  // Fetch semua mapel untuk dropdown tambah
  useEffect(() => {
    async function fetchAllMapel() {
      try {
        const res = await fetchWithAuth('/api/subjects');
        if (!res.ok) throw new Error('Gagal mengambil daftar mata pelajaran');
        const data = await res.json();
        setAllMapel(Array.isArray(data) ? data : []);
      } catch {}
    }
    if (showAddModal) fetchAllMapel();
  }, [showAddModal]);

  // Fetch tugas untuk mata pelajaran tertentu
  const fetchTasksForMapel = async (mapelId) => {
    if (tasksByMapel[mapelId]) return; // Already loaded
    
    setLoadingTasks(prev => ({ ...prev, [mapelId]: true }));
    try {
      const res = await fetchWithAuth(`/api/tugas?kelas_id=${kelasId}&mapel_id=${mapelId}`);
      if (res.ok) {
        const data = await res.json();
        setTasksByMapel(prev => ({ ...prev, [mapelId]: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [mapelId]: false }));
    }
  };

  // Toggle expand mata pelajaran
  const toggleExpand = (mapelId) => {
    setExpandedMapel(prev => {
      const isExpanding = !prev[mapelId];
      if (isExpanding) {
        fetchTasksForMapel(mapelId);
      }
      return { ...prev, [mapelId]: isExpanding };
    });
  };

  // Check if current user is teacher of this subject
  const isTeacherOfMapel = (mapel) => {
    if (!currentUser || currentUser.role !== 'guru') return false;
    const userId = currentUser.id || currentUser._id;
    const guruIds = mapel.guru_ids || [];
    return guruIds.some(g => {
      const guruId = typeof g === 'object' ? (g._id || g.id) : g;
      return guruId?.toString() === userId?.toString();
    });
  };

  const handleAddMapel = async (e) => {
    e.preventDefault();
    if (!selectedMapel) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'add-mapel', matapelajaran_id: selectedMapel })
      });
      if (!res.ok) throw new Error('Gagal menambah mata pelajaran ke kelas');
      setShowAddModal(false);
      setSelectedMapel('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setAdding(false);
  };

  const handleRemoveMapel = async (mapelId) => {
    const result = await Swal.fire({
      title: 'Hapus Mata Pelajaran?',
      text: 'Apakah Anda yakin ingin menghapus mata pelajaran ini dari kelas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    setRemoving(mapelId);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'remove-mapel', matapelajaran_id: mapelId })
      });
      if (!res.ok) throw new Error('Gagal menghapus mata pelajaran dari kelas');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setRemoving('');
  };

  const handleAddTask = (mapel) => {
    setSelectedMapelForTask(mapel);
    setEditTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task, mapel) => {
    setSelectedMapelForTask(mapel);
    setEditTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId, mapelId) => {
    const result = await Swal.fire({
      title: 'Hapus Tugas?',
      text: 'Apakah Anda yakin ingin menghapus tugas ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const res = await fetchWithAuth(`/api/tugas/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || 'Gagal menghapus tugas', type: 'error' });
      } else {
        // Refresh tasks
        setTasksByMapel(prev => {
          const updated = { ...prev };
          if (updated[mapelId]) {
            updated[mapelId] = updated[mapelId].filter(t => t._id !== taskId);
          }
          return updated;
        });
        setToast({ message: 'Tugas berhasil dihapus', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat menghapus tugas', type: 'error' });
    }
  };

  const handleTaskSuccess = () => {
    if (selectedMapelForTask) {
      const mapelId = selectedMapelForTask._id || selectedMapelForTask;
      // Refresh tasks
      setTasksByMapel(prev => {
        const updated = { ...prev };
        delete updated[mapelId];
        return updated;
      });
      fetchTasksForMapel(mapelId);
    }
    if (onSuccess) onSuccess();
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Mata Pelajaran di Kelas Ini</h3>
        {userRole !== 'guru' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Mata Pelajaran
          </button>
        )}
      </div>

      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}

      {loading ? (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat data mata pelajaran...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : mapelList.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Belum ada mata pelajaran di kelas ini.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {mapelList.map((m) => {
            const mapelId = m._id || m;
            const mapelNama = m.nama || '-';
            const guruNames = m.guru_ids && Array.isArray(m.guru_ids)
              ? m.guru_ids.map(g => (typeof g === 'object' ? g.nama : g) || g).filter(Boolean).join(', ')
              : '-';
            const totalJam = m.total_jam_per_minggu || 0;
            const isExpanded = expandedMapel[mapelId];
            const tasks = tasksByMapel[mapelId] || [];
            const isLoadingTasks = loadingTasks[mapelId];
            const canAddTask = userRole === 'guru' && isTeacherOfMapel(m) || userRole === 'admin';

            return (
              <div key={mapelId} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header Card */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{mapelNama}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {guruNames}
                            </span>
                            {totalJam > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {totalJam} jam/minggu
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canAddTask && (
                        <button
                          onClick={() => handleAddTask(m)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                          title="Tambah Tugas"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline">Tugas</span>
                        </button>
                      )}
                      {userRole !== 'guru' && (
                        <button
                          onClick={() => handleRemoveMapel(mapelId)}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                          disabled={removing === mapelId}
                          title="Hapus Mata Pelajaran"
                        >
                          {removing === mapelId ? 'Menghapus...' : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(mapelId)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title={isExpanded ? 'Tutup' : 'Lihat Tugas'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content - Daftar Tugas */}
                {isExpanded && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                    {isLoadingTasks ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Memuat tugas...</p>
                      </div>
                    ) : tasks.length === 0 ? (
                      <div className="text-center py-4">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada tugas untuk mata pelajaran ini.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <div key={task._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{task.judul}</h5>
                                {task.deskripsi && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{task.deskripsi}</p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Deadline: {task.tanggal_deadline ? new Date(task.tanggal_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${task.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                    {task.status === 'active' ? 'Aktif' : 'Selesai'}
                                  </span>
                                </div>
                              </div>
                              {canAddTask && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleEditTask(task, m)}
                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task._id, mapelId)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Mata Pelajaran */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddMapel} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">Tambah Mata Pelajaran ke Kelas</h3>
            <div className="space-y-4">
              <select
                required
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                value={selectedMapel}
                onChange={e => setSelectedMapel(e.target.value)}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {allMapel.filter(m => {
                  const currentIds = (kelas.matapelajaran_ids || []).map(id => {
                    if (typeof id === 'object' && id._id) return id._id.toString();
                    return id.toString();
                  });
                  return !currentIds.includes(m._id.toString());
                }).map(m => {
                  const guruName = m.guru_ids && Array.isArray(m.guru_ids) && m.guru_ids.length > 0
                    ? m.guru_ids.map(g => (typeof g === 'object' ? g.nama : g) || g).filter(Boolean).join(', ')
                    : '-';
                  return (
                    <option key={m._id} value={m._id}>{m.nama} ({guruName})</option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
                disabled={adding}
              >
                {adding ? 'Menambah...' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Tugas */}
      {showTaskModal && selectedMapelForTask && (
        <TaskModal
          kelasId={kelasId}
          initialData={editTask}
          onSuccess={handleTaskSuccess}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedMapelForTask(null);
            setEditTask(null);
          }}
          mapelId={selectedMapelForTask._id || selectedMapelForTask}
        />
      )}
    </div>
  );
}
