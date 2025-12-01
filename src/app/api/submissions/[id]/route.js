import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Tugas from '@/lib/models/Tugas';
import Kelas from '@/lib/models/Kelas';
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
      if (!submission.tugas_id || !submission.tugas_id.kelas_id) {
        return NextResponse.json({ error: 'Data tugas tidak lengkap untuk validasi.' }, { status: 500 });
      }
      const kelasTugas = await Kelas.findById(submission.tugas_id.kelas_id);
      if (!kelasTugas || kelasTugas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru kelas ini.' }, { status: 403 });
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
      if (!submissionToUpdate || !submissionToUpdate.tugas_id) return NextResponse.json({ error: 'Submission atau tugas terkait tidak ditemukan.' }, { status: 404 });
      const kelasTugas = await Kelas.findById(submissionToUpdate.tugas_id.kelas_id);
      if (!kelasTugas || kelasTugas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru kelas ini.' }, { status: 403 });
      }
    }

    const submission = await Submission.findByIdAndUpdate(submissionId, updateData, { new: true });
    if (!submission) return NextResponse.json({ error: 'Submission tidak ditemukan' }, { status: 404 });

    // Kirim notifikasi ke siswa jika nilai diupdate
    if (body.hasOwnProperty('nilai') && nilaiLama !== null && nilaiLama !== body.nilai) {
      await NotificationService.createNotification({
        user_id: submission.siswa_id,
        title: 'Nilai Tugas Diperbarui',
        message: `Nilai tugas Anda telah diperbarui menjadi ${body.nilai}.`,
        type: 'grade',
        data: { submission_id: submission._id, nilai: body.nilai }
      });
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