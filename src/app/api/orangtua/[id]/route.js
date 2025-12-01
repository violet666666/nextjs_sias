import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Orangtua from '@/lib/models/Orangtua';
    import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request, { params }) {
  try {
        // GET mungkin bisa juga untuk orangtua yang bersangkutan (untuk melihat data relasinya sendiri)
        const authResult = await authenticateAndAuthorize(request, ['admin', 'orangtua']);
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
        const currentUser = authResult.user;
    
    await connectDB();
    const { id } = await params;
    const orangtua = await Orangtua.findById(id) // Tidak ada perubahan di sini, karena signature sudah benar
      .populate('user_id', 'nama email')
      .populate('siswa_id', 'nama email');
    if (!orangtua) return NextResponse.json({ error: 'Orangtua tidak ditemukan' }, { status: 404 });
    
        if (currentUser.role === 'orangtua' && (!orangtua.user_id || orangtua.user_id._id.toString() !== currentUser.id)) {
          return NextResponse.json({ error: 'Akses ditolak: Anda hanya bisa melihat data relasi sendiri.' }, { status: 403 });
        }
    
    return NextResponse.json(orangtua);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
        const authResult = await authenticateAndAuthorize(request, ['admin']);
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
    await connectDB();
    const { id } = await params;
    const body = await request.json();
        // Validasi body, pastikan user_id dan siswa_id valid
        // dan nomor_telepon jika ada

    const orangtua = await Orangtua.findByIdAndUpdate(id, body, { new: true });
    if (!orangtua) return NextResponse.json({ error: 'Orangtua tidak ditemukan' }, { status: 404 });
    return NextResponse.json(orangtua);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
        const authResult = await authenticateAndAuthorize(request, ['admin']);
        if (authResult.error) {
          return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }
    await connectDB();
    const { id } = await params;
    const orangtua = await Orangtua.findByIdAndDelete(id);
    if (!orangtua) return NextResponse.json({ error: 'Orangtua tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ message: 'Orangtua berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 