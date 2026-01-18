'use client';
import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const nisRef = useRef();

  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      setError('');
      try {
        const summaryRes = await fetchWithAuth('/api/orangtua/children-summary');
        if (!summaryRes.ok) throw new Error('Gagal memuat data anak.');
        const data = await summaryRes.json();
        setChildren(Array.isArray(data.children) ? data.children : []);
      } catch (e) {
        setError(e.message || 'Gagal memuat data anak.');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // Fetch status request jika belum ada anak
  useEffect(() => {
    if (children.length > 0) return;
    const fetchRequest = async () => {
      try {
        const res = await fetchWithAuth('/api/orangtua/request');
        if (res.ok) {
          const data = await res.json();
          if (data && data.requests) {
            const myReq = data.requests.find(r => r.status === 'pending');
            if (myReq) setRequestStatus(myReq.status);
          }
        }
      } catch {}
    };
    fetchRequest();
  }, [children]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setError('');
    setRequestStatus(null);
    try {
      const res = await fetchWithAuth('/api/orangtua/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa_nis: nisRef.current.value })
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setRequestStatus('pending');
        setShowRequestForm(false);
      } else {
        setError(data?.error || 'Gagal mengajukan request.');
      }
    } catch (e) {
      setError('Gagal mengajukan request.');
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['orangtua', 'parent']}>
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold mb-4">Anak Saya</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Memuat data anak...</div>
          ) : error ? (
            <div className="text-red-500 font-semibold">{error}</div>
          ) : children.length === 0 ? (
            <>
              <div className="text-gray-500 dark:text-gray-400 mb-4">Belum ada anak yang terhubung ke akun Anda.</div>
              {requestStatus === 'pending' ? (
                <div className="text-yellow-600 dark:text-yellow-400 font-semibold mb-2">Request sedang diproses admin...</div>
              ) : requestStatus === 'approved' ? (
                <div className="text-green-600 font-semibold mb-2">Request sudah disetujui. Silakan refresh halaman.</div>
              ) : requestStatus === 'rejected' ? (
                <div className="text-red-600 font-semibold mb-2">Request ditolak admin.</div>
              ) : showRequestForm ? (
                <form onSubmit={handleRequest} className="flex gap-2 items-center mb-2">
                  <input ref={nisRef} type="text" placeholder="NIS Anak" className="border rounded px-2 py-1" required />
                  <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={requestLoading}>{requestLoading ? 'Mengirim...' : 'Ajukan'}</button>
                  <button type="button" className="ml-2 text-gray-500" onClick={() => setShowRequestForm(false)}>Batal</button>
                </form>
              ) : (
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setShowRequestForm(true)}>Ajukan Hubungan ke Anak</button>
              )}
            </>
          ) : (
            <table className="w-full border mt-4">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900">
                  <th className="p-2 border">Nama Anak</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Nilai (Rata-rata)</th>
                  <th className="p-2 border">Kehadiran</th>
                  <th className="p-2 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <ChildRow key={child._id} siswa={child} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ChildRow({ siswa }) {
  // Data sekarang sudah diproses di backend, tidak perlu fetch lagi di sini
  return (
    <tr>
      <td className="p-2 border">{siswa.nama}</td>
      <td className="p-2 border">{siswa.email}</td>
      <td className="p-2 border text-center">{siswa.nilaiRataRata}</td>
      <td className="p-2 border text-center">{siswa.kehadiran}</td>
      <td className="p-2 border text-center">
        <a
          href={`/cpanel/children/${siswa._id}`}
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Lihat Monitoring Anak"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          Lihat Detail
        </a>
      </td>
    </tr>
  );
}

function ChildDetailModal({ siswa, kelas, loading, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-2">Detail Monitoring: {siswa.nama}</h2>
        <div className="mb-2 text-gray-600">Email: {siswa.email}</div>
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Daftar Kelas</h3>
          {loading ? (
            <div>Memuat kelas...</div>
          ) : kelas.length === 0 ? (
            <div className="text-gray-500">Belum ada kelas terdaftar.</div>
          ) : (
            <ul className="list-disc ml-5">
              {kelas.map(k => (
                <li key={k._id} className="mb-1">
                  <span className="font-semibold">{k.nama}</span> &ndash; Guru: {k.guru_nama || '-'}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Tambahkan monitoring tugas, nilai, kehadiran detail di sini jika diinginkan */}
      </div>
    </div>
  );
} 