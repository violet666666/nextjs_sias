"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [kelasSiswa, setKelasSiswa] = useState([]);
  const [tugasSiswa, setTugasSiswa] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [fileToSubmit, setFileToSubmit] = useState(null);
  const [linkToSubmit, setLinkToSubmit] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    // Allow admin to view tasks page, but redirect to task-management for better view
    if (u.role === "admin" || u.role === "guru") {
      router.push("/cpanel/task-management");
      return;
    }
    if (u.role !== "siswa") {
      router.push("/cpanel/dashboard");
      return;
    }
    fetchData(u.id || u._id);
  }, [router]);

  async function fetchData(siswaId) {
    setLoading(true);
    setError("");
    try {
      // Ambil kelas yang memiliki siswa ini di siswa_ids
      const kelasSiswaRes = await fetchWithAuth(`/api/kelas?siswa_id=${siswaId}`);
      if (!kelasSiswaRes.ok) throw new Error("Gagal mengambil data kelas");
      const kelasList = await kelasSiswaRes.json();
      const kelasIds = Array.isArray(kelasList) ? kelasList.map(k => k._id) : [];
      
      // Set kelas siswa langsung dari hasil query
      setKelasSiswa(Array.isArray(kelasList) ? kelasList : []);
      
      // Fetch tugas dan submissions
      const [tugasRes, submissionsRes] = await Promise.all([
        fetchWithAuth(`/api/tugas`),
        fetchWithAuth(`/api/submissions?siswa_id=${siswaId}`)
      ]);
      
      if (!tugasRes.ok) throw new Error("Gagal mengambil data tugas");
      const semuaTugas = await tugasRes.json();
      setTugasSiswa(Array.isArray(semuaTugas) ? semuaTugas.filter(t => kelasIds.includes(t.kelas_id?._id || t.kelas_id)) : []);
      
      if (!submissionsRes.ok) throw new Error("Gagal mengambil data submission");
      setSubmissions(await submissionsRes.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isSubmitted = (tugasId) => submissions.some((s) => (s.tugas_id?._id || s.tugas_id) === tugasId);
  const getSubmissionDetails = (tugasId) => submissions.find((s) => (s.tugas_id?._id || s.tugas_id) === tugasId);

  const handleOpenSubmitModal = (tugas) => {
    setSelectedTugas(tugas);
    setFileToSubmit(null);
    setLinkToSubmit("");
    setSubmitError("");
    setShowSubmitModal(true);
  };

  const handleSubmitTugas = async (e) => {
    e.preventDefault();
    if (!selectedTugas) return;
    setSubmitLoading(true);
    setSubmitError("");
    let filePath = linkToSubmit;
    if (fileToSubmit) filePath = fileToSubmit.name; // Simulasi
    if (!filePath) {
      setSubmitError("File atau link wajib diisi.");
      setSubmitLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth("/api/submissions", {
        method: "POST",
        body: JSON.stringify({
          tugas_id: selectedTugas._id,
          siswa_id: user.id,
          tanggal_kumpul: new Date(),
          file_path: filePath,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengumpulkan tugas");
      }
      // Refresh submissions
      const newSubmissions = await fetchWithAuth(`/api/submissions?siswa_id=${user.id}`).then(r => r.json());
      setSubmissions(newSubmissions);
      setShowSubmitModal(false);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Daftar Tugas Saya</h1>
        <div className="space-y-4">
          {tugasSiswa.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">Tidak ada tugas saat ini.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tugasSiswa.map(t => {
                const submission = getSubmissionDetails(t._id);
                const isOverdue = new Date(t.tanggal_deadline) < new Date();
                return (
                  <div key={t._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{t.judul}</h4>
                      <span className="text-sm px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {t.kelas_id?.nama_kelas}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="font-medium">Deadline:</span> {new Date(t.tanggal_deadline).toLocaleString('id-ID')}
                    </p>
                    {t.deskripsi && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">{t.deskripsi}</p>
                    )}
                    {submission ? (
                      <div className="flex items-center justify-between">
                        <div className="text-green-600 dark:text-green-400 font-medium">
                          ✓ Sudah dikumpulkan
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">Nilai</div>
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {submission.nilai ?? '-'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {isOverdue ? '⚠ Terlambat' : '⏰ Belum dikumpulkan'}
                        </div>
                        <button 
                          onClick={() => handleOpenSubmitModal(t)} 
                          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          Kumpulkan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {showSubmitModal && selectedTugas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmitTugas} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Kumpulkan Tugas</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedTugas.judul}</p>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {submitError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <input 
                  type="file" 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                  onChange={e => setFileToSubmit(e.target.files[0])} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Atau Link (Google Drive, dll)
                </label>
                <input 
                  type="text" 
                  placeholder="https://drive.google.com/..." 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200" 
                  value={linkToSubmit} 
                  onChange={e => setLinkToSubmit(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setShowSubmitModal(false)} 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200" 
                disabled={submitLoading}
              >
                {submitLoading ? 'Mengirim...' : 'Kumpulkan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 