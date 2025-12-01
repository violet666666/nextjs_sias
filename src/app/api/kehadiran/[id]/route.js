import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
    import Kelas from '@/lib/models/Kelas'; // Impor Kelas
    import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
  try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const currentUser = authResult.user;
    
    await connectDB();
    const kehadiran = await Kehadiran.findById(params.id)
      .populate('kelas_id', 'nama_kelas')
      .populate('siswa_id', 'nama email');
    if (!kehadiran) return NextResponse.json({ error: 'Kehadiran tidak ditemukan' }, { status: 404 });
    
        if (currentUser.role === 'guru') {
          if (!kehadiran.kelas_id || !kehadiran.kelas_id.guru_id) {
            return NextResponse.json({ error: 'Data kelas tidak lengkap untuk validasi.' }, { status: 500 });
          }
          if (kehadiran.kelas_id.guru_id.toString() !== currentUser.id) {
            return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait kehadiran ini.' }, { status: 403 });
          }
        }
    
    return NextResponse.json(kehadiran);
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
        // Pastikan body hanya berisi field yang boleh diupdate (status, tanggal, dll)
        // Hindari update siswa_id atau kelas_id secara sembarangan
    
        if (currentUser.role === 'guru') {
          const existingKehadiran = await Kehadiran.findById(params.id).populate('kelas_id', 'guru_id');
          if (!existingKehadiran || !existingKehadiran.kelas_id || !existingKehadiran.kelas_id.guru_id) {
            return NextResponse.json({ error: 'Kehadiran atau data kelas tidak ditemukan untuk validasi.' }, { status: 404 });
          }
          if (existingKehadiran.kelas_id.guru_id.toString() !== currentUser.id) {
            return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait kehadiran ini.' }, { status: 403 });
          }
        }
    
    const kehadiran = await Kehadiran.findByIdAndUpdate(params.id, body, { new: true });
    if (!kehadiran) return NextResponse.json({ error: 'Kehadiran tidak ditemukan' }, { status: 404 });
    return NextResponse.json(kehadiran);
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
          const existingKehadiran = await Kehadiran.findById(params.id).populate('kelas_id', 'guru_id');
          if (!existingKehadiran || !existingKehadiran.kelas_id || !existingKehadiran.kelas_id.guru_id) {
            return NextResponse.json({ error: 'Kehadiran atau data kelas tidak ditemukan untuk validasi.' }, { status: 404 });
          }
          if (existingKehadiran.kelas_id.guru_id.toString() !== currentUser.id) {
            return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait kehadiran ini.' }, { status: 403 });
          }
        }

    await connectDB();
    const kehadiran = await Kehadiran.findByIdAndDelete(params.id);
    if (!kehadiran) return NextResponse.json({ error: 'Kehadiran tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Kehadiran berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 