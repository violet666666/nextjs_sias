'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import AddKelasModal from '@/components/subjects/AddKelasModal';
import AddGuruModal from '@/components/subjects/AddGuruModal';
import AssignGuruKelasModal from '@/components/subjects/AssignGuruKelasModal';
import Swal from 'sweetalert2';
import { Trash2, Edit2, BookOpen, Users, GraduationCap, Link2 } from 'lucide-react';

const initialForm = {
  nama: '',
  kode: '',
  deskripsi: '',
  total_jam_per_minggu: '',
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAddKelasModal, setShowAddKelasModal] = useState(false);
  const [showAddGuruModal, setShowAddGuruModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Fetch subjects
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/subjects');
      if (!res.ok) throw new Error('Gagal memuat data mata pelajaran.');
      const data = await res.json();
      setSubjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form open (add/edit)
  const openModal = (subject = null) => {
    if (subject) {
      setForm({
        nama: subject.nama || '',
        kode: subject.kode || '',
        deskripsi: subject.deskripsi || '',
        total_jam_per_minggu: subject.total_jam_per_minggu || '',
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
      if (!form.nama || !form.nama.trim()) {
        throw new Error('Nama mata pelajaran wajib diisi');
      }
      
      const payload = {
        nama: form.nama.trim(),
        kode: form.kode.trim() || undefined,
        deskripsi: form.deskripsi.trim() || undefined,
        total_jam_per_minggu: form.total_jam_per_minggu ? parseInt(form.total_jam_per_minggu) || 0 : 0,
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
  const handleDelete = async (id, nama) => {
    const result = await Swal.fire({
      title: 'Hapus Mata Pelajaran?',
      text: `Apakah Anda yakin ingin menghapus "${nama}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetchWithAuth(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus data.');
      }
      fetchData();
      Swal.fire('Berhasil!', 'Mata pelajaran berhasil dihapus.', 'success');
    } catch (e) {
      Swal.fire('Error!', e.message, 'error');
    }
  };

  // Handle add kelas
  const handleAddKelas = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setShowAddKelasModal(true);
  };

  // Handle add guru
  const handleAddGuru = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setShowAddGuruModal(true);
  };

  // Get kelas names
  const getKelasNames = (subject) => {
    const kelasData = subject.kelas_ids || [];
    return kelasData
      .map(k => {
        if (typeof k === 'object' && k?.nama_kelas) return k.nama_kelas;
        return null;
      })
      .filter(Boolean);
  };

  // Get guru names
  const getGuruNames = (subject) => {
    const guruData = subject.guru_ids || [];
    return guruData
      .map(g => {
        if (typeof g === 'object' && g?.nama) return g.nama;
        return null;
      })
      .filter(Boolean);
  };

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manajemen Mata Pelajaran</h1>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Tambah Mata Pelajaran
          </button>
        </div>

        {error && <div className="text-red-500 mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</div>}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Belum ada mata pelajaran</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const kelasNames = getKelasNames(subject);
              const guruNames = getGuruNames(subject);
              
              return (
                <div
                  key={subject._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                          {subject.nama}
                        </h3>
                        {subject.kode && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Kode: {subject.kode}</p>
                        )}
                        {subject.total_jam_per_minggu && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total Jam/Minggu: {subject.total_jam_per_minggu} jam</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(subject)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(subject._id, subject.nama)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {subject.deskripsi && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {subject.deskripsi}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Kelas Ajar */}
                    <div className="pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          Kelas Ajar
                        </span>
                        <button
                          onClick={() => handleAddKelas(subject._id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          {kelasNames.length > 0 ? (
                            <>
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </>
                          ) : (
                            '+ Tambah'
                          )}
                        </button>
                      </div>
                      {kelasNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {kelasNames.map((nama, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded"
                            >
                              {nama}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Belum ada kelas</p>
                      )}
                    </div>

                    {/* Guru Mata Pelajaran */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          Guru Mata Pelajaran
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddGuru(subject._id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            {guruNames.length > 0 ? (
                              <>
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </>
                            ) : (
                              '+ Tambah'
                            )}
                          </button>
                          {guruNames.length > 0 && kelasNames.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedSubjectId(subject._id);
                                setShowAssignModal(true);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                              title="Assign Guru ke Kelas Spesifik"
                            >
                              <Link2 className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                      {guruNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {guruNames.map((nama, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded"
                            >
                              {nama}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Belum ada guru</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Tambah/Edit Mata Pelajaran */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => {
            setModalOpen(false);
            setForm(initialForm);
            setEditId(null);
            setError('');
          }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setForm(initialForm);
                    setEditId(null);
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    Nama Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    Kode
                  </label>
                  <input
                    type="text"
                    value={form.kode}
                    onChange={e => setForm(f => ({ ...f, kode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    Deskripsi
                  </label>
                  <textarea
                    value={form.deskripsi}
                    onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Deskripsi singkat mata pelajaran..."
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                    Total Jam Per Minggu
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.total_jam_per_minggu}
                    onChange={e => setForm(f => ({ ...f, total_jam_per_minggu: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: 2"
                  />
                </div>

                {error && <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">{error}</div>}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setForm(initialForm);
                      setEditId(null);
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : editId ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tambah Kelas */}
        {showAddKelasModal && selectedSubjectId && (
          <AddKelasModal
            subjectId={selectedSubjectId}
            currentKelasIds={subjects.find(s => s._id === selectedSubjectId)?.kelas_ids || []}
            onSuccess={() => {
              fetchData();
              setShowAddKelasModal(false);
              setSelectedSubjectId(null);
            }}
            onClose={() => {
              setShowAddKelasModal(false);
              setSelectedSubjectId(null);
            }}
          />
        )}

        {/* Modal Tambah Guru */}
        {showAddGuruModal && selectedSubjectId && (
          <AddGuruModal
            subjectId={selectedSubjectId}
            currentGuruIds={subjects.find(s => s._id === selectedSubjectId)?.guru_ids || []}
            onSuccess={() => {
              fetchData();
              setShowAddGuruModal(false);
              setSelectedSubjectId(null);
            }}
            onClose={() => {
              setShowAddGuruModal(false);
              setSelectedSubjectId(null);
            }}
          />
        )}

        {/* Modal Assign Guru ke Kelas */}
        {showAssignModal && selectedSubjectId && (
          <AssignGuruKelasModal
            subjectId={selectedSubjectId}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedSubjectId(null);
            }}
            onSuccess={() => {
              fetchData();
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
