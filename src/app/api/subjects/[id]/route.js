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
    const subject = await MataPelajaran.findById(id);
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
    const { kelas_id } = body;

    const oldSubject = await MataPelajaran.findById(id);
    if (!oldSubject) return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    const oldKelasId = oldSubject.kelas_id?.toString();

    const guru_ids = normalizeGuruIds(body);
    if (guru_ids) {
      body.guru_ids = guru_ids;
      body.guru_id = guru_ids[0] || null;
    }

    const subject = await MataPelajaran.findByIdAndUpdate(id, body, { new: true });

    if (kelas_id && kelas_id !== oldKelasId) {
      if (oldKelasId) {
        await Kelas.findByIdAndUpdate(oldKelasId, { $pull: { matapelajaran_ids: subject._id } });
      }
      await Kelas.findByIdAndUpdate(kelas_id, { $addToSet: { matapelajaran_ids: subject._id } });
    }
    await logCRUDAction(userId, 'UPDATE_MAPEL', 'TUGAS', subject?._id, { nama: subject?.nama });
    const populated = await subject.populate('guru_ids', 'nama email');
    return NextResponse.json(populated);
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
    if (subject.kelas_id) {
      await Kelas.findByIdAndUpdate(subject.kelas_id, { $pull: { matapelajaran_ids: subject._id } });
    }
    await logCRUDAction(userId, 'DELETE_MAPEL', 'TUGAS', id, { nama: subject?.nama });
    return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_MAPEL', 'TUGAS', null, { error: error.message }, 'FAILED', error.message);
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
  return null;
}