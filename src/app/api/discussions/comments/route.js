import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DiscussionComment from '@/lib/models/DiscussionComment';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import NotificationService from '@/lib/services/notificationService';
import DiscussionThread from '@/lib/models/DiscussionThread';
import Kelas from '@/lib/models/Kelas';
import validator from 'validator';

// GET: List komentar per thread
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const thread_id = searchParams.get('thread_id');
    await connectDB();
    const filter = thread_id ? { thread_id } : {};
    const comments = await DiscussionComment.find(filter).populate('user_id', 'nama email').sort({ createdAt: 1 });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tambah komentar baru
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const user = authResult.user;
    await connectDB();
    const body = await request.json();
    const { thread_id, body: commentBody } = body;
    if (!thread_id || !commentBody) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }
    // Sanitasi input komentar
    const sanitizedComment = validator.escape(commentBody);
    const comment = await DiscussionComment.create({
      thread_id,
      user_id: user.id,
      body: sanitizedComment,
    });

    // Notifikasi otomatis ke semua siswa & guru di kelas (kecuali author komentar)
    const thread = await DiscussionThread.findById(thread_id);
    const kelas = await Kelas.findById(thread.kelas_id).populate('siswa_ids');
    const siswaIds = kelas.siswa_ids.map(s => (s._id || s).toString());
    const guruId = kelas.guru_id.toString();
    const targetUserIds = [...siswaIds, guruId].filter(id => id !== user.id.toString());
    if (targetUserIds.length > 0) {
      await NotificationService.createBatchNotifications(targetUserIds, {
        title: 'Komentar Baru di Diskusi',
        message: `Ada komentar baru pada thread "${thread.title}" di kelas ${kelas.nama_kelas}`,
        type: 'info',
        priority: 'medium',
        category: 'academic',
        actionUrl: `/cpanel/classes/${kelas._id}/discussion?thread=${thread._id}`,
        actionText: 'Lihat Diskusi',
        metadata: { thread_id: thread._id, comment_id: comment._id }
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 