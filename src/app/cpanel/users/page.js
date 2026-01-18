'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const initialForm = {
  nama: '',
  email: '',
  password: '',
  role: 'siswa',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('');

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const url = filterRole ? `/api/users?role=${filterRole}` : '/api/users';
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      setError('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  // Handle form open (add/edit)
  const openModal = (user = null) => {
    if (user) {
      setForm({
        nama: user.nama || '',
        email: user.email || '',
        password: '',
        role: user.role || 'siswa',
      });
      setEditId(user._id);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!editId && !payload.password) {
        setError('Password wajib diisi untuk user baru.');
        setSaving(false);
        return;
      }
      if (editId && !payload.password) {
        delete payload.password;
      }
      const res = await fetchWithAuth(editId ? `/api/users/${editId}` : '/api/users', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan user.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    setDeleteId(id);
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus user.');
      }
      fetchUsers();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
  ];

  // Table actions
  const actions = [
    {
      label: 'Edit',
      icon: <span className="text-blue-500">✏️</span>,
      onClick: (user) => openModal(user),
    },
    {
      label: 'Hapus',
      icon: <span className="text-red-500">🗑️</span>,
      onClick: (user) => handleDelete(user._id),
    },
  ];

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manajemen User</h1>
          <Button onClick={() => openModal()} color="primary">Tambah User</Button>
        </div>
        
        {/* Filters */}
        <div className="mb-4">
            <select
              className="border rounded px-3 py-2"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="guru">Guru</option>
              <option value="siswa">Siswa</option>
              <option value="orangtua">Orangtua</option>
            </select>
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable data={users} columns={columns} actions={actions} />
        )}
        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-2">{editId ? 'Edit User' : 'Tambah User'}</h2>
              <Input
                label="Nama"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={editId ? 'Kosongkan jika tidak ingin mengubah' : ''}
                required={!editId}
              />
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="guru">Guru</option>
                  <option value="siswa">Siswa</option>
                  <option value="orangtua">Orangtua</option>
                </select>
              </div>
              {error && <div className="text-red-500">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setModalOpen(false)} variant="outline">Batal</Button>
                <Button type="submit" color="primary" loading={saving}>{editId ? 'Simpan' : 'Tambah'}</Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
} 