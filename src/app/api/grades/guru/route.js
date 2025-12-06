import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Tugas from '@/lib/models/Tugas';
import MataPelajaran from '@/lib/models/MataPelajaran';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// GET: Get grades organized by subject and class for guru
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;
    const guruId = currentUser.id || currentUser._id;
    
    await connectDB();
    
    // 1. Ambil semua mata pelajaran yang diajar oleh guru ini
    const subjects = await MataPelajaran.find({
      $or: [
        { guru_ids: guruId },
        { 'guru_kelas_assignments.guru_id': guruId }
      ]
    })
    .populate('kelas_ids', 'nama_kelas tahun_ajaran')
    .populate('guru_ids', 'nama email')
    .lean();
    
    if (!subjects || subjects.length === 0) {
      return NextResponse.json([]);
    }
    
    // 2. Untuk setiap mata pelajaran, ambil kelas yang di-assign ke guru ini
    const result = await Promise.all(subjects.map(async (subject) => {
      // Filter kelas berdasarkan guru_kelas_assignments
      let assignedKelasIds = [];
      
      if (subject.guru_kelas_assignments && subject.guru_kelas_assignments.length > 0) {
        // Jika ada assignment spesifik, gunakan itu
        assignedKelasIds = subject.guru_kelas_assignments
          .filter(a => a.guru_id.toString() === guruId.toString())
          .map(a => a.kelas_id.toString());
      } else {
        // Fallback: gunakan semua kelas dari kelas_ids
        assignedKelasIds = (subject.kelas_ids || []).map(k => 
          typeof k === 'object' ? k._id.toString() : k.toString()
        );
      }
      
      // Filter kelas dari kelas_ids yang sudah di-populate berdasarkan assignedKelasIds
      const validKelas = (subject.kelas_ids || []).filter(k => {
        const kelasId = typeof k === 'object' ? k._id.toString() : k.toString();
        return assignedKelasIds.includes(kelasId);
      });
      
      // 3. Untuk setiap kelas, ambil tugas dan nilai
      const kelasWithGrades = await Promise.all(validKelas.map(async (kelas) => {
        const kelasId = typeof kelas === 'object' ? kelas._id : kelas;
        
        // Ambil semua tugas untuk mata pelajaran ini di kelas ini
        const tugasList = await Tugas.find({
          mapel_id: subject._id,
          kelas_id: kelasId
        })
        .populate('mapel_id', 'nama')
        .populate('kelas_id', 'nama_kelas tahun_ajaran')
        .lean();
        
        const tugasIds = tugasList.map(t => t._id);
        
        // Ambil semua submission untuk tugas-tugas ini
        const submissions = await Submission.find({
          tugas_id: { $in: tugasIds }
        })
        .populate('siswa_id', 'nama nis email')
        .populate('guru_id', 'nama')
        .populate({
          path: 'tugas_id',
          select: 'judul mapel_id kelas_id tanggal_deadline',
          populate: [
            { path: 'mapel_id', select: 'nama' },
            { path: 'kelas_id', select: 'nama_kelas tahun_ajaran' }
          ]
        })
        .lean();
        
        return {
          kelas_id: kelasId.toString(),
          kelas_nama: typeof kelas === 'object' ? (kelas.nama_kelas || '-') : '-',
          kelas_tahun: typeof kelas === 'object' ? (kelas.tahun_ajaran || '-') : '-',
          tugas_count: tugasList.length,
          nilai: submissions.map(s => ({
            _id: s._id,
            siswa_id: s.siswa_id,
            tugas_id: s.tugas_id,
            nilai: s.nilai || 0,
            feedback: s.feedback || '',
            tanggal_kumpul: s.tanggal_kumpul,
            file_path: s.file_path,
            status: s.status || 'submitted',
            guru_id: s.guru_id,
            is_graded: s.status === 'graded' || (s.nilai && s.nilai > 0)
          }))
        };
      }));
      
      return {
        subject_id: subject._id,
        subject_nama: subject.nama,
        subject_kode: subject.kode,
        kelas: kelasWithGrades
      };
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching guru grades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

