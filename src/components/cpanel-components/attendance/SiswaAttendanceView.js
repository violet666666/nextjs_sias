"use client";
import { useState, useEffect, useCallback } from "react";
import Toast from "@/components/common/Toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Pastikan ini diimpor dan digunakan
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function SiswaAttendanceView({ user, setToast }) {
  const [activeSessionsForSiswa, setActiveSessionsForSiswa] = useState([]);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [myAttendances, setMyAttendances] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Pagination state for attendance history
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchSiswaData = useCallback(async () => {
    if (!user || user.role !== "siswa") return;
    setLoadingData(true);
    try {
      const [activeSessionsRes, myAttendancesRes, enrollmentsRes] = await Promise.all([
        fetchWithAuth(`/api/attendance-sessions?status=open`), // Gunakan fetchWithAuth
        fetchWithAuth(`/api/kehadiran?siswa_id=${user.id}`), // Gunakan fetchWithAuth
        fetchWithAuth(`/api/enrollments?siswa_id=${user.id}`) // Gunakan fetchWithAuth
      ]);

      if (!activeSessionsRes.ok) throw new Error(`Gagal mengambil sesi aktif: ${activeSessionsRes.statusText}`);
      if (!myAttendancesRes.ok) throw new Error(`Gagal mengambil riwayat absensi: ${myAttendancesRes.statusText}`);
      if (!enrollmentsRes.ok) throw new Error(`Gagal mengambil data enrollment: ${enrollmentsRes.statusText}`);

      const activeSessionsData = await activeSessionsRes.json();
      const myAttendancesData = await myAttendancesRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      setMyEnrollments(enrollmentsData);
      const enrolledKelasIds = enrollmentsData.map(e => e.kelas_id._id);

      // Filter sesi aktif berdasarkan kelas yang diikuti siswa
      const filteredActiveSessions = activeSessionsData.filter(session =>
        enrolledKelasIds.includes(session.kelas_id._id)
      );

      setActiveSessionsForSiswa(filteredActiveSessions);
      setMyAttendances(myAttendancesData);

    } catch (error) {
      console.error("Error in fetchSiswaData:", error); // Tambahkan log error detail
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoadingData(false);
    }
  }, [user, setToast]);

  useEffect(() => {
    // Pastikan user dan user.id ada sebelum fetch
    if (user && user.id) {
      fetchSiswaData();
    }
  }, [user, fetchSiswaData]);

  const handleSiswaSubmitAttendance = async (sessionId, kelasId) => {
    setIsSubmittingAttendance(true);
    try {
      const res = await fetchWithAuth("/api/kehadiran/submit-self", { // Pastikan fetchWithAuth digunakan
        method: "POST",
        body: JSON.stringify({ kelas_id: kelasId, session_id: sessionId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal submit absensi");
      setToast({ message: "Absensi berhasil disubmit!", type: "success" });
      fetchSiswaData();
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  // Tambahkan useEffect untuk memanggil fetchSiswaData ketika user berubah (misalnya setelah login)
  useEffect(() => {
    if (user && user.role === "siswa") {
      fetchSiswaData();
    }
  }, [user, fetchSiswaData]);
  if (loadingData) return <div className="text-center py-10">Memuat data siswa...</div>;

  return (
    <div className="p-6 text-black">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Sesi Absensi Aktif</h1>
      </div>

      {activeSessionsForSiswa.length === 0 && (
        <div className="text-center text-gray-500 py-8">Tidak ada sesi absensi yang aktif untuk kelas Anda saat ini.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeSessionsForSiswa.map((session) => {
          const sudahAbsen = myAttendances.some(att => att.kelas_id?._id === session.kelas_id?._id && new Date(att.tanggal) >= new Date(session.waktu_mulai) && new Date(att.tanggal) <= new Date(session.waktu_selesai));
          return (
            <div key={session._id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">{session.kelas_id?.nama_kelas}</h3>
              <p className="text-md font-medium text-gray-800 mb-1">{session.judul_pertemuan}</p>
              <p className="text-sm text-gray-600 mb-1">Dibuka oleh: {session.guru_id?.nama}</p>
              <p className="text-sm text-gray-500 mb-3">Berakhir pada: {new Date(session.waktu_selesai).toLocaleTimeString()}</p>
              {sudahAbsen ? (
                <div className="text-green-600 font-semibold">Anda sudah absen untuk sesi ini.</div>
              ) : (
                <button onClick={() => handleSiswaSubmitAttendance(session._id, session.kelas_id?._id)} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={isSubmittingAttendance}>
                  {isSubmittingAttendance ? "Mengirim..." : "Submit Kehadiran"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-bold mt-10 mb-4">Riwayat Absensi Anda</h2>
      {myAttendances.length === 0 ? (<div className="text-gray-500">Belum ada riwayat absensi.</div>) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <ResponsiveTable>
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Kelas</th><th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Tanggal</th><th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {myAttendances
                .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(att => (
                  <tr key={att._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{att.kelas_id?.nama_kelas || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{new Date(att.tanggal).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-black">{att.status}</td>
                  </tr>
                ))}
            </tbody>
          </ResponsiveTable>
          {/* Pagination Controls */}
          {Math.ceil(myAttendances.length / itemsPerPage) > 1 && (
            <div className="flex justify-center items-center gap-4 p-4 bg-gray-50 border-t">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {Math.ceil(myAttendances.length / itemsPerPage)} ({myAttendances.length} total)
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(myAttendances.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(myAttendances.length / itemsPerPage)}
                className="px-4 py-2 rounded-lg bg-white border border-gray-300 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}