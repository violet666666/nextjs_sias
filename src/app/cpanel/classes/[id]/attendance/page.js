"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor helper
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [kelas, setKelas] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState({}); // { studentId: status }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rekap, setRekap] = useState([]);
  const [rekapLoading, setRekapLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    async function fetchKelas() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/kelas/${id}`);
        if (!res.ok) throw new Error("Gagal mengambil data kelas");
        const data = await res.json();
        setKelas(data);
        // Untuk students, lebih baik fetch dari enrollments
        const enrollRes = await fetchWithAuth(`/api/enrollments?kelas_id=${id}`);
        if (!enrollRes.ok) throw new Error("Gagal mengambil data siswa");
        const enrollData = await enrollRes.json();
        setStudents(enrollData.map(e => e.siswa_id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchKelas();
  }, [id]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (user.role !== "guru") {
      router.push("/cpanel/dashboard");
    }
  }, [router]);

  // Fetch rekap kehadiran
  const fetchRekap = async () => {
    setRekapLoading(true);
    try {
      const res = await fetchWithAuth(`/api/kehadiran?kelas_id=${id}`);
      if (!res.ok) throw new Error("Gagal mengambil rekap kehadiran");
      const data = await res.json();
      setRekap(data);
    } catch (err) {
      setError(err.message); // Bisa gunakan state error sendiri untuk rekap
    } finally {
      setRekapLoading(false);
    }
  };
  useEffect(() => {
    if (id) fetchRekap();
  }, [id]);

  // Handle input kehadiran
  const handleChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  // Submit kehadiran
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = Object.entries(attendance).map(([siswa_id, status]) => ({
        kelas_id: id,
        siswa_id,
        tanggal: date,
        status,
      }));
      const res = await fetchWithAuth("/api/kehadiran/bulk", {
        method: "POST",
        body: JSON.stringify({ data: payload }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan kehadiran");
      setAttendance({});
      fetchRekap();
      setToast({ message: "Kehadiran berhasil disimpan", type: "success" });
    } catch (err) {
      setError(err.message);
      setToast({ message: "Gagal menyimpan kehadiran", type: "error" });
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading...</div>;
  if (!kelas && !loading) return <div className="p-8 text-center text-red-600 dark:text-red-400">{error || "Kelas tidak ditemukan."}</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4 transition-colors duration-300">Input Kehadiran - {kelas.nama_kelas || kelas.namaKelas}</h1>
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="font-medium mr-2 text-gray-700 dark:text-gray-300">Tanggal:</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="border rounded p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 transition-colors duration-200" 
            />
          </div>
          <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow mb-4 transition-colors duration-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama Siswa</th>
                <th className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id || s.id}>
                  <td className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">{s.nama}</td>
                  <td className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">
                    <select
                      className="border rounded p-1 text-black dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 transition-colors duration-200"
                      value={attendance[s._id] || ""}
                      onChange={e => handleChange(s._id, e.target.value)}
                      required
                    >
                      <option value="">Pilih Status</option>
                      <option value="Hadir">Hadir</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Izin">Izin</option>
                      <option value="Alfa">Alfa</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200" 
            disabled={saving}
          >
            {saving ? <LoadingSpinner /> : "Simpan Kehadiran"}
          </button>
        </form>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 mt-6 transition-colors duration-300">Rekap Kehadiran</h2>
        {rekapLoading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading rekap...</div>
        ) : rekap.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">Belum ada data kehadiran.</div>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow transition-colors duration-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">Tanggal</th>
                <th className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">Nama Siswa</th>
                <th className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map((k, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID') : "-"}</td>
                  <td className="py-2 px-4 border-b text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.siswa_nama || k.siswa?.nama || "-"}</td>
                  <td className="py-2 px-4 border-b capitalize text-black dark:text-gray-100 border-gray-300 dark:border-gray-600">{k.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
    </div>
  );
} 