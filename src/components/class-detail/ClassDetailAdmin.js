import React, { useState, useMemo } from 'react';
import useKelasDetail from './useKelasDetail';
import useKelasEnrollments from './useKelasEnrollments';
import BulkAddStudentModal from './BulkAddStudentModal';
import Toast from '../common/Toast';
import { saveAs } from 'file-saver';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { getJumlahSiswa } from '@/lib/utils/kelasUtils';
import {
  Trash2, UserPlus, Bell, Plus, BookOpen, GraduationCap,
  Users, Award, AlertTriangle, ClipboardCheck, FileText, Printer, Download
} from 'lucide-react';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ClassDetailAdmin({ kelasId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId, refreshKey);
  const { students, loading: loadingStudents, error: errorStudents } = useKelasEnrollments(kelasId, studentsRefreshKey);
  const [showBulkAddStudent, setShowBulkAddStudent] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState(null);
  const [activeTab, setActiveTab] = useState('siswa');

  if (loading) return <div>Memuat data kelas...</div>;
  if (!kelas) return <div>Data kelas tidak ditemukan.</div>;

  const handleBulkAddStudent = () => setShowBulkAddStudent(true);

  const handleBulkAddStudentSuccess = () => {
    setStudentsRefreshKey(k => k + 1);
    setToast({
      message: 'Siswa berhasil ditambahkan ke kelas',
      type: 'success',
      icon: <Plus className="w-4 h-4" />
    });
  };

  // Handler untuk tambah pengumuman
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
      console.log('[FRONTEND] Mengirim request tambah pengumuman:', {
        kelasId,
        method: 'PATCH',
        url: `/api/kelas/${kelasId}`,
        body: requestBody
      });

      // Langsung update kelas dengan menambah pengumuman
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[FRONTEND] Response status:', res.status, res.ok);

      if (!res.ok) {
        const data = await res.json();
        console.error('[FRONTEND] Error response:', data);
        setToast({ message: data.error || 'Gagal menambah pengumuman', type: 'error' });
      } else {
        const responseData = await res.json();
        console.log('[FRONTEND] Success response:', responseData);
        console.log('[FRONTEND] Pengumuman di response:', responseData.kelas?.pengumuman);
        setShowAnnouncementModal(false);
        setAnnouncementText('');
        setRefreshKey(k => k + 1); // trigger refetch untuk mengambil pengumuman terbaru dari kelas
        setToast({ message: 'Pengumuman berhasil ditambahkan', type: 'success' });
      }
    } catch (err) {
      console.error('[FRONTEND] Exception error:', err);
      setToast({ message: 'Terjadi kesalahan saat menambah pengumuman', type: 'error' });
    }
    setSavingAnnouncement(false);
  };

  const handleRemoveStudent = async (siswaId) => {
    const result = await Swal.fire({
      title: 'Hapus Siswa?',
      text: 'Apakah Anda yakin ingin mengeluarkan siswa ini dari kelas?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    setDeletingStudentId(siswaId);
    try {
      const res = await fetchWithAuth(`/api/kelas/${kelasId}/students?siswa_id=${siswaId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengeluarkan siswa");
      }
      // Hanya refresh tabel siswa, bukan seluruh halaman detail
      setStudentsRefreshKey(k => k + 1);
      setToast({
        message: 'Siswa berhasil dikeluarkan dari kelas',
        type: 'success',
        icon: <Trash2 className="w-4 h-4" />
      });
    } catch (error) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setDeletingStudentId(null);
    }
  };

  const handleExport = () => {
    try {
      if (!students || students.length === 0) {
        setToast({ message: 'Tidak ada data siswa untuk diekspor', type: 'warning' });
        return;
      }
      // Siapkan data CSV
      const header = ['Nama', 'Email', 'NIS', 'Nilai Rata-rata', 'Jumlah Hadir'];
      const rows = students.map((s) => {
        const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
        const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
        const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
        const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
        return [s.nama, s.email, s.nis || '-', avgNilai, hadir];
      });
      const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `rekap_kelas_${kelas.nama_kelas || kelas.namaKelas || kelasId}.csv`);
      setToast({ message: 'Data berhasil diekspor', type: 'success' });
    } catch (err) {
      setToast({ message: 'Gagal mengekspor data', type: 'error' });
    }
  };

  // Print Leger PDF
  const handlePrintLeger = () => {
    try {
      if (!students || students.length === 0) {
        setToast({ message: 'Tidak ada data siswa untuk dicetak', type: 'warning' });
        return;
      }

      const doc = new jsPDF();
      const kelasNama = kelas.nama_kelas || kelas.namaKelas || 'Kelas';

      // Header
      doc.setFontSize(16);
      doc.text(`LEGER KELAS: ${kelasNama}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Tahun Ajaran: ${kelas.tahun_ajaran || '-'}`, 14, 28);
      doc.text(`Wali Kelas: ${kelas.guru_id?.nama || '-'}`, 14, 34);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);

      // Table Data
      const tableData = students.map((s, idx) => {
        const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
        const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
        const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
        const hadirCount = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
        const totalAtt = attendance.filter(k => k.siswa_id === s._id || k.siswa_id?._id === s._id).length;
        const persenHadir = totalAtt ? Math.round((hadirCount / totalAtt) * 100) : 0;

        return [idx + 1, s.nama, s.nis || '-', avgNilai, `${persenHadir}%`];
      });

      doc.autoTable({
        startY: 48,
        head: [['No', 'Nama Siswa', 'NIS', 'Rata-rata Nilai', 'Kehadiran']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 }
      });

      doc.save(`leger_${kelasNama.replace(/\s+/g, '_')}.pdf`);
      setToast({ message: 'Leger berhasil dicetak', type: 'success' });
    } catch (err) {
      console.error('Error printing leger:', err);
      setToast({ message: 'Gagal mencetak leger', type: 'error' });
    }
  };

  // Calculate Stats
  const stats = useMemo(() => {
    const totalSiswa = students?.length || 0;

    // Average Grade
    let totalNilai = 0;
    let countNilai = 0;
    students?.forEach(s => {
      const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      nilaiSiswa.forEach(n => {
        if (n.nilai) {
          totalNilai += n.nilai;
          countNilai++;
        }
      });
    });
    const avgNilai = countNilai ? Math.round(totalNilai / countNilai) : 0;

    // Attendance Rate
    const totalHadir = attendance.filter(a => a.status === 'Hadir').length;
    const totalAttendance = attendance.length;
    const attendanceRate = totalAttendance ? Math.round((totalHadir / totalAttendance) * 100) : 0;

    // At Risk Students (nilai < 75 atau kehadiran < 75%)
    let atRiskCount = 0;
    students?.forEach(s => {
      const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      const avgN = nilaiSiswa.length ? nilaiSiswa.reduce((a, n) => a + (n.nilai || 0), 0) / nilaiSiswa.length : 0;
      const attS = attendance.filter(a => a.siswa_id === s._id || a.siswa_id?._id === s._id);
      const hadirS = attS.filter(a => a.status === 'Hadir').length;
      const attRate = attS.length ? (hadirS / attS.length) * 100 : 100;

      if (avgN < 75 || attRate < 75) atRiskCount++;
    });

    return { totalSiswa, avgNilai, attendanceRate, atRiskCount };
  }, [students, nilai, attendance]);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {showBulkAddStudent && (
        <BulkAddStudentModal
          kelasId={kelasId}
          onSuccess={handleBulkAddStudentSuccess}
          onClose={() => setShowBulkAddStudent(false)}
        />
      )}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          icon={toast.icon}
          onClose={() => setToast({ message: '', type: 'info', icon: null })}
        />
      )}

      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-4 pb-4 border-b-2 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
          {kelas.nama_kelas || kelas.namaKelas}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {kelas.guru_id?.nama || '-'}</span>
          <span>•</span>
          <span>Tahun Ajaran: {kelas.tahun_ajaran || '-'}</span>
        </div>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Siswa</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSiswa}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
            <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Nilai</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgNilai}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tingkat Kehadiran</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
          <div className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Siswa Berisiko</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.atRiskCount}</p>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handlePrintLeger}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Cetak Leger
        </button>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={handleBulkAddStudent}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Siswa
        </button>
        <button
          onClick={handleAddAnnouncement}
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          Tambah Pengumuman
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('siswa')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'siswa'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Siswa
          </button>
          <button
            onClick={() => setActiveTab('tugas')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'tugas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Tugas
          </button>
          <button
            onClick={() => setActiveTab('nilai')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'nilai'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Nilai
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'siswa' && (
        <>
          {/* Pengumuman di bagian atas daftar siswa */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Pengumuman Kelas</h3>
              <button
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleAddAnnouncement}
                title="Tambah Pengumuman"
              >
                <Bell className="w-4 h-4" />
                <span>Tambah Pengumuman</span>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-6"><span className="spinner"></span> Memuat pengumuman...</div>
            ) : announcements.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                <svg className="mb-2 w-10 h-10 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <div>Belum ada pengumuman untuk kelas ini.</div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {announcements.map((a, i) => (
                  <div key={a._id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">Pengumuman</span>
                      <span className="ml-auto text-xs text-gray-400">{a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID') : ''}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-3 flex-1">{a.deskripsi || '-'}</div>
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Oleh: {a.author?.nama || '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mata Pelajaran */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">Mata Pelajaran</h3>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data mata pelajaran...</p>
              </div>
            ) : !kelas.matapelajaran_ids || kelas.matapelajaran_ids.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <div>Belum ada mata pelajaran di kelas ini.</div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {kelas.matapelajaran_ids.map((mapel) => {
                  // Handle both populated object and ID string
                  const mapelId = mapel._id || mapel;
                  const mapelNama = mapel.nama || '-';
                  const mapelKode = mapel.kode || null;
                  const mapelDeskripsi = mapel.deskripsi || null;
                  const mapelJam = mapel.total_jam_per_minggu || null;
                  // Handle guru_ids array
                  const guruNames = mapel.guru_ids && Array.isArray(mapel.guru_ids)
                    ? mapel.guru_ids.map(g => g.nama || g).filter(Boolean)
                    : [];

                  return (
                    <div
                      key={mapelId}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {mapelNama}
                          </h4>
                          <div className="space-y-1">
                            {mapelKode && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Kode: {mapelKode}</p>
                            )}
                            {mapelJam && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jam/Minggu: {mapelJam} jam</p>
                            )}
                          </div>
                        </div>
                        <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                      </div>

                      {mapelDeskripsi && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {mapelDeskripsi}
                        </p>
                      )}

                      {guruNames.length > 0 && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2 mb-1">
                            <GraduationCap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Guru:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {guruNames.map((guruName, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded"
                              >
                                {guruName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Daftar Siswa</h3>
              <button
                onClick={handleBulkAddStudent}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Tambah Siswa"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
            {loadingStudents ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data siswa...</p>
              </div>
            ) : errorStudents ? (
              <p className="text-red-500">{errorStudents}</p>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Tidak ada siswa terdaftar di kelas ini.</p>
                <p className="text-sm mt-2">Klik tombol di atas untuk menambahkan siswa</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="min-w-full modern-table">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">#</th>
                      <th className="px-4 py-2">Nama</th>
                      <th className="px-4 py-2">NIS</th>
                      <th className="px-4 py-2">Hadir</th>
                      <th className="px-4 py-2">Izin</th>
                      <th className="px-4 py-2">Sakit</th>
                      <th className="px-4 py-2">Alfa</th>
                      <th className="px-4 py-2">% Kehadiran</th>
                      <th className="px-4 py-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students.map((s, idx) => {
                      const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
                      const izin = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Izin').length;
                      const sakit = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Sakit').length;
                      const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
                      const total = hadir + izin + sakit + alfa;
                      const persen = total ? Math.round((hadir / total) * 100) : 0;
                      return (
                        <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.nama}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{s.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.nis || '-'}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-100">{hadir}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-100">{izin}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-100">{sakit}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-100">{alfa}</td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900 dark:text-gray-100">{persen}%</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleRemoveStudent(s._id)}
                              disabled={deletingStudentId === s._id}
                              className="inline-flex items-center justify-center p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus Siswa"
                            >
                              {deletingStudentId === s._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={handleExport}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Export Data
            </button>
          </div>
        </>
      )}

      {/* Tab Tugas */}
      {activeTab === 'tugas' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">Daftar Tugas</h3>
          {tasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Tidak ada tugas.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Judul</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.map((t) => (
                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{t.judul}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {t.status === 'active' ? 'Aktif' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Nilai */}
      {activeTab === 'nilai' && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-4">Rekap Nilai Siswa</h3>
          {students.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>Tidak ada data nilai.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama Siswa</th>
                    {tasks.map(t => (
                      <th key={t._id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t.judul?.substring(0, 15) || 'Tugas'}</th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s, idx) => {
                    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
                    const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
                    const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-center text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{s.nama}</td>
                        {tasks.map(t => {
                          const n = nilaiSiswa.find(n => n.tugas_id === t._id || n.tugas_id?._id === t._id);
                          return (
                            <td key={t._id} className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                              {n?.nilai ?? '-'}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-gray-100">{avgNilai}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Pengumuman */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tambah Pengumuman</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                disabled={savingAnnouncement}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitAnnouncement}>
              <div className="mb-4">
                <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-300">Isi Pengumuman <span className="text-red-500">*</span></label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-700"
                  placeholder="Tulis pengumuman untuk kelas ini..."
                  rows={6}
                  disabled={savingAnnouncement}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setShowAnnouncementModal(false)}
                  disabled={savingAnnouncement}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingAnnouncement || !announcementText.trim()}
                >
                  {savingAnnouncement ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 