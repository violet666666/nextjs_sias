import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AttendanceSession from '@/lib/models/AttendanceSession';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru
import User from '@/lib/models/userModel'; // Untuk mendapatkan user
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru']); // Hanya guru
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();

    const body = await request.json();
    const { kelas_id, judul_pertemuan, deskripsi_pertemuan, durasi_menit = 15 } = body;

    if (!kelas_id || !judul_pertemuan) {
      return NextResponse.json({ error: 'Field kelas_id dan judul_pertemuan wajib diisi.' }, { status: 400 });
    }

    // Verifikasi apakah guru ini mengajar kelas tersebut
    const kelas = await Kelas.findById(kelas_id);
    if (!kelas || kelas.guru_id.toString() !== currentUser.id.toString()) { // currentUser.id dari token
        return NextResponse.json({ error: 'Anda tidak berhak memulai sesi untuk kelas ini.' }, { status: 403 });
    }

    const waktu_mulai = new Date();
    const waktu_selesai = new Date(waktu_mulai.getTime() + parseInt(durasi_menit) * 60000);

    const newSession = await AttendanceSession.create({
      kelas_id,
      guru_id: currentUser.id, // currentUser.id dari token
      judul_pertemuan,
      deskripsi_pertemuan,
      waktu_mulai,
      waktu_selesai,
      status: 'open',
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating attendance session:", error);
    return NextResponse.json({ error: error.message || 'Gagal memulai sesi absensi.' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Sesi bisa dilihat oleh semua role yang terautentikasi, atau spesifik
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get('kelas_id');
    const guru_id = searchParams.get('guru_id'); // Untuk guru melihat sesi mereka
    const status = searchParams.get('status'); // 'open' atau 'closed'

    const now = new Date();

    // Update status sesi yang sudah lewat waktu_selesai menjadi 'closed'
    // Ini bisa juga dilakukan oleh background job, tapi untuk simplisitas, kita lakukan di sini.
    await AttendanceSession.updateMany(
      { status: 'open', waktu_selesai: { $lt: now } },
      { $set: { status: 'closed' } }
    );

    const filter = {};
    if (kelas_id) filter.kelas_id = kelas_id;
    if (guru_id) filter.guru_id = guru_id;
    if (status) {
      filter.status = status;
    } else {
      // Jika tidak ada filter status spesifik, dan bukan query untuk siswa (yang hanya butuh 'open'),
      // mungkin kita tidak perlu filter status sama sekali, atau default ke 'open' dan 'closed'.
      // Untuk siswa, kita biasanya hanya ingin sesi yang 'open'.
    }

    const sessions = await AttendanceSession.find(filter)
      .populate('kelas_id', 'nama_kelas')
      .populate('guru_id', 'nama')
      .sort({ waktu_mulai: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil data sesi absensi.' }, { status: 500 });
  }
}