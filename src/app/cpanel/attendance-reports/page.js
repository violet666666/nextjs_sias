'use client';
import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
// import jsPDF, autoTable, ExcelJS jika sudah tersedia

export default function AttendanceReportsPage() {
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reports, setReports] = useState([]);

  // Fetch kelas
  const fetchKelas = async () => {
    try {
      const res = await fetchWithAuth('/api/kelas');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setKelasList(data);
    } catch (e) {
      setError('Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/kehadiran?';
      if (selectedKelas) url += `kelas_id=${selectedKelas}&`;
      if (dateRange.start) url += `start=${dateRange.start}&`;
      if (dateRange.end) url += `end=${dateRange.end}&`;
      const res = await fetchWithAuth(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log('Attendance API result:', data);
      // Mapping agar field sesuai kebutuhan DataTable
      const mapped = Array.isArray(data) ? data.map(item => ({
        nama_siswa: item.nama_siswa || item.siswa_id?.nama || '-',
        hadir: item.hadir ?? item.status_hadir ?? 0,
        izin: item.izin ?? item.status_izin ?? 0,
        sakit: item.sakit ?? item.status_sakit ?? 0,
        alpa: item.alpa ?? item.status_alpa ?? 0,
        persentase: item.persentase ?? '-',
      })) : [];
      setAttendance(mapped);
    } catch (e) {
      setError('Gagal memuat data kehadiran.');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/rekap/nilai');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Gagal memuat data rekap kehadiran.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
  }, []);

  // Fetch attendance when filter changes
  useEffect(() => {
    if (selectedKelas) fetchAttendance();
  }, [selectedKelas, dateRange]);

  // Table columns
  const columns = [
    { key: 'nama_siswa', label: 'Nama Siswa' },
    { key: 'hadir', label: 'Hadir' },
    { key: 'izin', label: 'Izin' },
    { key: 'sakit', label: 'Sakit' },
    { key: 'alpa', label: 'Alpa' },
    { key: 'persentase', label: 'Persentase', render: val => val ? `${val}%` : '-' },
  ];

  // Export PDF/Excel (placeholder, implementasi tergantung library)
  const handleExport = (type) => {
    // TODO: Implement export using jsPDF/autoTable or ExcelJS
    alert('Fitur export belum diimplementasikan.');
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'guru']}>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Laporan Kehadiran</h1>
          <div className="flex gap-2">
            <Button onClick={() => handleExport('pdf')}>Export PDF</Button>
            <Button onClick={() => handleExport('excel')}>Export Excel</Button>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Kelas</label>
            <select
              className="border rounded px-3 py-2"
              value={selectedKelas}
              onChange={e => setSelectedKelas(e.target.value)}
            >
              <option value="">Pilih Kelas</option>
              {kelasList.map(kelas => (
                <option key={kelas._id} value={kelas._id}>{kelas.nama_kelas}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Tanggal Mulai</label>
            <Input type="date" value={dateRange.start} onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))} />
          </div>
          <div>
            <label className="block mb-1 font-medium">Tanggal Akhir</label>
            <Input type="date" value={dateRange.end} onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))} />
          </div>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <DataTable data={attendance} columns={columns} />
        )}
      </div>
    </ProtectedRoute>
  );
} 