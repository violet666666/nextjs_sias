import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DiscussionThread from '@/lib/models/DiscussionThread';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import NotificationService from '@/lib/services/notificationService';
import Kelas from '@/lib/models/Kelas';

// GET: List thread diskusi per kelas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get('kelas_id');
    await connectDB();
    const filter = kelas_id ? { kelas_id } : {};
    const threads = await DiscussionThread.find(filter).populate('user_id', 'nama email').sort({ createdAt: -1 });
    return NextResponse.json(threads);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Buat thread baru
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;
    await connectDB();
    const body = await request.json();
    const { kelas_id, title, body: threadBody } = body;
    if (!kelas_id || !title || !threadBody) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }
    const thread = await DiscussionThread.create({
      kelas_id,
      user_id: user.id,
      title,
      body: threadBody,
    });

    // Notifikasi otomatis ke semua siswa & guru di kelas (kecuali author)
    const kelas = await Kelas.findById(kelas_id).populate('siswa_ids');
    const siswaIds = kelas.siswa_ids.map(s => (s._id || s).toString());
    const guruId = kelas.guru_id.toString();
    const targetUserIds = [...siswaIds, guruId].filter(id => id !== user.id.toString());
    if (targetUserIds.length > 0) {
      await NotificationService.createBatchNotifications(targetUserIds, {
        title: 'Diskusi Baru di Kelas',
        message: `Thread "${title}" telah dibuat di kelas ${kelas.nama_kelas}`,
        type: 'info',
        priority: 'medium',
        category: 'academic',
        actionUrl: `/cpanel/classes/${kelas_id}/discussion`,
        actionText: 'Lihat Diskusi',
        metadata: { thread_id: thread._id }
      });
    }

    return NextResponse.json(thread, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 