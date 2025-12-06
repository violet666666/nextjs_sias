import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import User from '@/lib/models/userModel';
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
    
    const kelas = await Kelas.findById(id).select('pengumuman');
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    
    // Populate author secara manual
    let announcements = kelas.pengumuman || [];
    if (announcements.length > 0) {
      const authorIds = [...new Set(announcements.map(p => p.author?.toString()).filter(Boolean))];
      if (authorIds.length > 0) {
        const authors = await User.find({ _id: { $in: authorIds } }).select('nama role');
        const authorMap = new Map(authors.map(a => [a._id.toString(), a]));
        announcements = announcements.map(p => {
          const pObj = p.toObject ? p.toObject() : p;
          const authorId = pObj.author?.toString();
          if (authorId && authorMap.has(authorId)) {
            return { ...pObj, author: authorMap.get(authorId) };
          }
          return pObj;
        });
      } else {
        announcements = announcements.map(p => p.toObject ? p.toObject() : p);
      }
    }
    
    // Sort pengumuman berdasarkan createdAt (terbaru dulu)
    announcements = announcements.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
    
    if (!body.text || !body.text.trim()) {
      return NextResponse.json({ error: 'Teks pengumuman wajib diisi' }, { status: 400 });
    }
    
    if (!currentUser || !currentUser.id) {
      return NextResponse.json({ error: 'User tidak valid' }, { status: 401 });
    }
    
    const kelas = await Kelas.findById(id);
    if (!kelas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    
    // Validasi: hanya admin atau guru yang mengajar kelas ini yang bisa menambah pengumuman
    if (authResult.user.role === 'guru' && kelas.guru_id.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Anda tidak berhak menambah pengumuman di kelas ini' }, { status: 403 });
    }
    
    // Tambahkan pengumuman ke array pengumuman di kelas menggunakan $push
    const newAnnouncement = {
      text: body.text.trim(),
      author: currentUser.id,
      createdAt: new Date()
    };
    
    // Gunakan findByIdAndUpdate dengan $push untuk memastikan pengumuman ditambahkan
    const updatedKelas = await Kelas.findByIdAndUpdate(
      id,
      { $push: { pengumuman: newAnnouncement } },
      { new: true, runValidators: true }
    );
    
    if (!updatedKelas) {
      return NextResponse.json({ error: 'Gagal menambahkan pengumuman' }, { status: 500 });
    }
    
    // Ambil pengumuman yang baru saja ditambahkan (yang terakhir)
    const pengumumanArray = updatedKelas.pengumuman || [];
    if (pengumumanArray.length === 0) {
      return NextResponse.json({ error: 'Pengumuman tidak berhasil disimpan' }, { status: 500 });
    }
    
    const savedAnnouncementObj = pengumumanArray[pengumumanArray.length - 1];
    
    // Populate author untuk response secara manual
    const authorId = savedAnnouncementObj.author?.toString() || savedAnnouncementObj.author;
    if (!authorId) {
      return NextResponse.json({ error: 'Author ID tidak valid' }, { status: 500 });
    }
    
    const author = await User.findById(authorId).select('nama role');
    
    const savedAnnouncement = {
      _id: savedAnnouncementObj._id,
      text: savedAnnouncementObj.text,
      author: author ? { _id: author._id, nama: author.nama, role: author.role } : { _id: authorId },
      createdAt: savedAnnouncementObj.createdAt || savedAnnouncementObj.created_at || new Date()
    };

    // Kirim notifikasi ke semua siswa di kelas (non-blocking)
    try {
      await NotificationService.createNotificationForClass(
        id,
        {
          title: 'Pengumuman Baru',
          message: `Pengumuman baru telah diposting di kelas Anda: "${body.text.substring(0, 50)}..."`,
          type: 'announcement',
          data: { kelas_id: id }
        }
      );
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Jangan gagalkan request jika notifikasi gagal
    }

    return NextResponse.json(savedAnnouncement, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/kelas/[id]/announcements:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat menambahkan pengumuman' }, { status: 500 });
  }
} 