import React, { useEffect, useRef, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function TaskModal({ kelasId, onSuccess, onClose, initialData }) {
  const [judul, setJudul] = useState(initialData?.judul || '');
  const [deskripsi, setDeskripsi] = useState(initialData?.deskripsi || '');
  const [tanggal_deadline, setTanggalDeadline] = useState(initialData?.tanggal_deadline ? initialData.tanggal_deadline.slice(0, 16) : '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [mapelList, setMapelList] = useState([]);
  const [selectedMapel, setSelectedMapel] = useState(initialData?.matapelajaran_id || '');
  const modalRef = useRef();

  useEffect(() => {
    async function fetchMapel() {
      try {
        const kelasRes = await fetchWithAuth(`/api/kelas/${kelasId}`);
        if (!kelasRes.ok) return;
        const kelas = await kelasRes.json();
        if (kelas?.matapelajaran_ids?.length) {
          const res = await fetchWithAuth(`/api/subjects?ids=${kelas.matapelajaran_ids.join(',')}`);
          if (!res.ok) return;
          const data = await res.json();
          setMapelList(Array.isArray(data) ? data : []);
        } else {
          setMapelList([]);
        }
      } catch {}
    }
    fetchMapel();
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

  const isEdit = !!initialData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!judul.trim()) {
      setFormError('Judul tugas wajib diisi');
      return;
    }
    if (!selectedMapel) {
      setFormError('Mata pelajaran wajib dipilih');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        kelas_id: kelasId,
        judul,
        deskripsi,
        tanggal_deadline: tanggal_deadline ? new Date(tanggal_deadline).toISOString() : null,
        matapelajaran_id: selectedMapel,
      };
      const res = await fetchWithAuth(isEdit ? `/api/tugas/${initialData._id}` : '/api/tugas', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Gagal menyimpan tugas');
      } else {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setFormError('Terjadi kesalahan saat menyimpan tugas');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-60 animate-fade-in">
      <div ref={modalRef} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 relative animate-modal-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Tutup"
        >×</button>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{isEdit ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
            placeholder="Judul tugas"
            value={judul}
            onChange={e => setJudul(e.target.value)}
            disabled={submitting}
          />
          <textarea
            className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
            placeholder="Deskripsi (opsional)"
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            disabled={submitting}
          />
          <select
            className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
            value={selectedMapel}
            onChange={e => setSelectedMapel(e.target.value)}
            disabled={submitting || mapelList.length === 0}
            required
          >
            <option value="">Pilih Mata Pelajaran</option>
            {mapelList.map(m => {
              const guruNames = Array.isArray(m.guru_ids) && m.guru_ids.length
                ? m.guru_ids.map(g => g.nama || g).join(', ')
                : (m.guru_id?.nama || '-');
              return (
                <option key={m._id} value={m._id}>{m.nama} ({guruNames})</option>
              );
            })}
          </select>
          <input
            type="datetime-local"
            className="w-full border rounded p-2 dark:bg-gray-700 dark:text-white"
            value={tanggal_deadline}
            onChange={e => setTanggalDeadline(e.target.value)}
            disabled={submitting}
          />
          {formError && <div className="text-red-500 text-sm">{formError}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600" disabled={submitting}>Batal</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={submitting}>{submitting ? (isEdit ? 'Menyimpan...' : 'Menambah...') : (isEdit ? 'Simpan' : 'Tambah')}</button>
          </div>
        </form>
      </div>
    </div>
  );
} 