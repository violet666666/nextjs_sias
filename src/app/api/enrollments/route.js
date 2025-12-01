import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/lib/models/Enrollment';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru
import { logCRUDAction, logBulkAction } from '@/lib/auditLogger';
import NotificationService from '@/lib/services/notificationService';
import User from '@/lib/models/userModel';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get('kelas_id');
    const siswa_id = searchParams.get('siswa_id');

    const filter = {};
    if (kelas_id) filter.kelas_id = kelas_id;
    if (siswa_id) filter.siswa_id = siswa_id;

    const enrollments = await Enrollment.find(filter)
      .populate('kelas_id', 'nama_kelas')
      .populate('siswa_id', 'nama email');
    // Tambahan: Filter berdasarkan hak akses jika bukan admin
    // if (authResult.user.role === 'guru') { ... filter by kelas yang diajar ... }
    // if (authResult.user.role === 'siswa') { ... filter by siswa_id dirinya ... }
    return NextResponse.json(enrollments);
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
    const { kelas_id, siswa_id } = body;
    if (!kelas_id || !siswa_id || (Array.isArray(siswa_id) && siswa_id.length === 0)) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }
    // Jika guru, pastikan dia mengajar kelas tersebut
    if (currentUser.role === 'guru') {
      const kelas = await Kelas.findById(kelas_id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak mendaftarkan siswa ke kelas ini.' }, { status: 403 });
      }
    }
    // Bulk enroll
    if (Array.isArray(siswa_id)) {
      // Cek duplikasi
      const existing = await Enrollment.find({ kelas_id, siswa_id: { $in: siswa_id } }).select('siswa_id');
      const existingIds = existing.map(e => e.siswa_id.toString());
      const toEnroll = siswa_id.filter(id => !existingIds.includes(id));
      if (toEnroll.length === 0) {
        return NextResponse.json({ error: 'Semua siswa sudah terdaftar di kelas ini.' }, { status: 400 });
      }
      const enrollments = await Enrollment.insertMany(toEnroll.map(sid => ({ kelas_id, siswa_id: sid })), { ordered: false });
      
      // Audit log bulk action
      await logBulkAction(currentUser.id, 'ENROLL_STUDENT', 'ENROLLMENT', toEnroll, { kelas_id, count: enrollments.length });
      
      // Notifikasi ke siswa yang baru di-enroll
      const kelas = await Kelas.findById(kelas_id);
      await NotificationService.createBatchNotifications(toEnroll, {
        title: 'Pendaftaran Kelas',
        message: `Anda telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
        type: 'info',
        category: 'academic',
        priority: 'medium',
        actionUrl: `/cpanel/classes/${kelas_id}`,
        actionText: 'Lihat Kelas',
        metadata: { kelas_id }
      });
      // Notifikasi ke guru kelas (kecuali jika guru itu sendiri yang melakukan)
      if (kelas.guru_id && kelas.guru_id.toString() !== currentUser.id) {
        await NotificationService.createNotification({
          user_id: kelas.guru_id,
          title: 'Siswa Baru Didaftarkan',
          message: `${toEnroll.length} siswa baru telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
          type: 'info',
          category: 'academic',
          priority: 'medium',
          actionUrl: `/cpanel/classes/${kelas_id}`,
          actionText: 'Lihat Kelas',
          metadata: { kelas_id, siswa_ids: toEnroll }
        });
      }
      return NextResponse.json({ success: true, count: enrollments.length }, { status: 201 });
    }
    // Single enroll
    const enrollment = await Enrollment.create({ kelas_id, siswa_id });
    
    // Audit log single action
    await logCRUDAction(currentUser.id, 'ENROLL_STUDENT', 'ENROLLMENT', enrollment._id, { kelas_id, siswa_id });
    
    // Notifikasi ke siswa
    const kelas = await Kelas.findById(kelas_id);
    await NotificationService.createNotification({
      user_id: siswa_id,
      title: 'Pendaftaran Kelas',
      message: `Anda telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
      type: 'info',
      category: 'academic',
      priority: 'medium',
      actionUrl: `/cpanel/classes/${kelas_id}`,
      actionText: 'Lihat Kelas',
      metadata: { kelas_id }
    });
    // Notifikasi ke guru kelas (kecuali jika guru itu sendiri yang melakukan)
    if (kelas.guru_id && kelas.guru_id.toString() !== currentUser.id) {
      await NotificationService.createNotification({
        user_id: kelas.guru_id,
        title: 'Siswa Baru Didaftarkan',
        message: `1 siswa baru telah didaftarkan ke kelas ${kelas.nama_kelas}.`,
        type: 'info',
        category: 'academic',
        priority: 'medium',
        actionUrl: `/cpanel/classes/${kelas_id}`,
        actionText: 'Lihat Kelas',
        metadata: { kelas_id, siswa_id }
      });
    }
    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 