import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    await connectDB();
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });
    }
    const role = decoded.role;
    const userId = decoded.id || decoded.userId;
    const Submission = (await import('@/lib/models/Submission')).default;
    const Tugas = (await import('@/lib/models/Tugas')).default;
    const Kelas = (await import('@/lib/models/Kelas')).default;
    let activities = [];
    if (role === 'guru') {
      // Submissions terbaru untuk tugas yang diajar guru ini
      activities = await Submission.find({ guru_id: userId })
        .sort({ tanggal_kumpul: -1 })
        .limit(5)
        .populate('siswa_id tugas_id');
    } else if (role === 'siswa') {
      // Submissions terbaru oleh siswa ini
      activities = await Submission.find({ siswa_id: userId })
        .sort({ tanggal_kumpul: -1 })
        .limit(5)
        .populate('tugas_id');
    } else if (role === 'admin') {
      // Semua aktivitas terbaru
      activities = await Submission.find({})
        .sort({ tanggal_kumpul: -1 })
        .limit(5)
        .populate('siswa_id tugas_id');
    } else if (role === 'orangtua') {
      // Temukan anak-anak dari user ini, lalu ambil submission mereka
      const User = (await import('@/lib/models/userModel')).default;
      const anakList = await User.find({ orangtua_id: userId });
      const anakIds = anakList.map(a => a._id);
      activities = await Submission.find({ siswa_id: { $in: anakIds } })
        .sort({ tanggal_kumpul: -1 })
        .limit(5)
        .populate('siswa_id tugas_id');
    }
    return NextResponse.json({ success: true, activities });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
} 