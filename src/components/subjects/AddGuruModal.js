import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function AddGuruModal({ subjectId, currentGuruIds = [], onSuccess, onClose }) {
  const isEditMode = currentGuruIds && currentGuruIds.length > 0;
  const [guru, setGuru] = useState([]);
  const [selectedGuru, setSelectedGuru] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchGuru();
  }, [subjectId]);

  // Sync selectedGuru dengan currentGuruIds saat modal dibuka
  useEffect(() => {
    if (currentGuruIds && currentGuruIds.length > 0) {
      const currentIds = currentGuruIds.map(id => {
        if (typeof id === 'object' && id._id) return id._id.toString();
        return id.toString();
      });
      setSelectedGuru(currentIds);
    } else {
      setSelectedGuru([]);
    }
  }, [currentGuruIds]);

  const fetchGuru = async () => {
    setLoading(true);
    setError('');
    try {
      // Ambil semua guru
      const resAll = await fetchWithAuth('/api/users?role=guru');
      if (!resAll.ok) throw new Error('Gagal mengambil data guru');
      const allGuru = await resAll.json();
      
      // Tampilkan semua guru (untuk edit)
      setGuru(allGuru);
    } catch (err) {
      setError(err.message);
      setGuru([]);
    }
    setLoading(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedGuru([]);
      setSelectAll(false);
    } else {
      const filteredGuru = guru.filter(g => 
        (g.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedGuru(filteredGuru.map(g => g._id));
      setSelectAll(true);
    }
  };

  const handleGuruToggle = (guruId) => {
    setSelectedGuru(prev => {
      if (prev.includes(guruId)) {
        return prev.filter(id => id !== guruId);
      } else {
        return [...prev, guruId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Tidak perlu validasi minimal satu, bisa kosong untuk menghapus semua

    setSubmitting(true);
    setError('');
    try {
      // Gunakan selectedGuru langsung (sudah termasuk yang sudah ada dan yang baru dipilih)
      const finalIds = selectedGuru.map(id => id.toString());

      const res = await fetchWithAuth(`/api/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          guru_ids: finalIds
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan guru');
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  const filteredGuru = guru.filter(g => 
    (g.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEditMode ? 'Edit Guru Mata Pelajaran' : 'Tambah Guru Mata Pelajaran'}
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
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data guru...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="Cari guru berdasarkan nama atau email..."
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
                  Pilih Semua ({filteredGuru.length} guru)
                </label>
              </div>

              {/* Guru List */}
              <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {filteredGuru.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada guru yang cocok dengan pencarian' : 'Tidak ada guru tersedia'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredGuru.map((g) => (
                      <div key={g._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="checkbox"
                          id={g._id}
                          checked={selectedGuru.includes(g._id)}
                          onChange={() => handleGuruToggle(g._id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor={g._id} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {g.nama || 'Unknown Teacher'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {g.email || '-'}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Count */}
              {selectedGuru.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedGuru.length} guru dipilih
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
                  {submitting ? 'Menyimpan...' : selectedGuru.length > 0 ? `Simpan (${selectedGuru.length} guru)` : 'Simpan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

