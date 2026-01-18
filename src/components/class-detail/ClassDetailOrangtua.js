"use client";
import React, { useState, useEffect } from 'react';
import useKelasDetail from './useKelasDetail';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Toast from '../common/Toast';
import { BookOpen, Award, Calendar, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

// Stats Card Component
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-full ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export default function ClassDetailOrangtua({ kelasId }) {
  const { kelas, tasks, nilai, attendance, loading } = useKelasDetail(kelasId);
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
        setAnakList(Array.isArray(data) ? data : []);
        if (data && data.length > 0) {
          setSelectedAnakId(data[0].siswa_id?._id || data[0].siswa_id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedAnakId) return;
    setMyNilai(nilai.filter(n => n.siswa_id === selectedAnakId || n.siswa_id?._id === selectedAnakId));
    setMyAttendance(attendance.filter(a => a.siswa_id === selectedAnakId || a.siswa_id?._id === selectedAnakId));
  }, [selectedAnakId, nilai, attendance]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!kelas) return <div className="text-center py-12 text-gray-500">Data kelas tidak ditemukan.</div>;

  // Calculate Stats for selected child
  const avgNilai = myNilai.length > 0
    ? Math.round(myNilai.reduce((acc, n) => acc + (n.nilai || 0), 0) / myNilai.length)
    : 0;
  const totalHadir = myAttendance.filter(a => a.status === 'Hadir').length;
  const totalAbsen = myAttendance.length;
  const kehadiranPersen = totalAbsen > 0 ? Math.round((totalHadir / totalAbsen) * 100) : 0;
  const tugasBelumSelesai = tasks.filter(t => {
    const submitted = myNilai.find(n => n.tugas_id === t._id || n.tugas_id?._id === t._id);
    return !submitted;
  }).length;

  const selectedAnak = anakList.find(a => (a.siswa_id?._id || a.siswa_id) === selectedAnakId);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}

      {/* Header */}
      <div className="mb-6">
        <Link href="/cpanel/classes" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Daftar Kelas
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {kelas.nama_kelas || kelas.namaKelas}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Tahun Ajaran: {kelas.tahun_ajaran || '-'} • Wali Kelas: {kelas.guru_id?.nama || '-'}
        </p>
      </div>

      {/* Pilih Anak */}
      {anakList.length > 1 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Users className="w-4 h-4 inline mr-1" /> Pilih Anak:
          </label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedAnakId || ''}
            onChange={e => setSelectedAnakId(e.target.value)}
          >
            {anakList.map(a => (
              <option key={a.siswa_id?._id || a.siswa_id} value={a.siswa_id?._id || a.siswa_id}>
                {a.siswa_id?.nama || 'Nama Anak'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Info Anak */}
      {selectedAnak && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            Menampilkan data untuk: {selectedAnak.siswa_id?.nama || 'Anak'}
          </p>
        </div>
      )}

      {/* Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Rata-rata Nilai" value={avgNilai} icon={Award} color="bg-green-500" />
        <StatCard title="Kehadiran" value={`${kehadiranPersen}%`} icon={Calendar} color="bg-purple-500" />
        <StatCard title="Tugas Belum Selesai" value={tugasBelumSelesai} icon={BookOpen} color="bg-orange-500" />
      </div>

      {/* Daftar Nilai Anak */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nilai Anak</h3>
        {myNilai.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada nilai untuk anak Anda.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tugas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nilai</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Feedback</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {myNilai.map((n, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{n.tugas_id?.judul || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${n.nilai >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {n.nilai ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{n.feedback || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kehadiran Anak */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rekap Kehadiran Anak</h3>
        {myAttendance.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data kehadiran.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="grid grid-cols-4 gap-4 text-center mb-4">
              <div>
                <p className="text-2xl font-bold text-green-600">{myAttendance.filter(a => a.status === 'Hadir').length}</p>
                <p className="text-xs text-gray-500">Hadir</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{myAttendance.filter(a => a.status === 'Izin').length}</p>
                <p className="text-xs text-gray-500">Izin</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{myAttendance.filter(a => a.status === 'Sakit').length}</p>
                <p className="text-xs text-gray-500">Sakit</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{myAttendance.filter(a => a.status === 'Alfa').length}</p>
                <p className="text-xs text-gray-500">Alfa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className={`h-3 rounded-full ${kehadiranPersen >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${kehadiranPersen}%` }}></div>
              </div>
              <span className={`text-sm font-semibold ${kehadiranPersen >= 75 ? 'text-green-600' : 'text-red-600'}`}>{kehadiranPersen}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}