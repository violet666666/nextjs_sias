import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Tugas from '@/lib/models/Tugas';
import Kelas from '@/lib/models/Kelas';
import MataPelajaran from '@/lib/models/MataPelajaran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import NotificationService from '@/lib/services/notificationService';

// POST: Guru menambahkan nilai manual untuk siswa
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const guruId = currentUser.id || currentUser._id;
    
    await connectDB();
    const body = await request.json();
    const { tugas_id, siswa_id, nilai, feedback } = body;

    if (!tugas_id || !siswa_id || nilai === undefined || nilai === null) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    const nilaiNum = parseFloat(nilai);
    if (isNaN(nilaiNum) || nilaiNum < 0 || nilaiNum > 100) {
      return NextResponse.json({ error: 'Nilai harus antara 0-100' }, { status: 400 });
    }

    // Validasi: Cek apakah guru berwenang untuk tugas ini
    const tugas = await Tugas.findById(tugas_id)
      .populate('mapel_id')
      .populate('kelas_id');
    
    if (!tugas) {
      return NextResponse.json({ error: 'Tugas tidak ditemukan' }, { status: 404 });
    }

    const kelasTugas = await Kelas.findById(tugas.kelas_id);
    if (!kelasTugas) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Cek apakah guru adalah wali kelas
    const isWaliKelas = kelasTugas.guru_id && kelasTugas.guru_id.toString() === guruId.toString();
    
    // Cek apakah guru adalah guru mata pelajaran yang di-assign ke kelas ini
    const mataPelajaran = await MataPelajaran.findById(tugas.mapel_id);
    if (!mataPelajaran) {
      return NextResponse.json({ error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }
    
    const isGuruMapel = mataPelajaran.guru_ids && 
      mataPelajaran.guru_ids.some(g => g.toString() === guruId.toString());
    
    const isGuruKelasAssignment = mataPelajaran.guru_kelas_assignments && 
      mataPelajaran.guru_kelas_assignments.some(a => 
        a.guru_id.toString() === guruId.toString() && 
        a.kelas_id.toString() === kelasTugas._id.toString()
      );
    
    if (currentUser.role === 'guru' && !isWaliKelas && !isGuruMapel && !isGuruKelasAssignment) {
      return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru yang berwenang untuk kelas ini.' }, { status: 403 });
    }

    // Cek apakah submission sudah ada
    let submission = await Submission.findOne({
      tugas_id: tugas_id,
      siswa_id: siswa_id
    });

    if (submission) {
      // Update submission yang sudah ada
      submission.nilai = nilaiNum;
      submission.feedback = feedback || '';
      submission.status = 'graded';
      submission.guru_id = guruId;
      await submission.save();
    } else {
      // Buat submission baru dengan nilai langsung
      submission = await Submission.create({
        tugas_id: tugas_id,
        siswa_id: siswa_id,
        tanggal_kumpul: new Date(),
        file_path: '', // Tidak ada file karena nilai manual
        nilai: nilaiNum,
        feedback: feedback || '',
        status: 'graded',
        guru_id: guruId
      });
    }

    // Kirim notifikasi ke siswa
    await NotificationService.createNotification({
      user_id: siswa_id,
      title: 'Nilai Tugas Diberikan',
      message: `Nilai tugas Anda telah diberikan: ${nilaiNum}`,
      type: 'grade',
      data: { submission_id: submission._id, nilai: nilaiNum }
    });

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('siswa_id', 'nama nis email')
      .populate('tugas_id', 'judul')
      .populate('guru_id', 'nama');

    return NextResponse.json(populatedSubmission, { status: 201 });
  } catch (error) {
    console.error('Error adding manual grade:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

