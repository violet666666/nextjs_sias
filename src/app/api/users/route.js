import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/userModel';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import { logCRUDAction } from '@/lib/auditLogger';

// GET: List all users, filter by role if query param exists
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const currentUser = authResult.user;
    const filter = {};
    if (role) filter.role = role;
    // Guru hanya boleh akses data siswa
    if (currentUser.role === 'guru') {
      if (role !== 'siswa') {
        return NextResponse.json({ error: 'Guru hanya bisa mengakses data siswa' }, { status: 403 });
      }
    }
    const users = await User.find(filter).select('-password_hash');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new user (admin only)
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const body = await request.json();
    const { nama, email, password, role } = body;
    if (!nama || !email || !password || !role) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }
    // Validasi role - admin tidak bisa dibuat dari endpoint ini
    const allowedRoles = ['guru', 'siswa', 'orangtua'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid. Hanya guru, siswa, dan orangtua yang dapat dibuat.' }, { status: 400 });
    }
    // Cek email unik
    const exists = await User.findOne({ email });
    if (exists) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
    }
    // Hash password
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ nama, email, password_hash, role });
    
    // Audit log
    await logCRUDAction(authResult.user.id, 'CREATE_USER', 'USER', user._id, { 
      nama: user.nama, 
      email: user.email, 
      role: user.role 
    });
    
    return NextResponse.json({ id: user._id, nama: user.nama, email: user.email, role: user.role }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 