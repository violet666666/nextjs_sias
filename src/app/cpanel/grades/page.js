"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { exportGradesPDF, downloadPDF } from "@/lib/pdfExporter";
import Toast from "@/components/common/Toast";
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function GradesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nilai, setNilai] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

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
      // Admin and Guru see all grades, Siswa sees their own
      const endpoint = currentUser.role === 'admin' || currentUser.role === 'guru' 
        ? '/api/grades/all' 
        : `/api/grades/student/${currentUser.id || currentUser._id}`;
        
      const res = await fetchWithAuth(endpoint);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNilai(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat data nilai.');
      setNilai([]);
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
      // Transform data for PDF export
      const gradesData = nilai.map(submission => ({
        siswa: { nama: user.nama },
        nilai: submission.nilai,
        feedback: submission.feedback,
        submitted_at: submission.tanggal_kumpul
      }));
      
      const doc = await exportGradesPDF(
        gradesData,
        'Laporan Nilai Pribadi',
        'Semua Tugas'
      );
      
      const filename = `laporan-nilai-${user.nama}-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(doc, filename);
      
      setToast({ message: "PDF berhasil diunduh!", type: "success" });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: "Gagal mengekspor PDF", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const res = await fetchWithAuth('/api/rekap/nilai/export');
      if (!res.ok) throw new Error('Gagal mengekspor Excel');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap_nilai_${user?.nama || 'siswa'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast({ message: 'Excel berhasil diunduh!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Gagal mengekspor Excel', type: 'error' });
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <ProtectedRoute requiredRoles={['admin','guru','siswa','orangtua']}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "" })} />
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Daftar Nilai Tugas</h1>
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
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Tugas</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Nilai</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Feedback</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">Tanggal Kumpul</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {nilai.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Belum ada data nilai
                      </td>
                    </tr>
                  ) : (
                    nilai.map((n) => (
                      <tr key={n._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
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
        </div>
      </div>
    </ProtectedRoute>
  );
} 