import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import User from '@/lib/models/userModel';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const user = authResult.user;
    if (user.role === 'siswa' && !match.siswa_id) {
      match.siswa_id = user.id;
    }
    if (user.role === 'guru' && !kelas_id) {
      const kelasDiajar = await Kelas.find({ guru_id: user.id }).select('_id');
      const kelasIds = kelasDiajar.map(k => k._id);
      match.kelas_id = { $in: kelasIds };
    }
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

    // Generate PDF
    const doc = new jsPDF();
    doc.text('Rekap Absensi Siswa', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Nama Siswa', 'Kelas', 'Hadir', 'Izin', 'Sakit', 'Alfa', 'Total'
      ]],
      body: result.map(row => [
        row.siswa_nama,
        row.kelas_nama,
        row.hadir,
        row.izin,
        row.sakit,
        row.alfa,
        row.total
      ]),
    });
    const pdfBuffer = doc.output('arraybuffer');

    // Audit log
    await logCRUDAction(user.id, 'EXPORT_PDF', 'REKAP_ABSENSI', null, { kelas_id, siswa_id });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=rekap_absensi.pdf',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 