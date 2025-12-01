"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";

export default function BulletinPage() {
  const [buletins, setBuletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editBuletin, setEditBuletin] = useState(null);
  const [form, setForm] = useState({ judul: "", isi: "", lampiran: null });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchBuletins();
  }, [router]);

  async function fetchBuletins() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/buletin");
      if (!res.ok) throw new Error("Gagal mengambil data buletin");
      const data = await res.json();
      setBuletins(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (buletin = null) => {
    setEditBuletin(buletin);
    setForm({
      judul: buletin?.judul || "",
      isi: buletin?.isi || "",
      lampiran: null,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditBuletin(null);
    setForm({ judul: "", isi: "", lampiran: null });
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "lampiran") {
      setForm((f) => ({ ...f, lampiran: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    let lampiranPath = null;
    try {
      if (!form.judul.trim() || !form.isi.trim()) {
        setFormError("Judul dan isi wajib diisi.");
        setSubmitting(false);
        return;
      }
      // Upload lampiran jika ada
      if (form.lampiran) {
        const fd = new FormData();
        fd.append("file", form.lampiran);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload lampiran");
        lampiranPath = uploadData.file_path;
      }
      let res;
      if (editBuletin) {
        res = await fetchWithAuth("/api/buletin", {
          method: "PUT",
          body: JSON.stringify({ id: editBuletin._id, judul: form.judul, isi: form.isi, tanggal: new Date(), lampiran: lampiranPath }),
        });
      } else {
        res = await fetchWithAuth("/api/buletin", {
          method: "POST",
          body: JSON.stringify({ judul: form.judul, isi: form.isi, tanggal: new Date(), lampiran: lampiranPath }),
        });
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan buletin");
      }
      setShowModal(false);
      setToast({ message: editBuletin ? "Buletin berhasil diupdate" : "Buletin berhasil ditambahkan", type: "success" });
      fetchBuletins();
    } catch (err) {
      setFormError(err.message);
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin hapus buletin ini?")) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/buletin", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus buletin");
      }
      setToast({ message: "Buletin berhasil dihapus", type: "success" });
      fetchBuletins();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Papan Buletin</h1>
            <p className="text-gray-600 dark:text-gray-400">Informasi dan pengumuman terbaru</p>
          </div>
          {user && user.role === "admin" && (
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Buletin
            </button>
          )}
        </div>
        
        {buletins.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Tidak ada buletin yang tersedia saat ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {buletins.map((buletin) => (
              <div 
                key={buletin._id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{buletin.judul}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(buletin.tanggal || buletin.createdAt).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="mx-2">•</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{buletin.author?.nama || "Admin"}</span>
                    </div>
                  </div>
                  {user && user.role === "admin" && (
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleOpenModal(buletin)} 
                        className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(buletin._id)} 
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-4">{buletin.isi}</p>
                </div>
                {buletin.lampiran && (
                  <a 
                    href={buletin.lampiran} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Lihat Lampiran
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{editBuletin ? "Edit Buletin" : "Tambah Buletin"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masukkan judul buletin" 
                  name="judul" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  value={form.judul} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Isi Buletin</label>
                <textarea 
                  required 
                  placeholder="Masukkan isi buletin" 
                  name="isi" 
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                  value={form.isi} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lampiran (Opsional)</label>
                <input 
                  type="file" 
                  name="lampiran" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  onChange={handleChange} 
                />
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={submitting}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
    </div>
  );
}
