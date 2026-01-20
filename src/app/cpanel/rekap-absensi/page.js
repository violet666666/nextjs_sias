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
  const [user, setUser] = useState(null);
  const [childrenList, setChildrenList] = useState([]);

  // Get current user
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Fetch children for orangtua role
  useEffect(() => {
    if (!user) return;

    if (user.role === 'orangtua') {
      fetchWithAuth(`/api/orangtua?user_id=${user.id || user._id}`)
        .then(res => res.json())
        .then(data => {
          const children = Array.isArray(data) ? data.map(o => o.siswa_id).filter(Boolean) : [];
          setChildrenList(children);
          setSiswaList(children);
        })
        .catch(() => setChildrenList([]));
    }
  }, [user]);

  // Fetch kelas list for filter (not for orangtua)
  useEffect(() => {
    if (!user) return;
    if (user.role === 'orangtua') {
      setKelasList([]);
      return;
    }
    fetchWithAuth("/api/kelas")
      .then(res => res.json())
      .then(data => setKelasList(Array.isArray(data) ? data : []));
  }, [user]);

  // Fetch siswa list when kelasId changes (not for orangtua)
  useEffect(() => {
    if (!user || user.role === 'orangtua') return;
    if (!kelasId) {
      setSiswaList([]);
      return;
    }
    fetchWithAuth(`/api/enrollments?kelas_id=${kelasId}`)
      .then(res => res.json())
      .then(data => setSiswaList(Array.isArray(data) ? data.map(e => e.siswa_id).filter(Boolean) : []));
  }, [kelasId, user]);

  // Fetch rekap absensi
  const fetchRekap = async () => {
    setLoading(true);
    setError("");
    let url = "/api/rekap/absensi";
    const params = [];

    if (user?.role === 'orangtua') {
      if (siswaId) {
        params.push(`siswa_id=${siswaId}`);
      } else if (childrenList.length > 0) {
        params.push(`siswa_id=${childrenList.map(c => c._id).join(',')}`);
      }
    } else {
      if (kelasId) params.push(`kelas_id=${kelasId}`);
      if (siswaId) params.push(`siswa_id=${siswaId}`);
    }

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
    if (user) fetchRekap();
    // eslint-disable-next-line
  }, [kelasId, siswaId, dateStart, dateEnd, user, childrenList]);

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

  // Calculate percentage
  const getPercentage = (count, total) => {
    if (!total) return '0%';
    return ((count / total) * 100).toFixed(1) + '%';
  };

  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-900 dark:text-gray-100">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
      <h1 className="text-2xl font-bold mb-4">Rekap Absensi Siswa</h1>
      <form className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Hide kelas filter for orangtua */}
        {user?.role !== 'orangtua' && (
          <div>
            <label className="block font-semibold mb-1">Kelas</label>
            <select value={kelasId} onChange={e => setKelasId(e.target.value)} className="border rounded p-2 w-48 dark:bg-gray-700 dark:border-gray-600">
              <option value="">Semua Kelas</option>
              {kelasList.map(k => (
                <option key={k._id} value={k._id}>{k.nama_kelas}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block font-semibold mb-1">
            {user?.role === 'orangtua' ? 'Pilih Anak' : 'Siswa'}
          </label>
          <select
            value={siswaId}
            onChange={e => setSiswaId(e.target.value)}
            className="border rounded p-2 w-48 dark:bg-gray-700 dark:border-gray-600"
            disabled={user?.role !== 'orangtua' && !kelasId}
          >
            <option value="">{user?.role === 'orangtua' ? 'Semua Anak' : 'Semua Siswa'}</option>
            {siswaList.map(s => (
              <option key={s._id} value={s._id}>{s.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Tanggal Mulai</label>
          <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Tanggal Akhir</label>
          <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
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
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-gray-500">Tidak ada data rekap absensi.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="py-2 px-4 border-b dark:border-gray-600">Nama Siswa</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Kelas</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Hadir</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Izin</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Sakit</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Alfa</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">Total</th>
                <th className="py-2 px-4 border-b dark:border-gray-600">% Hadir</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-4 border-b dark:border-gray-600">{row.siswa_nama}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600">{row.kelas_nama}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-green-600 font-medium">{row.hadir || 0}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-blue-600">{row.izin || 0}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-yellow-600">{row.sakit || 0}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center text-red-600">{row.alfa || 0}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center font-semibold">{row.total || 0}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${((row.hadir || 0) / (row.total || 1)) >= 0.9
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : ((row.hadir || 0) / (row.total || 1)) >= 0.75
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                      }`}>
                      {getPercentage(row.hadir, row.total)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}