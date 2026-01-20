import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    // Query data dashboard dinamis sesuai role
    let stats = {};
    const role = decoded.role;
    const userId = decoded.id || decoded.userId;
    const User = (await import('@/lib/models/userModel')).default;
    const Kelas = (await import('@/lib/models/Kelas')).default;
    const Tugas = (await import('@/lib/models/Tugas')).default;
    const Submission = (await import('@/lib/models/Submission')).default;
    const Orangtua = (await import('@/lib/models/Orangtua')).default;
    const MataPelajaran = (await import('@/lib/models/MataPelajaran')).default;

    if (role === 'admin') {
      stats.totalStudents = await User.countDocuments({ role: 'siswa' });
      stats.totalTeachers = await User.countDocuments({ role: 'guru' });
      stats.totalClasses = await Kelas.countDocuments();
      stats.totalSubjects = await MataPelajaran.countDocuments();
      stats.activeSessions = 0; // Tambahkan jika ada sesi aktif
      stats.pendingTasks = await Tugas.countDocuments({ status: 'active' });
      stats.completedTasks = await Tugas.countDocuments({ status: 'completed' });
      stats.averageAttendance = 0; // Tambahkan jika ada data kehadiran
      stats.averageGrade = 0; // Tambahkan jika ada data nilai
    } else if (role === 'guru') {
      stats.kelasDiajar = await Kelas.countDocuments({ guru_id: userId });
      stats.tugasAktif = await Tugas.countDocuments({ guru_id: userId, status: 'active' });
      stats.submissionsBaru = await Submission.countDocuments({ guru_id: userId, status: 'submitted' });
    } else if (role === 'siswa') {
      stats.kelasDiikuti = await Kelas.countDocuments({ siswa_ids: userId });
      stats.tugasPending = await Tugas.countDocuments({ siswa_ids: userId, status: 'active' });
      stats.tugasSelesai = await Tugas.countDocuments({ siswa_ids: userId, status: 'completed' });
    } else if (role === 'orangtua') {
      // Cari semua data orang tua berdasarkan user ID yang sedang login
      const parentDataList = await Orangtua.find({ user_id: userId });

      // Hitung jumlah anak dari jumlah dokumen Orangtua yang terkait
      stats.childrenCount = parentDataList.length;

      // Anda bisa menambahkan statistik lain di sini, misalnya rata-rata nilai anak
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 