import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function useKelasDetail(kelasId) {
  const [kelas, setKelas] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nilai, setNilai] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [kelasRes, tugasRes, nilaiRes, hadirRes, pengumumanRes, komentarRes] = await Promise.all([
          fetchWithAuth(`/api/kelas/${kelasId}`),
          fetchWithAuth(`/api/tugas?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/submissions?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/kehadiran?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/kelas/${kelasId}/announcements`),
          fetchWithAuth(`/api/kelas/${kelasId}/comments`),
        ]);
        setKelas(kelasRes.ok ? await kelasRes.json() : null);
        setTasks(tugasRes.ok ? await tugasRes.json() : []);
        setNilai(nilaiRes.ok ? await nilaiRes.json() : []);
        setAttendance(hadirRes.ok ? await hadirRes.json() : []);
        setAnnouncements(pengumumanRes.ok ? await pengumumanRes.json() : []);
        setComments(komentarRes.ok ? await komentarRes.json() : []);
      } catch (e) {
        setKelas(null);
        setTasks([]);
        setNilai([]);
        setAttendance([]);
        setAnnouncements([]);
        setComments([]);
      }
      setLoading(false);
    }
    if (kelasId) fetchAll();
  }, [kelasId]);

  return { kelas, tasks, nilai, attendance, announcements, comments, loading };
} 