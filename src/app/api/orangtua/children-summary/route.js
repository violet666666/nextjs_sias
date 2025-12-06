import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Orangtua from '@/lib/models/Orangtua';
import Kelas from '@/lib/models/Kelas';
import Submission from '@/lib/models/Submission';
import Kehadiran from '@/lib/models/Kehadiran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();

    // Ambil semua anak dari koleksi Orangtua (menggunakan siswa_ids array)
    const relasiAnak = await Orangtua.find({ user_id: currentUser.id })
      .populate('siswa_ids', 'nama email nis');

    if (relasiAnak.length === 0 || !relasiAnak[0].siswa_ids || relasiAnak[0].siswa_ids.length === 0) {
      return NextResponse.json({ children: [], summary: {} });
    }

    // Flatten semua siswa_ids dari semua record Orangtua
    const anakIds = relasiAnak.flatMap(r => {
      if (!r.siswa_ids || !Array.isArray(r.siswa_ids)) return [];
      return r.siswa_ids.map(s => {
        // Handle jika sudah di-populate (object) atau masih ObjectId
        return s._id ? s._id : s;
      });
    });
    const anakData = relasiAnak.flatMap(r => {
      if (!r.siswa_ids || !Array.isArray(r.siswa_ids)) return [];
      return r.siswa_ids.filter(s => s && (s._id || s));
    });

    // Ambil data kelas yang memiliki anak-anak di siswa_ids
    const kelasWithAnak = await Kelas.find({ siswa_ids: { $in: anakIds } })
      .populate('guru_id', 'nama email')
      .populate('siswa_ids', 'nama email nis');

    // Ambil data nilai anak-anak
    const submissions = await Submission.find({ siswa_id: { $in: anakIds } })
      .populate('tugas_id', 'judul mata_pelajaran_id')
      .populate('kelas_id', 'nama_kelas');

    // Ambil data kehadiran anak-anak (30 hari terakhir)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const kehadiran = await Kehadiran.find({
      siswa_id: { $in: anakIds },
      tanggal: { $gte: thirtyDaysAgo }
    }).populate('kelas_id', 'nama_kelas');

    // Format data untuk response
    const childrenData = anakData.map(anak => {
      // Handle jika sudah di-populate (object) atau masih ObjectId
      const anakId = (anak._id ? anak._id : anak).toString();
      const anakNama = anak.nama || '-';
      const anakEmail = anak.email || '-';
      const anakNis = anak.nis || '-';
      
      // Data kelas anak - cari kelas yang memiliki anak ini di siswa_ids
      const anakKelas = kelasWithAnak.filter(k => {
        const siswaIds = k.siswa_ids.map(s => (s._id || s).toString());
        return siswaIds.includes(anakId);
      });
      
      // Data nilai anak
      const anakSubmissions = submissions.filter(s => {
        const siswaId = s.siswa_id?._id ? s.siswa_id._id.toString() : s.siswa_id?.toString();
        return siswaId === anakId;
      });
      const averageGrade = anakSubmissions.length > 0 
        ? Math.round(anakSubmissions.reduce((sum, sub) => sum + (sub.nilai || 0), 0) / anakSubmissions.length)
        : 0;

      // Data kehadiran anak
      const anakKehadiran = kehadiran.filter(k => {
        const siswaId = k.siswa_id?._id ? k.siswa_id._id.toString() : k.siswa_id?.toString();
        return siswaId === anakId;
      });
      const totalAttendance = anakKehadiran.length;
      const presentAttendance = anakKehadiran.filter(k => k.status === 'hadir').length;
      const attendanceRate = totalAttendance > 0 
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

      return {
        id: anakId,
        nama: anakNama,
        email: anakEmail,
        nis: anakNis,
        kelas: anakKelas.map(k => ({
          id: k._id,
          nama: k.nama_kelas || '-',
          guru_id: k.guru_id?._id || k.guru_id || null
        })),
        averageGrade,
        attendanceRate,
        totalAssignments: anakSubmissions.length,
        completedAssignments: anakSubmissions.filter(s => s.status === 'submitted').length
      };
    });

    // Ringkasan keseluruhan
    const summary = {
      totalChildren: childrenData.length,
      totalClasses: [...new Set(childrenData.flatMap(c => c.kelas.map(k => k.id)))].length,
      averageGrade: childrenData.length > 0 
        ? Math.round(childrenData.reduce((sum, c) => sum + c.averageGrade, 0) / childrenData.length)
        : 0,
      averageAttendance: childrenData.length > 0
        ? Math.round(childrenData.reduce((sum, c) => sum + c.attendanceRate, 0) / childrenData.length)
        : 0
    };

    return NextResponse.json({
      children: childrenData,
      summary
    });

  } catch (error) {
    console.error('Error fetching children summary:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 