import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Submission from '@/lib/models/Submission';
import Tugas from '@/lib/models/Tugas'; // Untuk filter guru
import Orangtua from '@/lib/models/Orangtua'; // Untuk filter orangtua
import Kelas from '@/lib/models/Kelas'; // Diperlukan untuk filter guru
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']); // Tambahkan 'orangtua'
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const siswa_id = searchParams.get('siswa_id');
    const tugas_id = searchParams.get('tugas_id'); // Tambahan filter by tugas_id
    
    let filter = {};
    if (siswa_id) filter.siswa_id = siswa_id;
    
    // Handle multiple tugas_id (comma-separated)
    if (tugas_id) {
      if (tugas_id.includes(',')) {
        const tugasIds = tugas_id.split(',').map(id => id.trim());
        filter.tugas_id = { $in: tugasIds };
      } else {
        filter.tugas_id = tugas_id;
      }
    }

    if (currentUser.role === 'siswa' && !filter.siswa_id) {
      filter.siswa_id = currentUser.id;
    } else if (currentUser.role === 'guru' && !filter.tugas_id && !filter.siswa_id) {
      // Jika guru, ambil semua submission dari tugas-tugas di kelas yang diajarnya
      try {
        const kelasDiajar = await Kelas.find({ guru_id: currentUser.id }).select('_id');
        const kelasDiajarIds = kelasDiajar.map(k => k._id);
        
        if (kelasDiajarIds.length > 0) {
          const tugasDariKelasGuru = await Tugas.find({ kelas_id: { $in: kelasDiajarIds } }).select('_id');
          const tugasIds = tugasDariKelasGuru.map(t => t._id);
          
          if (tugasIds.length > 0) {
            filter.tugas_id = { $in: tugasIds };
          } else {
            return NextResponse.json([]); // Tidak ada tugas di kelas yang diajar guru
          }
        } else {
          return NextResponse.json([]); // Guru tidak mengajar kelas manapun
        }
      } catch (error) {
        console.error('Error fetching guru classes:', error);
        return NextResponse.json([]);
      }
    } else if (currentUser.role === 'orangtua' && !filter.siswa_id) {
      try {
        const relasiAnak = await Orangtua.find({ user_id: currentUser.id }).select('siswa_ids');
        const anakIds = relasiAnak.flatMap(r => r.siswa_ids || []);
        
        if (anakIds.length > 0) {
          filter.siswa_id = { $in: anakIds };
        } else {
          return NextResponse.json([]); // Orang tua tidak memiliki anak terhubung
        }
      } catch (error) {
        console.error('Error fetching parent children:', error);
        return NextResponse.json([]);
      }
    }

    const submissions = await Submission.find(filter)
      .populate('tugas_id', 'judul')
      .populate('siswa_id', 'nama email');
      
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Submissions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']); // Tambahkan 'orangtua'
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const body = await request.json();
    const { tugas_id, siswa_id, tanggal_kumpul, file_path, nilai, feedback } = body;

    // Pastikan siswa_id dari body sama dengan currentUser.id
    if (siswa_id !== currentUser.id) {
      return NextResponse.json({ error: 'Anda hanya bisa submit tugas untuk diri sendiri.' }, { status: 403 });
    }
    if (!tugas_id || !tanggal_kumpul || !file_path) { // siswa_id diambil dari token
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }
    const submission = await Submission.create({ tugas_id, siswa_id, tanggal_kumpul, file_path, nilai, feedback });
    
    // Audit log
    await logCRUDAction(currentUser.id, 'UPLOAD_FILE', 'SUBMISSION', submission._id, { tugas_id, file_path });
    
    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Submissions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 