import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MataPelajaran from '@/lib/models/MataPelajaran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const kelas_id = searchParams.get('kelas_id');
    const guru_id = searchParams.get('guru_id');
    const ids = searchParams.get('ids');
    let subjects;
    if (ids) {
      const idsArr = ids.split(',').map(id => id.trim());
      subjects = await MataPelajaran.find({ _id: { $in: idsArr } })
        .populate('guru_ids', 'nama email')
        .populate('kelas_id', 'nama_kelas tahun_ajaran');
    } else if (kelas_id) {
      subjects = await MataPelajaran.find({ kelas_id })
        .populate('guru_ids', 'nama email')
        .populate('kelas_id', 'nama_kelas tahun_ajaran');
    } else if (guru_id) {
      subjects = await MataPelajaran.find({
        $or: [
          { guru_id: guru_id },
          { guru_ids: guru_id }
        ]
      }).populate('guru_ids', 'nama email')
        .populate('kelas_id', 'nama_kelas tahun_ajaran');
    } else {
      subjects = await MataPelajaran.find()
        .populate('guru_ids', 'nama email')
        .populate('kelas_id', 'nama_kelas tahun_ajaran');
    }
    return NextResponse.json(subjects);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const body = await request.json();
    const { nama, kode, deskripsi, kelas_id } = body;
    if (!nama || !kelas_id) {
      return NextResponse.json({ error: 'Nama dan kelas wajib diisi.' }, { status: 400 });
    }
    const guru_ids = normalizeGuruIds(body);
    const subject = await MataPelajaran.create({
      nama,
      kode,
      deskripsi,
      kelas_id,
      guru_ids,
      guru_id: guru_ids[0] || null
    });
    await Kelas.findByIdAndUpdate(kelas_id, { $addToSet: { matapelajaran_ids: subject._id } });
    await logCRUDAction(userId, 'CREATE_MAPEL', 'TUGAS', subject._id, { nama });
    const populated = await subject.populate('guru_ids', 'nama email');
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_MAPEL', 'TUGAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 

function normalizeGuruIds(payload) {
  if (Array.isArray(payload.guru_ids) && payload.guru_ids.length) {
    return payload.guru_ids.filter(Boolean);
  }
  if (payload.guru_id) {
    return [payload.guru_id];
  }
  return [];
}