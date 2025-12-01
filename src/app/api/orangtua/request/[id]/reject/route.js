import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParentChildRequest from '@/lib/models/ParentChildRequest';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

export async function PATCH(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    // Next.js 15: params is async, need to await
    const { id } = await params;
    const req = await ParentChildRequest.findById(id);
    if (!req || req.status !== 'pending') {
      return NextResponse.json({ error: 'Request tidak ditemukan atau sudah diproses.' }, { status: 404 });
    }
    req.status = 'rejected';
    await req.save();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 