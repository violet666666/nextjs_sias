import React, { useState, useEffect } from 'react';
import useKelasDetail from './useKelasDetail';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Toast from '../common/Toast';
import { 
  Info, Users, BookOpen, FileText, Award, ClipboardCheck, Bell,
  User, Mail, Calendar, Clock, GraduationCap, CheckCircle, XCircle, AlertCircle, Clock as ClockIcon
} from 'lucide-react';

export default function ClassDetailSiswa({ kelasId }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId, refreshKey);
  const [user, setUser] = useState(null);
  const [myNilai, setMyNilai] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    setUser(u);
  }, []);

  useEffect(() => {
    if (!user) return;
    setMyNilai(nilai.filter(n => n.siswa_id === user.id || n.siswa_id?._id === user.id));
    setMyAttendance(attendance.filter(a => a.siswa_id === user.id || a.siswa_id?._id === user.id));
  }, [user, nilai, attendance]);


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

  // Hitung statistik kehadiran
  const totalAttendance = myAttendance.length;
  const hadirCount = myAttendance.filter(a => a.status === 'Hadir').length;
  const izinCount = myAttendance.filter(a => a.status === 'Izin').length;
  const sakitCount = myAttendance.filter(a => a.status === 'Sakit').length;
  const alfaCount = myAttendance.filter(a => a.status === 'Alfa').length;
  const persenHadir = totalAttendance ? Math.round((hadirCount / totalAttendance) * 100) : 0;
  
  let badgeHadir = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  if (persenHadir >= 90) badgeHadir = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
  else if (persenHadir >= 75) badgeHadir = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
  else if (persenHadir >= 50) badgeHadir = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
  else badgeHadir = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';

  // Hitung nilai rata-rata
  const totalNilai = myNilai.reduce((acc, n) => acc + (n.nilai || 0), 0);
  const avgNilai = myNilai.length ? Math.round(totalNilai / myNilai.length) : 0;

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* HEADER KELAS */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white shadow-lg p-6 mb-8">
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

      {/* INFO KELAS */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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

      {/* STATISTIK CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nilai Rata-rata</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgNilai || '-'}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
            <ClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Kehadiran</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{persenHadir}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tugas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* DAFTAR TUGAS */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Daftar Tugas
        </h3>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Tidak ada tugas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.judul}</h4>
                    {t.deskripsi && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.deskripsi}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Deadline: {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded font-semibold ${t.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {t.status === 'active' ? 'Aktif' : 'Selesai'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NILAI SAYA */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Nilai Saya
        </h3>
        {myNilai.length === 0 && !loading ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada nilai</p>
          </div>
        ) : loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Tugas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Nilai</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {myNilai.map((n, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{n.tugas_id?.judul || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{n.nilai ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{n.feedback ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KEHADIRAN SAYA */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Kehadiran Saya
        </h3>
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : myAttendance.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada data kehadiran.</p>
          </div>
        ) : (
          <>
            {/* Statistik Kehadiran */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{hadirCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Hadir</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{izinCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Izin</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{sakitCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Sakit</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{alfaCount}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Alfa</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Persentase Kehadiran</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded ${badgeHadir}`}>{persenHadir}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full ${badgeHadir}`} style={{ width: `${persenHadir}%` }}></div>
              </div>
            </div>

            {/* Tabel Kehadiran */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {myAttendance.map((a, i) => {
                    let badge = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                    let icon = <ClockIcon className="w-4 h-4" />;
                    if (a.status === 'Hadir') { badge = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'; icon = <CheckCircle className="w-4 h-4" />; }
                    else if (a.status === 'Izin') { badge = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'; icon = <AlertCircle className="w-4 h-4" />; }
                    else if (a.status === 'Sakit') { badge = 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'; icon = <AlertCircle className="w-4 h-4" />; }
                    else if (a.status === 'Alfa') { badge = 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'; icon = <XCircle className="w-4 h-4" />; }
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {a.tanggal ? new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded font-semibold ${badge}`}>
                            {icon}
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* PENGUMUMAN */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Pengumuman
        </h3>
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat pengumuman...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada pengumuman untuk kelas ini.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <div key={a._id || i} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl shadow-md p-4 border border-blue-200 dark:border-blue-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">Pengumuman</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
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


      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}
    </div>
  );
}
