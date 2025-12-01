"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor fetchWithAuth
import Toast from "@/components/common/Toast";
import { exportClassSchedulePDF, downloadPDF } from "@/lib/pdfExporter";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama_kelas: "", tahun_ajaran: "", status_kelas: "aktif", guru_id: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [guruList, setGuruList] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    fetchWithAuth("/api/kelas")
      .then((res) => {
        if (!res.ok) {
          // Jika unauthorized atau error lain, res.json() mungkin gagal atau tidak sesuai harapan
          console.error("Gagal mengambil data kelas:", res.status, res.statusText);
          return res.json().then(errData => { throw new Error(errData.error || "Gagal mengambil data kelas") });
        }
        return res.json();
      })
      .then((data) => {
        // Pastikan data adalah array sebelum filter
        const kelasData = Array.isArray(data) ? data : [];
        if (u.role === "guru") {
          const guruId = u._id || u.id; // Pastikan u.id atau u._id konsisten dengan token
          setClasses(kelasData.filter((k) =>
            k.guru_id?._id === guruId || // Utamakan perbandingan dengan _id jika guru_id adalah ObjectId
            k.guru_id === guruId // Fallback jika guru_id adalah string
          ));
        } else {
          setClasses(kelasData);
        }
      })
      .catch(err => console.error("Error fetching classes:", err.message)) // Tangani error fetch
      .finally(() => setLoading(false));
    // Fetch guru list jika admin
    if (u.role === "admin") {
      fetchWithAuth("/api/users?role=guru").then(res => res.json()).then(setGuruList);
    }
  }, []);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => { setShowModal(false); setForm({ nama_kelas: "", tahun_ajaran: "", status_kelas: "aktif", guru_id: "" }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let payload = { ...form };
    if (user.role === "guru") {
      payload.guru_id = user._id || user.id;
    }
    if (user.role === "admin" && !payload.guru_id) {
      setToast({ message: "Pilih guru pengampu.", type: "error" });
      setSaving(false);
      return;
    }
    const res = await fetchWithAuth("/api/kelas", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setToast({ message: "Kelas berhasil ditambahkan!", type: "success" });
      setShowModal(false);
      setForm({ nama_kelas: "", tahun_ajaran: "", status_kelas: "aktif", guru_id: "" });
      // Refresh kelas
      const kelasRes = await fetchWithAuth("/api/kelas");
      const kelasData = await kelasRes.json();
      setClasses(Array.isArray(kelasData) ? kelasData : []);
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Gagal menambah kelas", type: "error" });
    }
    setSaving(false);
  };

  const handleExportPDF = async () => {
    if (!classes || classes.length === 0) {
      setToast({ message: "Tidak ada data kelas untuk diekspor", type: "error" });
      return;
    }
    
    setExporting(true);
    try {
      const doc = await exportClassSchedulePDF(classes);
      const filename = `jadwal-kelas-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(doc, filename);
      
      setToast({ message: "PDF berhasil diunduh!", type: "success" });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: "Gagal mengekspor PDF", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin','guru','siswa']}>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {user && user.role === "guru" ? "Kelas Saya (Wali Kelas)" : "Daftar Kelas"}
          </h1>
          {user && user.role === "guru" && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Kelas yang Anda ampu sebagai wali kelas
            </p>
          )}
          <div className="flex gap-2">
            {(user && (user.role === "guru" || user.role === "admin")) && (
              <button
                onClick={handleExportPDF}
                disabled={exporting || classes.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {exporting ? "Mengekspor..." : "Export PDF"}
              </button>
            )}
            {user && user.role === "guru" && (
              <button onClick={handleShowModal} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors duration-200">+ Buat Kelas</button>
            )}
            {user && user.role === "admin" && (
              <button onClick={handleShowModal} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition-colors duration-200">+ Tambah Kelas</button>
            )}
          </div>
        </div>
        
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded shadow w-96 transition-colors duration-300">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{user.role === "guru" ? "Buat Kelas" : "Tambah Kelas"}</h2>
              <input 
                type="text" 
                required 
                placeholder="Nama Kelas" 
                className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                value={form.nama_kelas} 
                onChange={e => setForm(f => ({ ...f, nama_kelas: e.target.value }))} 
              />
              <input 
                type="text" 
                required 
                placeholder="Tahun Ajaran" 
                className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                value={form.tahun_ajaran} 
                onChange={e => setForm(f => ({ ...f, tahun_ajaran: e.target.value }))} 
              />
              <select 
                required 
                className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                value={form.status_kelas} 
                onChange={e => setForm(f => ({ ...f, status_kelas: e.target.value }))}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              {user.role === "admin" && (
                <select 
                  required 
                  className="w-full mb-2 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                  value={form.guru_id} 
                  onChange={e => setForm(f => ({ ...f, guru_id: e.target.value }))}
                >
                  <option value="">Pilih Guru Pengampu</option>
                  {guruList.map((g) => (
                    <option key={g._id} value={g._id}>{g.nama}</option>
                  ))}
                </select>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200" 
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        )}
        {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <ResponsiveTable>
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Nama Kelas</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Tahun Ajaran</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Guru Pengampu</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {user && user.role === "guru" 
                          ? "Belum ada kelas yang Anda ampu sebagai wali kelas." 
                          : "Belum ada kelas yang diampu."}
                      </td>
                    </tr>
                  ) : (
                    classes.map((kelas) => (
                      <tr key={kelas._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{kelas.nama_kelas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{kelas.tahun_ajaran}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100 capitalize">{kelas.status_kelas}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{kelas.guru_id?.nama || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                          <Link href={`/cpanel/classes/${kelas._id}`} className="text-blue-500 hover:underline">Detail</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </ResponsiveTable>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
