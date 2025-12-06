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
        .populate('kelas_ids', 'nama_kelas');
    } else if (kelas_id) {
      // Filter berdasarkan kelas_ids array
      subjects = await MataPelajaran.find({
        kelas_ids: kelas_id
      })
        .populate('guru_ids', 'nama email')
        .populate('kelas_ids', 'nama_kelas');
    } else if (guru_id) {
      // Filter berdasarkan guru_ids array
      subjects = await MataPelajaran.find({
        guru_ids: guru_id
      })
        .populate('guru_ids', 'nama email')
        .populate('kelas_ids', 'nama_kelas');
    } else {
      subjects = await MataPelajaran.find()
        .populate('guru_ids', 'nama email')
        .populate('kelas_ids', 'nama_kelas');
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
    const { nama, kode, deskripsi, total_jam_per_minggu, kelas_ids, guru_ids } = body;
    
    // Hanya nama yang wajib diisi, kelas dan guru bisa ditambahkan nanti
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: 'Nama mata pelajaran wajib diisi.' }, { status: 400 });
    }
    
    // Normalize to array format
    const finalKelasIds = Array.isArray(kelas_ids) ? kelas_ids : (kelas_ids ? [kelas_ids] : []);
    const finalGuruIds = Array.isArray(guru_ids) ? guru_ids : (guru_ids ? [guru_ids] : []);
    
    const subject = await MataPelajaran.create({ 
      nama: nama.trim(), 
      kode: kode?.trim() || undefined, 
      deskripsi: deskripsi?.trim() || undefined,
      total_jam_per_minggu: total_jam_per_minggu ? parseInt(total_jam_per_minggu) || 0 : 0,
      kelas_ids: finalKelasIds,
      guru_ids: finalGuruIds
    });
    
    // Update all classes to include this subject (jika ada kelas yang dipilih)
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