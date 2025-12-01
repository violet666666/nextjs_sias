import React, { useState, useEffect } from 'react';
import useKelasDetail from './useKelasDetail';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import Toast from '../common/Toast';

export default function ClassDetailOrangtua({ kelasId }) {
  const { kelas, tasks, nilai, attendance, announcements, comments, loading } = useKelasDetail(kelasId);
  const [anakList, setAnakList] = useState([]);
  const [selectedAnakId, setSelectedAnakId] = useState(null);
  const [myNilai, setMyNilai] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    setUser(u);
    if (!u || u.role !== 'orangtua') return;
    fetchWithAuth(`/api/orangtua?user_id=${u.id}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const allData = Array.isArray(data) ? data : [];
        // Flatten siswa_ids dari semua record
        const allAnak = allData.flatMap(item => {
          if (item.siswa_ids && Array.isArray(item.siswa_ids)) {
            return item.siswa_ids;
          } else if (item.siswa_id) {
            // Backward compatibility
            return [item.siswa_id];
          }
          return [];
        });
        setAnakList(allAnak);
        if (allAnak.length > 0) {
          setSelectedAnakId(allAnak[0]._id || allAnak[0]);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedAnakId) return;
    setMyNilai(nilai.filter(n => n.siswa_id === selectedAnakId || n.siswa_id?._id === selectedAnakId));
    setMyAttendance(attendance.filter(a => a.siswa_id === selectedAnakId || a.siswa_id?._id === selectedAnakId));
  }, [selectedAnakId, nilai, attendance]);

  if (loading) return <div>Memuat data kelas...</div>;
  if (!kelas) return <div>Data kelas tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">{kelas.nama_kelas || kelas.namaKelas}</h2>
      <div className="mb-6">
        <h3 className="font-semibold">Info Kelas</h3>
        <p><b>Guru Kelas:</b> {kelas.guru_id?.nama || kelas.guruKelas || '-'}</p>
        <p><b>Tahun Ajaran:</b> {kelas.tahun_ajaran || '-'}</p>
        <p><b>Deskripsi:</b> {kelas.deskripsi || '-'}</p>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Pilih Anak</h3>
        {anakList.length === 0 ? <p>Tidak ada data anak terhubung.</p> : (
          <select
            className="border rounded p-2 mb-2"
            value={selectedAnakId || ''}
            onChange={e => setSelectedAnakId(e.target.value)}
          >
            {anakList.map(a => (
              <option key={a.siswa_id?._id || a.siswa_id} value={a.siswa_id?._id || a.siswa_id}>
                {a.siswa_id?.nama || 'Nama Anak Tidak Tersedia'}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Nilai Anak</h3>
        {toast.message && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        )}
        <table className="modern-table">
          <tbody>
            {myNilai.length === 0 && !loading && (
              <tr><td colSpan="100%" className="text-center py-6 text-gray-400">Belum ada nilai</td></tr>
            )}
            {loading && (
              <tr><td colSpan="100%" className="text-center py-6"><span className="loading-spinner"></span> Memuat data...</td></tr>
            )}
            {myNilai.map((n, i) => (
              <tr key={i}>
                <td>{n.tugas_id?.judul || '-'}</td>
                <td>{n.nilai ?? '-'}</td>
                <td>{n.feedback ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Kehadiran Anak</h3>
        {loading ? (
          <div className="text-center py-6"><span className="spinner"></span> Memuat data...</div>
        ) : myAttendance.length === 0 ? (
          <div className="empty-state">
            <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <div>Belum ada data kehadiran.</div>
          </div>
        ) : (
          <>
            <table className="modern-table mb-2">
              <thead>
                <tr>
                  <th className="px-4 py-2">Tanggal</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.map((a, i) => {
                  let badge = 'bg-gray-200 text-gray-700';
                  if (a.status === 'Hadir') badge = 'bg-green-100 text-green-700';
                  else if (a.status === 'Izin') badge = 'bg-blue-100 text-blue-700';
                  else if (a.status === 'Sakit') badge = 'bg-yellow-100 text-yellow-700';
                  else if (a.status === 'Alfa') badge = 'bg-red-100 text-red-700';
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2">{a.tanggal ? new Date(a.tanggal).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2"><span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{a.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Progress bar */}
            {(() => {
              const total = myAttendance.length;
              const hadir = myAttendance.filter(a => a.status === 'Hadir').length;
              const persen = total ? Math.round((hadir / total) * 100) : 0;
              let badge = 'bg-gray-200 text-gray-700';
              if (persen >= 90) badge = 'bg-green-100 text-green-700';
              else if (persen >= 75) badge = 'bg-blue-100 text-blue-700';
              else if (persen >= 50) badge = 'bg-yellow-100 text-yellow-700';
              else badge = 'bg-red-100 text-red-700';
              return (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-32 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-3 rounded-full ${badge}`} style={{ width: `${persen}%` }}></div>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded font-semibold ${badge}`}>{persen}% Hadir</span>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Pengumuman</h3>
        {loading ? (
          <div className="text-center py-6"><span className="spinner"></span> Memuat pengumuman...</div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div>Belum ada pengumuman untuk kelas ini.</div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <div key={a._id || i} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-blue-700 dark:text-blue-300 truncate">{a.title || a.judul || 'Pengumuman'}</span>
                  <span className="ml-auto text-xs text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('id-ID') : ''}</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-3">{a.text || a.ringkasan || a.deskripsi || '-'}</div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-xs text-gray-500">Oleh: {a.author?.nama || a.pembuat || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Komentar</h3>
        {loading ? (
          <div className="text-center py-6"><span className="spinner"></span> Memuat komentar...</div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <svg className="mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2"/><path d="M15 3h6v6"/><path d="M10 14l2-2 4 4"/></svg>
            <div>Belum ada komentar untuk kelas ini.</div>
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {comments.map((c, i) => (
              <div key={c._id || i} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg shadow p-3 border border-gray-100 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {c.author?.nama ? c.author.nama.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{c.author?.nama || 'Anonim'}</span>
                    <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString('id-ID') : ''}</span>
                  </div>
                  <div className="text-gray-800 dark:text-gray-200 mt-1">{c.text || c.isi || '-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <form className="mt-4 flex gap-2" onSubmit={async e => {
          e.preventDefault();
          if (!user || !selectedAnakId) {
            setToast({ message: 'User atau anak tidak valid.', type: 'error' });
            return;
          }
          const input = e.target.elements['komentar'];
          const text = input.value.trim();
          if (!text) return;
          input.disabled = true;
          try {
            const res = await fetchWithAuth(`/api/kelas/${kelasId}/comments`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, siswa_id: selectedAnakId })
            });
            if (!res.ok) {
              const data = await res.json();
              setToast({ message: data.error || 'Gagal mengirim komentar', type: 'error' });
            } else {
              input.value = '';
              setToast({ message: 'Komentar berhasil dikirim!', type: 'success' });
            }
          } catch (err) {
            setToast({ message: 'Terjadi kesalahan saat mengirim komentar', type: 'error' });
          }
          input.disabled = false;
        }}>
          <input
            name="komentar"
            className="flex-1 border rounded p-2"
            placeholder="Tulis komentar..."
            autoComplete="off"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
} 