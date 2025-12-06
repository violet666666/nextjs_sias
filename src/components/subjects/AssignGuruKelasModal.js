'use client';
import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { X, Plus, Trash2, Users, GraduationCap } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AssignGuruKelasModal({ subjectId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [subject, setSubject] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  // Filter kelas yang sudah di-assign
  const getAvailableKelas = () => {
    if (!kelasList || kelasList.length === 0) return [];
    
    // Ambil ID kelas yang sudah di-assign
    const assignedKelasIds = (assignments || []).map(a => {
      const kelasId = a.kelas_id?._id || a.kelas_id;
      return typeof kelasId === 'object' ? kelasId.toString() : kelasId.toString();
    });
    
    // Filter kelas yang belum di-assign
    return kelasList.filter(kelas => {
      const kelasId = kelas._id?.toString() || kelas.toString();
      return !assignedKelasIds.includes(kelasId);
    });
  };

  const availableKelas = getAvailableKelas();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch subject dengan assignments
      const subjectRes = await fetchWithAuth(`/api/subjects/${subjectId}`);
      if (!subjectRes.ok) throw new Error('Gagal mengambil data mata pelajaran');
      const subjectData = await subjectRes.json();
      setSubject(subjectData);
      setAssignments(subjectData.guru_kelas_assignments || []);

      // Fetch guru yang terdaftar di mata pelajaran ini
      const guruIds = subjectData.guru_ids || [];
      if (guruIds.length > 0) {
        const guruPromises = guruIds.map(async (gId) => {
          const id = typeof gId === 'object' ? (gId._id || gId) : gId;
          const res = await fetchWithAuth(`/api/users/${id}`);
          if (res.ok) return await res.json();
          return null;
        });
        const guruResults = await Promise.all(guruPromises);
        setGuruList(guruResults.filter(g => g !== null));
      }

      // Fetch kelas yang terdaftar di mata pelajaran ini
      const kelasIds = subjectData.kelas_ids || [];
      if (kelasIds.length > 0) {
        const kelasPromises = kelasIds.map(async (kId) => {
          const id = typeof kId === 'object' ? (kId._id || kId) : kId;
          const res = await fetchWithAuth(`/api/kelas/${id}`);
          if (res.ok) return await res.json();
          return null;
        });
        const kelasResults = await Promise.all(kelasPromises);
        setKelasList(kelasResults.filter(k => k !== null));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      Swal.fire('Error', 'Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedGuru || !selectedKelas) {
      Swal.fire('Error', 'Pilih guru dan kelas', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/subjects/${subjectId}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          guru_id: selectedGuru,
          kelas_id: selectedKelas
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menambahkan assignment');
      }

      const newAssignment = await res.json();
      setAssignments([...assignments, newAssignment]);
      setSelectedGuru('');
      setSelectedKelas('');
      setShowAddForm(false);
      Swal.fire('Berhasil', 'Assignment berhasil ditambahkan', 'success');
      if (onSuccess) onSuccess();
      
      // Refresh data untuk update daftar kelas yang tersedia
      await fetchData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const result = await Swal.fire({
      title: 'Hapus Assignment?',
      text: 'Apakah Anda yakin ingin menghapus assignment ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetchWithAuth(`/api/subjects/${subjectId}/assignments?assignment_id=${assignmentId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus assignment');
      }

      setAssignments(assignments.filter(a => a._id !== assignmentId));
      Swal.fire('Berhasil', 'Assignment berhasil dihapus', 'success');
      if (onSuccess) onSuccess();
      
      // Refresh data untuk update daftar kelas yang tersedia
      await fetchData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Assign Guru ke Kelas
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subject?.nama}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Catatan:</strong> Assign guru yang mengajar mata pelajaran ini ke kelas spesifik. 
              Hanya guru yang sudah di-assign yang dapat memberikan tugas ke kelas tersebut.
            </p>
          </div>

          {/* Add Form */}
          {showAddForm ? (
            <form onSubmit={handleAddAssignment} className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Tambah Assignment
                {availableKelas.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({availableKelas.length} kelas tersedia)
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Guru
                  </label>
                  <select
                    value={selectedGuru}
                    onChange={(e) => setSelectedGuru(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Pilih Guru</option>
                    {guruList.map(guru => (
                      <option key={guru._id} value={guru._id}>
                        {guru.nama} ({guru.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kelas
                  </label>
                  <select
                    value={selectedKelas}
                    onChange={(e) => setSelectedKelas(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                    disabled={availableKelas.length === 0}
                  >
                    <option value="">
                      {availableKelas.length === 0 
                        ? 'Semua kelas sudah di-assign' 
                        : 'Pilih Kelas'}
                    </option>
                    {availableKelas.map(kelas => (
                      <option key={kelas._id} value={kelas._id}>
                        {kelas.nama_kelas} ({kelas.tahun_ajaran})
                      </option>
                    ))}
                  </select>
                  {availableKelas.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Semua kelas sudah di-assign. Hapus assignment yang ada untuk menambahkan kelas baru.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedGuru('');
                    setSelectedKelas('');
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setShowAddForm(true);
                // Reset selection ketika form dibuka
                setSelectedGuru('');
                setSelectedKelas('');
              }}
              disabled={availableKelas.length === 0}
              className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Tambah Assignment
              {availableKelas.length === 0 && (
                <span className="ml-2 text-xs">(Semua kelas sudah di-assign)</span>
              )}
            </button>
          )}

          {/* Assignments List */}
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada assignment</p>
              <p className="text-sm mt-1">Klik "Tambah Assignment" untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment._id}
                  className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {assignment.guru_id?.nama || 'Guru tidak ditemukan'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mengajar di: <span className="font-medium">{assignment.kelas_id?.nama_kelas || 'Kelas tidak ditemukan'}</span>
                        {assignment.kelas_id?.tahun_ajaran && (
                          <span className="text-gray-500"> ({assignment.kelas_id.tahun_ajaran})</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAssignment(assignment._id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

