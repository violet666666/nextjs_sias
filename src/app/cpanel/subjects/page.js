'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Select from 'react-select';

const initialForm = {
  nama: '',
  kode: '',
  deskripsi: '',
  kelas_id: '',
  guru_ids: [],
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [allGuru, setAllGuru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setCurrentUser(parsed);
      fetchData(parsed);
    } else {
      fetchData(null);
    }
  }, []);

  const fetchData = async (user = null) => {
    setLoading(true);
    setError('');
    try {
      const userId = user?._id || user?.id;
      const subjectsEndpoint = user?.role === 'admin' || !userId
        ? '/api/subjects'
        : `/api/subjects?guru_id=${userId}`;

      const requests = [
        fetchWithAuth(subjectsEndpoint)
      ];

      if (user?.role === 'admin') {
        requests.push(fetchWithAuth('/api/kelas'));
        requests.push(fetchWithAuth('/api/users?role=guru'));
      }

      const responses = await Promise.all(requests);
      const subjectsRes = responses[0];
      if (!subjectsRes.ok) throw new Error('Gagal memuat data mata pelajaran.');
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData);

      if (user?.role === 'admin') {
        const classesRes = responses[1];
        const guruRes = responses[2];
        if (!classesRes.ok) throw new Error('Gagal memuat data kelas.');
        if (!guruRes.ok) throw new Error('Gagal memuat data guru.');

        const classesData = await classesRes.json();
        const guruData = await guruRes.json();

        setAllClasses(classesData.map(c => ({ value: c._id, label: c.nama_kelas })));
        setAllGuru(guruData.map(g => ({ value: g._id, label: g.nama })));
      }

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form open (add/edit)
  const openModal = (subject = null) => {
    if (subject) {
      setForm({
        nama: subject.nama || '',
        kode: subject.kode || '',
        deskripsi: subject.deskripsi || '',
        kelas_id: subject.kelas_id?._id || subject.kelas_id || '',
        guru_ids: Array.isArray(subject.guru_ids)
          ? subject.guru_ids.map(g => g._id || g)
          : subject.guru_id
            ? [subject.guru_id._id || subject.guru_id]
            : [],
      });
      setEditId(subject._id);
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
      if (!form.kelas_id) {
        throw new Error('Kelas wajib dipilih.');
      }
      if (!form.guru_ids.length && isAdmin) {
        throw new Error('Minimal satu guru pengampu wajib dipilih.');
      }
      const payload = {
        ...form,
        guru_ids: form.guru_ids.filter(Boolean)
      };
      const res = await fetchWithAuth(editId ? `/api/subjects/${editId}` : '/api/subjects', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan data.');
      }
      setModalOpen(false);
      fetchData(currentUser);
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
      const res = await fetchWithAuth(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus data.');
      }
      fetchData(currentUser);
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
    { key: 'kode', label: 'Kode' },
    { key: 'deskripsi', label: 'Deskripsi' },
    {
      key: 'kelas',
      label: 'Kelas',
      render: (_, subject) => subject.kelas_id?.nama_kelas || '-',
    },
    {
      key: 'guru',
      label: 'Guru Pengampu',
      render: (_, subject) => {
        if (Array.isArray(subject.guru_ids) && subject.guru_ids.length) {
          return subject.guru_ids.map(g => g.nama || g).join(', ');
        }
        return subject.guru_id?.nama || '-';
      }
    }
  ];

  // Table actions
  const actions = !isAdmin ? [] : [
    {
      label: 'Edit',
      icon: <span className="text-blue-500">✏️</span>,
      onClick: (subject) => openModal(subject),
    },
    {
      label: 'Hapus',
      icon: <span className="text-red-500">🗑️</span>,
      onClick: (subject) => handleDelete(subject._id),
    },
  ];

  return (
    <ProtectedRoute requiredRoles={['admin','guru']}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manajemen Mata Pelajaran</h1>
          {isAdmin && (
            <Button onClick={() => openModal()} color="primary">Tambah Mata Pelajaran</Button>
          )}
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable data={subjects} columns={columns} actions={actions} />
        )}
        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
              <h2 className="text-xl font-bold mb-2">{editId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</h2>
              <Input
                label="Nama"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                required
              />
              <Input
                label="Kode"
                value={form.kode}
                onChange={e => setForm(f => ({ ...f, kode: e.target.value }))}
              />
              <Input
                label="Deskripsi"
                value={form.deskripsi}
                onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
              />
              <div>
                <label className="block mb-1 font-medium">Kelas</label>
                <Select
                  isMulti={false}
                  options={allClasses}
                  isDisabled={!isAdmin}
                  value={allClasses.find(option => option.value === form.kelas_id) || null}
                  onChange={selectedOption => setForm(f => ({ ...f, kelas_id: selectedOption ? selectedOption.value : '' }))}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="block mb-1 font-medium">Guru Pengampu</label>
                  <Select
                    isMulti
                    options={allGuru}
                    value={allGuru.filter(option => form.guru_ids.includes(option.value))}
                    onChange={(selectedOptions) => setForm(f => ({
                      ...f,
                      guru_ids: (selectedOptions || []).map(option => option.value)
                    }))}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              )}
              {error && <div className="text-red-500">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => setModalOpen(false)} variant="outline">Batal</Button>
                <Button type="submit" color="primary" loading={saving} disabled={!isAdmin}>
                  {editId ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
} 