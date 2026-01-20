"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BarChart from '@/components/common/BarChart';

function KehadiranAnakTable({ siswaId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!siswaId) { setLoading(false); setData([]); return; }
    setLoading(true);
    fetchWithAuth(`/api/kehadiran?siswa_id=${siswaId}`)
      .then(res => res.ok ? res.json() : Promise.reject("Gagal ambil kehadiran anak"))
      .then(all => setData(Array.isArray(all) ? all : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siswaId]);

  if (loading) return <p>Memuat kehadiran anak...</p>;
  if (!data.length) return <p>Tidak ada data kehadiran anak.</p>;
  return (
    <table className="min-w-full bg-white rounded shadow mb-4 text-sm">
      <thead><tr><th className="py-1 px-2 border-b">Kelas</th><th className="py-1 px-2 border-b">Tanggal</th><th className="py-1 px-2 border-b">Status</th></tr></thead>
      <tbody>{data.map(d => (<tr key={d._id}><td className="py-1 px-2 border-b">{d.kelas_id?.nama_kelas || '-'}</td><td className="py-1 px-2 border-b">{new Date(d.tanggal).toLocaleDateString()}</td><td className="py-1 px-2 border-b">{d.status}</td></tr>))}</tbody>
    </table>
  );
}

function NilaiAnakTable({ siswaId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!siswaId) { setLoading(false); setData([]); return; }
    setLoading(true);
    fetchWithAuth(`/api/submissions?siswa_id=${siswaId}`)
      .then(res => res.ok ? res.json() : Promise.reject("Gagal ambil nilai anak"))
      .then(all => setData(Array.isArray(all) ? all : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [siswaId]);

  if (loading) return <p>Memuat nilai anak...</p>;
  if (!data.length) return <p>Tidak ada data nilai anak.</p>;
  return (
    <table className="min-w-full bg-white rounded shadow mb-4 text-sm">
      <thead><tr><th className="py-1 px-2 border-b">Tugas</th><th className="py-1 px-2 border-b">Nilai</th><th className="py-1 px-2 border-b">Feedback</th></tr></thead>
      <tbody>{data.map(d => (<tr key={d._id}><td className="py-1 px-2 border-b">{d.tugas_id?.judul || '-'}</td><td className="py-1 px-2 border-b">{d.nilai ?? '-'}</td><td className="py-1 px-2 border-b">{d.feedback || '-'}</td></tr>))}</tbody>
    </table>
  );
}

function NilaiAnakChart({ siswaId }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!siswaId) { setData([]); return; }
    fetchWithAuth(`/api/submissions?siswa_id=${siswaId}`)
      .then(res => res.ok ? res.json() : [])
      .then(all => {
        setData(Array.isArray(all) ? all.map(d => ({ name: d.tugas_id?.judul || '-', value: typeof d.nilai === 'number' ? d.nilai : 0 })) : []);
      })
      .catch(() => setData([]));
  }, [siswaId]);
  if (!data.length) return <p>Tidak ada data nilai anak.</p>;
  return <BarChart data={data} title="Grafik Nilai Anak" color="#3B82F6" />;
}

function KehadiranAnakChart({ siswaId }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (!siswaId) { setData([]); return; }
    fetchWithAuth(`/api/kehadiran?siswa_id=${siswaId}`)
      .then(res => res.ok ? res.json() : [])
      .then(all => {
        // Hitung jumlah hadir, izin, sakit, alfa
        const stat = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0 };
        (Array.isArray(all) ? all : []).forEach(a => { if (stat[a.status] !== undefined) stat[a.status]++; });
        setData(Object.entries(stat).map(([name, value]) => ({ name, value })));
      })
      .catch(() => setData([]));
  }, [siswaId]);
  if (!data.length) return <p>Tidak ada data kehadiran anak.</p>;
  return <BarChart data={data} title="Grafik Kehadiran Anak" color="#10B981" />;
}

export default function OrangtuaDashboardView({ user }) {
  const [anakList, setAnakList] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState(null);
  const [mapelList, setMapelList] = useState([]);
  const [tugasMapel, setTugasMapel] = useState({});
  const [absensiMapel, setAbsensiMapel] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMapel, setActiveMapel] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "orangtua") return;
    setLoading(true);
    setError("");
    fetchWithAuth(`/api/orangtua?user_id=${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data anak");
        return res.json();
      })
      .then(data => {
        const listAnak = Array.isArray(data) ? data : [];
        setAnakList(listAnak);
        if (listAnak.length > 0) {
          setSelectedAnak(listAnak[0]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedAnak) return;
    async function fetchMapelTugasAbsensi() {
      setLoading(true);
      setError("");
      try {
        const siswaId = selectedAnak.siswa_id?._id || selectedAnak.siswa_id;

        // Try to get kelas_id from various sources
        let kelasId = selectedAnak.siswa_id?.kelas_id || selectedAnak.siswa_id?.kelas || selectedAnak.kelas_id;

        // If kelas_id not found directly, try to get from enrollment
        if (!kelasId && siswaId) {
          try {
            const enrollRes = await fetchWithAuth(`/api/enrollment?siswa_id=${siswaId}`);
            if (enrollRes.ok) {
              const enrollData = await enrollRes.json();
              if (Array.isArray(enrollData) && enrollData.length > 0) {
                kelasId = enrollData[0].kelas_id?._id || enrollData[0].kelas_id;
              }
            }
          } catch (e) {
            console.warn("Could not fetch enrollment:", e);
          }
        }

        if (!kelasId) {
          // If still no kelas, show friendly message instead of hard error
          setMapelList([]);
          setError("Data kelas anak belum tersedia. Hubungi admin.");
          setLoading(false);
          return;
        }

        // Ambil daftar mapel
        const mapelRes = await fetchWithAuth(`/api/subjects?kelas_id=${kelasId}`);
        if (!mapelRes.ok) throw new Error("Gagal mengambil data mapel anak");
        const mapelArr = await mapelRes.json();
        setMapelList(Array.isArray(mapelArr) ? mapelArr : []);
        setActiveMapel(mapelArr[0]?._id || null);
        // Ambil tugas & absensi per mapel
        const tugasObj = {};
        const absensiObj = {};
        for (const mapel of mapelArr) {
          const tugasRes = await fetchWithAuth(`/api/tugas?mapel_id=${mapel._id}`);
          tugasObj[mapel._id] = tugasRes.ok ? await tugasRes.json() : [];
          const absensiRes = await fetchWithAuth(`/api/kehadiran?mapel_id=${mapel._id}&siswa_id=${selectedAnak.siswa_id?._id || selectedAnak.siswa_id}`);
          absensiObj[mapel._id] = absensiRes.ok ? await absensiRes.json() : [];
        }
        setTugasMapel(tugasObj);
        setAbsensiMapel(absensiObj);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMapelTugasAbsensi();
  }, [selectedAnak]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>;

  return (
    <div className="text-black space-y-6">
      <h2 className="text-2xl font-bold">Monitoring Akademik Anak</h2>
      {anakList.length === 0 ? (
        <p>Tidak ada data anak yang terhubung dengan akun Anda.</p>
      ) : (
        <>
          <div className="mb-4">
            <label htmlFor="anakSelect" className="font-semibold mr-2">Pilih Anak:</label>
            <select
              id="anakSelect"
              className="border rounded p-2 text-black"
              value={selectedAnak?.siswa_id?._id || selectedAnak?.siswa_id || ""}
              onChange={e => setSelectedAnak(anakList.find(a => (a.siswa_id?._id || a.siswa_id) === e.target.value))}
            >
              {anakList.map((a) => (
                <option key={a.siswa_id?._id || a.siswa_id} value={a.siswa_id?._id || a.siswa_id}>
                  {a.siswa_id?.nama || "Nama Anak Tidak Tersedia"}
                </option>
              ))}
            </select>
          </div>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}