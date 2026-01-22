import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tugas from '@/lib/models/Tugas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru
import { logCRUDAction } from '@/lib/auditLogger';
import NotificationService from '@/lib/services/notificationService';
import MataPelajaran from '@/lib/models/MataPelajaran';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get('kelas_id');
    const mapel_id = searchParams.get('mapel_id');
    const currentUser = authResult.user;
    const filter = {};

    if (currentUser.role === 'orangtua') {
      const Orangtua = (await import('@/lib/models/Orangtua')).default;
      const anakList = await Orangtua.find({ user_id: currentUser.id });
      const anakIds = anakList.map(o => o.siswa_id);
      if (anakIds.length === 0) {
        return NextResponse.json([]);
      }
      const anakKelas = await (await import('@/lib/models/userModel.js')).default.find({ _id: { $in: anakIds } }).select('kelas_id');
      const kelasIds = anakKelas.map(a => a.kelas_id).filter(Boolean);
      if (kelasIds.length === 0) {
        return NextResponse.json([]);
      }
      filter.kelas_id = { $in: kelasIds };
    } else if (currentUser.role === 'siswa') {
      // ALWAYS use Enrollment as primary source (consistent with getUpcomingDeadlines)
      const Enrollment = (await import('@/lib/models/Enrollment')).default;
      const enrollments = await Enrollment.find({ siswa_id: currentUser.id }).select('kelas_id');
      const kelasIds = enrollments.map(e => e.kelas_id).filter(Boolean);

      if (kelasIds.length > 0) {
        filter.kelas_id = { $in: kelasIds };
      } else if (currentUser.kelas_id) {
        // Fallback: use user.kelas_id if no enrollment found
        filter.kelas_id = currentUser.kelas_id;
      } else {
        return NextResponse.json([]);
      }
    } else {
      if (kelas_id) filter.kelas_id = kelas_id;
    }
    if (mapel_id) filter.mapel_id = mapel_id;

    const tugas = await Tugas.find(filter).populate('kelas_id', 'nama_kelas').populate('mapel_id', 'nama');
    return NextResponse.json(tugas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const body = await request.json();
    const { mapel_id, judul, deskripsi, tanggal_deadline } = body;

    if (!mapel_id || !judul || !tanggal_deadline) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    // Ambil kelas_id dari mapel
    const mapel = await MataPelajaran.findById(mapel_id);
    if (!mapel) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 404 });
    }
    const kelas_id = mapel.kelas_id;

    // Perbaikan: guru_id diisi otomatis dari user login
    const tugasData = { kelas_id, mapel_id, judul, deskripsi, tanggal_deadline };
    if (currentUser.role === 'guru') {
      tugasData.guru_id = currentUser.id;
    }
    // For admin: use provided guru_id or fallback to admin's own ID (required field)
    if (currentUser.role === 'admin') {
      tugasData.guru_id = body.guru_id || currentUser.id;
    }
    const tugas = await Tugas.create(tugasData);
    // Audit log
    await logCRUDAction(currentUser.id, 'CREATE_TUGAS', 'TUGAS', tugas._id, { kelas_id, mapel_id, judul });

    // Kirim notifikasi ke semua siswa di kelas dan orangtua mereka
    await NotificationService.createNotificationForClassAndParents(
      kelas_id,
      {
        title: 'Tugas Baru',
        text: `Tugas baru "${judul}" telah ditambahkan untuk kelas Anda.`,
        type: 'assignment',
        link: `/cpanel/tasks`
      },
      {
        title: 'Tugas Baru Anak Anda',
        text: `Anak Anda mendapat tugas baru "${judul}" dari guru.`,
        type: 'assignment',
        link: `/cpanel/children`
      }
    );

    return NextResponse.json(tugas, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 