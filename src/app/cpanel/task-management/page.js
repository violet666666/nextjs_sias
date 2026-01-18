"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useRealTimeTasks } from "@/lib/hooks/useRealTimeTasks";
import { useUserStatus } from "@/lib/hooks/useUserStatus";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function TaskManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Real-time hooks
  const { 
    tasks, 
    submissions, 
    loading, 
    error, 
    createTask, 
    submitTask, 
    updateGrade 
  } = useRealTimeTasks(selectedClass);

  const { 
    onlineUsers, 
    userActivity, 
    logActivity 
  } = useUserStatus();

  // Form states
  const [taskForm, setTaskForm] = useState({
    judul: "",
    deskripsi: "",
    tanggal_deadline: ""
  });

  const [gradeForm, setGradeForm] = useState({
    nilai: "",
    feedback: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Log activity
      logActivity('view_task_management', { page: 'task_management' });
      
      // Fetch classes for teacher
      if (userData.role === "guru") {
        fetchClasses(userData.id || userData._id);
      } else if (userData.role === "admin") {
        fetchClasses();
      }
    } else {
      router.push("/login");
    }
  }, [router, logActivity]);

  const fetchClasses = async (teacherId) => {
    try {
      const endpoint = teacherId ? `/api/kelas?guru_id=${teacherId}` : '/api/kelas';
      const res = await fetchWithAuth(endpoint);
      if (res.ok) {
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) {
          setSelectedClass(data[0]._id);
        }
      }
    } catch (error) {
      setToast({ message: "Gagal memuat kelas", type: "error" });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setToast({ message: "Pilih kelas terlebih dahulu", type: "error" });
      return;
    }

    const success = await createTask(taskForm);
    if (success) {
      setShowCreateModal(false);
      setTaskForm({ judul: "", deskripsi: "", tanggal_deadline: "" });
      setToast({ message: "Tugas berhasil dibuat", type: "success" });
      logActivity('create_task', { classId: selectedClass, taskTitle: taskForm.judul });
    } else {
      setToast({ message: "Gagal membuat tugas", type: "error" });
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const success = await updateGrade(selectedSubmission._id, gradeForm);
    if (success) {
      setShowGradeModal(false);
      setGradeForm({ nilai: "", feedback: "" });
      setSelectedSubmission(null);
      setToast({ message: "Nilai berhasil diperbarui", type: "success" });
      logActivity('grade_submission', { 
        submissionId: selectedSubmission._id, 
        nilai: gradeForm.nilai 
      });
    } else {
      setToast({ message: "Gagal memperbarui nilai", type: "error" });
    }
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({ 
      nilai: submission.nilai || "", 
      feedback: submission.feedback || "" 
    });
    setShowGradeModal(true);
  };

  const getSubmissionStatus = (task) => {
    const deadline = new Date(task.tanggal_deadline);
    const now = new Date();
    const submission = submissions.find(s => s.tugas_id === task._id);
    
    if (submission) {
      return { status: "submitted", icon: CheckCircle, color: "text-green-600" };
    } else if (deadline < now) {
      return { status: "overdue", icon: XCircle, color: "text-red-600" };
    } else {
      return { status: "pending", icon: Clock, color: "text-yellow-600" };
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['admin','guru']}>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manajemen Tugas</h1>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            color="primary"
            icon={<Plus className="w-4 h-4" />}
          >
            Buat Tugas Baru
          </Button>
        </div>

        {/* Real-time Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Online Users</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {onlineUsers.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Tugas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tasks.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Submissions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {submissions.length}
            </p>
          </div>
        </div>

        {/* Class Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pilih Kelas
          </label>
          <select
            value={selectedClass || ""}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Kelas</option>
            {classes.map((kelas) => (
              <option key={kelas._id} value={kelas._id}>
                {kelas.nama_kelas}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Daftar Tugas</h2>
              </div>
              <div className="p-4">
                {tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada tugas</p>
                ) : (
                  <ResponsiveTable>
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Judul</th>
                        <th className="px-4 py-2">Deskripsi</th>
                        <th className="px-4 py-2">Deadline</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => {
                        const status = getSubmissionStatus(task);
                        const StatusIcon = status.icon;
                        return (
                          <tr key={task._id}>
                            <td className="px-4 py-2">{task.judul}</td>
                            <td className="px-4 py-2">{task.deskripsi}</td>
                            <td className="px-4 py-2">{new Date(task.tanggal_deadline).toLocaleDateString()}</td>
                            <td className="px-4 py-2 flex items-center gap-2"><StatusIcon className={`w-5 h-5 ${status.color}`} />{status.status}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </ResponsiveTable>
                )}
              </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Pengumpulan Tugas</h2>
              </div>
              <div className="p-4">
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada pengumpulan</p>
                ) : (
                  <ResponsiveTable>
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Siswa</th>
                        <th className="px-4 py-2">Tugas</th>
                        <th className="px-4 py-2">Nilai</th>
                        <th className="px-4 py-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission._id}>
                          <td className="px-4 py-2">{submission.siswa_id?.nama || 'Unknown Student'}</td>
                          <td className="px-4 py-2">{submission.tugas_id?.judul || 'Unknown Task'}</td>
                          <td className="px-4 py-2">{submission.nilai || '-'}</td>
                          <td className="px-4 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openGradeModal(submission)}
                              icon={<Edit className="w-4 h-4" />}
                            >
                              {submission.nilai ? 'Edit Nilai' : 'Nilai'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ResponsiveTable>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateModal && (
          <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
            <form onSubmit={handleCreateTask} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-4">Buat Tugas Baru</h2>
              
              <Input
                label="Judul Tugas"
                value={taskForm.judul}
                onChange={(e) => setTaskForm(prev => ({ ...prev, judul: e.target.value }))}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={taskForm.deskripsi}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <Input
                label="Deadline"
                type="datetime-local"
                value={taskForm.tanggal_deadline}
                onChange={(e) => setTaskForm(prev => ({ ...prev, tanggal_deadline: e.target.value }))}
                required
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" color="primary">
                  Buat Tugas
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Grade Submission Modal */}
        {showGradeModal && selectedSubmission && (
          <Modal open={showGradeModal} onClose={() => setShowGradeModal(false)}>
            <form onSubmit={handleGradeSubmission} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-4">Nilai Tugas</h2>
              
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Siswa:</strong> {selectedSubmission.siswa_id?.nama}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Tugas:</strong> {selectedSubmission.tugas_id?.judul}
                </p>
              </div>
              
              <Input
                label="Nilai"
                type="number"
                min="0"
                max="100"
                value={gradeForm.nilai}
                onChange={(e) => setGradeForm(prev => ({ ...prev, nilai: e.target.value }))}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm(prev => ({ ...prev, feedback: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowGradeModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" color="primary">
                  Simpan Nilai
                </Button>
              </div>
            </form>
          </Modal>
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