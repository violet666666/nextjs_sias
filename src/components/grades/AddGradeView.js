"use client";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ArrowLeft } from "lucide-react";
import GradeComponentManager from "./GradeComponentManager";
import GradeInputTable from "./GradeInputTable";

export default function AddGradeView({ subject, kelas, onClose, onSuccess }) {
  const [studentsList, setStudentsList] = useState([]);
  const [components, setComponents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [savingComponents, setSavingComponents] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [subject, kelas]);

  const loadData = async () => {
    if (!kelas || !subject) return;

    setLoadingStudents(true);
    setLoadingComponents(true);
    setStudentsList([]);
    setComponents([]);

    try {
      const kelasId = kelas.kelas_id || kelas._id || kelas.id;
      const subjectId = subject.subject_id || subject._id || subject.id;

      if (!kelasId || !subjectId) {
        throw new Error('ID kelas atau mata pelajaran tidak ditemukan');
      }

      // Fetch students in class
      const studentsRes = await fetchWithAuth(`/api/kelas/${kelasId}/students`);
      if (!studentsRes.ok) {
        const errorData = await studentsRes.json().catch(() => ({ error: 'Gagal mengambil data siswa' }));
        throw new Error(errorData.error || `Gagal mengambil data siswa (${studentsRes.status})`);
      }
      const students = await studentsRes.json();
      setStudentsList(Array.isArray(students) ? students : []);

      // Fetch grade components
      const componentsRes = await fetchWithAuth(`/api/grades/components?mapel_id=${subjectId}&kelas_id=${kelasId}`);
      if (componentsRes.ok) {
        const data = await componentsRes.json();
        setComponents(Array.isArray(data.components) ? data.components : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Gagal memuat data');
    } finally {
      setLoadingStudents(false);
      setLoadingComponents(false);
    }
  };

  const handleSaveComponents = async () => {
    if (components.length === 0) {
      setError('Minimal harus ada satu komponen nilai');
      return;
    }

    const totalPercentage = components.reduce((sum, comp) => sum + parseFloat(comp.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      setError(`Total persentase harus 100%. Saat ini: ${totalPercentage.toFixed(1)}%`);
      return;
    }

    setSavingComponents(true);
    setError("");

    try {
      const kelasId = kelas.kelas_id || kelas._id || kelas.id;
      const subjectId = subject.subject_id || subject._id || subject.id;

      const res = await fetchWithAuth('/api/grades/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapel_id: subjectId,
          kelas_id: kelasId,
          components: components
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menyimpan komponen nilai');
      }

      setError("");
    } catch (error) {
      console.error('Error saving components:', error);
      setError(error.message || 'Gagal menyimpan komponen nilai');
    } finally {
      setSavingComponents(false);
    }
  };

  const handleSaveGrades = async (gradesData) => {
    if (gradesData.length === 0) {
      setError('Tidak ada nilai yang akan disimpan');
      return;
    }

    setSavingGrades(true);
    setError("");

    try {
      const kelasId = kelas.kelas_id || kelas._id || kelas.id;
      const subjectId = subject.subject_id || subject._id || subject.id;

      const res = await fetchWithAuth('/api/grades/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapel_id: subjectId,
          kelas_id: kelasId,
          grades: gradesData,
          semester: 'ganjil', // Bisa diambil dari input jika diperlukan
          tahun_ajaran: new Date().getFullYear().toString()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal menyimpan nilai');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving grades:', error);
      setError(error.message || 'Gagal menyimpan nilai');
    } finally {
      setSavingGrades(false);
    }
  };

  if (!subject || !kelas) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Nilai
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tambah Nilai
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {subject.subject_nama} - {kelas.kelas_nama}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {loadingStudents ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Grade Component Manager */}
          <GradeComponentManager
            components={components}
            onComponentsChange={(newComponents) => {
              setComponents(newComponents);
              setError("");
            }}
          />

          {/* Save Components Button */}
          {components.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleSaveComponents}
                disabled={savingComponents}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingComponents ? 'Menyimpan...' : 'Simpan Komponen Nilai'}
              </button>
            </div>
          )}

          {/* Grade Input Table - Only show if components are saved and total is 100% */}
          {components.length > 0 && 
           Math.abs(components.reduce((sum, comp) => sum + parseFloat(comp.percentage || 0), 0) - 100) < 0.01 && (
            <GradeInputTable
              students={studentsList}
              components={components}
              mapelId={subject.subject_id || subject._id || subject.id}
              kelasId={kelas.kelas_id || kelas._id || kelas.id}
              onSave={handleSaveGrades}
              saving={savingGrades}
            />
          )}
        </>
      )}
    </div>
  );
}
