"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Toast from "@/components/common/Toast";
import { saveAs } from "file-saver";

export default function RekapNilaiPage() {
  const [data, setData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [kelasId, setKelasId] = useState("");
  const [siswaId, setSiswaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [exporting, setExporting] = useState(false);

  // Fetch kelas list for filter
  useEffect(() => {
    fetchWithAuth("/api/kelas")
      .then(res => res.json())
      .then(data => setKelasList(Array.isArray(data) ? data : []));
  }, []);

  // Fetch siswa list when kelasId changes
  useEffect(() => {
    if (!kelasId) {
      setSiswaList([]);
      return;
    }
    fetchWithAuth(`/api/kelas/${kelasId}/students`)
      .then(res => res.json())
      .then(data => setSiswaList(Array.isArray(data) ? data : []));
  }, [kelasId]);

  // Fetch rekap nilai
  const fetchRekap = async () => {
    setLoading(true);
    setError("");
    let url = "/api/rekap/nilai";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal mengambil rekap nilai");
      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
      setToast({ message: err.message, type: "error" });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRekap();
    // eslint-disable-next-line
  }, [kelasId, siswaId]);

  const handleExportExcel = async () => {
    setExporting(true);
    let url = "/api/rekap/nilai/export";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal ekspor Excel");
      const blob = await res.blob();
      saveAs(blob, "rekap_nilai.xlsx");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    let url = "/api/rekap/nilai/export-pdf";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal ekspor PDF");
      const blob = await res.blob();
      saveAs(blob, "rekap_nilai.pdf");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
    setExporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-black">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
      <h1 className="text-2xl font-bold mb-4">Rekap Nilai Siswa</h1>
      <form className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block font-semibold mb-1">Kelas</label>
          <select value={kelasId} onChange={e => setKelasId(e.target.value)} className="border rounded p-2 w-48">
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k._id} value={k._id}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Siswa</label>
          <select value={siswaId} onChange={e => setSiswaId(e.target.value)} className="border rounded p-2 w-48" disabled={!kelasId}>
            <option value="">Semua Siswa</option>
            {siswaList.map(s => (
              <option key={s._id} value={s._id}>{s.nama}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={fetchRekap} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow">Terapkan Filter</button>
      </form>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow disabled:opacity-60"
          disabled={exporting}
        >
          {exporting ? "Mengekspor..." : "Ekspor Excel"}
        </button>
        <button
          type="button"
          onClick={handleExportPDF}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold shadow disabled:opacity-60"
          disabled={exporting}
        >
          {exporting ? "Mengekspor..." : "Ekspor PDF"}
        </button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-gray-500">Tidak ada data rekap nilai.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nama Siswa</th>
                <th className="py-2 px-4 border-b">Tugas</th>
                <th className="py-2 px-4 border-b">Rata-rata</th>
                <th className="py-2 px-4 border-b">Nilai Tertinggi</th>
                <th className="py-2 px-4 border-b">Nilai Terendah</th>
                <th className="py-2 px-4 border-b">Jumlah Submit</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border-b">{row.siswa_nama}</td>
                  <td className="py-2 px-4 border-b">{row.tugas_judul}</td>
                  <td className="py-2 px-4 border-b text-center">{row.avg_nilai?.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b text-center">{row.max_nilai}</td>
                  <td className="py-2 px-4 border-b text-center">{row.min_nilai}</td>
                  <td className="py-2 px-4 border-b text-center">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 