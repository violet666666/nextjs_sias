import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function AddKelasModal({ subjectId, currentKelasIds = [], onSuccess, onClose }) {
  const isEditMode = currentKelasIds && currentKelasIds.length > 0;
  const [classes, setClasses] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [subjectId]);

  // Sync selectedClasses dengan currentKelasIds saat modal dibuka
  useEffect(() => {
    if (currentKelasIds && currentKelasIds.length > 0) {
      const currentIds = currentKelasIds.map(id => {
        if (typeof id === 'object' && id._id) return id._id.toString();
        return id.toString();
      });
      setSelectedClasses(currentIds);
    } else {
      setSelectedClasses([]);
    }
  }, [currentKelasIds]);

  const fetchClasses = async () => {
    setLoading(true);
    setError('');
    try {
      // Ambil semua kelas
      const resAll = await fetchWithAuth('/api/kelas');
      if (!resAll.ok) throw new Error('Gagal mengambil data kelas');
      const allClasses = await resAll.json();
      
      // Tampilkan semua kelas (untuk edit)
      setClasses(allClasses);
    } catch (err) {
      setError(err.message);
      setClasses([]);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClasses([]);
      setSelectAll(false);
    } else {
      const filteredClasses = classes.filter(kelas => 
        (kelas.nama_kelas || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedClasses(filteredClasses.map(c => c._id));
      setSelectAll(true);
    }
  };

  const handleClassToggle = (classId) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tidak perlu validasi minimal satu, bisa kosong untuk menghapus semua

    setSubmitting(true);
    setError('');
    try {
      // Gunakan selectedClasses langsung (sudah termasuk yang sudah ada dan yang baru dipilih)
      const finalIds = selectedClasses.map(id => id.toString());

      const res = await fetchWithAuth(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kelas_ids: finalIds
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan kelas');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  const filteredClasses = classes.filter(kelas => 
    (kelas.nama_kelas || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Kelas Ajar' : 'Tambah Kelas Ajar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data kelas...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="Cari kelas berdasarkan nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pilih Semua ({filteredClasses.length} kelas)
                </label>
              </div>

              {/* Classes List */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada kelas yang cocok dengan pencarian' : 'Tidak ada kelas tersedia'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredClasses.map((kelas) => (
                      <div key={kelas._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          id={kelas._id}
                          checked={selectedClasses.includes(kelas._id)}
                          onChange={() => handleClassToggle(kelas._id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor={kelas._id} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {kelas.nama_kelas || 'Unknown Class'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {kelas.tahun_ajaran || '-'}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Count */}
              {selectedClasses.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedClasses.length} kelas dipilih
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Menyimpan...' : selectedClasses.length > 0 ? `Simpan (${selectedClasses.length} kelas)` : 'Simpan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

