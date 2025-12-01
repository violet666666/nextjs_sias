import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import bcrypt from 'bcryptjs';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return NextResponse.json({ error: 'Akses ditolak: Anda hanya bisa melihat profil sendiri.' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(id).select('-password_hash');
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const authResult = await authenticateAndAuthorize(request); // Semua role terautentikasi
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    // Admin bisa edit semua, user lain hanya bisa edit profil sendiri
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return NextResponse.json({ error: 'Akses ditolak: Anda hanya bisa mengedit profil sendiri.' }, { status: 403 });
    }

    await connectDB();
    let body = await request.json();
    
    // User tidak bisa mengubah role sendiri, kecuali admin
    if (currentUser.role !== 'admin' && body.role && body.role !== currentUser.role) {
      delete body.role; // Hapus percobaan perubahan role
    }

    // Hash password if present and needs update
    if (body.password) {
      body.password_hash = await bcrypt.hash(body.password, 10);
      delete body.password; // Remove plain password from direct update
    }
    const user = await User.findByIdAndUpdate(id, body, { new: true });
    // Jangan kirim password_hash kembali
    if (user) {
      user.password_hash = undefined;
    }
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const currentUser = authResult.user;

    await connectDB();
    const user = await User.findByIdAndDelete(id);
    if (!user) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    
    // Audit log
    await logCRUDAction(currentUser.id, 'DELETE_USER', 'USER', id, { nama: user.nama, email: user.email, role: user.role });
    
    return NextResponse.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 