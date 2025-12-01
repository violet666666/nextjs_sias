"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'mapel', label: 'Mata Pelajaran' },
  { key: 'tugas', label: 'Tugas' },
  { key: 'nilai', label: 'Nilai' },
  { key: 'kehadiran', label: 'Kehadiran' },
  { key: 'pengumuman', label: 'Pengumuman' },
  { key: 'komentar', label: 'Komentar' },
];

export default function ParentChildDetailPage({ params }) {
  const { anakId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [anak, setAnak] = useState(null);
  const [kelas, setKelas] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [mapel, setMapel] = useState([]);
  const [loadingMapel, setLoadingMapel] = useState(false);
  const [errorMapel, setErrorMapel] = useState('');
  const [tugas, setTugas] = useState([]);
  const [loadingTugas, setLoadingTugas] = useState(false);
  const [errorTugas, setErrorTugas] = useState('');
  const [nilai, setNilai] = useState([]);
  const [loadingNilai, setLoadingNilai] = useState(false);
  const [errorNilai, setErrorNilai] = useState('');
  const [kehadiran, setKehadiran] = useState([]);
  const [loadingKehadiran, setLoadingKehadiran] = useState(false);
  const [errorKehadiran, setErrorKehadiran] = useState('');
  const [pengumuman, setPengumuman] = useState([]);
  const [loadingPengumuman, setLoadingPengumuman] = useState(false);
  const [errorPengumuman, setErrorPengumuman] = useState('');
  const [komentar, setKomentar] = useState([]);
  const [loadingKomentar, setLoadingKomentar] = useState(false);
  const [errorKomentar, setErrorKomentar] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        // Fetch data anak dan kelasnya
        const anakRes = await fetchWithAuth(`/api/users/${anakId}`);
        if (!anakRes.ok) throw new Error('Gagal mengambil data anak');
        const anakData = await anakRes.json();
        setAnak(anakData);
        // Fetch kelas anak
        if (anakData.kelas_id) {
          const kelasRes = await fetchWithAuth(`/api/kelas/${anakData.kelas_id}`);
          if (kelasRes.ok) setKelas(await kelasRes.json());
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    if (anakId) fetchData();
  }, [anakId]);

  // Fetch mapel di kelas anak
  useEffect(() => {
    async function fetchMapel() {
      if (!kelas?.matapelajaran_ids?.length) { setMapel([]); return; }
      setLoadingMapel(true); setErrorMapel('');
      try {
        const res = await fetchWithAuth(`/api/subjects?ids=${kelas.matapelajaran_ids.join(',')}`);
        if (!res.ok) throw new Error('Gagal mengambil data mata pelajaran');
        const data = await res.json();
        setMapel(Array.isArray(data) ? data : []);
      } catch (err) { setErrorMapel(err.message); }
      setLoadingMapel(false);
    }
    if (kelas?.matapelajaran_ids) fetchMapel();
  }, [kelas?.matapelajaran_ids]);

  // Fetch tugas anak
  useEffect(() => {
    async function fetchTugas() {
      setLoadingTugas(true); setErrorTugas('');
      try {
        const res = await fetchWithAuth(`/api/tugas?siswa_id=${anakId}`);
        if (!res.ok) throw new Error('Gagal mengambil data tugas');
        const data = await res.json();
        setTugas(Array.isArray(data) ? data : []);
      } catch (err) { setErrorTugas(err.message); }
      setLoadingTugas(false);
    }
    if (anakId) fetchTugas();
  }, [anakId]);

  // Fetch nilai anak
  useEffect(() => {
    async function fetchNilai() {
      setLoadingNilai(true); setErrorNilai('');
      try {
        // Coba endpoint grades/student/[anakId] jika ada, fallback ke /api/nilai?siswa_id=anakId
        let res = await fetchWithAuth(`/api/grades/student/${anakId}`);
        if (!res.ok) res = await fetchWithAuth(`/api/nilai?siswa_id=${anakId}`);
        if (!res.ok) throw new Error('Gagal mengambil data nilai');
        const data = await res.json();
        setNilai(Array.isArray(data) ? data : []);
      } catch (err) { setErrorNilai(err.message); }
      setLoadingNilai(false);
    }
    if (anakId) fetchNilai();
  }, [anakId]);

  // Fetch kehadiran anak
  useEffect(() => {
    async function fetchKehadiran() {
      setLoadingKehadiran(true); setErrorKehadiran('');
      try {
        const res = await fetchWithAuth(`/api/kehadiran?siswa_id=${anakId}`);
        if (!res.ok) throw new Error('Gagal mengambil data kehadiran');
        const data = await res.json();
        setKehadiran(Array.isArray(data) ? data : []);
      } catch (err) { setErrorKehadiran(err.message); }
      setLoadingKehadiran(false);
    }
    if (anakId) fetchKehadiran();
  }, [anakId]);

  // Fetch pengumuman kelas anak
  useEffect(() => {
    async function fetchPengumuman() {
      if (!kelas?._id) { setPengumuman([]); return; }
      setLoadingPengumuman(true); setErrorPengumuman('');
      try {
        const res = await fetchWithAuth(`/api/kelas/${kelas._id}/announcements`);
        if (!res.ok) throw new Error('Gagal mengambil data pengumuman');
        const data = await res.json();
        setPengumuman(Array.isArray(data) ? data : []);
      } catch (err) { setErrorPengumuman(err.message); }
      setLoadingPengumuman(false);
    }
    if (kelas?._id) fetchPengumuman();
  }, [kelas?._id]);

  // Fetch komentar kelas anak
  useEffect(() => {
    async function fetchKomentar() {
      if (!kelas?._id) { setKomentar([]); return; }
      setLoadingKomentar(true); setErrorKomentar('');
      try {
        const res = await fetchWithAuth(`/api/kelas/${kelas._id}/comments`);
        if (!res.ok) throw new Error('Gagal mengambil data komentar');
        const data = await res.json();
        setKomentar(Array.isArray(data) ? data : []);
      } catch (err) { setErrorKomentar(err.message); }
      setLoadingKomentar(false);
    }
    if (kelas?._id) fetchKomentar();
  }, [kelas?._id]);

  if (loading) return <div className="p-8 text-center">Memuat data anak...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!anak) return <div className="p-8 text-center text-gray-500">Data anak tidak ditemukan.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* HEADER */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white shadow-lg p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">{anak.nama}</h2>
          <div className="flex flex-wrap gap-4 items-center text-base font-medium opacity-90">
            <span className="inline-flex items-center gap-2">Kelas: {kelas?.nama_kelas || '-'}</span>
            <span className="inline-flex items-center gap-2">Tahun Ajaran: {kelas?.tahun_ajaran || '-'}</span>
            <span className="inline-flex items-center gap-2">Wali Kelas: {kelas?.guru_id?.nama || '-'}</span>
          </div>
        </div>
      </div>
      {/* TAB NAVIGASI */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-medium rounded-t-lg focus:outline-none transition-colors duration-200 ${activeTab === tab.key ? 'bg-white dark:bg-slate-800 border-x border-t border-gray-200 dark:border-slate-700 -mb-px' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* SECTION PER TAB */}
      {activeTab === 'info' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Info Anak</h3>
          <p><b>Nama:</b> {anak.nama}</p>
          <p><b>Email:</b> {anak.email}</p>
          <p><b>Kelas:</b> {kelas?.nama_kelas || '-'}</p>
          <p><b>Tahun Ajaran:</b> {kelas?.tahun_ajaran || '-'}</p>
        </div>
      )}
      {activeTab === 'mapel' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Mata Pelajaran Anak</h3>
          {loadingMapel ? (
            <div className="py-6 text-center">Memuat data mata pelajaran...</div>
          ) : errorMapel ? (
            <div className="text-red-500">{errorMapel}</div>
          ) : mapel.length === 0 ? (
            <div className="empty-state">Belum ada mata pelajaran di kelas anak ini.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Nama Mata Pelajaran</th>
                    <th className="py-2 px-4">Guru Pengampu</th>
                  </tr>
                </thead>
                <tbody>
                  {mapel.map(m => (
                    <tr key={m._id}>
                      <td className="py-2 px-4 font-medium">{m.nama}</td>
                      <td className="py-2 px-4">{m.guru_id?.nama || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'tugas' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Tugas Anak</h3>
          {loadingTugas ? (
            <div className="py-6 text-center">Memuat data tugas...</div>
          ) : errorTugas ? (
            <div className="text-red-500">{errorTugas}</div>
          ) : tugas.length === 0 ? (
            <div className="empty-state">Belum ada tugas untuk anak ini.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Judul Tugas</th>
                    <th className="py-2 px-4">Mata Pelajaran</th>
                    <th className="py-2 px-4">Deadline</th>
                    <th className="py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tugas.map(t => (
                    <tr key={t._id}>
                      <td className="py-2 px-4 font-medium">{t.judul}</td>
                      <td className="py-2 px-4">{t.matapelajaran_id?.nama || '-'}</td>
                      <td className="py-2 px-4">{t.tanggal_deadline ? new Date(t.tanggal_deadline).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-4">{t.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'nilai' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Rekap Nilai Anak</h3>
          {loadingNilai ? (
            <div className="py-6 text-center">Memuat data nilai...</div>
          ) : errorNilai ? (
            <div className="text-red-500">{errorNilai}</div>
          ) : nilai.length === 0 ? (
            <div className="empty-state">Belum ada nilai untuk anak ini.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Mata Pelajaran</th>
                    <th className="py-2 px-4">Tugas</th>
                    <th className="py-2 px-4">Nilai</th>
                    <th className="py-2 px-4">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {nilai.map((n, i) => (
                    <tr key={i}>
                      <td className="py-2 px-4">{n.matapelajaran_id?.nama || '-'}</td>
                      <td className="py-2 px-4">{n.tugas_id?.judul || '-'}</td>
                      <td className="py-2 px-4 font-medium">{n.nilai ?? '-'}</td>
                      <td className="py-2 px-4">{n.feedback ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'kehadiran' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Kehadiran Anak</h3>
          {loadingKehadiran ? (
            <div className="py-6 text-center">Memuat data kehadiran...</div>
          ) : errorKehadiran ? (
            <div className="text-red-500">{errorKehadiran}</div>
          ) : kehadiran.length === 0 ? (
            <div className="empty-state">Belum ada data kehadiran untuk anak ini.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white dark:bg-gray-800">
              <table className="min-w-full modern-table">
                <thead>
                  <tr>
                    <th className="py-2 px-4">Tanggal</th>
                    <th className="py-2 px-4">Kelas</th>
                    <th className="py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kehadiran.map((k, i) => (
                    <tr key={i}>
                      <td className="py-2 px-4">{k.tanggal ? new Date(k.tanggal).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-4">{k.kelas_id?.nama_kelas || '-'}</td>
                      <td className="py-2 px-4 font-medium">{k.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {activeTab === 'pengumuman' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Pengumuman Kelas Anak</h3>
          {loadingPengumuman ? (
            <div className="py-6 text-center">Memuat data pengumuman...</div>
          ) : errorPengumuman ? (
            <div className="text-red-500">{errorPengumuman}</div>
          ) : pengumuman.length === 0 ? (
            <div className="empty-state">Belum ada pengumuman untuk kelas anak ini.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pengumuman.map((p) => (
                <div key={p._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-lg mb-1">{p.judul}</h4>
                  <div className="text-sm text-gray-500 mb-2">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</div>
                  <div className="text-gray-700 dark:text-gray-200 mb-2">{p.ringkasan || p.isi?.slice(0, 100) || '-'}</div>
                  <div className="text-xs text-gray-500">Oleh: {p.pembuat?.nama || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'komentar' && (
        <div className="mb-8">
          <h3 className="font-semibold text-lg mb-2">Komentar & Diskusi Kelas Anak</h3>
          {loadingKomentar ? (
            <div className="py-6 text-center">Memuat komentar...</div>
          ) : errorKomentar ? (
            <div className="text-red-500">{errorKomentar}</div>
          ) : komentar.length === 0 ? (
            <div className="empty-state">Belum ada komentar untuk kelas anak ini.</div>
          ) : (
            <div className="space-y-4">
              {komentar.map((k) => (
                <div key={k._id} className="flex items-start gap-3 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                    {k.user?.nama ? k.user.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{k.user?.nama || '-'}</span>
                      <span className="text-xs text-gray-500">{k.createdAt ? new Date(k.createdAt).toLocaleString() : '-'}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">{k.isi || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 