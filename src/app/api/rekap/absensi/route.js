import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import Orangtua from '@/lib/models/Orangtua';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

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
    const tanggal_start = searchParams.get('tanggal_start');
    const tanggal_end = searchParams.get('tanggal_end');
    let match = {};
    if (kelas_id) match.kelas_id = kelas_id;
    if (siswa_id) match.siswa_id = siswa_id;
    if (tanggal_start || tanggal_end) {
      match.tanggal = {};
      if (tanggal_start) match.tanggal.$gte = new Date(tanggal_start);
      if (tanggal_end) match.tanggal.$lte = new Date(tanggal_end);
    }
    // Role-based filter
    const user = authResult.user;
    if (user.role === 'siswa' && !match.siswa_id) {
      match.siswa_id = user.id;
    }
    if (user.role === 'guru' && !kelas_id) {
      const kelasDiajar = await Kelas.find({ guru_id: user.id }).select('_id');
      const kelasIds = kelasDiajar.map(k => k._id);
      match.kelas_id = { $in: kelasIds };
    }
    // Orangtua: only their children's data
    if (user.role === 'orangtua') {
      const orangtuaEntries = await Orangtua.find({ user_id: user.id });
      const childIds = orangtuaEntries.map(o => o.siswa_id).filter(Boolean);
      if (childIds.length === 0) {
        return NextResponse.json([]);
      }
      match.siswa_id = { $in: childIds };
    }
    // Aggregate kehadiran per siswa per kelas
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { siswa_id: "$siswa_id", kelas_id: "$kelas_id" },
          hadir: { $sum: { $cond: [{ $eq: ["$status", "Hadir"] }, 1, 0] } },
          izin: { $sum: { $cond: [{ $eq: ["$status", "Izin"] }, 1, 0] } },
          sakit: { $sum: { $cond: [{ $eq: ["$status", "Sakit"] }, 1, 0] } },
          alfa: { $sum: { $cond: [{ $eq: ["$status", "Alfa"] }, 1, 0] } },
          total: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.siswa_id",
          foreignField: "_id",
          as: "siswa"
        }
      },
      {
        $lookup: {
          from: "kelas",
          localField: "_id.kelas_id",
          foreignField: "_id",
          as: "kelas"
        }
      },
      { $unwind: "$siswa" },
      { $unwind: "$kelas" },
      {
        $project: {
          siswa_id: "$_id.siswa_id",
          kelas_id: "_id.kelas_id",
          siswa_nama: "$siswa.nama",
          kelas_nama: "$kelas.nama_kelas",
          hadir: 1,
          izin: 1,
          sakit: 1,
          alfa: 1,
          total: 1
        }
      },
      { $sort: { kelas_nama: 1, siswa_nama: 1 } }
    ];
    const result = await Kehadiran.aggregate(pipeline);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 