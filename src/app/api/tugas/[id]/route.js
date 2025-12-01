import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tugas from '@/lib/models/Tugas';
import Enrollment from '@/lib/models/Enrollment'; // Impor Enrollment
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const tugas = await Tugas.findById(params.id).populate('kelas_id', 'nama_kelas');
    if (!tugas) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    
    if (!tugas.kelas_id) {
      return NextResponse.json({ error: 'Data kelas pada tugas tidak ditemukan.' }, { status: 500 });
    }

    if (currentUser.role === 'siswa') {
      const enrollment = await Enrollment.findOne({ kelas_id: tugas.kelas_id._id, siswa_id: currentUser.id });
      if (!enrollment) {
        return NextResponse.json({ error: 'Akses ditolak: Anda tidak terdaftar di kelas dari tugas ini.' }, { status: 403 });
      }
    } else if (currentUser.role === 'guru') {
      if (!tugas.kelas_id.guru_id || tugas.kelas_id.guru_id.toString() !== currentUser.id) {
        // return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas tugas ini.' }, { status: 403 });
        // Atau jika guru lain boleh lihat tugas dari kelas lain, maka tidak perlu error di sini.
        // Untuk sekarang, kita asumsikan guru hanya bisa lihat tugas dari kelasnya jika bukan admin.
      }
    }

    return NextResponse.json(tugas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const body = await request.json();

    if (currentUser.role === 'guru') {
      const tugasToUpdate = await Tugas.findById(params.id);
      if (!tugasToUpdate) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
      const kelas = await Kelas.findById(tugasToUpdate.kelas_id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak mengedit tugas ini.' }, { status: 403 });
      }
    }

    const tugas = await Tugas.findByIdAndUpdate(params.id, body, { new: true });
    if (!tugas) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(currentUser.id, 'UPDATE_TUGAS', 'TUGAS', params.id, { ...body });
    return NextResponse.json(tugas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    if (currentUser.role === 'guru') {
      const tugasToDelete = await Tugas.findById(params.id);
      if (!tugasToDelete) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
      const kelas = await Kelas.findById(tugasToDelete.kelas_id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak menghapus tugas ini.' }, { status: 403 });
      }
    }
    await connectDB();
    const tugas = await Tugas.findByIdAndDelete(params.id);
    if (!tugas) return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    // Audit log
    await logCRUDAction(currentUser.id, 'DELETE_TUGAS', 'TUGAS', params.id, { judul: tugas.judul });
    return NextResponse.json({ message: 'Tugas berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 