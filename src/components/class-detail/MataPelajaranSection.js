import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function MataPelajaranSection({ kelas, kelasId, onSuccess }) {
  const [mapelList, setMapelList] = useState([]); // Daftar mapel di kelas
  const [allMapel, setAllMapel] = useState([]); // Semua mapel untuk dropdown tambah
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState('');

  // Fetch mapel di kelas
  useEffect(() => {
    async function fetchMapel() {
      setLoading(true);
      setError('');
      try {
        // Ambil detail mapel di kelas
        if (kelas?.matapelajaran_ids?.length) {
          const res = await fetchWithAuth(`/api/subjects?ids=${kelas.matapelajaran_ids.join(',')}`);
          if (!res.ok) throw new Error('Gagal mengambil data mata pelajaran');
          const data = await res.json();
          setMapelList(Array.isArray(data) ? data : []);
        } else {
          setMapelList([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMapel();
  }, [kelas?.matapelajaran_ids]);

  // Fetch semua mapel untuk dropdown tambah
  useEffect(() => {
    async function fetchAllMapel() {
      try {
        const res = await fetchWithAuth('/api/subjects');
        if (!res.ok) throw new Error('Gagal mengambil daftar mata pelajaran');
        const data = await res.json();
        setAllMapel(Array.isArray(data) ? data : []);
      } catch {}
    }
    if (showAddModal) fetchAllMapel();
  }, [showAddModal]);

  // Tambah mapel ke kelas
  const handleAddMapel = async (e) => {
    e.preventDefault();
    if (!selectedMapel) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'add-mapel', matapelajaran_id: selectedMapel })
      });
      if (!res.ok) throw new Error('Gagal menambah mata pelajaran ke kelas');
      setShowAddModal(false);
      setSelectedMapel('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setAdding(false);
  };

  // Hapus mapel dari kelas
  const handleRemoveMapel = async (mapelId) => {
    if (!window.confirm('Yakin ingin menghapus mata pelajaran ini dari kelas?')) return;
    setRemoving(mapelId);
    setError('');
    try {
      const res = await fetchWithAuth(`/api/kelas/${kelasId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'remove-mapel', matapelajaran_id: mapelId })
      });
      if (!res.ok) throw new Error('Gagal menghapus mata pelajaran dari kelas');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    }
    setRemoving('');
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Mata Pelajaran di Kelas Ini</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Tambah Mata Pelajaran
        </button>
      </div>
      {loading ? (
        <div className="text-center py-6">Memuat data mata pelajaran...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : mapelList.length === 0 ? (
        <div className="empty-state">
          <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <div>Belum ada mata pelajaran di kelas ini.</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
          <table className="min-w-full modern-table">
            <thead>
              <tr>
                <th className="py-2 px-4">Nama Mata Pelajaran</th>
                <th className="py-2 px-4">Guru Pengampu</th>
                <th className="py-2 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {mapelList.map((m) => {
                const guruNames = Array.isArray(m.guru_ids) && m.guru_ids.length
                  ? m.guru_ids.map(g => g.nama || g).join(', ')
                  : (m.guru_id?.nama || '-');
                return (
                <tr key={m._id}>
                  <td className="py-2 px-4 font-medium">{m.nama}</td>
                  <td className="py-2 px-4">{guruNames}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleRemoveMapel(m._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                      disabled={removing === m._id}
                    >
                      {removing === m._id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal Tambah Mapel */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddMapel} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-slate-100">Tambah Mata Pelajaran ke Kelas</h3>
            <div className="space-y-4">
              <select
                required
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                value={selectedMapel}
                onChange={e => setSelectedMapel(e.target.value)}
              >
                <option value="">Pilih Mata Pelajaran</option>
                {allMapel.filter(m => !kelas.matapelajaran_ids?.includes(m._id)).map(m => {
                  const guruNames = Array.isArray(m.guru_ids) && m.guru_ids.length
                    ? m.guru_ids.map(g => g.nama || g).join(', ')
                    : (m.guru_id?.nama || '-');
                  return (
                    <option key={m._id} value={m._id}>{m.nama} ({guruNames})</option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors duration-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 font-medium"
                disabled={adding}
              >
                {adding ? 'Menambah...' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 