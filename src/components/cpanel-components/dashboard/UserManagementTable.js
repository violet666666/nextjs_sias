"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function UserManagementTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'siswa' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    fetchWithAuth('/api/users')
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data user");
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  const handleEdit = (user) => {
    setEditUser(user);
    setForm({ nama: user.nama, email: user.email, password: '', role: user.role });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus user ini?')) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('User berhasil dihapus');
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({ message: 'Gagal menghapus user' }));
      setError(data.message || 'Gagal menghapus user');
    }
    setSaving(false);
  };

  const handleAdd = () => {
    setEditUser(null);
    setForm({ nama: '', email: '', password: '', role: 'siswa' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!form.nama || !form.email || (!editUser && !form.password)) {
      setError('Nama, email, dan password (untuk user baru) wajib diisi');
      setSaving(false);
      return;
    }
    let res;
    const endpoint = editUser ? `/api/users/${editUser._id}` : '/api/auth/register'; // API register untuk user baru
    const method = editUser ? 'PUT' : 'POST';
    const body = { ...form };
    if (editUser && !form.password) delete body.password; // Jangan kirim password kosong saat edit jika tidak diubah

    res = await fetchWithAuth(endpoint, {
      method: method,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setSuccess(editUser ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
      setShowModal(false);
      fetchUsers();
    } else {
      const data = await res.json().catch(() => ({ message: 'Gagal menyimpan user' }));
      setError(data.message || data.error || 'Gagal menyimpan user');
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Manajemen User</h2>
      <div className="flex items-center gap-4 mb-4">
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded p-2 text-black">
          <option value="all">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="guru">Guru</option>
          <option value="siswa">Siswa</option>
          <option value="orangtua">Orang Tua</option>
        </select>
        <button onClick={handleAdd} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">+ Tambah User</button>
      </div>
      {error && <div className="text-red-500 mb-2 p-2 bg-red-100 border border-red-400 rounded">{error}</div>}
      {success && <div className="text-green-600 mb-2 p-2 bg-green-100 border border-green-400 rounded">{success}</div>}
      
      <ResponsiveTable>
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nama</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(u => (
            <tr key={u._id}>
              <td className="py-2 px-4 border-b">{u.nama}</td>
              <td className="py-2 px-4 border-b">{u.email}</td>
              <td className="py-2 px-4 border-b capitalize">{u.role}</td>
              <td className="py-2 px-4 border-b">
                <button onClick={() => handleEdit(u)} className="text-blue-500 hover:underline mr-2">Edit</button>
                <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:underline">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </ResponsiveTable>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 text-black">
            <h2 className="text-lg font-bold mb-4">{editUser ? 'Edit User' : 'Tambah User'}</h2>
            <input type="text" required placeholder="Nama" className="w-full mb-2 p-2 border rounded" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} />
            <input type="email" required placeholder="Email" className="w-full mb-2 p-2 border rounded" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input type="password" placeholder={editUser ? "Password (kosongkan jika tidak diubah)" : "Password"} className="w-full mb-2 p-2 border rounded" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!editUser} />
            <select className="w-full mb-2 p-2 border rounded" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
              <option value="orangtua">Orang Tua</option>
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-200 rounded">Batal</button>
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}