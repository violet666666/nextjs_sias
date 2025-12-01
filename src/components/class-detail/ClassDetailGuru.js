import React, { useState } from 'react';
import useKelasDetail from './useKelasDetail';
import useKelasEnrollments from './useKelasEnrollments';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import AddStudentModal from './AddStudentModal';
import BulkAddStudentModal from './BulkAddStudentModal';
import TaskModal from './TaskModal';
import Toast from '../common/Toast';
import StatCard from './StatCard';
import TabNav from './TabNav';
import MataPelajaranSection from './MataPelajaranSection';

export default function ClassDetailGuru({ kelasId }) {
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId);
  const [refreshKey, setRefreshKey] = useState(0);
  const { students, loading: loadingStudents, error: errorStudents } = useKelasEnrollments(kelasId, refreshKey);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showBulkAddStudent, setShowBulkAddStudent] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Tab navigasi
  const TABS = [
    { key: 'info', label: 'Info', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01"/><circle cx="12" cy="12" r="10"/></svg> },
    { key: 'siswa', label: 'Siswa', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87"/><path d="M9 20H4v-2a4 4 0 013-3.87"/><circle cx="12" cy="7" r="4"/></svg> },
    { key: 'mapel', label: 'Mata Pelajaran', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg> },
    { key: 'tugas', label: 'Tugas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
    { key: 'nilai', label: 'Nilai', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
    { key: 'absensi', label: 'Absensi', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
    { key: 'pengumuman', label: 'Pengumuman', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg> },
    { key: 'komentar', label: 'Komentar', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2"/><path d="M15 3h6v6"/><path d="M10 14l2-2 4 4"/></svg> },
  ];
  const [activeTab, setActiveTab] = useState('siswa');

  if (loading) return <div>Memuat data kelas...</div>;
  if (!kelas) return <div>Data kelas tidak ditemukan.</div>;

  // Placeholder aksi (nanti bisa dihubungkan ke API)
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
    if (!window.confirm('Yakin ingin menghapus tugas ini?')) return;
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
  const handleAddStudent = () => setShowAddStudent(true);
  const handleBulkAddStudent = () => setShowBulkAddStudent(true);
  const handleRemoveStudent = async (enrollmentId) => {
    if (!window.confirm('Yakin ingin mengeluarkan siswa ini dari kelas?')) return;
    try {
      const res = await fetchWithAuth(`/api/enrollments/${enrollmentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setToast({ message: data.error || 'Gagal mengeluarkan siswa', type: 'error' });
      } else {
        setRefreshKey(k => k + 1); // trigger refetch
        setToast({ message: 'Siswa berhasil dikeluarkan', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan saat mengeluarkan siswa', type: 'error' });
    }
  };
  const handleExport = () => setToast({ message: 'Fitur ekspor data (belum diimplementasi)', type: 'info' });

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
    <div className="max-w-5xl mx-auto p-4">
      {/* HEADER KELAS MODERN */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white shadow-lg p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{kelas.nama_kelas || kelas.namaKelas}</h2>
          <div className="flex flex-wrap gap-4 items-center text-base font-medium opacity-90">
            <span className="inline-flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"/></svg> Tahun Ajaran: {kelas.tahun_ajaran || '-'}</span>
            <span className="inline-flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Guru: {kelas.guru_id?.nama || kelas.guruKelas || '-'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-start md:justify-end">
          <StatCard icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87"/><path d="M9 20H4v-2a4 4 0 013-3.87"/><circle cx="12" cy="7" r="4"/></svg>} label="Siswa" value={totalSiswa} color="blue" />
          <StatCard icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>} label="Tugas Aktif" value={tugasAktif} color="green" />
          <StatCard icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>} label="Nilai Rata-rata" value={nilaiRata2} color="yellow" />
          <StatCard icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} label="% Kehadiran" value={kehadiranRata2 + '%'} color="purple" />
        </div>
      </div>
      {showAddStudent && (
        <AddStudentModal
          kelasId={kelasId}
          onSuccess={() => setRefreshKey(k => k + 1)}
          onClose={() => setShowAddStudent(false)}
        />
      )}
      {showBulkAddStudent && (
        <BulkAddStudentModal
          kelasId={kelasId}
          onSuccess={() => setRefreshKey(k => k + 1)}
          onClose={() => setShowBulkAddStudent(false)}
        />
      )}
      {showTaskModal && (
        <TaskModal
          kelasId={kelasId}
          initialData={editTask}
          onSuccess={() => setRefreshKey(k => k + 1)}
          onClose={() => setShowTaskModal(false)}
        />
      )}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}
      {/* TAB NAVIGASI */}
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* SECTION PER TAB */}
      {activeTab === 'info' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Info Kelas</h3>
          <p><b>Guru Kelas:</b> {kelas.guru_id?.nama || kelas.guruKelas || '-'}</p>
          <p><b>Tahun Ajaran:</b> {kelas.tahun_ajaran || '-'}</p>
          <p><b>Deskripsi:</b> {kelas.deskripsi || '-'}</p>
        </div>
      )}
      {activeTab === 'siswa' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Daftar Siswa</h3>
            <div className="flex space-x-2">
              <button 
                onClick={handleAddStudent} 
                className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                + Tambah Siswa
              </button>
              <button 
                onClick={handleBulkAddStudent} 
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Tambah Banyak Siswa
              </button>
            </div>
          </div>
          {loadingStudents ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : errorStudents ? (
            <p className="text-red-500">{errorStudents}</p>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87"/><path d="M9 20H4v-2a4 4 0 013-3.87"/><circle cx="12" cy="7" r="4"/></svg>
              <div>Belum ada siswa terdaftar</div>
              <div className="text-sm mt-2">Klik tombol di atas untuk menambahkan siswa</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-2 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 flex items-center gap-3">
                        {/* Avatar atau inisial */}
                        {s.foto_profil ? (
                          <img src={s.foto_profil} alt={s.nama} className="w-8 h-8 rounded-full object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border">
                            {s.nama ? s.nama.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?'}
                          </div>
                        )}
                        <span>{s.nama}</span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.email}</td>
                      <td className="px-4 py-2">
                        {/* Badge status, contoh: Baru jika baru ditambahkan (dummy, bisa diubah sesuai data) */}
                        {/* {s.isBaru && ( */}
                        {/*   <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-semibold">Baru</span> */}
                        {/* )} */}
                        <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-semibold">Aktif</span>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          onClick={() => handleRemoveStudent(s.enrollmentId)} 
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400 font-medium flex items-center gap-1"
                          title="Keluarkan siswa"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                          <span className="hidden sm:inline">Keluarkan</span>
                        </button>
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
        <MataPelajaranSection kelas={kelas} kelasId={kelasId} onSuccess={() => setRefreshKey(k => k + 1)} />
      )}
      {activeTab === 'tugas' && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Daftar Tugas</h3>
            <button onClick={handleAddTask} className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
              Tambah Tugas
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
              <div>Tidak ada tugas.</div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(t => (
                <div key={t._id} className="rounded-xl shadow-md bg-white dark:bg-gray-800 p-4 flex flex-col gap-2 border border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">{t.judul}</span>
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded font-semibold ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{t.status === 'active' ? 'Aktif' : 'Selesai'}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Deadline: {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleEditTask(t._id)} className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 flex items-center gap-1" title="Edit">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6-6M3 17.25V21h3.75l11.06-11.06a2.121 2.121 0 00-3-3L3 17.25z"/></svg>
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button onClick={() => handleDeleteTask(t._id)} className="text-red-600 hover:text-red-800 dark:hover:text-red-400 flex items-center gap-1" title="Hapus">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      <span className="hidden sm:inline">Hapus</span>
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
          <h3 className="font-semibold text-lg mb-4">Nilai & Kehadiran Siswa</h3>
          {loadingStudents ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <div>Tidak ada data nilai.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Nilai Rata-rata</th>
                    <th className="px-4 py-2">Grade</th>
                    <th className="px-4 py-2">Progress</th>
                    <th className="px-4 py-2">Jumlah Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
                    const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
                    const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
                    let grade = '-';
                    let badge = 'bg-gray-200 text-gray-700';
                    if (avgNilai >= 90) { grade = 'A'; badge = 'bg-green-100 text-green-700'; }
                    else if (avgNilai >= 80) { grade = 'B'; badge = 'bg-blue-100 text-blue-700'; }
                    else if (avgNilai >= 70) { grade = 'C'; badge = 'bg-yellow-100 text-yellow-700'; }
                    else if (avgNilai > 0) { grade = 'D'; badge = 'bg-red-100 text-red-700'; }
                    const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-4 py-2 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2">{s.nama}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.email}</td>
                        <td className="px-4 py-2 text-center font-bold text-lg">{avgNilai}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{grade}</span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="w-32 bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div className={`h-3 rounded-full ${badge}`} style={{ width: `${Math.min(avgNilai, 100)}%` }}></div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-semibold">{hadir}</span>
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
          <h3 className="font-semibold text-lg mb-4">Rekap Kehadiran Siswa</h3>
          {loadingStudents ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data siswa...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a4 4 0 00-3-3.87"/><path d="M9 20H4v-2a4 4 0 013-3.87"/><circle cx="12" cy="7" r="4"/></svg>
              <div>Belum ada siswa terdaftar</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Nama</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Hadir</th>
                    <th className="px-4 py-2">Izin</th>
                    <th className="px-4 py-2">Sakit</th>
                    <th className="px-4 py-2">Alfa</th>
                    <th className="px-4 py-2">% Kehadiran</th>
                    <th className="px-4 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
                    const izin = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Izin').length;
                    const sakit = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Sakit').length;
                    const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
                    const total = hadir + izin + sakit + alfa;
                    const persen = total ? Math.round((hadir / total) * 100) : 0;
                    let badge = 'bg-gray-200 text-gray-700';
                    if (persen >= 90) badge = 'bg-green-100 text-green-700';
                    else if (persen >= 75) badge = 'bg-blue-100 text-blue-700';
                    else if (persen >= 50) badge = 'bg-yellow-100 text-yellow-700';
                    else badge = 'bg-red-100 text-red-700';
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                        <td className="px-4 py-2 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2">{s.nama}</td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{s.email}</td>
                        <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700 font-semibold">{hadir}</span></td>
                        <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-semibold">{izin}</span></td>
                        <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 font-semibold">{sakit}</span></td>
                        <td className="px-4 py-2 text-center"><span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-semibold">{alfa}</span></td>
                        <td className="px-4 py-2 text-center"><span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{persen}%</span></td>
                        <td className="px-4 py-2">
                          <div className="w-24 bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div className={`h-3 rounded-full ${badge}`} style={{ width: `${persen}%` }}></div>
                          </div>
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
      {activeTab === 'pengumuman' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Pengumuman Kelas</h3>
          <div className="flex justify-end mb-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => alert('Fitur tambah pengumuman (belum diimplementasi)')}>+ Tambah Pengumuman</button>
          </div>
          {loading ? (
            <div className="text-center py-6"><span className="spinner"></span> Memuat pengumuman...</div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              <div>Belum ada pengumuman untuk kelas ini.</div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((a, i) => (
                <div key={a._id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">{a.title || a.judul || 'Pengumuman'}</span>
                    <span className="ml-auto text-xs text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('id-ID') : ''}</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-3">{a.text || a.ringkasan || a.deskripsi || '-'}</div>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-xs text-gray-500">Oleh: {a.author?.nama || a.pembuat || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'komentar' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Komentar & Diskusi Kelas</h3>
          {loading ? (
            <div className="text-center py-6"><span className="spinner"></span> Memuat komentar...</div>
          ) : comments.length === 0 ? (
            <div className="empty-state">
              <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2"/><path d="M15 3h6v6"/><path d="M10 14l2-2 4 4"/></svg>
              <div>Belum ada komentar untuk kelas ini.</div>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {comments.map((c, i) => (
                <div key={c._id || i} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-100 dark:border-slate-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                    {c.author?.nama ? c.author.nama.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{c.author?.nama || 'Anonim'}</span>
                      <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString('id-ID') : ''}</span>
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 mt-1">{c.text || c.isi || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form className="mt-4 flex gap-2" onSubmit={async e => {
            e.preventDefault();
            const input = e.target.elements['komentar'];
            const text = input.value.trim();
            if (!text) return;
            input.disabled = true;
            try {
              const res = await fetchWithAuth(`/api/kelas/${kelasId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
              });
              if (!res.ok) {
                const data = await res.json();
                setToast({ message: data.error || 'Gagal mengirim komentar', type: 'error' });
              } else {
                input.value = '';
                setToast({ message: 'Komentar berhasil dikirim!', type: 'success' });
              }
            } catch (err) {
              setToast({ message: 'Terjadi kesalahan saat mengirim komentar', type: 'error' });
            }
            input.disabled = false;
          }}>
            <input
              name="komentar"
              className="flex-1 border rounded p-2"
              placeholder="Tulis komentar..."
              autoComplete="off"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 