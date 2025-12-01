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
  kelas_ids: [],
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

  // Fetch all data (subjects, classes, guru)
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectsRes, classesRes, guruRes] = await Promise.all([
        fetchWithAuth('/api/subjects'),
        fetchWithAuth('/api/kelas'),
        fetchWithAuth('/api/users?role=guru'),
      ]);

      if (!subjectsRes.ok) throw new Error('Gagal memuat data mata pelajaran.');
      if (!classesRes.ok) throw new Error('Gagal memuat data kelas.');
      if (!guruRes.ok) throw new Error('Gagal memuat data guru.');

      const subjectsData = await subjectsRes.json();
      const classesData = await classesRes.json();
      const guruData = await guruRes.json();

      setSubjects(subjectsData);
      // Ensure IDs are strings for consistent comparison
      // Create mapping for quick lookup
      setAllClasses(classesData.map(c => ({ 
        value: String(c._id), 
        label: c.nama_kelas || 'Unknown Class',
        _id: c._id 
      })));
      setAllGuru(guruData.map(g => ({ 
        value: String(g._id), 
        label: g.nama || 'Unknown Teacher',
        _id: g._id 
      })));

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper function to extract ID from various formats (string, object, array)
  const extractIds = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return String(item);
        if (typeof item === 'object' && item !== null) {
          const id = item._id || item.id || item;
          return id ? String(id) : null;
        }
        return item ? String(item) : null;
      }).filter(Boolean);
    }
    if (typeof data === 'string') return [String(data)];
    if (typeof data === 'object' && data !== null) {
      const id = data._id || data.id || data;
      return id ? [String(id)] : [];
    }
    return [];
  };

  // Handle form open (add/edit)
  const openModal = (subject = null) => {
    if (subject) {
      // Extract IDs from various formats (support populated data)
      // Priority: new format (kelas_ids/guru_ids) > old format (kelas_id/guru_id)
      const kelasIds = extractIds(subject.kelas_ids || subject.kelas_id);
      const guruIds = extractIds(subject.guru_ids || subject.guru_id);
      
      // Ensure all IDs are strings for consistent comparison with Select options
      const normalizedKelasIds = kelasIds.map(id => String(id));
      const normalizedGuruIds = guruIds.map(id => String(id));
      
      setForm({
        nama: subject.nama || '',
        kode: subject.kode || '',
        deskripsi: subject.deskripsi || '',
        kelas_ids: normalizedKelasIds,
        guru_ids: normalizedGuruIds,
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
      // Ensure kelas_ids and guru_ids are arrays (not empty if required)
      const payload = {
        ...form,
        kelas_ids: Array.isArray(form.kelas_ids) ? form.kelas_ids : [],
        guru_ids: Array.isArray(form.guru_ids) ? form.guru_ids : [],
      };
      
      // Validate required fields
      if (!payload.nama || !payload.nama.trim()) {
        throw new Error('Nama mata pelajaran wajib diisi');
      }
      if (!payload.kelas_ids || payload.kelas_ids.length === 0) {
        throw new Error('Minimal satu kelas harus dipilih');
      }
      
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
      setForm(initialForm);
      setEditId(null);
      fetchData();
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
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  // Helper function to get class name from various formats
  const getClassName = (kelasData) => {
    if (!kelasData) return null;
    
    // If already populated object with nama_kelas (from API populate)
    if (typeof kelasData === 'object' && kelasData !== null) {
      if (kelasData.nama_kelas) {
        return kelasData.nama_kelas;
      }
      // Extract ID from object
      const id = kelasData._id || kelasData.id || kelasData;
      if (id) {
        const kelas = allClasses.find(k => {
          const kValue = String(k.value);
          const dataId = String(id);
          return kValue === dataId;
        });
        return kelas ? kelas.label : null;
      }
    }
    
    // If it's a string ID, find in allClasses
    if (typeof kelasData === 'string') {
      const kelas = allClasses.find(k => String(k.value) === kelasData);
      return kelas ? kelas.label : null;
    }
    
    return null;
  };

  // Helper function to get teacher name from various formats
  const getGuruName = (guruData) => {
    if (!guruData) return null;
    
    // If already populated object with nama (from API populate)
    if (typeof guruData === 'object' && guruData !== null) {
      if (guruData.nama) {
        return guruData.nama;
      }
      // Extract ID from object
      const id = guruData._id || guruData.id || guruData;
      if (id) {
        const guru = allGuru.find(g => {
          const gValue = String(g.value);
          const dataId = String(id);
          return gValue === dataId;
        });
        return guru ? guru.label : null;
      }
    }
    
    // If it's a string ID, find in allGuru
    if (typeof guruData === 'string') {
      const guru = allGuru.find(g => String(g.value) === guruData);
      return guru ? guru.label : null;
    }
    
    return null;
  };

  // Table columns
  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'kode', label: 'Kode' },
    { key: 'deskripsi', label: 'Deskripsi' },
    {
      key: 'kelas',
      label: 'Kelas',
      render: (value, subject) => {
        // Support both old (kelas_id) and new (kelas_ids) format
        // Also support populated data (objects) and ID strings
        let kelasData = [];
        
        // Priority: new format (kelas_ids) > old format (kelas_id)
        if (subject.kelas_ids) {
          kelasData = Array.isArray(subject.kelas_ids) ? subject.kelas_ids : [subject.kelas_ids];
        } else if (subject.kelas_id) {
          kelasData = Array.isArray(subject.kelas_id) ? subject.kelas_id : [subject.kelas_id];
        }
        
        // Get class names using helper function
        const kelasNames = kelasData
          .map(kelas => getClassName(kelas))
          .filter(Boolean);
        
        // Return joined names or dash if empty
        if (kelasNames.length > 0) {
          return (
            <span className="text-gray-900 dark:text-gray-100">
              {kelasNames.join(', ')}
            </span>
          );
        }
        return <span className="text-gray-400 dark:text-gray-500">-</span>;
      },
    },
    {
      key: 'guru',
      label: 'Guru Pengampu',
      render: (value, subject) => {
        // Support both old (guru_id) and new (guru_ids) format
        // Also support populated data (objects) and ID strings
        let guruData = [];
        
        // Priority: new format (guru_ids) > old format (guru_id)
        if (subject.guru_ids) {
          guruData = Array.isArray(subject.guru_ids) ? subject.guru_ids : [subject.guru_ids];
        } else if (subject.guru_id) {
          guruData = Array.isArray(subject.guru_id) ? subject.guru_id : [subject.guru_id];
        }
        
        // Get teacher names using helper function
        const guruNames = guruData
          .map(guru => getGuruName(guru))
          .filter(Boolean);
        
        // Return joined names or dash if empty
        if (guruNames.length > 0) {
          return (
            <span className="text-gray-900 dark:text-gray-100">
              {guruNames.join(', ')}
            </span>
          );
        }
        return <span className="text-gray-400 dark:text-gray-500">-</span>;
      },
    },
  ];

  // Table actions
  const actions = [
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
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manajemen Mata Pelajaran</h1>
          <Button onClick={() => openModal()} color="primary">Tambah Mata Pelajaran</Button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable data={subjects} columns={columns} actions={actions} />
        )}
        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <Modal open={modalOpen} onClose={() => {
            setModalOpen(false);
            setForm(initialForm);
            setEditId(null);
            setError('');
          }}>
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
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Kelas (dapat memilih lebih dari 1)</label>
                <Select
                  isMulti={true}
                  options={allClasses}
                  value={allClasses.filter(option => {
                    // Convert both to string for comparison
                    const formId = String(option.value);
                    return form.kelas_ids.some(id => String(id) === formId);
                  })}
                  onChange={selectedOptions => {
                    const newKelasIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                    setForm(f => ({ ...f, kelas_ids: newKelasIds }));
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Pilih kelas..."
                  isClearable
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Guru Pengampu (dapat memilih lebih dari 1)</label>
                <Select
                  isMulti={true}
                  options={allGuru}
                  value={allGuru.filter(option => {
                    // Convert both to string for comparison
                    const formId = String(option.value);
                    return form.guru_ids.some(id => String(id) === formId);
                  })}
                  onChange={selectedOptions => {
                    const newGuruIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
                    setForm(f => ({ ...f, guru_ids: newGuruIds }));
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Pilih guru..."
                  isClearable
                />
              </div>
              {error && <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  onClick={() => {
                    setModalOpen(false);
                    setForm(initialForm);
                    setEditId(null);
                    setError('');
                  }} 
                  variant="outline"
                >
                  Batal
                </Button>
                <Button type="submit" color="primary" loading={saving}>{editId ? 'Simpan' : 'Tambah'}</Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </ProtectedRoute>
  );
} 