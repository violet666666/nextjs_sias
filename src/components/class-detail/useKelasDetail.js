import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export default function useKelasDetail(kelasId, refreshKey = 0) {
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
        const [kelasRes, tugasRes, nilaiRes, hadirRes, komentarRes] = await Promise.all([
          fetchWithAuth(`/api/kelas/${kelasId}`),
          fetchWithAuth(`/api/tugas?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/submissions?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/kehadiran?kelas_id=${kelasId}`),
          fetchWithAuth(`/api/kelas/${kelasId}/comments`),
        ]);
        
        // Handle kelas response
        if (kelasRes.ok) {
          const kelasData = await kelasRes.json();
          setKelas(kelasData);
          // Ambil pengumuman dari kelas (selalu ada di response kelas)
          if (kelasData.pengumuman && Array.isArray(kelasData.pengumuman)) {
            // Sort pengumuman berdasarkan createdAt (terbaru dulu)
            const sortedAnnouncements = [...kelasData.pengumuman].sort((a, b) => 
              new Date(b.tanggal || b.createdAt || 0) - new Date(a.tanggal || a.createdAt || 0)
            );
            setAnnouncements(sortedAnnouncements);
          } else {
            setAnnouncements([]);
          }
        } else {
          // Coba ambil error message dari response
          let errorData;
          try {
            errorData = await kelasRes.json();
          } catch {
            errorData = { error: `Gagal mengambil data kelas (${kelasRes.status})` };
          }
          console.error('Error fetching kelas:', errorData);
          // Set kelas ke null hanya jika benar-benar error, bukan jika hanya 403/404
          if (kelasRes.status === 404 || kelasRes.status === 403) {
            setKelas(null);
          } else {
            // Untuk error lain, tetap set null tapi log error
            setKelas(null);
          }
          setAnnouncements([]);
        }
        
        // Handle other responses
        setTasks(tugasRes.ok ? await tugasRes.json() : []);
        setNilai(nilaiRes.ok ? await nilaiRes.json() : []);
        setAttendance(hadirRes.ok ? await hadirRes.json() : []);
        setComments(komentarRes.ok ? await komentarRes.json() : []);
      } catch (e) {
        console.error('Error in fetchAll:', e);
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
  }, [kelasId, refreshKey]);

  return { kelas, tasks, nilai, attendance, announcements, comments, loading };
} 