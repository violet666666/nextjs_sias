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
      .populate('guru_id', 'nama email')
      .populate('kelas_ids', 'nama_kelas')
      .populate('kelas_id', 'nama_kelas');
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
    const { kelas_ids, guru_ids, kelas_id, guru_id } = body;

    // Get the old subject to compare classes
    const oldSubject = await MataPelajaran.findById(id);
    if (!oldSubject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    
    // Normalize to new format
    const finalKelasIds = kelas_ids || (kelas_id ? [kelas_id] : oldSubject.kelas_ids || (oldSubject.kelas_id ? [oldSubject.kelas_id] : []));
    const finalGuruIds = guru_ids || (guru_id ? [guru_id] : oldSubject.guru_ids || (oldSubject.guru_id ? [oldSubject.guru_id] : []));
    
    const oldKelasIds = oldSubject.kelas_ids || (oldSubject.kelas_id ? [oldSubject.kelas_id.toString()] : []);
    const oldGuruIds = oldSubject.guru_ids || (oldSubject.guru_id ? [oldSubject.guru_id.toString()] : []);

    // Update the subject with normalized data
    const updateData = {
      ...body,
      kelas_ids: finalKelasIds,
      guru_ids: finalGuruIds,
      kelas_id: finalKelasIds[0] || null, // Keep backward compatibility
      guru_id: finalGuruIds[0] || null
    };
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
    
    // Remove subject from all associated classes (support both old and new format)
    const kelasIds = subject.kelas_ids || (subject.kelas_id ? [subject.kelas_id] : []);
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