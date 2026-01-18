"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor fetchWithAuth
import ProtectedRoute from '@/components/common/ProtectedRoute';
import Link from 'next/link';

export default function MonitoringPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [kehadiran, setKehadiran] = useState([]);
  const [nilai, setNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    if (u.role !== "siswa" && u.role !== "orangtua") {
      router.push("/cpanel/dashboard");
      return;
    }
    if (u.role === "orangtua") {
      const anak = localStorage.getItem("anak_id");
      if (!anak) {
        setToast({ message: "Silakan pilih anak terlebih dahulu di dashboard.", type: "error" });
        setTimeout(() => router.push("/cpanel/dashboard"), 1500);
        return;
      }
    }
    fetchData(u);
  }, [router]);

  useEffect(() => {
    async function fetchChildren() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchWithAuth('/api/orangtua/children-summary');
        if (!res.ok) throw new Error('Gagal memuat data anak.');
        const data = await res.json();
        setChildren(Array.isArray(data.children) ? data.children : []);
      } catch (err) {
        setError(err.message || 'Gagal memuat data anak.');
      } finally {
        setLoading(false);
      }
    }
    fetchChildren();
  }, []);

  async function fetchData(u) {
    setLoading(true);
    setError("");
    try {
      let siswaId = u._id || u.id;
      // Jika orangtua, ambil id anak dari localStorage (atau API jika sudah ada relasi)
      if (u.role === "orangtua") {
        const anak = localStorage.getItem("anak_id");
        if (anak) siswaId = anak;
        // TODO: fetch id anak dari API jika perlu
      }
      const [kRes, nRes] = await Promise.all([
        fetchWithAuth(`/api/kehadiran?siswa_id=${siswaId}`), // Gunakan fetchWithAuth
        fetchWithAuth(`/api/submissions?siswa_id=${siswaId}`), // Gunakan fetchWithAuth
      ]);
      if (!kRes.ok || !nRes.ok) throw new Error("Gagal mengambil data monitoring");
      setKehadiran(await kRes.json());
      setNilai(await nRes.json());
      setToast({ message: "Data monitoring berhasil dimuat", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute requiredRoles={['orangtua', 'parent']}>
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Monitoring Anak</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Memuat data anak...</div>
          ) : error ? (
            <div className="text-red-500 font-semibold">{error}</div>
          ) : children.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">Belum ada anak yang terhubung ke akun Anda.</div>
          ) : (
            <table className="w-full border mt-4">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900">
                  <th className="p-2 border">Nama Anak</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Nilai (Rata-rata)</th>
                  <th className="p-2 border">Kehadiran</th>
                  <th className="p-2 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <MonitoringChildRow key={child._id} siswa={child} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function MonitoringChildRow({ siswa }) {
  const [nilai, setNilai] = useState(siswa.nilaiRataRata ?? '-');
  const [kehadiran, setKehadiran] = useState(siswa.kehadiran ?? '-');
  const [loading, setLoading] = useState(!(siswa.nilaiRataRata && siswa.kehadiran));

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const nilaiRes = await fetchWithAuth(`/api/rekap/nilai?siswa_id=${siswa._id}`);
        let avg = '-';
        if (nilaiRes.ok) {
          const nilaiData = await nilaiRes.json();
          if (Array.isArray(nilaiData) && nilaiData.length > 0) {
            const total = nilaiData.reduce((sum, n) => sum + (n.avg_nilai || 0), 0);
            avg = (total / nilaiData.length).toFixed(2);
          }
        }
        const kehadiranRes = await fetchWithAuth(`/api/kehadiran?siswa_id=${siswa._id}`);
        let hadir = 0, total = 0;
        if (kehadiranRes.ok) {
          const kehadiranData = await kehadiranRes.json();
          if (Array.isArray(kehadiranData) && kehadiranData.length > 0) {
            total = kehadiranData.length;
            hadir = kehadiranData.filter(k => k.status === 'Hadir').length;
          }
        }
        if (isMounted) {
          setNilai(avg);
          setKehadiran(`${hadir}/${total}`);
        }
      } catch {
        if (isMounted) {
          setNilai('-');
          setKehadiran('-');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [siswa._id]);

  return (
    <tr>
      <td className="p-2 border">{siswa.nama}</td>
      <td className="p-2 border">{siswa.email}</td>
      <td className="p-2 border text-center">{loading ? '...' : nilai}</td>
      <td className="p-2 border text-center">{loading ? '...' : kehadiran}</td>
      <td className="p-2 border text-center">
        <Link
          href={`/cpanel/children/${siswa._id}`}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Lihat Monitoring Anak"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Lihat Detail
        </Link>
      </td>
    </tr>
  );
} 