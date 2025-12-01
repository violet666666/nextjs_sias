import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Tugas from '@/lib/models/Tugas';
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
    const tugas_id = searchParams.get('tugas_id');
    let match = {};
    if (kelas_id) {
      const tugasList = await Tugas.find({ kelas_id }).select('_id');
      const tugasIds = tugasList.map(t => t._id);
      match.tugas_id = { $in: tugasIds };
    }
    if (siswa_id) match.siswa_id = siswa_id;
    if (tugas_id) match.tugas_id = tugas_id;
    const user = authResult.user;
    if (user.role === 'siswa' && !match.siswa_id) {
      match.siswa_id = user.id;
    }
    if (user.role === 'guru' && !kelas_id && !tugas_id) {
      const kelasDiajar = await Kelas.find({ guru_id: user.id }).select('_id');
      const kelasIds = kelasDiajar.map(k => k._id);
      const tugasGuru = await Tugas.find({ kelas_id: { $in: kelasIds } }).select('_id');
      const tugasIds = tugasGuru.map(t => t._id);
      match.tugas_id = { $in: tugasIds };
    }
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { siswa_id: "$siswa_id", tugas_id: "$tugas_id" },
          avg_nilai: { $avg: "$nilai" },
          min_nilai: { $min: "$nilai" },
          max_nilai: { $max: "$nilai" },
          count: { $sum: 1 },
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
          from: "tugas",
          localField: "_id.tugas_id",
          foreignField: "_id",
          as: "tugas"
        }
      },
      { $unwind: "$siswa" },
      { $unwind: "$tugas" },
      {
        $project: {
          siswa_nama: "$siswa.nama",
          tugas_judul: "$tugas.judul",
          avg_nilai: 1,
          min_nilai: 1,
          max_nilai: 1,
          count: 1
        }
      },
      { $sort: { siswa_nama: 1, tugas_judul: 1 } }
    ];
    const result = await Submission.aggregate(pipeline);

    // Generate PDF
    const doc = new jsPDF();
    doc.text('Rekap Nilai Siswa', 14, 16);
    autoTable(doc, {
      startY: 22,
      head: [[
        'Nama Siswa', 'Tugas', 'Rata-rata', 'Nilai Tertinggi', 'Nilai Terendah', 'Jumlah Submit'
      ]],
      body: result.map(row => [
        row.siswa_nama,
        row.tugas_judul,
        row.avg_nilai?.toFixed(2),
        row.max_nilai,
        row.min_nilai,
        row.count
      ]),
    });
    const pdfBuffer = doc.output('arraybuffer');

    // Audit log
    await logCRUDAction(user.id, 'EXPORT_PDF', 'REKAP_NILAI', null, { kelas_id, siswa_id });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=rekap_nilai.pdf',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 