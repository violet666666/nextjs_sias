"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/common/Toast";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor helper

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ nama: "", email: "", password: "", role: "siswa" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebounce(filter, 300);
  const [roleFilter, setRoleFilter] = useState("");
  const userRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || (user.role !== "admin" && user.role !== "guru")) {
      router.push("/cpanel/dashboard");
    } else {
      userRef.current = user;
      fetchUsers();
    }
  }, [router]);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("/api/users"); // Gunakan fetchWithAuth
      if (!res.ok) throw new Error("Gagal mengambil data user");
      setUsers(await res.json());
      setToast({ message: "Data user berhasil dimuat", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Filter & search
  const filteredUsers = users.filter(u =>
    (!debouncedFilter || u.nama.toLowerCase().includes(debouncedFilter.toLowerCase()) || u.email.toLowerCase().includes(debouncedFilter.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter)
  );

  // Tambah user
  const handleOpenModal = () => {
    setForm({ nama: "", email: "", password: "", role: "siswa" });
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
    if (!form.nama.trim() || !form.email.trim() || !form.password.trim() || !form.role) {
      setFormError("Semua field wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      // Untuk tambah user, API register lebih sesuai jika password perlu di-hash
      // Jika API /api/users POST sudah handle hashing, maka ini benar.
      const res = await fetchWithAuth("/api/users", { // Atau /api/auth/register
        method: "POST",
        body: JSON.stringify({
          nama: form.nama,
          email: form.email,
          password: form.password, // Kirim password plain, backend akan hash
          role: form.role,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambah user");
      }
      setToast({ message: "User berhasil ditambahkan!", type: "success" });
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setForm({ nama: user.nama, email: user.email, password: "", role: user.role });
    setFormError("");
    setEditModal(true);
  };
  const handleEditClose = () => {
    setEditModal(false);
    setFormError("");
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.nama.trim() || !form.email.trim() || !form.role) {
      setFormError("Nama, email, dan role wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        body: JSON.stringify({
          nama: form.nama,
          email: form.email,
          password: form.password, // Kirim plain password, backend akan hash jika diisi
          role: form.role,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengedit user");
      }
      setToast({ message: "User berhasil diupdate!", type: "success" });
      setEditModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus user
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModal(true);
  };
  const handleDeleteClose = () => {
    setDeleteModal(false);
  };
  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/users/${selectedUser._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus user");
      }
      setToast({ message: "User berhasil dihapus!", type: "success" });
      setDeleteModal(false);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-black">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, message: "" })} />
      <h1 className="text-2xl font-bold mb-4">Manajemen User</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Cari nama/email..."
          className="border px-3 py-2 rounded"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select
          className="border px-3 py-2 rounded"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="guru">Guru</option>
          <option value="siswa">Siswa</option>
          <option value="orangtua">Orangtua</option>
        </select>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleOpenModal}
        >
          + Tambah User
        </button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? null : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-black">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Nama</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">Role</th>
                <th className="px-4 py-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4">Belum ada user</td></tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="border px-4 py-2">{u.nama}</td>
                    <td className="border px-4 py-2">{u.email}</td>
                    <td className="border px-4 py-2">{u.role}</td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700"
                        onClick={() => handleEditClick(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                        onClick={() => handleDeleteClick(u)}
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
      {/* Modal Tambah */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md text-black">
            <h2 className="text-xl font-bold mb-4">Tambah User</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Nama</label>
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                  <option value="orangtua">Orangtua</option>
                </select>
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
      {/* Modal Edit */}
      {editModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md text-black">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Nama</label>
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Password (opsional)</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                  placeholder="Biarkan kosong jika tidak ingin mengubah password"
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-semibold">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded text-black"
                  disabled={submitting}
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                  <option value="orangtua">Orangtua</option>
                </select>
              </div>
              {formError && <div className="text-red-500 mb-2">{formError}</div>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={handleEditClose}
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
      {/* Modal Hapus */}
      {deleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm text-black">
            <h2 className="text-xl font-bold mb-4">Hapus User</h2>
            <p>Yakin ingin menghapus user <b>{selectedUser?.nama}</b>?</p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={handleDeleteClose}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 