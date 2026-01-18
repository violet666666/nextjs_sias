"use client";
import React, { useState, useEffect } from 'react';
import useKelasDetail from './useKelasDetail';
import Toast from '../common/Toast';
import { BookOpen, Award, Calendar, ArrowLeft } from 'lucide-react';
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

export default function ClassDetailSiswa({ kelasId }) {
  const { kelas, tasks, nilai, attendance, loading } = useKelasDetail(kelasId);
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!kelas) return <div className="text-center py-12 text-gray-500">Data kelas tidak ditemukan.</div>;

  // Calculate Stats
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

      {/* Stats Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Rata-rata Nilai" value={avgNilai} icon={Award} color="bg-green-500" />
        <StatCard title="Kehadiran" value={`${kehadiranPersen}%`} icon={Calendar} color="bg-purple-500" />
        <StatCard title="Tugas Belum Selesai" value={tugasBelumSelesai} icon={BookOpen} color="bg-orange-500" />
      </div>

      {/* Daftar Tugas */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Tugas</h3>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Tidak ada tugas untuk kelas ini.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Judul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Deadline</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nilai</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map(t => {
                  const submission = myNilai.find(n => n.tugas_id === t._id || n.tugas_id?._id === t._id);
                  const isOverdue = t.tanggal_deadline && new Date(t.tanggal_deadline) < new Date() && !submission;
                  return (
                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{t.judul}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission?.nilai !== undefined ? (
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${submission.nilai >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {submission.nilai}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {submission ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Sudah Dinilai</span>
                        ) : isOverdue ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Terlambat</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Belum Kumpul</span>
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

      {/* Kehadiran Saya */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rekap Kehadiran Saya</h3>
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