"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { exportAttendancePDF, downloadPDF } from "@/lib/pdfExporter";

export default function AttendanceSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionId } = params;

  const [sessionDetails, setSessionDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [user, setUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (parsedUser.role !== "guru" && parsedUser.role !== "admin") { // Admin juga mungkin perlu akses
      router.push("/cpanel/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (!sessionId || !user) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [sessionRes, participantsRes] = await Promise.all([
          fetchWithAuth(`/api/attendance-sessions/${sessionId}`),
          fetchWithAuth(`/api/kehadiran?session_id=${sessionId}`)
        ]);

        if (!sessionRes.ok) throw new Error("Gagal mengambil detail sesi.");
        const sessionData = await sessionRes.json();
        setSessionDetails(sessionData);

        if (!participantsRes.ok) throw new Error("Gagal mengambil daftar peserta.");
        const participantsData = await participantsRes.json();
        setParticipants(participantsData);

      } catch (error) {
        setToast({ message: error.message, type: "error" });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionId, user]);

  const handleExportPDF = async () => {
    if (!sessionDetails || !participants) return;
    
    setExporting(true);
    try {
      const doc = await exportAttendancePDF(
        participants,
        sessionDetails.kelas_id?.nama_kelas || 'Unknown Class',
        sessionDetails.waktu_mulai
      );
      
      const filename = `laporan-kehadiran-${sessionDetails.kelas_id?.nama_kelas}-${new Date(sessionDetails.waktu_mulai).toISOString().split('T')[0]}.pdf`;
      downloadPDF(doc, filename);
      
      setToast({ message: "PDF berhasil diunduh!", type: "success" });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: "Gagal mengekspor PDF", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  if (loading || !user) return <LoadingSpinner />;
  if (!sessionDetails) return <div className="p-6 text-center text-red-500">Sesi tidak ditemukan atau Anda tidak memiliki akses.</div>;

  return (
    <div className="p-6 text-black">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          &larr; Kembali ke Daftar Sesi
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? "Mengekspor..." : "Export PDF"}
        </button>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Detail Sesi Absensi: {sessionDetails.judul_pertemuan}</h1>
      <p className="text-gray-700 mb-1">Kelas: <span className="font-medium">{sessionDetails.kelas_id?.nama_kelas}</span></p>
      <p className="text-gray-700 mb-1">Guru: <span className="font-medium">{sessionDetails.guru_id?.nama}</span></p>
      <p className="text-gray-700 mb-1">Waktu Mulai: <span className="font-medium">{new Date(sessionDetails.waktu_mulai).toLocaleString()}</span></p>
      <p className="text-gray-700 mb-4">Waktu Selesai: <span className="font-medium">{new Date(sessionDetails.waktu_selesai).toLocaleString()}</span></p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Daftar Peserta Hadir</h2>
      {participants.length === 0 ? (
        <p className="text-gray-500">Belum ada siswa yang melakukan absensi untuk sesi ini.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Nama Siswa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Waktu Absen</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {participants.map(p => (
                <tr key={p._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{p.siswa_id?.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Hadir' ? 'bg-green-100 text-green-800' :
                      p.status === 'Izin' ? 'bg-yellow-100 text-yellow-800' :
                      p.status === 'Sakit' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(p.tanggal).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}