"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Impor useRouter
import Toast from "@/components/common/Toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth"; // Impor helper
import ResponsiveTable from '@/components/common/ResponsiveTable';

const getStatusBadge = (status) => {
  const badges = {
    open: "bg-green-100 text-green-800", // Mengganti 'ongoing' dengan 'open'
    closed: "bg-gray-100 text-gray-800", // Mengganti 'finished' dengan 'closed'
    // upcoming: "bg-blue-100 text-blue-800", // 'upcoming' tidak ada di model AttendanceSession
  };
  const statusText = {
    open: "Terbuka",
    closed: "Tertutup",
  };
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || "bg-yellow-100 text-yellow-800"}`}
    >
      {statusText[status] || status}
    </span>
  );
};

export default function GuruAttendanceView({ user, setToast }) {
  const router = useRouter(); // Inisialisasi router
  const [guruKelasList, setGuruKelasList] = useState([]);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [startSessionForm, setStartSessionForm] = useState({
    kelas_id: "",
    judul_pertemuan: "",
    deskripsi_pertemuan: "",
    durasi_menit: 15,
  });
  const [guruSessions, setGuruSessions] = useState([]);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // State untuk filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'open', 'closed'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterBtnRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const [mapelList, setMapelList] = useState([]);
  const [selectedMapel, setSelectedMapel] = useState("");

  const fetchGuruData = useCallback(async () => {
    if (!user || (user.role !== "guru" && user.role !== "admin")) return;
    setLoadingData(true);
    try {
      let kelasRes, sessionsRes;
      if (user.role === "admin") {
        kelasRes = await fetchWithAuth(`/api/kelas`);
        sessionsRes = await fetchWithAuth(`/api/attendance-sessions`);
      } else {
        kelasRes = await fetchWithAuth(`/api/kelas?guru_id=${user.id}`);
        sessionsRes = await fetchWithAuth(`/api/attendance-sessions?guru_id=${user.id}`);
      }
      if (!kelasRes.ok) throw new Error(`Gagal mengambil data kelas: ${kelasRes.statusText}`);
      if (!sessionsRes.ok) throw new Error(`Gagal mengambil data sesi: ${sessionsRes.statusText}`);
      const kelasData = await kelasRes.json();
      const sessionsData = await sessionsRes.json();
      setGuruKelasList(kelasData);
      setGuruSessions(sessionsData);
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setLoadingData(false);
    }
  }, [user, setToast]);

  useEffect(() => {
    fetchGuruData();
  }, [fetchGuruData]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (showFilterDropdown && filterDropdownRef.current && !filterDropdownRef.current.contains(event.target) && !filterBtnRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  // Fetch mapel ketika kelas dipilih di modal
  useEffect(() => {
    async function fetchMapel() {
      if (!startSessionForm.kelas_id) {
        setMapelList([]);
        setSelectedMapel("");
        return;
      }
      try {
        // Ambil daftar mapel di kelas yang diajar guru (admin sees all)
        let url = `/api/subjects?kelas_id=${startSessionForm.kelas_id}`;
        if (user.role !== 'admin') {
          url += `&guru_id=${user.id}`;
        }
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error("Gagal mengambil data mapel");
        const data = await res.json();
        setMapelList(Array.isArray(data) ? data : []);
        setSelectedMapel("");
      } catch {
        setMapelList([]);
        setSelectedMapel("");
      }
    }
    if (showStartSessionModal && startSessionForm.kelas_id) fetchMapel();
  }, [showStartSessionModal, startSessionForm.kelas_id, user.id]);

  const handleStartSessionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSession(true);
    try {
      if (!startSessionForm.kelas_id) throw new Error("Kelas wajib dipilih");
      if (!selectedMapel) throw new Error("Mata pelajaran wajib dipilih");
      const res = await fetchWithAuth("/api/attendance-sessions", {
        method: "POST",
        body: JSON.stringify({ ...startSessionForm, mapel_id: selectedMapel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memulai sesi");
      setToast({ message: "Sesi absensi berhasil dimulai!", type: "success" });
      setShowStartSessionModal(false);
      setStartSessionForm({ kelas_id: "", judul_pertemuan: "", deskripsi_pertemuan: "", durasi_menit: 15 });
      setSelectedMapel("");
      fetchGuruData();
    } catch (error) {
      setToast({ message: error.message, type: "error" });
    } finally {
      setIsSubmittingSession(false);
    }
  };

  const filteredGuruSessions = guruSessions.filter(s =>
    (s.kelas_id?.nama_kelas.toLowerCase().includes(searchTerm.toLowerCase()) || s.judul_pertemuan.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' || s.status === statusFilter)
  );

  if (loadingData) return <div className="text-center py-10 text-gray-600 dark:text-gray-400">Memuat data guru...</div>;

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="mb-6 flex justify-between items-center">
        <div className="text-xl font-bold">Sesi Absensi Saya</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStartSessionModal(true)}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Mulai Sesi Absensi
          </button>
          {/* Tombol Filter bisa ditambahkan di sini jika diperlukan */}
        </div>
      </div>

      {/* Filter UI */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Cari nama kelas atau judul..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        >
          <option value="all">Semua Status</option>
          <option value="open">Terbuka</option>
          <option value="closed">Tertutup</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
        <ResponsiveTable>
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Kelas</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Mata Pelajaran</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Judul Pertemuan</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Waktu Mulai</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Waktu Selesai</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredGuruSessions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Tidak ada sesi ditemukan.
                </td>
              </tr>
            )}
            {filteredGuruSessions.map((session) => (
              <tr
                key={session._id}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                onClick={() => router.push(`/cpanel/attendance-sessions/${session._id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {session.kelas_id?.nama_kelas || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {session.mapel_id?.nama_mapel || session.mapel_id?.nama || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{session.judul_pertemuan}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{new Date(session.waktu_mulai).toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{new Date(session.waktu_selesai).toLocaleString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {getStatusBadge(session.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </ResponsiveTable>
      </div>

      {showStartSessionModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-black shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Mulai Sesi Absensi</h3>
              <button onClick={() => setShowStartSessionModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleStartSessionSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Kelas</label>
                <select
                  className="w-full border rounded p-2"
                  value={startSessionForm.kelas_id}
                  onChange={e => setStartSessionForm(f => ({ ...f, kelas_id: e.target.value }))}
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {guruKelasList.map(k => (
                    <option key={k._id} value={k._id}>{k.nama_kelas}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Mata Pelajaran</label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedMapel}
                  onChange={e => setSelectedMapel(e.target.value)}
                  required
                  disabled={!startSessionForm.kelas_id || mapelList.length === 0}
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mapelList.map(m => (
                    <option key={m._id} value={m._id}>{m.nama_mapel || m.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Judul Pertemuan</label>
                <input
                  className="w-full border rounded p-2"
                  value={startSessionForm.judul_pertemuan}
                  onChange={e => setStartSessionForm(f => ({ ...f, judul_pertemuan: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Deskripsi Pertemuan</label>
                <textarea
                  className="w-full border rounded p-2"
                  value={startSessionForm.deskripsi_pertemuan}
                  onChange={e => setStartSessionForm(f => ({ ...f, deskripsi_pertemuan: e.target.value }))}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Durasi (menit)</label>
                <input
                  type="number"
                  min={5}
                  className="w-full border rounded p-2"
                  value={startSessionForm.durasi_menit}
                  onChange={e => setStartSessionForm(f => ({ ...f, durasi_menit: Number(e.target.value) }))}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowStartSessionModal(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" disabled={isSubmittingSession}>Batal</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" disabled={isSubmittingSession}>{isSubmittingSession ? 'Menyimpan...' : 'Mulai Sesi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}