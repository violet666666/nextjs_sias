"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from '@/components/common/Toast';
import BarChart from '@/components/common/BarChart';

export default function SiswaDashboardView({ user }) {
  const [kelas, setKelas] = useState(null);
  const [mapelList, setMapelList] = useState([]);
  const [tugasMapel, setTugasMapel] = useState({});
  const [absensiMapel, setAbsensiMapel] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMapel, setActiveMapel] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    if (!user || user.role !== "siswa") return;
    setLoading(true);
    setError("");
    async function fetchData() {
      try {
        // Ambil kelas utama siswa
        const kelasRes = await fetchWithAuth(`/api/kelas`);
        if (!kelasRes.ok) throw new Error("Gagal mengambil data kelas");
        const kelasArr = await kelasRes.json();
        const kelasObj = Array.isArray(kelasArr) && kelasArr.length > 0 ? kelasArr[0] : null;
        setKelas(kelasObj);
        if (!kelasObj) throw new Error("Kelas utama tidak ditemukan");
        // Ambil daftar mapel di kelas
        const mapelRes = await fetchWithAuth(`/api/subjects?kelas_id=${kelasObj._id}`);
        if (!mapelRes.ok) throw new Error("Gagal mengambil data mapel");
        const mapelArr = await mapelRes.json();
        setMapelList(Array.isArray(mapelArr) ? mapelArr : []);
        setActiveMapel(mapelArr[0]?._id || null);
        // Ambil tugas & absensi per mapel
        const tugasObj = {};
        const absensiObj = {};
        for (const mapel of mapelArr) {
          const tugasRes = await fetchWithAuth(`/api/tugas?mapel_id=${mapel._id}`);
          tugasObj[mapel._id] = tugasRes.ok ? await tugasRes.json() : [];
          const absensiRes = await fetchWithAuth(`/api/kehadiran?mapel_id=${mapel._id}&siswa_id=${user.id}`);
          absensiObj[mapel._id] = absensiRes.ok ? await absensiRes.json() : [];
        }
        setTugasMapel(tugasObj);
        setAbsensiMapel(absensiObj);
        // Ambil submissions siswa
        const submissionsRes = await fetchWithAuth(`/api/submissions?siswa_id=${user.id}`);
        if (!submissionsRes.ok) throw new Error("Gagal mengambil data submission");
        setSubmissions(await submissionsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const getSubmissionDetails = (tugasId) => submissions.find((s) => (s.tugas_id?._id || s.tugas_id) === tugasId);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>;

  return (
    <div className="text-black space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Siswa</h2>
      {kelas && <div className="mb-4">Kelas: <span className="font-semibold">{kelas.nama_kelas}</span></div>}
      <div className="mb-4 flex gap-2 flex-wrap">
        {mapelList.map(m => (
          <button key={m._id} onClick={() => setActiveMapel(m._id)} className={`px-3 py-1 rounded ${activeMapel === m._id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{m.nama}</button>
        ))}
      </div>
      {activeMapel && (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">Tugas Mapel: {mapelList.find(m => m._id === activeMapel)?.nama}</h3>
            {tugasMapel[activeMapel]?.length === 0 ? <p>Tidak ada tugas untuk mapel ini.</p> : (
              <ul className="space-y-3">
                {tugasMapel[activeMapel].map(t => {
                  const submission = getSubmissionDetails(t._id);
                  return (
                    <li key={t._id} className="bg-white p-4 rounded shadow">
                      <h4 className="font-semibold">{t.judul}</h4>
                      <p className="text-sm text-gray-600">Deadline: {new Date(t.tanggal_deadline).toLocaleString()}</p>
                      {submission ? (
                        <div className="mt-2 text-green-600">Sudah dikumpulkan. Nilai: {submission.nilai ?? '-'}</div>
                      ) : (
                        <span className="mt-2 inline-block text-yellow-600">Belum dikumpulkan</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-3">Absensi Mapel: {mapelList.find(m => m._id === activeMapel)?.nama}</h3>
            {absensiMapel[activeMapel]?.length === 0 ? <p>Tidak ada data absensi untuk mapel ini.</p> : (
              <ul className="space-y-2">
                {absensiMapel[activeMapel].map(a => (
                  <li key={a._id} className="bg-white p-2 rounded shadow flex justify-between items-center">
                    <span>{new Date(a.tanggal).toLocaleDateString()} - <span className="font-semibold">{a.status}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      {toast.message && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      )}
    </div>
  );
}