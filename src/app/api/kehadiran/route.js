import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import Enrollment from '@/lib/models/Enrollment'; // Untuk filter orangtua
import Orangtua from '@/lib/models/Orangtua'; // Impor Orangtua
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
    const currentUser = authResult.user;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const siswa_id = searchParams.get('siswa_id');
    const kelas_id = searchParams.get('kelas_id');
    const mapel_id = searchParams.get('mapel_id');
    const session_id = searchParams.get('session_id');
    const filter = {};
    if (siswa_id) filter.siswa_id = siswa_id;
    if (kelas_id) filter.kelas_id = kelas_id;
    if (mapel_id) filter.mapel_id = mapel_id;
    if (session_id) filter.session_id = session_id;

    // Filter tambahan berdasarkan peran jika bukan admin
    if (currentUser.role === 'siswa' && !filter.siswa_id) {
      filter.siswa_id = currentUser.id;
    } else if (currentUser.role === 'guru' && !filter.kelas_id) {
      const kelasDiajar = await Kelas.find({ guru_id: currentUser.id }).select('_id');
      const kelasDiajarIds = kelasDiajar.map(k => k._id);
      if (kelasDiajarIds.length > 0) {
        filter.kelas_id = { $in: kelasDiajarIds };
      } else {
        return NextResponse.json([]);
      }
    } else if (currentUser.role === 'orangtua' && !filter.siswa_id) {
      const anakList = await Orangtua.find({ user_id: currentUser.id });
      const anakIds = anakList.map(o => o.siswa_id);
      if (anakIds.length > 0) {
        filter.siswa_id = { $in: anakIds };
      } else {
        return NextResponse.json([]);
      }
    }

    const kehadiran = await Kehadiran.find(filter)
      .populate('kelas_id', 'nama_kelas')
      .populate('mapel_id', 'nama')
      .populate('siswa_id', 'nama email');
    return NextResponse.json(kehadiran);
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
    const { mapel_id, siswa_id, tanggal, status } = body;
    if (!mapel_id || !siswa_id || !tanggal || !status) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    // Ambil kelas_id dari mapel
    const mapel = await MataPelajaran.findById(mapel_id);
    if (!mapel) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 404 });
    }
    const kelas_id = mapel.kelas_id;

    // Jika guru, pastikan dia mengajar kelas tersebut
    if (currentUser.role === 'guru') {
      const kelas = await Kelas.findById(kelas_id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: `Anda tidak berhak input kehadiran untuk kelas ${kelas_id}.` }, { status: 403 });
      }
    }

    const kehadiran = await Kehadiran.create({ kelas_id, mapel_id, siswa_id, tanggal, status });
    // Audit log
    await logCRUDAction(currentUser.id, 'MARK_ATTENDANCE', 'ATTENDANCE', kehadiran._id, { kelas_id, mapel_id, siswa_id, tanggal, status });
    // Kirim notifikasi ke siswa
    await NotificationService.createNotification({
      user_id: siswa_id,
      title: 'Kehadiran Dicatat',
      text: `Kehadiran Anda pada ${tanggal} untuk kelas ${kelas_id} (${mapel.nama}) telah dicatat sebagai: ${status}.`,
      type: 'attendance',
      link: `/cpanel/attendance`
    });
    // Kirim notifikasi ke orangtua jika siswa tidak hadir
    if (status !== 'Hadir') {
      const orangtuaList = await Orangtua.find({ siswa_ids: siswa_id });
      for (const ortu of orangtuaList) {
        await NotificationService.createNotification({
          user_id: ortu.user_id,
          title: 'Anak Tidak Hadir',
          text: `Anak Anda tidak hadir pada ${tanggal} untuk kelas ${kelas_id} (${mapel.nama}).`,
          type: 'attendance',
          link: `/cpanel/children`
        });
      }
    }
    // Kirim notifikasi ke guru (jika role guru)
    if (currentUser.role === 'guru') {
      await NotificationService.createNotification({
        user_id: currentUser.id,
        title: 'Absensi Berhasil',
        message: `Anda telah mencatat kehadiran untuk kelas ${kelas_id} (${mapel.nama}) pada ${tanggal}.`,
        type: 'attendance',
        data: { kehadiran_id: kehadiran._id, kelas_id, mapel_id, tanggal }
      });
    }

    return NextResponse.json(kehadiran, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 