import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Tugas from '@/lib/models/Tugas';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import ExcelJS from 'exceljs';
import { logCRUDAction } from '@/lib/auditLogger';

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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Nilai');
    worksheet.columns = [
      { header: 'Nama Siswa', key: 'siswa_nama', width: 30 },
      { header: 'Tugas', key: 'tugas_judul', width: 30 },
      { header: 'Rata-rata', key: 'avg_nilai', width: 15 },
      { header: 'Nilai Tertinggi', key: 'max_nilai', width: 15 },
      { header: 'Nilai Terendah', key: 'min_nilai', width: 15 },
      { header: 'Jumlah Submit', key: 'count', width: 15 },
    ];
    result.forEach(row => {
      worksheet.addRow({
        siswa_nama: row.siswa_nama,
        tugas_judul: row.tugas_judul,
        avg_nilai: row.avg_nilai?.toFixed(2),
        max_nilai: row.max_nilai,
        min_nilai: row.min_nilai,
        count: row.count,
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();

    await logCRUDAction(user.id, 'EXPORT_EXCEL', 'REKAP_NILAI', null, { kelas_id, siswa_id });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=rekap_nilai.xlsx',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

