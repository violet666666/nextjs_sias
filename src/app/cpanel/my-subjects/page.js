"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Toast from "@/components/common/Toast";
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ResponsiveTable from '@/components/common/ResponsiveTable';

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [classesMap, setClassesMap] = useState({}); // Map subject_id -> classes[]
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [expandedSubject, setExpandedSubject] = useState(null); // Track expanded subject

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);
    
    if (u.role !== "guru") {
      setToast({ message: "Hanya untuk guru", type: "error" });
      return;
    }
    
    fetchSubjects(u);
  }, []);

  const fetchSubjects = async (currentUser) => {
    setLoading(true);
    try {
      const guruId = currentUser._id || currentUser.id;
      
      // Fetch mata pelajaran yang diajar oleh guru ini
      const subjectsRes = await fetchWithAuth(`/api/subjects?guru_id=${guruId}`);
      if (!subjectsRes.ok) throw new Error("Gagal mengambil data mata pelajaran");
      
      const subjectsData = await subjectsRes.json();
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
      // Fetch kelas untuk setiap mata pelajaran
      const classesPromises = subjectsData.map(async (subject) => {
        if (subject.kelas_id) {
          try {
            const kelasRes = await fetchWithAuth(`/api/kelas?id=${subject.kelas_id}`);
            if (kelasRes.ok) {
              const kelasData = await kelasRes.json();
              return {
                subjectId: subject._id,
                kelas: Array.isArray(kelasData) ? kelasData[0] : kelasData
              };
            }
          } catch (err) {
            console.error(`Error fetching kelas for subject ${subject._id}:`, err);
          }
        }
        return { subjectId: subject._id, kelas: null };
      });
      
      const classesResults = await Promise.all(classesPromises);
      const newClassesMap = {};
      classesResults.forEach(({ subjectId, kelas }) => {
        if (kelas) {
          if (!newClassesMap[subjectId]) {
            newClassesMap[subjectId] = [];
          }
          newClassesMap[subjectId].push(kelas);
        }
      });
      setClassesMap(newClassesMap);
      
    } catch (err) {
      setToast({ message: err.message || "Gagal memuat data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (subjectId) => {
    setExpandedSubject(expandedSubject === subjectId ? null : subjectId);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ProtectedRoute requiredRoles={['guru']}>
      <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
                Mata Pelajaran Saya
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Lihat mata pelajaran yang Anda ajar dan kelas-kelasnya
              </p>
            </div>
          </div>

          {toast.message && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast({ message: "", type: "success" })} 
            />
          )}

          {subjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Belum ada mata pelajaran</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Anda belum mengajar mata pelajaran apapun.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjects.map((subject) => {
                const classes = classesMap[subject._id] || [];
                const isExpanded = expandedSubject === subject._id;
                
                return (
                  <div
                    key={subject._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
                  >
                    {/* Subject Header */}
                    <div
                      className="p-6 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => toggleExpand(subject._id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                              {subject.nama}
                            </h3>
                            {subject.kode && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Kode: {subject.kode}
                              </p>
                            )}
                            {subject.deskripsi && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {subject.deskripsi}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {classes.length}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {classes.length === 1 ? 'Kelas' : 'Kelas'}
                          </div>
                        </div>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Classes List */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        {classes.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <p>Mata pelajaran ini belum ditugaskan ke kelas manapun.</p>
                          </div>
                        ) : (
                          <div className="p-6">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                              Kelas yang Mengikuti Mata Pelajaran Ini
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {classes.map((kelas) => (
                                <Link
                                  key={kelas._id}
                                  href={`/cpanel/classes/${kelas._id}`}
                                  className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                        {kelas.nama_kelas}
                                      </h5>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Tahun Ajaran: {kelas.tahun_ajaran || '-'}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Wali Kelas: {kelas.guru_id?.nama || '-'}
                                      </p>
                                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                                        kelas.status_kelas === 'aktif'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                      }`}>
                                        {kelas.status_kelas === 'aktif' ? 'Aktif' : 'Nonaktif'}
                                      </span>
                                    </div>
                                    <svg
                                      className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

