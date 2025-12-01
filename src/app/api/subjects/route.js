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
      // Ambil banyak mapel sekaligus
      const idsArr = ids.split(',').map(id => id.trim());
      subjects = await MataPelajaran.find({ _id: { $in: idsArr } })
        .populate('guru_ids', 'nama email')
        .populate('guru_id', 'nama email')
        .populate('kelas_ids', 'nama_kelas')
        .populate('kelas_id', 'nama_kelas');
    } else if (kelas_id) {
      // Support both old and new format
      subjects = await MataPelajaran.find({
        $or: [
          { kelas_id },
          { kelas_ids: kelas_id }
        ]
      })
        .populate('guru_ids', 'nama email')
        .populate('guru_id', 'nama email')
        .populate('kelas_ids', 'nama_kelas')
        .populate('kelas_id', 'nama_kelas');
    } else if (guru_id) {
      // Support both old and new format
      subjects = await MataPelajaran.find({
        $or: [
          { guru_id },
          { guru_ids: guru_id }
        ]
      })
        .populate('guru_ids', 'nama email')
        .populate('guru_id', 'nama email')
        .populate('kelas_ids', 'nama_kelas')
        .populate('kelas_id', 'nama_kelas');
    } else {
      subjects = await MataPelajaran.find()
        .populate('guru_ids', 'nama email')
        .populate('guru_id', 'nama email')
        .populate('kelas_ids', 'nama_kelas')
        .populate('kelas_id', 'nama_kelas');
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
    const { nama, kode, deskripsi, kelas_ids, guru_ids, kelas_id, guru_id } = body;
    if (!nama || (!kelas_ids?.length && !kelas_id)) {
      return NextResponse.json({ error: 'Nama dan kelas wajib diisi.' }, { status: 400 });
    }
    
    // Support both old and new format - normalize to new format
    const finalKelasIds = kelas_ids || (kelas_id ? [kelas_id] : []);
    const finalGuruIds = guru_ids || (guru_id ? [guru_id] : []);
    
    const subject = await MataPelajaran.create({ 
      nama, 
      kode, 
      deskripsi, 
      kelas_ids: finalKelasIds,
      guru_ids: finalGuruIds,
      // Keep backward compatibility
      kelas_id: finalKelasIds[0] || null,
      guru_id: finalGuruIds[0] || null
    });
    
    // Update all classes to include this subject
    for (const kId of finalKelasIds) {
      await Kelas.findByIdAndUpdate(kId, { $addToSet: { matapelajaran_ids: subject._id } });
    }
    
    await logCRUDAction(userId, 'CREATE_MAPEL', 'TUGAS', subject._id, { nama });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_MAPEL', 'TUGAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 