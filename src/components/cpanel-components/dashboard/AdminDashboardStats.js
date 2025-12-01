"use client";

import { useMemo } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded shadow p-4 flex flex-col items-center ${color} text-white`}>
      <div className="text-2xl font-bold mb-2">{value}</div>
      <div className="text-sm font-semibold">{label}</div>
    </div>
  );
}

export default function AdminDashboardStats({ users, kelas, tugas, kehadiran, loading }) {
  const totalSiswa = useMemo(() => users.filter(u => u.role === "siswa").length, [users]);
  const totalGuru = useMemo(() => users.filter(u => u.role === "guru").length, [users]);
  const totalOrangtua = useMemo(() => users.filter(u => u.role === "orangtua").length, [users]);
  const totalKelas = useMemo(() => kelas.length, [kelas]);
  const totalTugas = useMemo(() => tugas.length, [tugas]);

  const kehadiranStats = useMemo(() => {
    const stats = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
    if (Array.isArray(kehadiran)) {
      kehadiran.forEach(k => {
        if (stats.hasOwnProperty(k.status)) stats[k.status]++;
      });
    }
    return stats;
  }, [kehadiran]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Siswa" value={totalSiswa} color="bg-blue-500" />
        <StatCard label="Total Guru" value={totalGuru} color="bg-green-500" />
        <StatCard label="Total Orangtua" value={totalOrangtua} color="bg-yellow-500" />
        <StatCard label="Total Kelas" value={totalKelas} color="bg-purple-500" />
        <StatCard label="Total Tugas" value={totalTugas} color="bg-pink-500" />
      </div>
      <div className="bg-white rounded shadow p-6 mb-8 text-black">
        <h2 className="text-xl font-bold mb-4">Grafik Kehadiran Siswa (Contoh)</h2>
        <div className="flex gap-6 items-end h-40">
          {Object.entries(kehadiranStats).map(([status, count]) => (
            <div key={status} className="flex flex-col items-center flex-1">
              <div className={`w-10 rounded-t bg-blue-400 mb-2`} style={{ height: `${Math.min(count * 5 + 10, 150)}px` }} title={status}></div>
              <span className="font-semibold text-sm">{status}</span>
              <span className="text-lg font-bold">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}