"use client";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function GradeInputTable({ students, components, mapelId, kelasId, onSave, saving }) {
  const [grades, setGrades] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    loadExistingGrades();
  }, [students, components, mapelId, kelasId]);

  const loadExistingGrades = async () => {
    if (!mapelId || !kelasId || components.length === 0) {
      initializeEmptyGrades();
      return;
    }

    setLoadingExisting(true);
    try {
      const res = await fetchWithAuth(`/api/grades/student-grades?mapel_id=${mapelId}&kelas_id=${kelasId}&semester=ganjil`);
      if (res.ok) {
        const existingGrades = await res.json();
        
        // Initialize grades object
        const initialGrades = {};
        students.forEach(student => {
          const studentId = student._id || student.id;
          initialGrades[studentId] = {};
          
          // Find existing grade for this student
          const existingGrade = existingGrades.find(g => 
            (g.siswa_id?._id || g.siswa_id)?.toString() === studentId.toString()
          );
          
          components.forEach(component => {
            if (existingGrade && existingGrade.components) {
              initialGrades[studentId][component.name] = existingGrade.components[component.name] || '';
            } else {
              initialGrades[studentId][component.name] = '';
            }
          });
        });
        setGrades(initialGrades);
      } else {
        initializeEmptyGrades();
      }
    } catch (error) {
      console.error('Error loading existing grades:', error);
      initializeEmptyGrades();
    } finally {
      setLoadingExisting(false);
    }
  };

  const initializeEmptyGrades = () => {
    const initialGrades = {};
    students.forEach(student => {
      const studentId = student._id || student.id;
      initialGrades[studentId] = {};
      components.forEach(component => {
        initialGrades[studentId][component.name] = '';
      });
    });
    setGrades(initialGrades);
    setHasChanges(false);
  };

  const handleGradeChange = (studentId, componentName, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [componentName]: value
      }
    }));
    setHasChanges(true);
  };

  const calculateTotal = (studentId) => {
    let total = 0;
    components.forEach(component => {
      const grade = parseFloat(grades[studentId]?.[component.name] || 0);
      if (!isNaN(grade)) {
        total += (grade * parseFloat(component.percentage)) / 100;
      }
    });
    return total.toFixed(2);
  };

  const handleSave = () => {
    // Transform data for API
    const gradesData = Object.keys(grades).map(studentId => {
      const studentGrades = {};
      components.forEach(component => {
        const value = grades[studentId][component.name];
        if (value !== '' && value !== null && value !== undefined) {
          studentGrades[component.name] = parseFloat(value);
        }
      });
      
      return {
        student_id: studentId,
        components: studentGrades,
        total: parseFloat(calculateTotal(studentId))
      };
    });

    onSave(gradesData);
    setHasChanges(false);
  };

  if (loadingExisting) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Memuat nilai yang sudah ada...</p>
      </div>
    );
  }

  if (components.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Buat komponen nilai terlebih dahulu untuk menampilkan tabel input nilai
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Tidak ada siswa di kelas ini
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Input Nilai Siswa
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Isi nilai untuk setiap komponen. Nilai akhir akan dihitung otomatis berdasarkan persentase.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                No
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase sticky left-12 bg-gray-50 dark:bg-gray-900 z-10 min-w-[200px]">
                Nama Siswa
              </th>
              {components.map((component, index) => (
                <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase min-w-[120px]">
                  <div>
                    <div className="font-semibold">{component.name}</div>
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({component.percentage}%)
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase min-w-[100px]">
                Nilai Akhir
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student, index) => {
              const studentId = student._id || student.id;
              return (
                <tr key={studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 sticky left-12 bg-white dark:bg-gray-800 z-10">
                    {student.nama}
                    {student.nis && (
                      <span className="ml-2 text-xs text-gray-500">({student.nis})</span>
                    )}
                  </td>
                  {components.map((component, compIndex) => (
                    <td key={compIndex} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={grades[studentId]?.[component.name] || ''}
                        onChange={(e) => handleGradeChange(studentId, component.name, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="0-100"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {calculateTotal(studentId)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Simpan Semua Nilai
            </>
          )}
        </button>
      </div>
    </div>
  );
}

