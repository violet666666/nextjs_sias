import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Announcement from '@/lib/models/Announcement';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import NotificationService from '@/lib/services/notificationService';

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const announcements = await Announcement.find({ kelas_id: id }).sort({ createdAt: -1 }).populate('author', 'nama role');
    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const body = await request.json();
    if (!body.text) return NextResponse.json({ error: 'Teks pengumuman wajib diisi' }, { status: 400 });
    const announcement = await Announcement.create({ kelas_id: id, text: body.text, author: currentUser.id });

    // Kirim notifikasi ke semua siswa di kelas
    await NotificationService.createNotificationForClass(
      id,
      {
        title: 'Pengumuman Baru',
        message: `Pengumuman baru telah diposting di kelas Anda: "${body.text.substring(0, 50)}..."`,
        type: 'announcement',
        data: { announcement_id: announcement._id }
      }
    );

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 