import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParentChildRequest from '@/lib/models/ParentChildRequest';
import User from '@/lib/models/userModel';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// POST: Orangtua ajukan request relasi ke anak
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const { siswa_nis } = await request.json();
    const siswa = await User.findOne({ nis: siswa_nis, role: 'siswa' });
    if (!siswa) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan.' }, { status: 404 });
    }
    // Cek relasi sudah ada (menggunakan siswa_ids array)
    const Orangtua = (await import('@/lib/models/Orangtua')).default;
    const existingRelation = await Orangtua.findOne({ 
      user_id: authResult.user.id, 
      siswa_ids: siswa._id 
    });
    if (existingRelation) {
      return NextResponse.json({ error: 'Relasi dengan anak ini sudah ada.' }, { status: 409 });
    }
    
    // Cek duplikat request
    const existing = await ParentChildRequest.findOne({ orangtua_id: authResult.user.id, siswa_id: siswa._id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'Request sudah diajukan dan masih pending.' }, { status: 409 });
    }
    
    const req = await ParentChildRequest.create({ orangtua_id: authResult.user.id, siswa_id: siswa._id });
    return NextResponse.json({ success: true, request: req });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET: Admin lihat semua request, Orangtua lihat request miliknya
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin', 'orangtua']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    let filter = {};
    if (authResult.user.role === 'orangtua') {
      filter.orangtua_id = authResult.user.id;
    }
    const requests = await ParentChildRequest.find(filter)
      .populate('orangtua_id', 'nama email')
      .populate('siswa_id', 'nama nis');
    return NextResponse.json({ success: true, requests });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 