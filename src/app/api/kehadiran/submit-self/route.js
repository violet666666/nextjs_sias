import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import AttendanceSession from '@/lib/models/AttendanceSession';
import Enrollment from '@/lib/models/Enrollment';
import User from '@/lib/models/userModel'; // Untuk mendapatkan user
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['siswa']); // Hanya siswa
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();

    const body = await request.json();
    const { kelas_id, session_id } = body; // session_id bisa opsional jika kita cari sesi aktif

    if (!kelas_id) {
      return NextResponse.json({ error: 'Field kelas_id wajib diisi.' }, { status: 400 });
    }

    // 1. Cari sesi absensi yang aktif untuk kelas tersebut
    const now = new Date();
    const activeSession = await AttendanceSession.findOne({
      _id: session_id, // Jika session_id diberikan
      // kelas_id: kelas_id, // Jika session_id tidak diberikan, cari berdasarkan kelas_id
      status: 'open',
      waktu_mulai: { $lte: now },
      waktu_selesai: { $gte: now },
    });

    if (!activeSession) {
      return NextResponse.json({ error: 'Tidak ada sesi absensi yang aktif untuk kelas ini atau sesi telah berakhir.' }, { status: 404 });
    }

    // 2. Cek apakah siswa terdaftar di kelas tersebut
    const enrollment = await Enrollment.findOne({ kelas_id: activeSession.kelas_id, siswa_id: currentUser.id });
    if (!enrollment) {
      return NextResponse.json({ error: 'Anda tidak terdaftar di kelas ini.' }, { status: 403 });
    }

    // 3. Cek apakah siswa sudah absen untuk sesi ini (atau hari ini untuk kelas ini)
    //    Untuk mencegah duplikasi, kita bisa cek berdasarkan session_id jika ada, atau tanggal dan kelas_id.
    const existingAttendance = await Kehadiran.findOne({ siswa_id: currentUser.id, kelas_id: activeSession.kelas_id, session_id: activeSession._id }); // Cek dengan session_id
    if (existingAttendance) {
      return NextResponse.json({ error: 'Anda sudah melakukan absensi untuk sesi ini.' }, { status: 409 });
    }

    // 4. Buat record kehadiran
    const kehadiranRecord = await Kehadiran.create({
      kelas_id: activeSession.kelas_id,
      mapel_id: activeSession.mapel_id, // Include mapel_id from session
      siswa_id: currentUser.id,
      session_id: activeSession._id, // Simpan ID sesi
      tanggal: now,
      status: 'Hadir', // Absensi mandiri selalu 'Hadir'
    });

    return NextResponse.json({ message: 'Absensi berhasil dicatat.', data: kehadiranRecord }, { status: 201 });
  } catch (error) {
    console.error("Error submitting self attendance:", error);
    return NextResponse.json({ error: error.message || 'Gagal melakukan absensi.' }, { status: 500 });
  }
}