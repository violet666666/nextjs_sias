import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function useKelasEnrollments(kelasId, refreshKey = 0) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      if (!kelasId) {
        setStudents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/kelas/${kelasId}/students`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal mengambil data siswa');
        }
        const studentsData = await res.json();
        setStudents(studentsData);
      } catch (err) {
        setError(err.message);
        setStudents([]);
      }
      setLoading(false);
    }
    
    fetchStudents();
  }, [kelasId, refreshKey]);

  return { students, loading, error };
} 