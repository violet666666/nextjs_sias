import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Orangtua from '@/lib/models/Orangtua';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function GET(request) {
  const authResult = await authenticateAndAuthorize(request, ['admin', 'guru', 'siswa', 'orangtua']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  await connectDB();
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');
  const siswa_id = searchParams.get('siswa_id');
  const filter = {};
  // Jika yang login adalah orangtua, selalu filter user_id = id parent yang login
  if (authResult.user.role === 'orangtua') {
    filter.user_id = authResult.user.id;
  } else if (user_id) {
    filter.user_id = user_id;
  }
  if (siswa_id) {
    filter.siswa_id = siswa_id;
  }
  // PENTING: populate siswa_id agar frontend dapat data anak lengkap
  const data = await Orangtua.find(filter).populate('siswa_id');
  return NextResponse.json(data);
}

export async function POST(request) {
  const authResult = await authenticateAndAuthorize(request, ['admin']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  await connectDB();
  const { user_id, siswa_id, nomor_telepon } = await request.json();

  if (!user_id || !siswa_id) {
    return NextResponse.json({ error: "user_id dan siswa_id wajib diisi" }, { status: 400 });
  }

  // Cek duplikat
  const exists = await Orangtua.findOne({ user_id, siswa_id });
  if (exists) {
    return NextResponse.json({ error: "Relasi sudah ada" }, { status: 400 });
  }

  const data = await Orangtua.create({ user_id, siswa_id, nomor_telepon });
  return NextResponse.json(data, { status: 201 });
} 