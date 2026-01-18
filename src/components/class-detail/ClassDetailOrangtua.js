import React, { useState, useEffect, useMemo } from 'react';
import useKelasDetail from './useKelasDetail';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Toast from '../common/Toast';
import {
  Award, ClipboardCheck, FileText, User, GraduationCap, Calendar,
  CheckCircle, XCircle, AlertCircle, Bell
} from 'lucide-react';

export default function ClassDetailOrangtua({ kelasId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId, refreshKey);
  const [anakList, setAnakList] = useState([]);
  const [selectedAnakId, setSelectedAnakId] = useState(null);
  const [myNilai, setMyNilai] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    setUser(u);
    if (!u || u.role !== 'orangtua') return;
    fetchWithAuth(`/api/orangtua?user_id=${u.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const allData = Array.isArray(data) ? data : [];
        // Flatten siswa_ids dari semua record
        const allAnak = allData.flatMap(item => {
          if (item.siswa_ids && Array.isArray(item.siswa_ids)) {
            return item.siswa_ids;
          } else if (item.siswa_id) {
            // Backward compatibility
            return [item.siswa_id];
          }
          return [];
        });
        setAnakList(allAnak);
        if (allAnak.length > 0) {
          setSelectedAnakId(allAnak[0]._id || allAnak[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedAnakId) return;
    setMyNilai(nilai.filter(n => n.siswa_id === selectedAnakId || n.siswa_id?._id === selectedAnakId));
    setMyAttendance(attendance.filter(a => a.siswa_id === selectedAnakId || a.siswa_id?._id === selectedAnakId));
  }, [selectedAnakId, nilai, attendance]);

  // Calculate stats for selected child
  const stats = useMemo(() => {
    // Average grade
    const totalNilai = myNilai.reduce((acc, n) => acc + (n.nilai || 0), 0);
    const avgNilai = myNilai.length ? Math.round(totalNilai / myNilai.length) : 0;

    // Attendance rate
    const hadirCount = myAttendance.filter(a => a.status === 'Hadir').length;
    const totalAtt = myAttendance.length;
    const attendanceRate = totalAtt ? Math.round((hadirCount / totalAtt) * 100) : 0;

    // Pending tasks (tugas yang belum dikumpulkan)
    const submittedTaskIds = myNilai.map(n => n.tugas_id?._id || n.tugas_id);
    const pendingTasks = tasks.filter(t => !submittedTaskIds.includes(t._id)).length;

    return { avgNilai, attendanceRate, pendingTasks };
  }, [myNilai, myAttendance, tasks]);

  if (loading) return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Memuat data kelas...</p>
      </div>
    </div>
  );
  if (!kelas) return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <p className="text-red-600">Data kelas tidak ditemukan.</p>
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-500 via-purple-400 to-purple-300 text-white shadow-lg p-6 mb-8">
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

      {/* Child Selector */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="w-5 h-5" />
          Pilih Anak
        </h3>
        {anakList.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Tidak ada data anak terhubung.</p>
        ) : (
          <select
            className="w-full md:w-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
            value={selectedAnakId || ''}
            onChange={e => setSelectedAnakId(e.target.value)}
          >
            {anakList.map(a => (
              <option key={a.siswa_id?._id || a.siswa_id || a._id} value={a.siswa_id?._id || a.siswa_id || a._id}>
                {a.siswa_id?.nama || a.nama || 'Nama Anak Tidak Tersedia'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Widget */}
      {selectedAnakId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgNilai || '-'}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.attendanceRate}%</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 border border-gray-200 dark:border-gray-700">
            <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tugas Belum Selesai</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h3 className="font-semibold">Nilai Anak</h3>
        {toast.message && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        )}
        <table className="modern-table">
          <tbody>
            {myNilai.length === 0 && !loading && (
              <tr><td colSpan="100%" className="text-center py-6 text-gray-400">Belum ada nilai</td></tr>
            )}
            {loading && (
              <tr><td colSpan="100%" className="text-center py-6"><span className="loading-spinner"></span> Memuat data...</td></tr>
            )}
            {myNilai.map((n, i) => (
              <tr key={i}>
                <td>{n.tugas_id?.judul || '-'}</td>
                <td>{n.nilai ?? '-'}</td>
                <td>{n.feedback ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Kehadiran Anak</h3>
        {loading ? (
          <div className="text-center py-6"><span className="spinner"></span> Memuat data...</div>
        ) : myAttendance.length === 0 ? (
          <div className="empty-state">
            <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            <div>Belum ada data kehadiran.</div>
          </div>
        ) : (
          <>
            <table className="modern-table mb-2">
              <thead>
                <tr>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map((a, i) => {
                  let badge = 'bg-gray-200 text-gray-700';
                  if (a.status === 'Hadir') badge = 'bg-green-100 text-green-700';
                  else if (a.status === 'Izin') badge = 'bg-blue-100 text-blue-700';
                  else if (a.status === 'Sakit') badge = 'bg-yellow-100 text-yellow-700';
                  else if (a.status === 'Alfa') badge = 'bg-red-100 text-red-700';
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2">{a.tanggal ? new Date(a.tanggal).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2"><span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{a.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Progress bar */}
            {(() => {
              const total = myAttendance.length;
              const hadir = myAttendance.filter(a => a.status === 'Hadir').length;
              const persen = total ? Math.round((hadir / total) * 100) : 0;
              let badge = 'bg-gray-200 text-gray-700';
              if (persen >= 90) badge = 'bg-green-100 text-green-700';
              else if (persen >= 75) badge = 'bg-blue-100 text-blue-700';
              else if (persen >= 50) badge = 'bg-yellow-100 text-yellow-700';
              else badge = 'bg-red-100 text-red-700';
              return (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-32 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-3 rounded-full ${badge}`} style={{ width: `${persen}%` }}></div>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{persen}% Hadir</span>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Pengumuman</h3>
        {loading ? (
          <div className="text-center py-6"><span className="spinner"></span> Memuat pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <div>Belum ada pengumuman untuk kelas ini.</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <div key={a._id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">Pengumuman</span>
                  <span className="ml-auto text-xs text-gray-400">{a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID') : ''}</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-3">{a.deskripsi || '-'}</div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-xs text-gray-500">Oleh: {a.author?.nama || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 