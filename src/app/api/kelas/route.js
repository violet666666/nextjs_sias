import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Kelas from '@/lib/models/Kelas';
import Orangtua from '@/lib/models/Orangtua';
import { logCRUDAction } from '@/lib/auditLogger';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
  try {
    // Semua role terautentikasi boleh melihat daftar kelas (mungkin perlu filter lebih lanjut di frontend)
    // Pastikan 'guru' ada di sini
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']); 
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const guru_id = searchParams.get('guru_id');

    const filter = {};
    if (guru_id) {
      filter.guru_id = guru_id;
    } else if (currentUser.role === 'siswa') {
      // Ambil semua kelas yang memiliki siswa_id ini di array siswa_ids
      filter.siswa_ids = currentUser.id;
    } else if (currentUser.role === 'orangtua') {
      // Ambil semua anak dari koleksi Orangtua (menggunakan siswa_ids array)
      const relasiOrangtua = await Orangtua.find({ user_id: currentUser.id }).select('siswa_ids');
      const anakIds = relasiOrangtua.flatMap(r => r.siswa_ids || []);
      
      if (anakIds.length === 0) {
        return NextResponse.json([]); // Orangtua tidak memiliki anak yang terdaftar
      }
      
      // Ambil semua kelas yang memiliki salah satu anak di array siswa_ids
      filter.siswa_ids = { $in: anakIds };
    }

    const kelas = await Kelas.find(filter).populate('guru_id', 'nama email');
    return NextResponse.json(kelas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const body = await request.json();
    // Set wali_kelas_id sama dengan guru_id jika belum diisi
    if (body.guru_id && !body.wali_kelas_id) {
      body.wali_kelas_id = body.guru_id;
    }
    const kelas = await Kelas.create(body);
    await logCRUDAction(userId, 'CREATE_KELAS', 'KELAS', kelas._id, { nama: kelas.nama_kelas });
    return NextResponse.json(kelas, { status: 201 });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'CREATE_KELAS', 'KELAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const body = await request.json();
    const kelas = await Kelas.findByIdAndUpdate(body._id, body, { new: true });
    await logCRUDAction(userId, 'UPDATE_KELAS', 'KELAS', kelas?._id, { nama: kelas?.nama_kelas });
    return NextResponse.json(kelas);
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'UPDATE_KELAS', 'KELAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  let userId = null;
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    userId = authResult.user.id || authResult.user._id;
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const kelas = await Kelas.findByIdAndDelete(id);
    await logCRUDAction(userId, 'DELETE_KELAS', 'KELAS', id, { nama: kelas?.nama_kelas });
    return NextResponse.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    if (userId) await logCRUDAction(userId, 'DELETE_KELAS', 'KELAS', null, { error: error.message }, 'FAILED', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 