import React, { useEffect, useRef, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function AddStudentModal({ kelasId, onSuccess, onClose }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef();

  useEffect(() => {
    async function fetchCandidates() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth('/api/users?role=siswa');
        if (!res.ok) throw new Error('Gagal mengambil data siswa');
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        setError(err.message);
        setStudents([]);
      }
      setLoading(false);
    }
    fetchCandidates();
  }, [kelasId]);

  // Close modal on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close modal on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selected) {
      setFormError('Pilih siswa terlebih dahulu');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelas_id: kelasId, siswa_id: selected })
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Gagal menambah siswa');
      } else {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setFormError('Terjadi kesalahan saat menambah siswa');
    }
    setSubmitting(false);
  };

  const filteredStudents = students.filter(student => 
    student.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Tambah Siswa ke Kelas
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Memuat data siswa...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="Cari siswa berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Student Selection */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Tidak ada siswa tersedia'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredStudents.map((student) => (
                      <div key={student._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <input
                          type="radio"
                          id={student._id}
                          name="student"
                          value={student._id}
                          checked={selected === student._id}
                          onChange={(e) => setSelected(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor={student._id} className="flex-1 cursor-pointer">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {student.nama}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {student.email}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formError && <div className="text-red-500 text-sm">{formError}</div>}
              
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50" 
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={submitting || !selected}
                >
                  {submitting ? 'Menambahkan...' : 'Tambah'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 