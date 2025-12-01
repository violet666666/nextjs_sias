"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function BulletinManagementPage() {
  const router = useRouter();
  const [buletins, setBuletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ judul: "", isi: "" });
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [submitting, setSubmitting] = useState(false);
  const userRef = useRef(null);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedBuletin, setSelectedBuletin] = useState(null);
  const [editForm, setEditForm] = useState({ judul: '', isi: '' });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      router.push("/cpanel/dashboard");
    } else {
      userRef.current = user;
    }
  }, [router]);

  async function fetchBuletins() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buletin");
      if (!res.ok) throw new Error("Gagal mengambil data buletin");
      const data = await res.json();
      setBuletins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBuletins();
  }, []);

  const handleOpenModal = () => {
    setForm({ judul: "", isi: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.judul.trim() || !form.isi.trim()) {
      setFormError("Judul dan isi wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/buletin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, author: userRef.current._id || userRef.current.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambah buletin");
      }
      setToast({ message: "Buletin berhasil ditambahkan!", type: "success" });
      setShowModal(false);
      fetchBuletins();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Edit
  const handleEditClick = (buletin) => {
    setSelectedBuletin(buletin);
    setEditForm({ judul: buletin.judul, isi: buletin.isi });
    setEditError('');
    setEditModal(true);
  };
  const handleEditClose = () => {
    setEditModal(false);
    setEditError('');
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!editForm.judul.trim() || !editForm.isi.trim()) {
      setEditError('Judul dan isi wajib diisi.');
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch('/api/buletin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedBuletin._id,
          judul: editForm.judul,
          isi: editForm.isi,
          tanggal: selectedBuletin.tanggal,
          author: userRef.current._id || userRef.current.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengedit buletin');
      }
      setToast({ message: 'Buletin berhasil diupdate!', type: 'success' });
      setEditModal(false);
      fetchBuletins();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setEditSubmitting(false);
    }
  };

  // Hapus
  const handleDeleteClick = (buletin) => {
    setSelectedBuletin(buletin);
    setDeleteModal(true);
  };
  const handleDeleteClose = () => {
    setDeleteModal(false);
  };
  const handleDeleteConfirm = async () => {
    setDeleteSubmitting(true);
    if (!selectedBuletin) return;
    try {
      const res = await fetch('/api/buletin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedBuletin._id, author: userRef.current._id || userRef.current.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus buletin');
      }
      setToast({ message: 'Buletin berhasil dihapus!', type: 'success' });
      setDeleteModal(false);
      fetchBuletins();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="text-black">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: "" })} />
      <h1 className="text-2xl font-bold mb-4">Manajemen Buletin</h1>
      <button
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={handleOpenModal}
      >
        + Tambah Buletin
      </button>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md text-black">
            <h2 className="text-xl font-bold mb-4">Tambah Buletin</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Judul</label>
                <input
                  type="text"
                  name="judul"
                  value={form.judul}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Isi</label>
                <textarea
                  name="isi"
                  value={form.isi}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  rows={5}
                  disabled={submitting}
                />
              </div>
              {formError && <div className="text-red-500 mb-2">{formError}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md text-black">
            <h2 className="text-xl font-bold mb-4">Edit Buletin</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Judul</label>
                <input
                  type="text"
                  name="judul"
                  value={editForm.judul}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={editSubmitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Isi</label>
                <textarea
                  name="isi"
                  value={editForm.isi}
                  onChange={handleEditChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  rows={5}
                  disabled={editSubmitting}
                />
              </div>
              {editError && <div className="text-red-500 mb-2">{editError}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={handleEditClose}
                  disabled={editSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm text-black">
            <h2 className="text-xl font-bold mb-4">Hapus Buletin</h2>
            <p>Yakin ingin menghapus buletin <b>{selectedBuletin?.judul}</b>?</p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={handleDeleteClose}
                disabled={deleteSubmitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Toast message={error} type="error" onClose={() => setError("")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-black">
            <thead>
              <tr>
                <th className="px-4 py-2 border text-black">Judul</th>
                <th className="px-4 py-2 border text-black">Tanggal</th>
                <th className="px-4 py-2 border text-black">Author</th>
                <th className="px-4 py-2 border text-black">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {buletins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-black">Belum ada buletin</td>
                </tr>
              ) : (
                buletins.map((b) => (
                  <tr key={b._id}>
                    <td className="border px-4 py-2 text-black">{b.judul}</td>
                    <td className="border px-4 py-2 text-black">{new Date(b.tanggal).toLocaleDateString()}</td>
                    <td className="border px-4 py-2 text-black">{b.author?.nama || "-"}</td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700"
                        onClick={() => handleEditClick(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                        onClick={() => handleDeleteClick(b)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 