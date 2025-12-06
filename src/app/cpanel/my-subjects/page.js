"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import TaskModal from '@/components/class-detail/TaskModal';
import { BookOpen, FileText, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Calendar, Clock, Users, Award, ClipboardCheck, X, Info } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classesMap, setClassesMap] = useState({}); // Map subject_id -> classes[]
  const [tasksByKelas, setTasksByKelas] = useState({}); // Map kelasId -> tasks[]
  const [loadingTasks, setLoadingTasks] = useState({}); // Map kelasId -> boolean
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedKelas, setExpandedKelas] = useState({}); // Map kelasId -> boolean
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedKelasForTask, setSelectedKelasForTask] = useState(null);
  const [selectedMapelForTask, setSelectedMapelForTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedKelasForDetail, setSelectedKelasForDetail] = useState(null);
  const [detailData, setDetailData] = useState({
    students: [],
    attendance: [],
    nilai: [],
    loading: false
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    
    if (u.role !== "guru") {
      setToast({ message: "Hanya untuk guru", type: "error" });
      return;
    }
    
    fetchSubjects(u);
  }, [refreshKey]);

  const fetchSubjects = async (currentUser) => {
    setLoading(true);
    try {
      const guruId = currentUser._id || currentUser.id;
      
      // Fetch mata pelajaran yang diajar oleh guru ini
      const subjectsRes = await fetchWithAuth(`/api/subjects?guru_id=${guruId}`);
      if (!subjectsRes.ok) throw new Error("Gagal mengambil data mata pelajaran");
      
      const subjectsData = await subjectsRes.json();
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
      // Fetch semua kelas untuk setiap mata pelajaran
      const classesPromises = subjectsData.map(async (subject) => {
        const kelasIds = subject.kelas_ids || [];
        if (kelasIds.length > 0) {
          // Fetch semua kelas dari array kelas_ids
          const kelasPromises = kelasIds.map(async (kelasId) => {
            const id = typeof kelasId === 'object' ? (kelasId._id || kelasId.id) : kelasId;
            try {
              const kelasRes = await fetchWithAuth(`/api/kelas/${id}`);
              if (kelasRes.ok) {
                return await kelasRes.json();
              }
            } catch (err) {
              console.error(`Error fetching kelas ${id}:`, err);
            }
            return null;
          });
          
          const kelasResults = await Promise.all(kelasPromises);
          const validKelas = kelasResults.filter(k => k !== null);
          
          return {
            subjectId: subject._id,
            kelas: validKelas
          };
        }
        return { subjectId: subject._id, kelas: [] };
      });
      
      const classesResults = await Promise.all(classesPromises);
      const newClassesMap = {};
      classesResults.forEach(({ subjectId, kelas }) => {
        newClassesMap[subjectId] = kelas;
      });
      setClassesMap(newClassesMap);
      
    } catch (err) {
      setToast({ message: err.message || "Gagal memuat data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tugas untuk kelas tertentu
  const fetchTasksForKelas = async (kelasId, mapelId) => {
    const key = `${kelasId}-${mapelId}`;
    if (tasksByKelas[key]) return; // Already loaded
    
    setLoadingTasks(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetchWithAuth(`/api/tugas?kelas_id=${kelasId}&mapel_id=${mapelId}`);
      if (res.ok) {
        const data = await res.json();
        setTasksByKelas(prev => ({ ...prev, [key]: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleExpand = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const toggleExpandKelas = (kelasId, mapelId) => {
    const key = `${kelasId}-${mapelId}`;
    setExpandedKelas(prev => {
      const isExpanding = !prev[key];
      if (isExpanding) {
        fetchTasksForKelas(kelasId, mapelId);
      }
      return { ...prev, [key]: isExpanding };
    });
  };

  const handleAddTask = (kelas, mapel) => {
    setSelectedKelasForTask(kelas);
    setSelectedMapelForTask(mapel);
    setEditTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task, kelas, mapel) => {
    setSelectedKelasForTask(kelas);
    setSelectedMapelForTask(mapel);
    setEditTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId, kelasId, mapelId) => {
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
        const key = `${kelasId}-${mapelId}`;
        setTasksByKelas(prev => {
          const updated = { ...prev };
          if (updated[key]) {
            updated[key] = updated[key].filter(t => t._id !== taskId);
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
    if (selectedKelasForTask && selectedMapelForTask) {
      const key = `${selectedKelasForTask._id}-${selectedMapelForTask._id}`;
      // Refresh tasks
      setTasksByKelas(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
      fetchTasksForKelas(selectedKelasForTask._id, selectedMapelForTask._id);
    }
    setShowTaskModal(false);
    setSelectedKelasForTask(null);
    setSelectedMapelForTask(null);
    setEditTask(null);
  };

  const handleShowDetail = async (kelas) => {
    setSelectedKelasForDetail(kelas);
    setShowDetailModal(true);
    setDetailData({ students: [], attendance: [], nilai: [], loading: true });
    
    try {
      // Fetch siswa, absensi, dan nilai secara parallel
      const [studentsRes, attendanceRes, nilaiRes] = await Promise.all([
        fetchWithAuth(`/api/kelas/${kelas._id}/students`),
        fetchWithAuth(`/api/kehadiran?kelas_id=${kelas._id}`),
        fetchWithAuth(`/api/submissions?kelas_id=${kelas._id}`)
      ]);

      const students = studentsRes.ok ? await studentsRes.json() : [];
      const attendance = attendanceRes.ok ? await attendanceRes.json() : [];
      const nilai = nilaiRes.ok ? await nilaiRes.json() : [];

      setDetailData({
        students: Array.isArray(students) ? students : [],
        attendance: Array.isArray(attendance) ? attendance : [],
        nilai: Array.isArray(nilai) ? nilai : [],
        loading: false
      });
    } catch (err) {
      console.error('Error fetching detail:', err);
      setDetailData({ students: [], attendance: [], nilai: [], loading: false });
      setToast({ message: 'Gagal memuat detail kelas', type: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['guru']}>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                Mata Pelajaran Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Kelola mata pelajaran yang Anda ajar dan tugas untuk setiap kelas
              </p>
            </div>
          </div>

          {toast.message && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast({ message: "", type: "success" })} 
            />
          )}

          {subjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Belum ada mata pelajaran</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Anda belum mengajar mata pelajaran apapun.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject) => {
                const classes = classesMap[subject._id] || [];
                const isExpanded = expandedSubject === subject._id;
                
                return (
                  <div
                    key={subject._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
                  >
                    {/* Subject Header */}
                    <div
                      className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => toggleExpand(subject._id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {subject.nama}
                            </h3>
                            {subject.kode && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kode: {subject.kode}
                              </p>
                            )}
                            {subject.deskripsi && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {subject.deskripsi}
                              </p>
                            )}
                            {subject.total_jam_per_minggu && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <Clock className="w-4 h-4 inline mr-1" />
                                {subject.total_jam_per_minggu} jam/minggu
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {classes.length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {classes.length === 1 ? 'Kelas' : 'Kelas'}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Classes List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        {classes.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <p>Mata pelajaran ini belum ditugaskan ke kelas manapun.</p>
                          </div>
                        ) : (
                          <div className="p-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                              Kelas yang Mengikuti Mata Pelajaran Ini
                            </h4>
                            <div className="space-y-4">
                              {classes.map((kelas) => {
                                const key = `${kelas._id}-${subject._id}`;
                                const isKelasExpanded = expandedKelas[key];
                                const tasks = tasksByKelas[key] || [];
                                const isLoadingTask = loadingTasks[key];

                                return (
                                  <div
                                    key={kelas._id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                  >
                                    {/* Kelas Header */}
                                    <div className="p-4 flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                          </div>
                                          <div>
                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                              {kelas.nama_kelas}
                                            </h5>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                              <span>Tahun Ajaran: {kelas.tahun_ajaran || '-'}</span>
                                              <span>•</span>
                                              <span>Wali Kelas: {kelas.guru_id?.nama || '-'}</span>
                                            </div>
                                            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                              kelas.status_kelas === 'aktif'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                              {kelas.status_kelas === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddTask(kelas, subject);
                                          }}
                                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                                          title="Tambah Tugas"
                                        >
                                          <Plus className="w-4 h-4" />
                                          <span className="hidden sm:inline">Tugas</span>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowDetail(kelas);
                                          }}
                                          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm flex items-center gap-1"
                                          title="Lihat Detail Kelas"
                                        >
                                          <Info className="w-4 h-4" />
                                          Detail
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpandKelas(kelas._id, subject._id);
                                          }}
                                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                          title={isKelasExpanded ? 'Tutup Tugas' : 'Lihat Tugas'}
                                        >
                                          {isKelasExpanded ? (
                                            <ChevronUp className="w-5 h-5" />
                                          ) : (
                                            <ChevronDown className="w-5 h-5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Expanded Tasks List */}
                                    {isKelasExpanded && (
                                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4">
                                        {isLoadingTask ? (
                                          <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Memuat tugas...</p>
                                          </div>
                                        ) : tasks.length === 0 ? (
                                          <div className="text-center py-4">
                                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada tugas untuk kelas ini.</p>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            {tasks.map(task => (
                                              <div key={task._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <h6 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{task.judul}</h6>
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
                                                  <div className="flex items-center gap-1 ml-2">
                                                    <button
                                                      onClick={() => handleEditTask(task, kelas, subject)}
                                                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                      title="Edit"
                                                    >
                                                      <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeleteTask(task._id, kelas._id, subject._id)}
                                                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                      title="Hapus"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
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
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tugas */}
      {showTaskModal && selectedKelasForTask && selectedMapelForTask && (
        <TaskModal
          kelasId={selectedKelasForTask._id}
          initialData={editTask}
          onSuccess={handleTaskSuccess}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedKelasForTask(null);
            setSelectedMapelForTask(null);
            setEditTask(null);
          }}
          mapelId={selectedMapelForTask._id}
        />
      )}

      {/* Modal Detail Kelas */}
      {showDetailModal && selectedKelasForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Detail Kelas: {selectedKelasForDetail.nama_kelas}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Tahun Ajaran: {selectedKelasForDetail.tahun_ajaran || '-'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedKelasForDetail(null);
                  setDetailData({ students: [], attendance: [], nilai: [], loading: false });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailData.loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statistik Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Jumlah Murid */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Jumlah Murid</p>
                          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                            {detailData.students.length}
                          </p>
                        </div>
                        <Users className="w-12 h-12 text-blue-400 dark:text-blue-500 opacity-50" />
                      </div>
                    </div>

                    {/* Statistik Absensi */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Rata-rata Kehadiran</p>
                          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                            {(() => {
                              const total = detailData.attendance.length;
                              const hadir = detailData.attendance.filter(a => a.status === 'Hadir').length;
                              return total > 0 ? Math.round((hadir / total) * 100) : 0;
                            })()}%
                          </p>
                        </div>
                        <ClipboardCheck className="w-12 h-12 text-green-400 dark:text-green-500 opacity-50" />
                      </div>
                    </div>

                    {/* Statistik Nilai */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Rata-rata Nilai</p>
                          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                            {(() => {
                              const nilaiList = detailData.nilai.filter(n => n.nilai && n.nilai > 0);
                              if (nilaiList.length === 0) return 0;
                              const total = nilaiList.reduce((sum, n) => sum + (n.nilai || 0), 0);
                              return Math.round(total / nilaiList.length);
                            })()}
                          </p>
                        </div>
                        <Award className="w-12 h-12 text-purple-400 dark:text-purple-500 opacity-50" />
                      </div>
                    </div>
                  </div>

                  {/* Detail Absensi */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5" />
                      Statistik Kehadiran
                    </h3>
                    {detailData.attendance.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">Belum ada data kehadiran</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {detailData.attendance.filter(a => a.status === 'Hadir').length}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">Hadir</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {detailData.attendance.filter(a => a.status === 'Izin').length}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Izin</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                            {detailData.attendance.filter(a => a.status === 'Sakit').length}
                          </p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Sakit</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {detailData.attendance.filter(a => a.status === 'Alfa').length}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">Alfa</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Detail Nilai */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Statistik Nilai
                    </h3>
                    {detailData.nilai.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">Belum ada data nilai</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {detailData.nilai.filter(n => n.nilai >= 90).length}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">A (90-100)</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {detailData.nilai.filter(n => n.nilai >= 80 && n.nilai < 90).length}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">B (80-89)</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                            {detailData.nilai.filter(n => n.nilai >= 70 && n.nilai < 80).length}
                          </p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">C (70-79)</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {detailData.nilai.filter(n => n.nilai < 70 && n.nilai > 0).length}
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">D (&lt;70)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daftar Siswa */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Daftar Siswa ({detailData.students.length})
                    </h3>
                    {detailData.students.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">Belum ada siswa di kelas ini</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">#</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nama</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">NIS</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Email</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {detailData.students.map((s, idx) => (
                              <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-4 py-3 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.nama}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.nis || '-'}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.email}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
