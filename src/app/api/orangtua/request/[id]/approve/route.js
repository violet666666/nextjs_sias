import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParentChildRequest from '@/lib/models/ParentChildRequest';
import Orangtua from '@/lib/models/Orangtua';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    const req = await ParentChildRequest.findById(params.id);
    if (!req || req.status !== 'pending') {
      return NextResponse.json({ error: 'Request tidak ditemukan atau sudah diproses.' }, { status: 404 });
    }
    // Cek relasi sudah ada
    const existing = await Orangtua.findOne({ user_id: req.orangtua_id, siswa_id: req.siswa_id });
    if (existing) {
      req.status = 'approved';
      await req.save();
      return NextResponse.json({ success: true, message: 'Relasi sudah ada.' });
    }
    await Orangtua.create({ user_id: req.orangtua_id, siswa_id: req.siswa_id });
    req.status = 'approved';
    await req.save();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 