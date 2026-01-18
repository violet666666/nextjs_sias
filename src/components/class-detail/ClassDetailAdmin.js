"use client";
import React, { useState } from 'react';
import useKelasDetail from './useKelasDetail';
import useKelasEnrollments from './useKelasEnrollments';
import BulkAddStudentModal from './BulkAddStudentModal';
import Toast from '../common/Toast';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Users, BookOpen, Award, AlertTriangle, ArrowLeft, Printer, Plus } from 'lucide-react';
import Link from 'next/link';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function ClassDetailAdmin({ kelasId }) {
  const { kelas, tasks, nilai, attendance, loading } = useKelasDetail(kelasId);
  const [refreshKey, setRefreshKey] = useState(0);
  const { students, loading: loadingStudents, error: errorStudents } = useKelasEnrollments(kelasId, refreshKey);
  const [showBulkAddStudent, setShowBulkAddStudent] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('siswa');

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!kelas) return <div className="text-center py-12 text-gray-500">Data kelas tidak ditemukan.</div>;

  // Calculate Stats
  const totalSiswa = students.length;
  const avgNilai = nilai.length > 0
    ? Math.round(nilai.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilai.length)
    : 0;
  const totalHadir = attendance.filter(a => a.status === 'Hadir').length;
  const totalAbsen = attendance.length;
  const kehadiranPersen = totalAbsen > 0 ? Math.round((totalHadir / totalAbsen) * 100) : 0;
  const siswaBerisiko = students.filter(s => {
    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
    const avg = nilaiSiswa.length > 0 ? nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiSiswa.length : 0;
    const alfa = attendance.filter(a => (a.siswa_id === s._id || a.siswa_id?._id === s._id) && a.status === 'Alfa').length;
    return avg < 70 || alfa >= 3;
  }).length;

  const handleBulkAddStudent = () => setShowBulkAddStudent(true);

  // Export to PDF (Leger Nilai)
  const handlePrintLeger = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Leger Nilai - ${kelas.nama_kelas || kelas.namaKelas}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Tahun Ajaran: ${kelas.tahun_ajaran || '-'}`, 14, 22);
    doc.text(`Wali Kelas: ${kelas.guru_id?.nama || '-'}`, 14, 28);

    // Prepare table data
    const tableData = students.map((s, idx) => {
      const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      const totalN = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
      const avgN = nilaiSiswa.length ? Math.round(totalN / nilaiSiswa.length) : 0;
      const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
      const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
      return [idx + 1, s.nama, s.email || '-', avgN, hadir, alfa];
    });

    doc.autoTable({
      startY: 35,
      head: [['No', 'Nama Siswa', 'Email', 'Nilai Rata-rata', 'Hadir', 'Alfa']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 }
    });

    doc.save(`leger_nilai_${kelas.nama_kelas || kelasId}.pdf`);
    setToast({ message: 'Leger nilai berhasil diunduh', type: 'success' });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!students || students.length === 0) {
      setToast({ message: 'Tidak ada data siswa', type: 'warning' });
      return;
    }
    const header = ['No', 'Nama', 'Email', 'Nilai Rata-rata', 'Hadir', 'Izin', 'Sakit', 'Alfa'];
    const rows = students.map((s, idx) => {
      const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
      const totalN = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
      const avgN = nilaiSiswa.length ? Math.round(totalN / nilaiSiswa.length) : 0;
      const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
      const izin = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Izin').length;
      const sakit = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Sakit').length;
      const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
      return [idx + 1, s.nama, s.email, avgN, hadir, izin, sakit, alfa];
    });
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `rekap_kelas_${kelas.nama_kelas || kelasId}.csv`);
    setToast({ message: 'Data berhasil diekspor ke CSV', type: 'success' });
  };

  const TABS = [
    { key: 'siswa', label: 'Siswa' },
    { key: 'tugas', label: 'Tugas' },
    { key: 'nilai', label: 'Nilai' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {showBulkAddStudent && (
        <BulkAddStudentModal
          kelasId={kelasId}
          onSuccess={() => setRefreshKey(k => k + 1)}
          onClose={() => setShowBulkAddStudent(false)}
        />
      )}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}

      {/* Header */}
      <div className="mb-6">
        <Link href="/cpanel/classes" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Kelas
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {kelas.nama_kelas || kelas.namaKelas}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Tahun Ajaran: {kelas.tahun_ajaran || '-'} • Wali Kelas: {kelas.guru_id?.nama || '-'}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={handlePrintLeger} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Cetak Leger
            </button>
            <button onClick={handleExportCSV} className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Siswa" value={totalSiswa} icon={Users} color="bg-blue-500" />
        <StatCard title="Rata-rata Nilai" value={avgNilai} icon={Award} color="bg-green-500" />
        <StatCard title="Tingkat Kehadiran" value={`${kehadiranPersen}%`} icon={BookOpen} color="bg-purple-500" />
        <StatCard title="Siswa Berisiko" value={siswaBerisiko} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'siswa' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Siswa</h3>
            <button onClick={handleBulkAddStudent} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Tambah Siswa
            </button>
          </div>
          {loadingStudents ? (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : errorStudents ? (
            <p className="text-red-500">{errorStudents}</p>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada siswa terdaftar.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nilai</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hadir</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Alfa</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((s, idx) => {
                    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
                    const avg = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiSiswa.length) : 0;
                    const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Hadir').length;
                    const alfa = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === 'Alfa').length;
                    const isAtRisk = avg < 70 || alfa >= 3;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{s.nama}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.email || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${avg >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {avg}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{hadir}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${alfa >= 3 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {alfa}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isAtRisk ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Perlu Perhatian
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Baik
                            </span>
                          )}
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

      {activeTab === 'tugas' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Tugas</h3>
            <Link href="/cpanel/tasks" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Buat Tugas
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada tugas untuk kelas ini.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Judul</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Terkumpul</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.map(t => {
                    const submitted = nilai.filter(n => n.tugas_id === t._id || n.tugas_id?._id === t._id).length;
                    const isOverdue = t.tanggal_deadline && new Date(t.tanggal_deadline) < new Date();
                    return (
                      <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{t.judul}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{submitted}/{totalSiswa}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {isOverdue ? 'Lewat Deadline' : 'Aktif'}
                          </span>
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

      {activeTab === 'nilai' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rekap Nilai</h3>
            <button onClick={handlePrintLeger} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4 mr-2" /> Cetak Leger
            </button>
          </div>
          {students.length === 0 || tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Data nilai belum tersedia.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase sticky left-0 bg-gray-50 dark:bg-gray-700">Nama Siswa</th>
                    {tasks.map(t => (
                      <th key={t._id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        {t.judul.length > 15 ? t.judul.substring(0, 15) + '...' : t.judul}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-blue-50 dark:bg-blue-900">Rata-rata</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map(s => {
                    const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
                    const avg = nilaiSiswa.length > 0 ? Math.round(nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0) / nilaiSiswa.length) : 0;
                    return (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">{s.nama}</td>
                        {tasks.map(t => {
                          const grade = nilaiSiswa.find(n => n.tugas_id === t._id || n.tugas_id?._id === t._id);
                          return (
                            <td key={t._id} className="px-4 py-3 text-center text-sm">
                              {grade?.nilai !== undefined ? (
                                <span className={`px-2 py-1 rounded ${grade.nilai >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {grade.nilai}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center bg-blue-50 dark:bg-blue-900">
                          <span className={`px-2 py-1 font-bold rounded ${avg >= 70 ? 'text-green-700' : 'text-red-700'}`}>
                            {avg}
                          </span>
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
    </div>
  );
}