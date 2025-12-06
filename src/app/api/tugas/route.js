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
      if (currentUser.kelas_id) {
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
    const { mapel_id, kelas_id: bodyKelasId, judul, deskripsi, tanggal_deadline } = body;

    if (!mapel_id || !judul || !tanggal_deadline) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    // Ambil mata pelajaran
    const mapel = await MataPelajaran.findById(mapel_id);
    if (!mapel) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 404 });
    }

    // Validasi: Jika guru, pastikan dia mengajar mata pelajaran ini
    if (currentUser.role === 'guru') {
      // Cek apakah ada assignment spesifik untuk guru-kelas ini
      const assignments = mapel.guru_kelas_assignments || [];
      const hasSpecificAssignment = assignments.some(a => 
        a.guru_id.toString() === currentUser.id.toString() && 
        (bodyKelasId ? a.kelas_id.toString() === bodyKelasId.toString() : true)
      );
      
      // Jika ada assignment spesifik, gunakan itu
      if (assignments.length > 0) {
        if (!hasSpecificAssignment) {
          return NextResponse.json({ error: 'Anda tidak ditugaskan untuk mengajar mata pelajaran ini di kelas tersebut.' }, { status: 403 });
        }
      } else {
        // Fallback: cek apakah guru ada di guru_ids (untuk backward compatibility)
        const guruIds = mapel.guru_ids || [];
        const isTeacher = guruIds.some(gId => {
          const gIdStr = typeof gId === 'object' ? gId.toString() : gId.toString();
          return gIdStr === currentUser.id.toString();
        });
        if (!isTeacher) {
          return NextResponse.json({ error: 'Anda tidak berhak memberikan tugas untuk mata pelajaran ini.' }, { status: 403 });
        }
      }
    }

    // Tentukan kelas_id
    let kelas_id;
    if (bodyKelasId) {
      // Validasi bahwa kelas_id ada di kelas_ids mata pelajaran
      const kelasIds = mapel.kelas_ids || [];
      const kelasIdStr = bodyKelasId.toString();
      const isValidKelas = kelasIds.some(kId => {
        const kIdStr = typeof kId === 'object' ? kId.toString() : kId.toString();
        return kIdStr === kelasIdStr;
      });
      if (!isValidKelas) {
        return NextResponse.json({ error: 'Kelas tidak valid untuk mata pelajaran ini.' }, { status: 400 });
      }
      kelas_id = bodyKelasId;
    } else {
      // Gunakan kelas pertama dari mata pelajaran
      const kelas_ids = mapel.kelas_ids || [];
      if (kelas_ids.length === 0) {
        return NextResponse.json({ error: 'Mata pelajaran belum di-assign ke kelas manapun.' }, { status: 400 });
      }
      kelas_id = kelas_ids[0];
    }

    // Set guru_id
    const tugasData = { kelas_id, mapel_id, judul, deskripsi, tanggal_deadline };
    if (currentUser.role === 'guru') {
      tugasData.guru_id = currentUser.id;
    }
    if (currentUser.role === 'admin' && body.guru_id) {
      tugasData.guru_id = body.guru_id;
    }
    const tugas = await Tugas.create(tugasData);
    // Audit log
    await logCRUDAction(currentUser.id, 'CREATE_TUGAS', 'TUGAS', tugas._id, { kelas_id, mapel_id, judul });

    // Kirim notifikasi ke semua siswa di kelas dan orangtua mereka
    await NotificationService.createNotificationForClassAndParents(
      kelas_id,
      {
        title: 'Tugas Baru',
        message: `Tugas baru "${judul}" telah ditambahkan untuk kelas Anda.`,
        type: 'task',
        category: 'academic',
        priority: 'medium',
        actionRequired: true,
        actionUrl: `/cpanel/tasks`,
        actionText: 'Lihat Tugas'
      },
      {
        title: 'Tugas Baru Anak Anda',
        message: `Anak Anda mendapat tugas baru "${judul}" dari guru.`,
        type: 'task',
        category: 'academic',
        priority: 'medium',
        actionRequired: true,
        actionUrl: `/cpanel/children`,
        actionText: 'Lihat Detail'
      }
    );

    return NextResponse.json(tugas, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 