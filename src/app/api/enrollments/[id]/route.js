import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Enrollment from '@/lib/models/Enrollment';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import Kelas from '@/lib/models/Kelas'; // Untuk verifikasi guru

export async function GET(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    await connectDB();
    const awaitedParams = await params;
    const { id } = awaitedParams;
    const enrollment = await Enrollment.findById(id)
      .populate('kelas_id', 'nama_kelas')
      .populate('siswa_id', 'nama email');
    if (!enrollment) return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });

    // Validasi hak akses
    if (currentUser.role === 'siswa' && enrollment.siswa_id._id.toString() !== currentUser.id) {
      return NextResponse.json({ error: 'Akses ditolak: Anda hanya bisa melihat enrollment sendiri.' }, { status: 403 });
    }
    if (currentUser.role === 'guru') {
      const kelas = await Kelas.findById(enrollment.kelas_id._id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait enrollment ini.' }, { status: 403 });
      }
    }
    // Untuk orang tua, bisa ditambahkan validasi jika perlu (cek apakah enrollment milik anaknya)

    return NextResponse.json(enrollment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']); // Hanya admin yang boleh edit enrollment secara langsung
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const awaitedParams = await params;
    // Validasi body jika perlu
    const enrollment = await Enrollment.findByIdAndUpdate(awaitedParams.id, await request.json(), { new: true });
    if (!enrollment) return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    return NextResponse.json(enrollment);
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
    await connectDB();
    const awaitedParams = await params;
    const enrollmentToDelete = await Enrollment.findById(awaitedParams.id);
    if (!enrollmentToDelete) return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    
    // Jika guru, pastikan dia mengajar kelas dari enrollment tersebut
    if (currentUser.role === 'guru') {
      const kelas = await Kelas.findById(enrollmentToDelete.kelas_id);
      if (!kelas || kelas.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Anda tidak berhak menghapus enrollment dari kelas ini.' }, { status: 403 });
      }
    }
    
    const enrollment = await Enrollment.findByIdAndDelete(awaitedParams.id);
    if (!enrollment) return NextResponse.json({ error: 'Enrollment tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Enrollment berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 