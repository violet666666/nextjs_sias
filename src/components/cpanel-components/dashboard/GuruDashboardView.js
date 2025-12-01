"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from '@/components/common/Toast';

export default function GuruDashboardView({ user }) {
  const [mapelList, setMapelList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [tugasMapel, setTugasMapel] = useState({});
  const [absensiMapel, setAbsensiMapel] = useState({});
  const [nilaiMapel, setNilaiMapel] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMapel, setActiveMapel] = useState(null);
  const [activeKelas, setActiveKelas] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    if (!user || user.role !== "guru") return;
    setLoading(true);
    setError("");
    async function fetchData() {
      try {
        // Ambil daftar mapel yang diampu guru
        const mapelRes = await fetchWithAuth(`/api/subjects?guru_id=${user.id}`);
        if (!mapelRes.ok) throw new Error("Gagal mengambil data mapel");
        const mapelArr = await mapelRes.json();
        setMapelList(Array.isArray(mapelArr) ? mapelArr : []);
        setActiveMapel(mapelArr[0]?._id || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Ambil daftar kelas dari mapel yang dipilih
  useEffect(() => {
    if (!activeMapel) return;
    setLoading(true);
    setError("");
    async function fetchKelas() {
      try {
        const mapel = mapelList.find(m => m._id === activeMapel);
        if (!mapel) throw new Error("Mapel tidak ditemukan");
        // Ambil kelas dari field kelas_id di mapel
        const kelasRes = await fetchWithAuth(`/api/kelas?id=${mapel.kelas_id}`);
        if (!kelasRes.ok) throw new Error("Gagal mengambil data kelas");
        const kelasObj = await kelasRes.json();
        setKelasList(Array.isArray(kelasObj) ? kelasObj : [kelasObj]);
        setActiveKelas((Array.isArray(kelasObj) ? kelasObj[0]?._id : kelasObj?._id) || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchKelas();
  }, [activeMapel]);

  // Ambil siswa, tugas, absensi, nilai untuk kelas & mapel terpilih
  useEffect(() => {
    if (!activeMapel || !activeKelas) return;
    setLoading(true);
    setError("");
    async function fetchDetail() {
      try {
        // Siswa di kelas
        const siswaRes = await fetchWithAuth(`/api/kelas/${activeKelas}`);
        if (!siswaRes.ok) throw new Error("Gagal mengambil data siswa kelas");
        const kelasData = await siswaRes.json();
        setSiswaList(kelasData.siswa_ids || []);
        // Tugas mapel di kelas
        const tugasRes = await fetchWithAuth(`/api/tugas?mapel_id=${activeMapel}&kelas_id=${activeKelas}`);
        setTugasMapel({ [activeMapel]: tugasRes.ok ? await tugasRes.json() : [] });
        // Absensi mapel di kelas
        const absensiRes = await fetchWithAuth(`/api/kehadiran?mapel_id=${activeMapel}&kelas_id=${activeKelas}`);
        setAbsensiMapel({ [activeMapel]: absensiRes.ok ? await absensiRes.json() : [] });
        // Nilai mapel di kelas
        const nilaiRes = await fetchWithAuth(`/api/grades?mapel_id=${activeMapel}&kelas_id=${activeKelas}`);
        setNilaiMapel({ [activeMapel]: nilaiRes.ok ? await nilaiRes.json() : [] });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [activeMapel, activeKelas]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard Guru</h2>
      <div className="mb-4 flex gap-2 flex-wrap">
        {mapelList.map(m => (
          <button key={m._id} onClick={() => setActiveMapel(m._id)} className={`px-3 py-1 rounded ${activeMapel === m._id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{m.nama}</button>
        ))}
      </div>
      {activeMapel && (
        <div className="mb-4 flex gap-2 flex-wrap">
          {kelasList.map(k => (
            <button key={k._id} onClick={() => setActiveKelas(k._id)} className={`px-3 py-1 rounded ${activeKelas === k._id ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>{k.nama_kelas}</button>
          ))}
        </div>
      )}
      {activeMapel && activeKelas && (
        <div className="space-y-6">
          <section>
            <h3 className="text-xl font-semibold mb-3">Daftar Siswa Kelas: {kelasList.find(k => k._id === activeKelas)?.nama_kelas}</h3>
            {siswaList.length === 0 ? <p>Tidak ada siswa di kelas ini.</p> : (
              <ul className="space-y-2">
                {siswaList.map(s => (
                  <li key={s._id || s} className="bg-white p-2 rounded shadow flex justify-between items-center">
                    <span>{s.nama || s}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-3">Tugas Mapel: {mapelList.find(m => m._id === activeMapel)?.nama}</h3>
            {tugasMapel[activeMapel]?.length === 0 ? <p>Tidak ada tugas untuk mapel ini.</p> : (
              <ul className="space-y-3">
                {tugasMapel[activeMapel].map(t => (
                  <li key={t._id} className="bg-white p-4 rounded shadow">
                    <h4 className="font-semibold">{t.judul}</h4>
                    <p className="text-sm text-gray-600">Deadline: {new Date(t.tanggal_deadline).toLocaleString()}</p>
                  </li>
                ))}
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
          <section>
            <h3 className="text-xl font-semibold mb-3">Nilai Mapel: {mapelList.find(m => m._id === activeMapel)?.nama}</h3>
            {nilaiMapel[activeMapel]?.length === 0 ? <p>Belum ada nilai untuk mapel ini.</p> : (
              <ul className="space-y-2">
                {nilaiMapel[activeMapel].map(n => (
                  <li key={n._id} className="bg-white p-2 rounded shadow flex justify-between items-center">
                    <span>{n.siswa_nama || n.siswa_id} - Nilai: <span className="font-semibold">{n.nilai}</span></span>
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