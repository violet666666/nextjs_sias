import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MataPelajaran from '@/lib/models/MataPelajaran';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const subject = await MataPelajaran.findById(id)
      .populate('guru_ids', 'nama email')
      .populate('kelas_ids', 'nama_kelas')
      .populate('guru_kelas_assignments.guru_id', 'nama email')
      .populate('guru_kelas_assignments.kelas_id', 'nama_kelas tahun_ajaran');
    if (!subject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    return NextResponse.json(subject);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  let userId = null;
  try {
    const { params } = context;
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const body = await request.json();
    const { kelas_ids, guru_ids } = body;

    // Get the old subject to compare classes
    const oldSubject = await MataPelajaran.findById(id);
    if (!oldSubject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    
    // Normalize to array format
    const finalKelasIds = Array.isArray(kelas_ids) ? kelas_ids : (kelas_ids ? [kelas_ids] : (oldSubject.kelas_ids || []));
    const finalGuruIds = Array.isArray(guru_ids) ? guru_ids : (guru_ids ? [guru_ids] : (oldSubject.guru_ids || []));
    
    const oldKelasIds = (oldSubject.kelas_ids || []).map(id => id.toString());
    const oldGuruIds = (oldSubject.guru_ids || []).map(id => id.toString());

    // Update the subject with normalized data
    const updateData = {
      ...body,
      kelas_ids: finalKelasIds,
      guru_ids: finalGuruIds
    };
    // Remove kelas_id and guru_id from updateData if they exist
    delete updateData.kelas_id;
    delete updateData.guru_id;
    
    const subject = await MataPelajaran.findByIdAndUpdate(id, updateData, { new: true });

    // Sync class relationships - remove from old classes, add to new ones
    const newKelasIds = finalKelasIds.map(id => id.toString());
    const classesToRemove = oldKelasIds.filter(id => !newKelasIds.includes(id));
    const classesToAdd = newKelasIds.filter(id => !oldKelasIds.includes(id));
    
    for (const kId of classesToRemove) {
      await Kelas.findByIdAndUpdate(kId, { $pull: { matapelajaran_ids: subject._id } });
    }
    for (const kId of classesToAdd) {
      await Kelas.findByIdAndUpdate(kId, { $addToSet: { matapelajaran_ids: subject._id } });
    }
    
    await logCRUDAction(userId, 'UPDATE_MAPEL', 'TUGAS', subject?._id, { nama: subject?.nama });
    return NextResponse.json(subject);
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'UPDATE_MAPEL', 'TUGAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  let userId = null;
  try {
    const { params } = context;
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const subject = await MataPelajaran.findByIdAndDelete(id);
    if (!subject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    
    // Remove subject from all associated classes
    const kelasIds = subject.kelas_ids || [];
    for (const kId of kelasIds) {
      await Kelas.findByIdAndUpdate(kId, { $pull: { matapelajaran_ids: subject._id } });
    }
    
    await logCRUDAction(userId, 'DELETE_MAPEL', 'TUGAS', id, { nama: subject?.nama });
    return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_MAPEL', 'TUGAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 