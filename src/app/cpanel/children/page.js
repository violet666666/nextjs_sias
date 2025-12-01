'use client';
import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [nisInput, setNisInput] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    fetchChildren();
  }, []);

  // Fetch status request
  useEffect(() => {
    const fetchRequestStatus = async () => {
      try {
        const res = await fetchWithAuth('/api/orangtua/request');
        if (res && res.ok) {
          const data = await res.json();
          if (data && data.success && data.requests) {
            const requests = Array.isArray(data.requests) ? data.requests : [];
            // Filter request yang masih pending
            const pending = requests.filter(r => r.status === 'pending');
            setPendingRequests(pending);
            
            // Set status untuk display (jika belum ada anak)
            if (children.length === 0 && pending.length > 0) {
              setRequestStatus('pending');
            } else if (children.length === 0 && requests.length > 0) {
              const latestReq = requests[requests.length - 1];
              setRequestStatus(latestReq.status);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching request status:', e);
      }
    };
    fetchRequestStatus();
  }, [children.length]);

  const handleRequest = async (e) => {
    e.preventDefault();
    
    // Validasi NIS
    const nis = nisInput.trim();
    if (!nis) {
      setError('NIS tidak boleh kosong.');
      return;
    }
    
    setRequestLoading(true);
    setError('');
    setSuccess('');
    setRequestStatus(null);
    
    try {
      const res = await fetchWithAuth('/api/orangtua/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa_nis: nis })
      });
      
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setSuccess(`Request berhasil dikirim! NIS ${nis} sedang menunggu persetujuan admin.`);
          setRequestStatus('pending');
          setNisInput(''); // Clear input
          setShowRequestForm(false);
          
          // Refresh data children
          await fetchChildren();
          
          // Refresh request status
          try {
            const reqRes = await fetchWithAuth('/api/orangtua/request');
            if (reqRes && reqRes.ok) {
              const reqData = await reqRes.json();
              if (reqData && reqData.success && reqData.requests) {
                const requests = Array.isArray(reqData.requests) ? reqData.requests : [];
                const pending = requests.filter(r => r.status === 'pending');
                setPendingRequests(pending);
              }
            }
          } catch (e) {
            console.error('Error refreshing request status:', e);
          }
        } else {
          setError(data?.error || 'Gagal mengajukan request.');
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData?.error || 'Gagal mengajukan request.');
      }
    } catch (e) {
      console.error('Error submitting request:', e);
      setError('Gagal mengajukan request. Pastikan koneksi internet Anda stabil.');
    } finally {
      setRequestLoading(false);
    }
  };

  const fetchChildren = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/orangtua/children-summary');
      if (!res.ok) {
        throw new Error('Gagal memuat data anak');
      }
      const data = await res.json();
      const childrenData = data.children || [];
      const formattedChildren = Array.isArray(childrenData) ? childrenData.map(child => ({
        _id: child.id,
        nama: child.nama || '-',
        email: child.email || '-',
        nis: child.nis || '-',
        nilaiRataRata: child.averageGrade || 0,
        kehadiran: child.attendanceRate ? `${child.attendanceRate}%` : '0%'
      })) : [];
      setChildren(formattedChildren);
    } catch (e) {
      console.error('Error fetching children:', e);
      setError('Gagal memuat data anak.');
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };


  return (
    <ProtectedRoute requiredRoles={['orangtua', 'parent']}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Anak Saya</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola hubungan dengan anak Anda menggunakan NIS (Nomor Induk Siswa)
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Request Form Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {children.length > 0 ? 'Tambah Anak Lain' : 'Hubungkan dengan Anak'}
          </h2>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong className="text-blue-700 dark:text-blue-300">Cara menggunakan:</strong>
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Masukkan NIS (Nomor Induk Siswa) anak Anda</li>
              <li>Klik tombol "Ajukan Hubungan"</li>
              <li>Tunggu persetujuan dari admin</li>
              <li>Setelah disetujui, data anak akan muncul di bawah</li>
            </ol>
          </div>

          {showRequestForm ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label htmlFor="nis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NIS (Nomor Induk Siswa)
                </label>
                <input
                  id="nis"
                  type="text"
                  value={nisInput}
                  onChange={(e) => setNisInput(e.target.value)}
                  placeholder="Contoh: SISWA-20240101-0001"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={requestLoading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Masukkan NIS yang diberikan oleh sekolah
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={requestLoading}
                >
                  {requestLoading ? 'Mengirim...' : 'Ajukan Hubungan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    setNisInput('');
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={requestLoading}
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowRequestForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {children.length > 0 ? '+ Tambah Anak Lain' : 'Ajukan Hubungan ke Anak'}
            </button>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Request yang Menunggu Persetujuan ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        NIS: <span className="font-mono">{req.siswa_id?.nis || '-'}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Nama: {req.siswa_id?.nama || '-'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-semibold rounded-full">
                      Menunggu
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Children List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Memuat data anak...
            </div>
          ) : children.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                {requestStatus === 'pending' ? (
                  <div>
                    <p className="mb-2">Request sedang diproses admin...</p>
                    <p className="text-sm">Silakan tunggu persetujuan dari admin.</p>
                  </div>
                ) : requestStatus === 'approved' ? (
                  <div>
                    <p className="mb-2 text-green-600 dark:text-green-400 font-semibold">
                      Request sudah disetujui!
                    </p>
                    <p className="text-sm">Silakan refresh halaman untuk melihat data anak.</p>
                  </div>
                ) : requestStatus === 'rejected' ? (
                  <div>
                    <p className="mb-2 text-red-600 dark:text-red-400 font-semibold">
                      Request ditolak admin.
                    </p>
                    <p className="text-sm">Silakan coba lagi dengan NIS yang benar.</p>
                  </div>
                ) : (
                  <p>Belum ada anak yang terhubung ke akun Anda.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Nama Anak
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      NIS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Nilai (Rata-rata)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Kehadiran
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {children.map((child) => (
                    <ChildRow key={child._id} siswa={child} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ChildRow({ siswa }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
        {siswa.nama}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300">
        {siswa.nis}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
        {siswa.email}
      </td>
      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
        {siswa.nilaiRataRata > 0 ? siswa.nilaiRataRata : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">
        {siswa.kehadiran}
      </td>
      <td className="px-4 py-3 text-center">
        <a
          href={`/cpanel/children/${siswa._id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Lihat Detail Monitoring Anak"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Detail
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