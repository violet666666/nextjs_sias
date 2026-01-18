import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function useKelasEnrollments(kelasId, refreshKey = 0) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!kelasId) {
        setStudents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`/api/enrollments?kelas_id=${kelasId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal mengambil data siswa');
        }
        const enrollments = await res.json();
        setStudents(enrollments.map(e => ({ ...e.siswa_id, enrollmentId: e._id })));
      } catch (err) {
        setError(err.message);
        setStudents([]);
      }
      setLoading(false);
    }
    
    fetchEnrollments();
  }, [kelasId, refreshKey]);

  return { students, loading, error };
} 