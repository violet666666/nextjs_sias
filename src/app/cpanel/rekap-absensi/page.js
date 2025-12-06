"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Toast from "@/components/common/Toast";
import { saveAs } from "file-saver";

export default function RekapAbsensiPage() {
  const [data, setData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [kelasId, setKelasId] = useState("");
  const [siswaId, setSiswaId] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
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

  // Fetch rekap absensi
  const fetchRekap = async () => {
    setLoading(true);
    setError("");
    let url = "/api/rekap/absensi";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (dateStart) params.push(`tanggal_start=${dateStart}`);
    if (dateEnd) params.push(`tanggal_end=${dateEnd}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal mengambil rekap absensi");
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
  }, [kelasId, siswaId, dateStart, dateEnd]);

  const handleExportExcel = async () => {
    setExporting(true);
    let url = "/api/rekap/absensi/export";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (dateStart) params.push(`tanggal_start=${dateStart}`);
    if (dateEnd) params.push(`tanggal_end=${dateEnd}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal ekspor Excel");
      const blob = await res.blob();
      saveAs(blob, "rekap_absensi.xlsx");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    setExporting(true);
    let url = "/api/rekap/absensi/export-pdf";
    const params = [];
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (siswaId) params.push(`siswa_id=${siswaId}`);
    if (dateStart) params.push(`tanggal_start=${dateStart}`);
    if (dateEnd) params.push(`tanggal_end=${dateEnd}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    try {
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error("Gagal ekspor PDF");
      const blob = await res.blob();
      saveAs(blob, "rekap_absensi.pdf");
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
    setExporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-black">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
      <h1 className="text-2xl font-bold mb-4">Rekap Absensi Siswa</h1>
      <form className="flex flex-wrap gap-4 mb-6 items-end">
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
        <div>
          <label className="block font-semibold mb-1">Tanggal Mulai</label>
          <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="border rounded p-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tanggal Akhir</label>
          <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="border rounded p-2" />
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
        <div className="text-gray-500">Tidak ada data rekap absensi.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nama Siswa</th>
                <th className="py-2 px-4 border-b">Kelas</th>
                <th className="py-2 px-4 border-b">Hadir</th>
                <th className="py-2 px-4 border-b">Izin</th>
                <th className="py-2 px-4 border-b">Sakit</th>
                <th className="py-2 px-4 border-b">Alfa</th>
                <th className="py-2 px-4 border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border-b">{row.siswa_nama}</td>
                  <td className="py-2 px-4 border-b">{row.kelas_nama}</td>
                  <td className="py-2 px-4 border-b text-center">{row.hadir}</td>
                  <td className="py-2 px-4 border-b text-center">{row.izin}</td>
                  <td className="py-2 px-4 border-b text-center">{row.sakit}</td>
                  <td className="py-2 px-4 border-b text-center">{row.alfa}</td>
                  <td className="py-2 px-4 border-b text-center">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 