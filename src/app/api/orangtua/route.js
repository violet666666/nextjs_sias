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
    // Filter berdasarkan siswa_id di dalam array siswa_ids
    filter.siswa_ids = siswa_id;
  }
  // PENTING: populate siswa_ids agar frontend dapat data anak lengkap
  const data = await Orangtua.find(filter).populate('siswa_ids', 'nama email nis');
  
  // Format response untuk kompatibilitas dengan frontend yang masih menggunakan siswa_id
  const formattedData = data.map(item => {
    // Jika hanya satu anak, kembalikan format lama untuk backward compatibility
    if (item.siswa_ids && item.siswa_ids.length === 1) {
      return {
        ...item.toObject(),
        siswa_id: item.siswa_ids[0]
      };
    }
    return item;
  });
  
  return NextResponse.json(formattedData);
}

export async function POST(request) {
  const authResult = await authenticateAndAuthorize(request, ['admin']);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  await connectDB();
  const { user_id, siswa_id, siswa_ids, nomor_telepon } = await request.json();

  // Support both single siswa_id and array siswa_ids
  const siswaIdsArray = siswa_ids || (siswa_id ? [siswa_id] : []);

  if (!user_id || siswaIdsArray.length === 0) {
    return NextResponse.json({ error: "user_id dan siswa_id/siswa_ids wajib diisi" }, { status: 400 });
  }

  // Cek apakah record dengan user_id ini sudah ada
  const existing = await Orangtua.findOne({ user_id });
  
  if (existing) {
    // Jika sudah ada, tambahkan siswa_id baru ke array jika belum ada
    const newSiswaIds = siswaIdsArray.filter(id => 
      !existing.siswa_ids.some(existingId => existingId.toString() === id.toString())
    );
    
    if (newSiswaIds.length === 0) {
      return NextResponse.json({ error: "Semua relasi sudah ada" }, { status: 400 });
    }
    
    existing.siswa_ids.push(...newSiswaIds);
    await existing.save();
    return NextResponse.json(existing, { status: 200 });
  } else {
    // Jika belum ada, buat record baru
    const data = await Orangtua.create({ 
      user_id, 
      siswa_ids: siswaIdsArray, 
      nomor_telepon 
    });
    return NextResponse.json(data, { status: 201 });
  }
} 