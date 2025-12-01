import React, { useState } from 'react';
import useKelasDetail from './useKelasDetail';
import useKelasEnrollments from './useKelasEnrollments';
import BulkAddStudentModal from './BulkAddStudentModal';
import Toast from '../common/Toast';
import { saveAs } from 'file-saver';

export default function ClassDetailAdmin({ kelasId }) {
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId);
  const [refreshKey, setRefreshKey] = useState(0);
  const { students, loading: loadingStudents, error: errorStudents } = useKelasEnrollments(kelasId, refreshKey);
  const [showBulkAddStudent, setShowBulkAddStudent] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  if (loading) return <div>Memuat data kelas...</div>;
  if (!kelas) return <div>Data kelas tidak ditemukan.</div>;

  const handleBulkAddStudent = () => setShowBulkAddStudent(true);

  const handleExport = () => {
    try {
      if (!students || students.length === 0) {
        setToast({ message: 'Tidak ada data siswa untuk diekspor', type: 'warning' });
        return;
      }
      // Siapkan data CSV
      const header = ['Nama', 'Email', 'Nilai Rata-rata', 'Jumlah Hadir'];
      const rows = students.map((s) => {
        const nilaiSiswa = nilai.filter(n => n.siswa_id === s._id || n.siswa_id?._id === s._id);
        const totalNilai = nilaiSiswa.reduce((acc, n) => acc + (n.nilai || 0), 0);
        const avgNilai = nilaiSiswa.length ? Math.round(totalNilai / nilaiSiswa.length) : 0;
        const hadir = attendance.filter(k => (k.siswa_id === s._id || k.siswa_id?._id === s._id) && k.status === "Hadir").length;
        return [s.nama, s.email, avgNilai, hadir];
      });
      const csvContent = [header, ...rows].map(r => r.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `rekap_kelas_${kelas.nama_kelas || kelas.namaKelas || kelasId}.csv`);
      setToast({ message: 'Data berhasil diekspor', type: 'success' });
    } catch (err) {
      setToast({ message: 'Gagal mengekspor data', type: 'error' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
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
      
      <h2 className="text-2xl font-bold mb-4">{kelas.nama_kelas || kelas.namaKelas}</h2>
      <div className="mb-6">
        <h3 className="font-semibold">Info Kelas</h3>
        <p><b>Guru Kelas:</b> {kelas.guru_id?.nama || kelas.guruKelas || '-'}</p>
        <p><b>Tahun Ajaran:</b> {kelas.tahun_ajaran || '-'}</p>
        <p><b>Deskripsi:</b> {kelas.deskripsi || '-'}</p>
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Daftar Siswa</h3>
          <button 
            onClick={handleBulkAddStudent} 
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Tambah Banyak Siswa
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
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Hadir</th>
                  <th className="px-4 py-2">Izin</th>
                  <th className="px-4 py-2">Sakit</th>
                  <th className="px-4 py-2">Alfa</th>
                  <th className="px-4 py-2">% Kehadiran</th>
                  <th className="px-4 py-2">Progress</th>
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
                  let badge = 'bg-gray-200 text-gray-700';
                  if (persen >= 90) badge = 'bg-green-100 text-green-700';
                  else if (persen >= 75) badge = 'bg-blue-100 text-blue-700';
                  else if (persen >= 50) badge = 'bg-yellow-100 text-yellow-700';
                  else badge = 'bg-red-100 text-red-700';
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 text-center font-semibold text-gray-400 dark:text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{s.nama}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{s.email}</td>
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
      
      <div className="mb-6">
        <h3 className="font-semibold">Daftar Tugas</h3>
        {tasks.length === 0 ? (
          <p>Tidak ada tugas.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Judul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t.judul}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
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

      <div className="mb-6">
        <h3 className="font-semibold">Komentar</h3>
        {comments.length === 0 ? (
          <p>Belum ada komentar.</p>
        ) : (
          <div className="space-y-2">
            {comments.map((c, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <p className="text-gray-900 dark:text-gray-100">{c.text || c}</p>
              </div>
            ))}
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
    </div>
  );
} 