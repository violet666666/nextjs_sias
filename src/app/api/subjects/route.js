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
    const populateFields = [
      { path: 'guru_ids', select: 'nama email' },
      { path: 'guru_id', select: 'nama email' },
      { path: 'kelas_id', select: 'nama_kelas tahun_ajaran' }
    ];
    if (ids) {
      const idsArr = ids.split(',').map(id => id.trim());
      subjects = await MataPelajaran.find({ _id: { $in: idsArr } }).populate(populateFields);
    } else if (kelas_id) {
      subjects = await MataPelajaran.find({ kelas_id }).populate(populateFields);
    } else if (guru_id) {
      subjects = await MataPelajaran.find({
        $or: [
          { guru_id: guru_id },
          { guru_ids: guru_id }
        ]
      }).populate(populateFields);
    } else {
      subjects = await MataPelajaran.find().populate(populateFields);
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
    // Support both field name formats for backward compatibility
    const nama_mapel = body.nama_mapel || body.nama;
    const kode_mapel = body.kode_mapel || body.kode;
    const kkm = body.kkm || 75;
    const kelas_id = body.kelas_id;

    if (!nama_mapel || !kelas_id) {
      return NextResponse.json({ error: 'Nama mata pelajaran dan kelas wajib diisi.' }, { status: 400 });
    }
    const guru_ids = normalizeGuruIds(body);
    const subject = await MataPelajaran.create({
      nama_mapel,
      kode_mapel,
      kkm,
      kelas_id,
      guru_ids,
      guru_id: guru_ids[0] || null
    });
    await Kelas.findByIdAndUpdate(kelas_id, { $addToSet: { matapelajaran_ids: subject._id } });
    await logCRUDAction(userId, 'CREATE_MAPEL', 'MAPEL', subject._id, { nama_mapel });
    const populated = await subject.populate([
      { path: 'guru_ids', select: 'nama email' },
      { path: 'guru_id', select: 'nama email' },
      { path: 'kelas_id', select: 'nama_kelas tahun_ajaran' }
    ]);
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_MAPEL', 'MAPEL', null, { error: error.message }, 'FAILED', error.message);
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