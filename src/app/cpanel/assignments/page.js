'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const initialForm = {
  kelas_id: '',
  judul: '',
  deskripsi: '',
  tanggal_deadline: '',
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/tugas');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat data tugas.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch kelas list
  const fetchKelas = async (currentUser) => {
    try {
      const res = await fetchWithAuth('/api/kelas');
      if (!res.ok) throw new Error('Gagal mengambil data kelas');
      const data = await res.json();
      if (currentUser && currentUser.role === 'guru') {
        const guruId = currentUser._id || currentUser.id;
        setKelasList(Array.isArray(data) ? data.filter(k => k.guru_id?._id === guruId || k.guru_id === guruId) : []);
      } else {
        setKelasList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setKelasList([]);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchKelas(u);
    }
    fetchAssignments();
  }, []);

  // Handle form open (add/edit)
  const openModal = (assignment = null) => {
    if (assignment) {
      setForm({
        kelas_id: assignment.kelas_id?._id || assignment.kelas_id || '',
        judul: assignment.judul || '',
        deskripsi: assignment.deskripsi || '',
        tanggal_deadline: assignment.tanggal_deadline ? new Date(assignment.tanggal_deadline).toISOString().slice(0, 16) : '',
      });
      setEditId(assignment._id);
    } else {
      setForm(initialForm);
      setEditId(null);
    }
    setModalOpen(true);
    setError('');
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    if (!form.kelas_id || !form.judul || !form.tanggal_deadline) {
      setError('Kelas, judul, dan deadline wajib diisi');
      setSaving(false);
      return;
    }
    try {
      let res;
      if (editId) {
        res = await fetchWithAuth(`/api/tugas/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetchWithAuth('/api/tugas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan tugas');
      }
      setModalOpen(false);
      fetchAssignments();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus tugas ini?')) return;
    setDeleteId(id);
    setDeleteLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/tugas/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus tugas');
      }
      fetchAssignments();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  // Table columns
  const columns = [
    { key: 'judul', label: 'Judul' },
    { key: 'deskripsi', label: 'Deskripsi' },
    { key: 'tanggal_deadline', label: 'Deadline', render: (row) => row.tanggal_deadline ? new Date(row.tanggal_deadline).toLocaleString('id-ID') : '-' },
    { key: 'kelas_id', label: 'Kelas', render: (row) => row.kelas_id?.nama_kelas || '-' },
  ];

  // Table actions
  const actions = [
    {
      label: 'Edit',
      icon: <span className="text-blue-500">✏️</span>,
      onClick: (assignment) => openModal(assignment),
    },
    {
      label: 'Hapus',
      icon: <span className="text-red-500">🗑️</span>,
      onClick: (assignment) => handleDelete(assignment._id),
    },
  ];

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru']}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manajemen Tugas</h1>
          <Button onClick={() => openModal()} color="primary">Tambah Tugas</Button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable data={assignments} columns={columns} actions={actions} />
        )}
        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-2">{editId ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
              <div>
                <label className="block mb-1 font-medium">Kelas</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.kelas_id}
                  onChange={e => setForm(f => ({ ...f, kelas_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k._id} value={k._id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Judul"
                value={form.judul}
                onChange={e => setForm(f => ({ ...f, judul: e.target.value }))}
                required
              />
              <Input
                label="Deskripsi"
                value={form.deskripsi}
                onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
              />
              <Input
                label="Deadline"
                type="datetime-local"
                value={form.tanggal_deadline}
                onChange={e => setForm(f => ({ ...f, tanggal_deadline: e.target.value }))}
                required
              />
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