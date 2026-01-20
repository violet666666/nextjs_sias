import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Orangtua from '@/lib/models/Orangtua';
import Enrollment from '@/lib/models/Enrollment';
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

    // Ambil semua anak dari koleksi Orangtua
    const relasiAnak = await Orangtua.find({ user_id: currentUser.id })
      .populate('siswa_id', 'nama email')
      .select('siswa_id');

    if (relasiAnak.length === 0) {
      return NextResponse.json({ children: [], summary: {} });
    }

    // Filter out null siswa_ids and extract _id
    const anakIds = relasiAnak
      .filter(r => r.siswa_id && r.siswa_id._id)
      .map(r => r.siswa_id._id);

    if (anakIds.length === 0) {
      return NextResponse.json({ children: [], summary: { message: 'Data anak belum lengkap' } });
    }

    // Ambil data enrollment anak-anak
    const enrollments = await Enrollment.find({ siswa_id: { $in: anakIds } })
      .populate('kelas_id', 'nama_kelas guru_id')
      .populate('siswa_id', 'nama email');

    // Ambil data nilai anak-anak
    // Note: Submission doesn't have kelas_id, it's on Tugas
    const submissions = await Submission.find({ siswa_id: { $in: anakIds } })
      .populate({
        path: 'tugas_id',
        select: 'judul mata_pelajaran_id kelas_id',
        populate: { path: 'kelas_id', select: 'nama_kelas' }
      });

    // Ambil data kehadiran anak-anak (30 hari terakhir)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const kehadiran = await Kehadiran.find({
      siswa_id: { $in: anakIds },
      tanggal: { $gte: thirtyDaysAgo }
    }).populate('kelas_id', 'nama_kelas');

    // Filter valid relations with siswa_id populated
    const validRelasiAnak = relasiAnak.filter(r => r.siswa_id && r.siswa_id._id);

    // Format data untuk response
    const childrenData = validRelasiAnak.map(relasi => {
      const anakId = relasi.siswa_id._id.toString();

      // Data kelas anak
      const anakEnrollments = enrollments.filter(e => e.siswa_id && e.siswa_id._id && e.siswa_id._id.toString() === anakId);

      // Data nilai anak
      const anakSubmissions = submissions.filter(s => s.siswa_id.toString() === anakId);
      const averageGrade = anakSubmissions.length > 0
        ? Math.round(anakSubmissions.reduce((sum, sub) => sum + (sub.nilai || 0), 0) / anakSubmissions.length)
        : 0;

      // Data kehadiran anak
      const anakKehadiran = kehadiran.filter(k => k.siswa_id.toString() === anakId);
      const totalAttendance = anakKehadiran.length;
      const presentAttendance = anakKehadiran.filter(k => k.status === 'hadir').length;
      const attendanceRate = totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

      return {
        _id: anakId,
        nama: relasi.siswa_id.nama,
        email: relasi.siswa_id.email,
        kelas: anakEnrollments.map(e => ({
          id: e.kelas_id._id,
          nama: e.kelas_id.nama_kelas,
          guru_id: e.kelas_id.guru_id
        })),
        nilaiRataRata: Number(averageGrade || 0).toFixed(2),
        kehadiran: `${presentAttendance}/${totalAttendance}`,
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