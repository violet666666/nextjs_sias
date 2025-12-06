"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { exportGradesPDF, downloadPDF } from "@/lib/pdfExporter";
import Toast from "@/components/common/Toast";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { BookOpen, ChevronDown, ChevronUp, Users, Award, FileText, Edit, CheckCircle, Plus } from 'lucide-react';
import AddGradeView from '@/components/grades/AddGradeView';

export default function GradesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nilai, setNilai] = useState([]);
  const [guruGradesData, setGuruGradesData] = useState([]); // Data terstruktur untuk guru
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedKelas, setExpandedKelas] = useState({}); // Map: subjectId_kelasId -> boolean
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ nilai: '', feedback: '' });
  const [grading, setGrading] = useState(false);
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'add-grade'
  const [selectedKelasForAdd, setSelectedKelasForAdd] = useState(null);
  const [selectedSubjectForAdd, setSelectedSubjectForAdd] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);
    fetchGrades(u);
  }, [router]);

  const fetchGrades = async (currentUser) => {
    setLoading(true);
    setError('');
    try {
      if (currentUser.role === 'guru') {
        // Untuk guru, gunakan endpoint khusus yang terstruktur
        const res = await fetchWithAuth('/api/grades/guru');
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setGuruGradesData(Array.isArray(data) ? data : []);
        setNilai([]); // Kosongkan nilai untuk guru
      } else {
        // Admin dan Siswa menggunakan endpoint biasa
        const endpoint = currentUser.role === 'admin' 
          ? '/api/grades/all' 
          : `/api/grades/student/${currentUser.id || currentUser._id}`;
          
        const res = await fetchWithAuth(endpoint);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setNilai(Array.isArray(data) ? data : []);
        setGuruGradesData([]); // Kosongkan data guru
      }
    } catch (e) {
      setError('Gagal memuat data nilai.');
      setNilai([]);
      setGuruGradesData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!nilai || nilai.length === 0) {
      setToast({ message: "Tidak ada data nilai untuk diekspor", type: "error" });
      return;
    }
    
    setExporting(true);
    try {
      // Transform data for PDF export - handle both student and admin/guru views
      const gradesData = nilai.map(submission => ({
        siswa: { 
          nama: submission.siswa_id?.nama || user.nama || 'Unknown',
          nis: submission.siswa_id?.nis || '-'
        },
        tugas: submission.tugas_id?.judul || 'Unknown Task',
        kelas: submission.tugas_id?.kelas_id?.nama_kelas || submission.kelas_id?.nama_kelas || '-',
        nilai: submission.nilai,
        feedback: submission.feedback,
        submitted_at: submission.tanggal_kumpul
      }));
      
      const doc = await exportGradesPDF(
        gradesData,
        user.role === 'siswa' ? 'Laporan Nilai Pribadi' : 'Laporan Nilai Tugas',
        user.role === 'siswa' ? 'Semua Tugas' : 'Semua Siswa'
      );
      
      const filename = `laporan-nilai-${user.role === 'siswa' ? user.nama : 'semua'}-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(doc, filename);
      
      setToast({ message: "PDF berhasil diunduh!", type: "success" });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: "Gagal mengekspor PDF: " + error.message, type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!nilai || nilai.length === 0) {
      setToast({ message: "Tidak ada data nilai untuk diekspor", type: "error" });
      return;
    }
    
    setExportingExcel(true);
    try {
      // Build query params based on user role
      const params = new URLSearchParams();
      if (user.role === 'siswa') {
        params.append('siswa_id', user.id || user._id);
      } else if (user.role === 'guru') {
        // Guru can export their class grades
      }
      // Admin can export all
      
      const res = await fetchWithAuth(`/api/rekap/nilai/export?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengekspor Excel');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap_nilai_${user?.role === 'siswa' ? user.nama : 'semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Excel berhasil diunduh!', type: 'success' });
    } catch (error) {
      console.error('Excel export error:', error);
      setToast({ message: 'Gagal mengekspor Excel: ' + error.message, type: 'error' });
    } finally {
      setExportingExcel(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  const toggleKelas = (subjectId, kelasId) => {
    const key = `${subjectId}_${kelasId}`;
    setExpandedKelas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const openGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      nilai: submission.nilai || '',
      feedback: submission.feedback || ''
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const nilai = parseFloat(gradeForm.nilai);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      setToast({ message: "Nilai harus antara 0-100", type: "error" });
      return;
    }

    setGrading(true);
    try {
      const res = await fetchWithAuth(`/api/submissions/${selectedSubmission._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nilai: nilai,
          feedback: gradeForm.feedback || ''
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Gagal memperbarui nilai');
      }

      setToast({ message: "Nilai berhasil diperbarui", type: "success" });
      setShowGradeModal(false);
      setSelectedSubmission(null);
      setGradeForm({ nilai: '', feedback: '' });
      
      // Refresh data
      if (user) {
        await fetchGrades(user);
      }
    } catch (error) {
      setToast({ message: error.message || "Gagal memperbarui nilai", type: "error" });
    } finally {
      setGrading(false);
    }
  };

  const openAddGradeView = (subject, kelas) => {
    setSelectedSubjectForAdd(subject);
    setSelectedKelasForAdd(kelas);
    setCurrentView('add-grade');
  };

  const closeAddGradeView = () => {
    setCurrentView('list');
    setSelectedKelasForAdd(null);
    setSelectedSubjectForAdd(null);
  };

  const handleGradeAdded = async () => {
    // Refresh data setelah nilai ditambahkan
    if (user) {
      await fetchGrades(user);
    }
    setToast({ message: "Nilai berhasil ditambahkan", type: "success" });
  };


  // Render view khusus untuk guru
  const renderGuruView = () => {
    if (guruGradesData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Belum ada data nilai</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {guruGradesData.map((subject) => (
          <div key={subject.subject_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Subject Header */}
            <button
              onClick={() => toggleSubject(subject.subject_id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {subject.subject_nama}
                  </h3>
                  {subject.subject_kode && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{subject.subject_kode}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {subject.kelas.length} kelas
                </span>
                {expandedSubject === subject.subject_id ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Kelas List */}
            {expandedSubject === subject.subject_id && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {subject.kelas.length === 0 ? (
                  <div className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Belum ada kelas
                  </div>
                ) : (
                  subject.kelas.map((kelas) => {
                    const kelasKey = `${subject.subject_id}_${kelas.kelas_id}`;
                    const isKelasExpanded = expandedKelas[kelasKey];
                    
                    return (
                      <div key={kelas.kelas_id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                        {/* Kelas Header */}
                        <div className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                          <button
                            onClick={() => toggleKelas(subject.subject_id, kelas.kelas_id)}
                            className="flex-1 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg px-2 py-1"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                              <div className="text-left">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {kelas.kelas_nama}
                                </span>
                                {kelas.kelas_tahun && (
                                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                    ({kelas.kelas_tahun})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {kelas.nilai.length} nilai
                              </span>
                              {isKelasExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => openAddGradeView(subject, kelas)}
                            className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                            title="Tambah Nilai"
                          >
                            <Plus className="w-3 h-3" />
                            Tambah Nilai
                          </button>
                        </div>

                        {/* Nilai Table */}
                        {isKelasExpanded && (
                          <div className="px-6 py-4">
                            {kelas.nilai.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                Belum ada nilai untuk kelas ini
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full">
                                  <thead className="bg-gray-100 dark:bg-gray-900">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Siswa</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tugas</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Nilai</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Feedback</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tanggal Kumpul</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {kelas.nilai.map((n) => (
                                      <tr key={n._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {n.siswa_id?.nama || '-'}
                                          {n.siswa_id?.nis && (
                                            <span className="ml-2 text-xs text-gray-500">({n.siswa_id.nis})</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {n.tugas_id?.judul || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                          {n.is_graded ? (
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              n.nilai >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                              n.nilai >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                              n.nilai >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                              {n.nilai}
                                            </span>
                                          ) : (
                                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                              Belum dinilai
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                          {n.feedback || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                          {n.tanggal_kumpul ? new Date(n.tanggal_kumpul).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                          <button
                                            onClick={() => openGradeModal(n)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                          >
                                            {n.is_graded ? (
                                              <>
                                                <Edit className="w-3 h-3" />
                                                Edit
                                              </>
                                            ) : (
                                              <>
                                                <Award className="w-3 h-3" />
                                                Beri Nilai
                                              </>
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  // Render view untuk admin dan siswa
  const renderDefaultView = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {(user?.role === 'admin' || user?.role === 'guru') && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Siswa</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Tugas</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Nilai</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Feedback</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Tanggal Kumpul</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {nilai.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' || user?.role === 'guru' ? 5 : 4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Belum ada data nilai
                  </td>
                </tr>
              ) : (
                nilai.map((n) => (
                  <tr key={n._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    {(user?.role === 'admin' || user?.role === 'guru') && (
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {n.siswa_id?.nama || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {n.tugas_id?.judul || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        n.nilai >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        n.nilai >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        n.nilai >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {n.nilai ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100">
                      {n.feedback || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {n.tanggal_kumpul ? new Date(n.tanggal_kumpul).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <ProtectedRoute requiredRoles={['admin','guru','siswa','orangtua']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {currentView === 'add-grade' ? 'Tambah Nilai' : 'Daftar Nilai Tugas'}
            </h1>
            {currentView === 'list' && user?.role !== 'guru' && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting || nilai.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting ? "Mengekspor..." : "Export PDF"}
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exportingExcel || nilai.length === 0}
                  className="ml-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-2 4h6m0 0l-2-2m2 2l-2 2" />
                  </svg>
                  {exportingExcel ? "Mengekspor..." : "Export Excel"}
                </button>
              </>
            )}
          </div>
          
          {currentView === 'list' ? (
            user?.role === 'guru' ? renderGuruView() : renderDefaultView()
          ) : (
            <AddGradeView
              subject={selectedSubjectForAdd}
              kelas={selectedKelasForAdd}
              onClose={closeAddGradeView}
              onSuccess={handleGradeAdded}
            />
          )}
        </div>

        {/* Grade Modal */}
        {showGradeModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedSubmission.is_graded ? 'Edit Nilai' : 'Beri Nilai'}
                </h3>
                <button
                  onClick={() => {
                    setShowGradeModal(false);
                    setSelectedSubmission(null);
                    setGradeForm({ nilai: '', feedback: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Siswa:</span> {selectedSubmission.siswa_id?.nama || '-'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Tugas:</span> {selectedSubmission.tugas_id?.judul || '-'}
                </p>
                {selectedSubmission.file_path && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="font-medium">File:</span>{' '}
                    <a 
                      href={selectedSubmission.file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Lihat Submission
                    </a>
                  </p>
                )}
              </div>

              <form onSubmit={handleGradeSubmission} className="space-y-4">
                <div>
                  <label htmlFor="nilai" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nilai (0-100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="nilai"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={gradeForm.nilai}
                    onChange={(e) => setGradeForm({ ...gradeForm, nilai: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Masukkan nilai (0-100)"
                  />
                </div>

                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Feedback
                  </label>
                  <textarea
                    id="feedback"
                    rows="4"
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Masukkan feedback untuk siswa (opsional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGradeModal(false);
                      setSelectedSubmission(null);
                      setGradeForm({ nilai: '', feedback: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={grading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={grading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {grading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Simpan Nilai
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
} 