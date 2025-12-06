import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AttendanceSession from '@/lib/models/AttendanceSession';
import Kelas from '@/lib/models/Kelas';
import Orangtua from '@/lib/models/Orangtua'; // Impor model relasi Orangtua
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request,{params}) {
  try {
        // Tambahkan 'orangtua' ke role yang diizinkan
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']); 
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const currentUser = authResult.user;
    
    await connectDB();
    const awaitedParams = await params;
    const { sessionId } = awaitedParams;

    const session = await AttendanceSession.findById(sessionId)
      .populate('kelas_id', 'nama_kelas')
      .populate('guru_id', 'nama');

    if (!session) {
      return NextResponse.json({ error: 'Sesi absensi tidak ditemukan' }, { status: 404 });
    }

    // Validasi hak akses
    if (currentUser.role === 'siswa') {
      const kelas = await Kelas.findById(session.kelas_id._id);
      if (!kelas || !kelas.siswa_ids.some(id => id.toString() === currentUser.id)) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak terdaftar di kelas dari sesi ini.' }, { status: 403 });
      }
    } else if (currentUser.role === 'guru' && session.guru_id._id.toString() !== currentUser.id) {
      // Jika guru, dan bukan guru yang membuat sesi ini
      // Anda bisa memutuskan apakah guru lain boleh lihat atau tidak. Untuk sekarang, kita batasi.
      // return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru yang membuat sesi ini.' }, { status: 403 });
    } else if (currentUser.role === 'orangtua') {
      // Cari ID anak dari orang tua yang login
      const relasiAnak = await Orangtua.find({ user_id: currentUser.id }).select('siswa_ids');
      const anakIds = relasiAnak.flatMap(r => r.siswa_ids || []).map(id => id.toString());
      // Cek apakah salah satu anak terdaftar di kelas dari sesi ini
      const kelas = await Kelas.findById(session.kelas_id._id);
      if (!kelas) {
        return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
      }
      const siswaIds = kelas.siswa_ids.map(id => id.toString());
      const hasAnakInClass = siswaIds.some(id => anakIds.includes(id));
      if (!hasAnakInClass) {
        return NextResponse.json({ error: 'Akses ditolak: Anak Anda tidak terdaftar di kelas dari sesi ini.' }, { status: 403 });
      }
    }

    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil data sesi absensi.' }, { status: 500 });
  }
}