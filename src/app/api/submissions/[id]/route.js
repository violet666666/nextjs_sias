import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Tugas from '@/lib/models/Tugas';
import Kelas from '@/lib/models/Kelas';
import MataPelajaran from '@/lib/models/MataPelajaran';
import NotificationService from '@/lib/services/notificationService';

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    const { id: submissionId } = params;

    await connectDB();
    const submission = await Submission.findById(submissionId)
      .populate('tugas_id', 'judul')
      .populate('siswa_id', 'nama email');

    if (!submission) return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 });

    // Validasi hak akses
    if (currentUser.role === 'siswa' && submission.siswa_id._id.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Akses ditolak: Anda hanya bisa melihat submission sendiri.' }, { status: 403 });
    }
    if (currentUser.role === 'guru') {
      if (!submission.tugas_id || !submission.tugas_id.kelas_id || !submission.tugas_id.mapel_id) {
        return NextResponse.json({ error: 'Data tugas tidak lengkap untuk validasi.' }, { status: 500 });
      }
      
      const kelasTugas = await Kelas.findById(submission.tugas_id.kelas_id);
      if (!kelasTugas) {
        return NextResponse.json({ error: 'Kelas tidak ditemukan.' }, { status: 404 });
      }
      
      // Cek apakah guru adalah wali kelas
      const isWaliKelas = kelasTugas.guru_id && kelasTugas.guru_id.toString() === currentUser.id;
      
      // Cek apakah guru adalah guru mata pelajaran yang di-assign ke kelas ini
      const mataPelajaran = await MataPelajaran.findById(submission.tugas_id.mapel_id);
      if (!mataPelajaran) {
        return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 404 });
      }
      
      const guruId = currentUser.id || currentUser._id;
      const isGuruMapel = mataPelajaran.guru_ids && 
        mataPelajaran.guru_ids.some(g => g.toString() === guruId.toString());
      
      const isGuruKelasAssignment = mataPelajaran.guru_kelas_assignments && 
        mataPelajaran.guru_kelas_assignments.some(a => 
          a.guru_id.toString() === guruId.toString() && 
          a.kelas_id.toString() === kelasTugas._id.toString()
        );
      
      if (!isWaliKelas && !isGuruMapel && !isGuruKelasAssignment) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru yang berwenang untuk kelas ini.' }, { status: 403 });
      }
    }

    return NextResponse.json(submission);
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
    const { id: submissionId } = params;

    await connectDB();
    const body = await request.json();
    const updateData = {};
    if (body.hasOwnProperty('nilai')) updateData.nilai = body.nilai;
    if (body.hasOwnProperty('feedback')) updateData.feedback = body.feedback;

    let nilaiLama = null;
    if (body.hasOwnProperty('nilai')) {
      const submissionBefore = await Submission.findById(submissionId);
      if (submissionBefore) nilaiLama = submissionBefore.nilai;
    }

    if (currentUser.role === 'guru') {
      const submissionToUpdate = await Submission.findById(submissionId).populate('tugas_id');
      if (!submissionToUpdate || !submissionToUpdate.tugas_id) {
        return NextResponse.json({ error: 'Submission atau tugas terkait tidak ditemukan.' }, { status: 404 });
      }
      
      const kelasTugas = await Kelas.findById(submissionToUpdate.tugas_id.kelas_id);
      if (!kelasTugas) {
        return NextResponse.json({ error: 'Kelas tidak ditemukan.' }, { status: 404 });
      }
      
      // Cek apakah guru adalah wali kelas
      const isWaliKelas = kelasTugas.guru_id && kelasTugas.guru_id.toString() === currentUser.id;
      
      // Cek apakah guru adalah guru mata pelajaran yang di-assign ke kelas ini
      const mataPelajaran = await MataPelajaran.findById(submissionToUpdate.tugas_id.mapel_id);
      if (!mataPelajaran) {
        return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan.' }, { status: 404 });
      }
      
      const guruId = currentUser.id || currentUser._id;
      const isGuruMapel = mataPelajaran.guru_ids && 
        mataPelajaran.guru_ids.some(g => g.toString() === guruId.toString());
      
      const isGuruKelasAssignment = mataPelajaran.guru_kelas_assignments && 
        mataPelajaran.guru_kelas_assignments.some(a => 
          a.guru_id.toString() === guruId.toString() && 
          a.kelas_id.toString() === kelasTugas._id.toString()
        );
      
      if (!isWaliKelas && !isGuruMapel && !isGuruKelasAssignment) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru yang berwenang untuk kelas ini.' }, { status: 403 });
      }
    }

    // Update status menjadi "graded" jika nilai diberikan
    if (body.hasOwnProperty('nilai') && body.nilai > 0) {
      updateData.status = 'graded';
      updateData.guru_id = currentUser.id || currentUser._id;
    }
    
    const submission = await Submission.findByIdAndUpdate(submissionId, updateData, { new: true })
      .populate('siswa_id', 'nama email');
    if (!submission) return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 });

    // Kirim notifikasi ke siswa jika nilai diupdate atau diberikan pertama kali
    if (body.hasOwnProperty('nilai')) {
      const isFirstGrade = nilaiLama === null || nilaiLama === 0;
      const isUpdated = nilaiLama !== null && nilaiLama !== body.nilai && body.nilai > 0;
      
      if (isFirstGrade || isUpdated) {
        await NotificationService.createNotification({
          user_id: submission.siswa_id._id || submission.siswa_id,
          title: isFirstGrade ? 'Nilai Tugas Diberikan' : 'Nilai Tugas Diperbarui',
          message: isFirstGrade 
            ? `Nilai tugas Anda telah diberikan: ${body.nilai}` 
            : `Nilai tugas Anda telah diperbarui menjadi ${body.nilai}.`,
          type: 'grade',
          data: { submission_id: submission._id, nilai: body.nilai }
        });
      }
    }

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Umumnya, submission tidak dihapus, tapi jika diperlukan:
    const authResult = await authenticateAndAuthorize(request, ['admin']); // Mungkin hanya admin yang boleh hapus total
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const submission = await Submission.findByIdAndDelete(params.id); // Gunakan params.id
    if (!submission) return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Submission berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 