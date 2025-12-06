import React, { useState } from 'react';
import useKelasDetail from './useKelasDetail';
import useKelasEnrollments from './useKelasEnrollments';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import TaskModal from './TaskModal';
import Toast from '../common/Toast';
import StatCard from './StatCard';
import TabNav from './TabNav';
import MataPelajaranSection from './MataPelajaranSection';
import { 
  Info, Users, BookOpen, FileText, Award, ClipboardCheck, Bell,
  Plus, Edit2, Trash2, Calendar, User, Mail, Clock, GraduationCap
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function ClassDetailGuru({ kelasId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId, refreshKey);
  const { students, loading: loadingStudents, error: errorStudents } = useKelasEnrollments(kelasId, refreshKey);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Tab navigasi dengan ikon lucide-react
  const TABS = [
    { key: 'info', label: 'Info', icon: <Info className="w-5 h-5" /> },
    { key: 'siswa', label: 'Siswa', icon: <Users className="w-5 h-5" /> },
    { key: 'mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'tugas', label: 'Tugas', icon: <FileText className="w-5 h-5" /> },
    { key: 'nilai', label: 'Nilai', icon: <Award className="w-5 h-5" /> },
    { key: 'absensi', label: 'Absensi', icon: <ClipboardCheck className="w-5 h-5" /> },
    { key: 'pengumuman', label: 'Pengumuman', icon: <Bell className="w-5 h-5" /> },
  ];
  const [activeTab, setActiveTab] = useState('siswa');

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat data kelas...</p>
        </div>
      </div>
    );
  }
  if (!kelas) {
    return (
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">Data kelas tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const handleAddTask = () => {
    setEditTask(null);
    setShowTaskModal(true);
  };
  const handleEditTask = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    setEditTask(task);
    setShowTaskModal(true);
  };
  const handleDeleteTask = async (taskId) => {
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
        setRefreshKey(k => k + 1);
        setToast({ message: 'Tugas berhasil dihapus', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat menghapus tugas', type: 'error' });
    }
  };

  const handleAddAnnouncement = () => {
    setAnnouncementText('');
    setShowAnnouncementModal(true);
  };

  const handleSubmitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementText.trim()) {
      setToast({ message: 'Teks pengumuman tidak boleh kosong', type: 'error' });
      return;
    }
    setSavingAnnouncement(true);
    try {
      const requestBody = { 
        action: 'add-announcement',
        deskripsi: announcementText 
      };
      
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || 'Gagal menambah pengumuman', type: 'error' });
      } else {
        setShowAnnouncementModal(false);
        setAnnouncementText('');
        setRefreshKey(k => k + 1);
        setToast({ message: 'Pengumuman berhasil ditambahkan', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat menambah pengumuman', type: 'error' });
    }
    setSavingAnnouncement(false);
  };

  // Statistik dinamis
  const totalSiswa = students.length;
  const tugasAktif = tasks.filter(t => t.status === 'active').length;
  const nilaiRata2 = (() => {
    if (!students.length) return 0;
    let total = 0, count = 0;
    students.forEach(s => {
      const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      if (nilaiSiswa.length) {
        total += nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiSiswa.length;
        count++;
      }
    });
    return count ? Math.round(total / count) : 0;
  })();
  const kehadiranRata2 = (() => {
    if (!students.length) return 0;
    let total = 0, count = 0;
    students.forEach(s => {
      const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
      const totalPertemuan = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id)).length;
      if (totalPertemuan) {
        total += (hadir / totalPertemuan) * 100;
        count++;
      }
    });
    return count ? Math.round(total / count) : 0;
  })();

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* HEADER KELAS MODERN */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{kelas.nama_kelas || kelas.namaKelas}</h2>
            <div className="flex flex-wrap gap-4 items-center text-base font-medium opacity-90">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Tahun Ajaran: {kelas.tahun_ajaran || '-'}
              </span>
              <span className="inline-flex items-center gap-2">
                <User className="w-5 h-5" />
                Guru: {kelas.guru_id?.nama || kelas.guruKelas || '-'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 justify-start md:justify-end">
            <StatCard icon={<Users className="w-7 h-7" />} label="Siswa" value={totalSiswa} color="blue" />
            <StatCard icon={<FileText className="w-7 h-7" />} label="Tugas Aktif" value={tugasAktif} color="green" />
            <StatCard icon={<Award className="w-7 h-7" />} label="Nilai Rata-rata" value={nilaiRata2} color="yellow" />
            <StatCard icon={<ClipboardCheck className="w-7 h-7" />} label="% Kehadiran" value={kehadiranRata2 + '%'} color="purple" />
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          kelasId={kelasId}
          initialData={editTask}
          onSuccess={() => setRefreshKey(k => k + 1)}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Tambah Pengumuman</h3>
            <form onSubmit={handleSubmitAnnouncement}>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Tulis pengumuman..."
                className="w-full mb-4 p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingAnnouncement ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}

      {/* TAB NAVIGASI */}
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* SECTION PER TAB */}
      {activeTab === 'info' && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Info Kelas
          </h3>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <b>Guru Kelas:</b> {kelas.guru_id?.nama || kelas.guruKelas || '-'}
            </p>
            <p className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <b>Tahun Ajaran:</b> {kelas.tahun_ajaran || '-'}
            </p>
            {kelas.deskripsi && (
              <p className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <b>Deskripsi:</b> {kelas.deskripsi}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'siswa' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Siswa
            </h3>
          </div>
          {loadingStudents ? (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data siswa...</p>
            </div>
          ) : errorStudents ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{errorStudents}</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada siswa terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">NIS</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.foto_profil ? (
                            <img src={s.foto_profil} alt={s.nama} className="w-8 h-8 rounded-full object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm border">
                              {s.nama ? s.nama.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?'}
                            </div>
                          )}
                          <span className="text-gray-900 dark:text-gray-100">{s.nama}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.nis || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold">Aktif</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mapel' && (
        <MataPelajaranSection kelas={kelas} kelasId={kelasId} onSuccess={() => setRefreshKey(k => k + 1)} userRole="guru" />
      )}

      {activeTab === 'tugas' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Daftar Tugas
            </h3>
            <button 
              onClick={handleAddTask} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Tugas
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Tidak ada tugas.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(t => (
                <div key={t._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">{t.judul}</span>
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded font-semibold ${t.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {t.status === 'active' ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Deadline: {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleEditTask(t._id)} 
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1" 
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(t._id)} 
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1" 
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'nilai' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Nilai & Kehadiran Siswa
          </h3>
          {loadingStudents ? (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data siswa...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Tidak ada data nilai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nilai Rata-rata</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Jumlah Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s, idx) => {
                    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
                    const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
                    const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
                    let grade = '-';
                    let badge = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    if (avgNilai >= 90) { grade = 'A'; badge = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'; }
                    else if (avgNilai >= 80) { grade = 'B'; badge = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'; }
                    else if (avgNilai >= 70) { grade = 'C'; badge = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'; }
                    else if (avgNilai > 0) { grade = 'D'; badge = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'; }
                    const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.nama}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.email}</td>
                        <td className="px-4 py-3 text-center font-bold text-lg text-gray-900 dark:text-gray-100">{avgNilai}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{grade}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">{hadir}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'absensi' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Rekap Kehadiran Siswa
          </h3>
          {loadingStudents ? (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data siswa...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada siswa terdaftar</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Hadir</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Izin</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Sakit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Alfa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">% Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s, idx) => {
                    const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
                    const izin = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Izin').length;
                    const sakit = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Sakit').length;
                    const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
                    const total = hadir + izin + sakit + alfa;
                    const persen = total ? Math.round((hadir / total) * 100) : 0;
                    let badge = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    if (persen >= 90) badge = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
                    else if (persen >= 75) badge = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
                    else if (persen >= 50) badge = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
                    else badge = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{s.nama}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.email}</td>
                        <td className="px-4 py-3 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-semibold">{hadir}</span></td>
                        <td className="px-4 py-3 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">{izin}</span></td>
                        <td className="px-4 py-3 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-semibold">{sakit}</span></td>
                        <td className="px-4 py-3 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-semibold">{alfa}</span></td>
                        <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{persen}%</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pengumuman' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Pengumuman Kelas
            </h3>
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2" 
              onClick={handleAddAnnouncement}
            >
              <Plus className="w-5 h-5" />
              Tambah Pengumuman
            </button>
          </div>
          {loading ? (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Memuat pengumuman...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">Belum ada pengumuman untuk kelas ini.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((a, i) => (
                <div key={a._id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">Pengumuman</span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID') : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-3">{a.deskripsi || '-'}</div>
                  <div className="flex items-center gap-2 mt-auto">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Oleh: {a.author?.nama || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
