import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kehadiran from '@/lib/models/Kehadiran';
import Kelas from '@/lib/models/Kelas';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    // Next.js 16: params is a Promise, must await
    const { id } = await context.params;
    const kehadiran = await Kehadiran.findById(id)
      .populate('kelas_id', 'nama_kelas guru_id')
      .populate('siswa_id', 'nama email')
      .populate('mapel_id', 'nama_mapel');
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

export async function PUT(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const body = await request.json();
    // Next.js 16: params is a Promise, must await
    const { id } = await context.params;

    if (currentUser.role === 'guru') {
      const existingKehadiran = await Kehadiran.findById(id).populate('kelas_id', 'guru_id');
      if (!existingKehadiran || !existingKehadiran.kelas_id || !existingKehadiran.kelas_id.guru_id) {
        return NextResponse.json({ error: 'Kehadiran atau data kelas tidak ditemukan untuk validasi.' }, { status: 404 });
      }
      if (existingKehadiran.kelas_id.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait kehadiran ini.' }, { status: 403 });
      }
    }

    const kehadiran = await Kehadiran.findByIdAndUpdate(id, body, { new: true });
    if (!kehadiran) return NextResponse.json({ error: 'Kehadiran tidak ditemukan' }, { status: 404 });
    return NextResponse.json(kehadiran);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;
    // Next.js 16: params is a Promise, must await
    const { id } = await context.params;

    if (currentUser.role === 'guru') {
      const existingKehadiran = await Kehadiran.findById(id).populate('kelas_id', 'guru_id');
      if (!existingKehadiran || !existingKehadiran.kelas_id || !existingKehadiran.kelas_id.guru_id) {
        return NextResponse.json({ error: 'Kehadiran atau data kelas tidak ditemukan untuk validasi.' }, { status: 404 });
      }
      if (existingKehadiran.kelas_id.guru_id.toString() !== currentUser.id) {
        return NextResponse.json({ error: 'Akses ditolak: Anda bukan guru dari kelas terkait kehadiran ini.' }, { status: 403 });
      }
    }

    await connectDB();
    const kehadiran = await Kehadiran.findByIdAndDelete(id);
    if (!kehadiran) return NextResponse.json({ error: 'Kehadiran tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Kehadiran berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}