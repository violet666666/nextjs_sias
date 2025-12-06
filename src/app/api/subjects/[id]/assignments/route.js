import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import MataPelajaran from '@/lib/models/MataPelajaran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

// GET: Get all assignments for a subject
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    
    const subject = await MataPelajaran.findById(id)
      .populate('guru_kelas_assignments.guru_id', 'nama email')
      .populate('guru_kelas_assignments.kelas_id', 'nama_kelas tahun_ajaran');
    
    if (!subject) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json(subject.guru_kelas_assignments || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add assignment (guru to kelas)
export async function POST(request, { params }) {
  let userId = null;
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    
    const body = await request.json();
    const { guru_id, kelas_id } = body;
    
    if (!guru_id || !kelas_id) {
      return NextResponse.json({ error: 'guru_id dan kelas_id wajib diisi' }, { status: 400 });
    }
    
    const subject = await MataPelajaran.findById(id);
    if (!subject) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }
    
    // Validasi: guru_id harus ada di guru_ids
    const guruIds = (subject.guru_ids || []).map(g => g.toString());
    if (!guruIds.includes(guru_id.toString())) {
      return NextResponse.json({ error: 'Guru tidak terdaftar sebagai pengajar mata pelajaran ini' }, { status: 400 });
    }
    
    // Validasi: kelas_id harus ada di kelas_ids
    const kelasIds = (subject.kelas_ids || []).map(k => k.toString());
    if (!kelasIds.includes(kelas_id.toString())) {
      return NextResponse.json({ error: 'Kelas tidak terdaftar untuk mata pelajaran ini' }, { status: 400 });
    }
    
    // Cek apakah assignment sudah ada
    const existingAssignments = subject.guru_kelas_assignments || [];
    const isDuplicate = existingAssignments.some(a => 
      a.guru_id.toString() === guru_id.toString() && 
      a.kelas_id.toString() === kelas_id.toString()
    );
    
    if (isDuplicate) {
      return NextResponse.json({ error: 'Assignment ini sudah ada' }, { status: 400 });
    }
    
    // Tambahkan assignment
    if (!subject.guru_kelas_assignments) {
      subject.guru_kelas_assignments = [];
    }
    subject.guru_kelas_assignments.push({ guru_id, kelas_id });
    await subject.save();
    
    await logCRUDAction(userId, 'CREATE_ASSIGNMENT', 'MataPelajaran', id, { guru_id, kelas_id });
    
    // Populate untuk response
    await subject.populate('guru_kelas_assignments.guru_id', 'nama email');
    await subject.populate('guru_kelas_assignments.kelas_id', 'nama_kelas tahun_ajaran');
    
    const newAssignment = subject.guru_kelas_assignments[subject.guru_kelas_assignments.length - 1];
    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_ASSIGNMENT', 'MataPelajaran', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove assignment
export async function DELETE(request, { params }) {
  let userId = null;
  try {
    const { id } = params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignment_id');
    
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignment_id wajib diisi' }, { status: 400 });
    }
    
    const subject = await MataPelajaran.findById(id);
    if (!subject) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }
    
    // Hapus assignment
    subject.guru_kelas_assignments = (subject.guru_kelas_assignments || []).filter(
      a => a._id.toString() !== assignmentId
    );
    await subject.save();
    
    await logCRUDAction(userId, 'DELETE_ASSIGNMENT', 'MataPelajaran', id, { assignment_id: assignmentId });
    
    return NextResponse.json({ message: 'Assignment berhasil dihapus' });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_ASSIGNMENT', 'MataPelajaran', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


