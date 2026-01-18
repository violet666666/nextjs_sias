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
    <div className="p-6 text-black space-y-8">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-white/80">Informasi Sekolah</p>
          <h1 className="text-3xl font-bold mt-2">Papan Buletin</h1>
          <p className="text-white/90 mt-2 max-w-2xl">Ikuti kabar terbaru seputar kegiatan akademik, pengumuman penting, dan agenda resmi satu atap.</p>
        </div>
        {user && user.role === "admin" && (
          <div className="flex flex-col gap-2 md:items-end">
            <span className="text-white/70 text-sm">Total Buletin</span>
            <span className="text-4xl font-bold">{buletins.length}</span>
            <button onClick={() => handleOpenModal()} className="bg-white text-blue-700 font-semibold px-5 py-2 rounded-lg shadow hover:bg-blue-50 transition-colors">+ Tambah Buletin</button>
          </div>
        )}
      </div>

      {buletins.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-600">
          Tidak ada buletin yang tersedia saat ini. Silakan kembali lagi nanti.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {buletins.map((buletin) => (
            <div key={buletin._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-shadow flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-indigo-500 font-semibold">Pengumuman</p>
                  <h2 className="text-2xl font-semibold text-gray-900 mt-1">{buletin.judul}</h2>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <span>{new Date(buletin.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span className="text-gray-400">•</span>
                    <span>{buletin.author?.nama || "Admin"}</span>
                  </p>
                </div>
                {user && user.role === "admin" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenModal(buletin)} className="px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 text-sm font-medium hover:bg-yellow-200">Edit</button>
                    <button onClick={() => handleDelete(buletin._id)} className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200">Hapus</button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mt-4 flex-1">{buletin.isi}</p>
              {buletin.lampiran && (
                <a href={buletin.lampiran} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-semibold mt-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13.828 14.828a4 4 0 01-5.656 0l-3.172-3.172a4 4 0 015.656-5.656l1.172 1.172"/><path d="M10.172 9.172a4 4 0 015.656 0l3.172 3.172a4 4 0 01-5.656 5.656l-1.172-1.172"/></svg>
                  Lihat Lampiran
                </a>
              )}
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-lg font-bold mb-4">{editBuletin ? "Edit Buletin" : "Tambah Buletin"}</h2>
            <input type="text" required placeholder="Judul" name="judul" className="w-full mb-2 p-2 border rounded" value={form.judul} onChange={handleChange} />
            <textarea required placeholder="Isi buletin" name="isi" className="w-full mb-2 p-2 border rounded" value={form.isi} onChange={handleChange} />
            <input type="file" name="lampiran" className="w-full mb-2" onChange={handleChange} />
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={handleCloseModal} className="px-3 py-1 bg-gray-200 rounded">Batal</button>
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded" disabled={submitting}>{submitting ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </div>
      )}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
    </div>
  );
}
