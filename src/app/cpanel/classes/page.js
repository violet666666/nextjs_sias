"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Toast from "@/components/common/Toast";
import { exportClassSchedulePDF, downloadPDF } from "@/lib/pdfExporter";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';

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
          return res.json().then(errData => { throw new Error(errData.error || "Gagal mengambil data kelas") });
        }
        return res.json();
      })
      .then((data) => {
        const kelasData = Array.isArray(data) ? data : [];
        if (u.role === "guru") {
          const guruId = u._id || u.id;
          setClasses(kelasData.filter((k) =>
            k.guru_id?._id === guruId ||
            k.guru_id === guruId
          ));
        } else {
          setClasses(kelasData);
        }
      })
      .catch(err => console.error("Error fetching classes:", err.message))
      .finally(() => setLoading(false));

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
      // Refresh
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

  // DataTable Configuration
  const columns = [
    { key: 'nama_kelas', label: 'Nama Kelas' },
    { key: 'tahun_ajaran', label: 'Tahun Ajaran' },
    {
      key: 'status_kelas',
      label: 'Status',
      render: (val) => <span className="capitalize">{val}</span>
    },
    {
      key: 'guru_id',
      label: 'Guru Pengampu',
      render: (val) => val?.nama || '-'
    }
  ];

  const [editId, setEditId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      nama_kelas: item.nama_kelas || '',
      tahun_ajaran: item.tahun_ajaran || '',
      status_kelas: item.status_kelas || 'aktif',
      guru_id: item.guru_id?._id || item.guru_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus kelas ini? Semua data terkait akan ikut terhapus.')) return;
    setDeleteLoading(true);
    try {
      const res = await fetchWithAuth(`/api/kelas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ message: 'Kelas berhasil dihapus!', type: 'success' });
        setClasses(classes.filter(c => c._id !== id));
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Gagal menghapus kelas', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Terjadi kesalahan', type: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let payload = { ...form };
    if (user.role === "guru") {
      payload.guru_id = user._id || user.id;
    }

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/kelas/${editId}` : '/api/kelas';

    const res = await fetchWithAuth(url, {
      method,
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setToast({ message: editId ? "Kelas berhasil diupdate!" : "Kelas berhasil ditambahkan!", type: "success" });
      setShowModal(false);
      setEditId(null);
      setForm({ nama_kelas: "", tahun_ajaran: "", status_kelas: "aktif", guru_id: "" });
      // Refresh
      const kelasRes = await fetchWithAuth("/api/kelas");
      const kelasData = await kelasRes.json();
      setClasses(Array.isArray(kelasData) ? kelasData : []);
    } else {
      const data = await res.json();
      setToast({ message: data.error || "Gagal menyimpan kelas", type: "error" });
    }
    setSaving(false);
  };

  const actions = [
    {
      label: 'Detail',
      icon: <span className="text-blue-500 font-medium text-sm">Detail</span>,
      onClick: (item) => window.location.href = `/cpanel/classes/${item._id}`
    },
    ...(user?.role === 'admin' ? [
      {
        label: 'Edit',
        icon: <span className="text-yellow-600 font-medium text-sm">Edit</span>,
        onClick: (item) => handleEdit(item)
      },
      {
        label: 'Hapus',
        icon: <span className="text-red-500 font-medium text-sm">Hapus</span>,
        onClick: (item) => handleDelete(item._id)
      }
    ] : [])
  ];

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru', 'siswa']}>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
            Daftar Kelas
          </h1>
          <div className="flex gap-2">
            {(user && (user.role === "guru" || user.role === "admin")) && (
              <button
                onClick={handleExportPDF}
                disabled={exporting || classes.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors duration-200"
              >
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

        {loading ? (
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        ) : (
          <DataTable
            data={classes}
            columns={columns}
            actions={actions}
            searchable
            pagination
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
